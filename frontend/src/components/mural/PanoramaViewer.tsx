import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Props {
  src: string;
  title: string;
}

export default function PanoramaViewer({ src, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let texture: THREE.Texture | null = null;

    setLoading(true);
    setError(null);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 1100);
    camera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.rotateSpeed = -0.22;
    controls.minDistance = 0.1;
    controls.maxDistance = 0.1;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(0, 0, 1);
    controls.update();

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(500, 80, 60),
      new THREE.MeshBasicMaterial({ color: '#000000', side: THREE.BackSide }),
    );
    scene.add(sphere);

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

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      src,
      (loadedTexture) => {
        if (disposed) {
          loadedTexture.dispose();
          return;
        }
        texture = loadedTexture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const material = sphere.material;
        if (material instanceof THREE.MeshBasicMaterial) {
          material.map = texture;
          material.needsUpdate = true;
        }
        setLoading(false);
      },
      undefined,
      () => {
        if (disposed) return;
        setLoading(false);
        setError('全景图加载失败，请确认图片资源可用。');
      },
    );

    const render = () => {
      if (disposed) return;
      frameId = window.requestAnimationFrame(render);
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
      texture?.dispose();
      sphere.geometry.dispose();
      if (sphere.material instanceof THREE.Material) {
        sphere.material.dispose();
      }
      renderer.dispose();
      scene.clear();
      container.innerHTML = '';
    };
  }, [src]);

  return (
    <div className="relative h-[420px] overflow-hidden bg-[#17120c]">
      <div ref={containerRef} className="h-full w-full" aria-label={`${title} panorama viewer`} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm text-[#f5ead8]">
          正在加载全景图...
        </div>
      )}
      {error && (
        <div className="absolute inset-x-6 bottom-6 rounded-xl border border-[#7d5c39] bg-[#2c1f13]/90 px-4 py-3 text-sm text-[#f7e6ce] shadow-sm">
          {error}
        </div>
      )}
      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/12 px-3 py-1 text-xs text-white backdrop-blur-sm">
        拖拽环视，滚轮调整视角
      </div>
    </div>
  );
}
