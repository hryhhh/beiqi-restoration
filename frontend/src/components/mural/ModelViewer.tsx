import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Props {
  src: string;
  title: string;
}

function disposeMaterial(material: THREE.Material) {
  const materialRecord = material as THREE.Material & Record<string, unknown>;
  const maybeTextureKeys = [
    'map',
    'alphaMap',
    'aoMap',
    'bumpMap',
    'displacementMap',
    'emissiveMap',
    'envMap',
    'lightMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap',
  ] as const;

  for (const key of maybeTextureKeys) {
    const value = materialRecord[key];
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
  material.dispose();
}

export default function ModelViewer({ src, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let currentObject: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;

    setLoading(true);
    setError(null);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#efe4d0');
    scene.fog = new THREE.Fog('#efe4d0', 18, 42);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(4, 3, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const hemisphere = new THREE.HemisphereLight('#fff6de', '#8b6e4d', 2.4);
    const directional = new THREE.DirectionalLight('#fff7ea', 2.8);
    directional.position.set(6, 8, 10);
    directional.castShadow = true;
    const rim = new THREE.DirectionalLight('#d9b177', 1.1);
    rim.position.set(-8, 4, -6);
    const ambient = new THREE.AmbientLight('#f8ecda', 0.6);
    scene.add(hemisphere, directional, rim, ambient);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(12, 64),
      new THREE.MeshStandardMaterial({
        color: '#d9c4a3',
        roughness: 0.92,
        metalness: 0.02,
        transparent: true,
        opacity: 0.6,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.8;
    floor.receiveShadow = true;
    scene.add(floor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1;
    controls.maxDistance = 30;
    controls.target.set(0, 0, 0);
    controls.update();

    const updateSize = () => {
      const { clientWidth, clientHeight } = container;
      const width = Math.max(clientWidth, 1);
      const height = Math.max(clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateSize());
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', updateSize);
    }

    const clock = new THREE.Clock();
    const loader = new GLTFLoader();
    loader.load(
      src,
      (gltf) => {
        if (disposed) return;

        currentObject = gltf.scene;
        currentObject.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => {
              material.needsUpdate = true;
            });
          } else if (child.material) {
            child.material.needsUpdate = true;
          }
        });
        scene.add(currentObject);

        const box = new THREE.Box3().setFromObject(currentObject);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z, 1);
        const fitDistance = maxSize / (2 * Math.tan((Math.PI * camera.fov) / 360));
        const distance = fitDistance * 1.65;

        camera.near = Math.max(distance / 100, 0.01);
        camera.far = Math.max(distance * 30, 100);
        camera.position.set(center.x + distance * 0.9, center.y + distance * 0.55, center.z + distance * 1.2);
        camera.updateProjectionMatrix();

        floor.position.set(center.x, box.min.y - Math.max(size.y * 0.08, 0.18), center.z);
        floor.scale.setScalar(Math.max(maxSize * 1.8, 6));

        controls.target.copy(center);
        controls.minDistance = Math.max(maxSize * 0.35, 0.6);
        controls.maxDistance = Math.max(maxSize * 8, 30);
        controls.update();

        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(currentObject);
          gltf.animations.forEach((clip) => mixer?.clipAction(clip).play());
        }

        setLoading(false);
      },
      undefined,
      () => {
        if (disposed) return;
        setLoading(false);
        setError('模型加载失败，请确认资源文件可用。');
      },
    );

    const render = () => {
      if (disposed) return;
      frameId = window.requestAnimationFrame(render);
      const delta = clock.getDelta();
      mixer?.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      if (!resizeObserver) {
        window.removeEventListener('resize', updateSize);
      }
      controls.dispose();

      if (currentObject) {
        currentObject.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(disposeMaterial);
          } else if (child.material) {
            disposeMaterial(child.material);
          }
        });
      }

      floor.geometry.dispose();
      if (floor.material instanceof THREE.Material) {
        disposeMaterial(floor.material);
      }

      renderer.dispose();
      scene.clear();
      container.innerHTML = '';
    };
  }, [src]);

  return (
    <div className="relative h-[420px] overflow-hidden bg-[radial-gradient(circle_at_top,#f8f1e5_0%,#ede2cf_45%,#e6d7bf_100%)]">
      <div ref={containerRef} className="h-full w-full" aria-label={`${title} 3D viewer`} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f4eadb]/70 text-sm text-text-secondary">
          正在加载 3D 模型...
        </div>
      )}
      {error && (
        <div className="absolute inset-x-6 bottom-6 rounded-xl border border-[#e6d3b5] bg-[#fff8ee]/95 px-4 py-3 text-sm text-[#7a5a34] shadow-sm">
          {error}
        </div>
      )}
      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white">
        拖拽旋转，滚轮缩放
      </div>
    </div>
  );
}
