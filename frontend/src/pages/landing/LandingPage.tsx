import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PictureOutlined,
  BugOutlined,
  ToolOutlined,
  SwapOutlined,
  ExperimentOutlined,
  BookOutlined,
  ArrowDownOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  AuditOutlined,
  LockOutlined,
  FileTextOutlined,
  RobotOutlined,
  FundProjectionScreenOutlined,
  SyncOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import Header from '@/components/layout/Header';
import HeroParticles from '@/components/landing/HeroParticles';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import CountUpBlock from '@/components/landing/CountUpBlock';

/* ===== 数据 ===== */

const majorFeatures = [
  {
    icon: <PictureOutlined />,
    title: '壁画库管理',
    desc: '全球高清扫描、云端存储与统一化智能检索管理，构建完整的壁画数字档案体系。',
  },
  {
    icon: <BugOutlined />,
    title: '病害精确识别',
    desc: 'AI 精准定位裂缝、空鼓、起甲、霉斑等病害区域，辅助专家快速诊断与评估。',
  },
  {
    icon: <ToolOutlined />,
    title: '流程数字闭环',
    desc: '从现状调查到监测验收，七阶段标准修复流程全程数字化管理与追踪。',
  },
];

const minorFeatures = [
  { icon: <SyncOutlined />, title: '前后智能对比' },
  { icon: <BookOutlined />, title: '知识库集成' },
  { icon: <FileTextOutlined />, title: '数字档案' },
  { icon: <RobotOutlined />, title: 'AI修复建议' },
];

const coreFeatures = [
  { icon: <PictureOutlined />, title: '壁画库管理', desc: '系统化管理壁画数字档案，支持多光谱图像存储与检索' },
  { icon: <BugOutlined />, title: '病害精准标注', desc: '多边形、矩形、自由路径标注工具，精确记录病害区域' },
  { icon: <ToolOutlined />, title: '修复项目全流程', desc: '七阶段标准修复流程管理，任务分配与进度追踪' },
  { icon: <SwapOutlined />, title: '修复前后对比', desc: '并排与滑块叠加对比，直观评估修复效果' },
  { icon: <ExperimentOutlined />, title: 'AI 图像分析', desc: '智能病害检测辅助标注，自动生成修复报告' },
  { icon: <BookOutlined />, title: '知识库与档案', desc: '修复标准流程、材料手册、案例库一站式查阅' },
];

const valueIcons = [
  { icon: <SafetyCertificateOutlined />, label: '权威国家级' },
  { icon: <TeamOutlined />, label: 'AI+专家协作' },
  { icon: <AuditOutlined />, label: '标准与规范' },
  { icon: <LockOutlined />, label: '安全溯源保真' },
];

/* ===== 组件 ===== */

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  // 滚动观察 refs
  const statsRef = useScrollReveal<HTMLElement>();
  const featuresRef = useScrollReveal<HTMLElement>();
  const minorRef = useScrollReveal<HTMLDivElement>();
  const comparisonRef = useScrollReveal<HTMLElement>();
  const coreFeatRef = useScrollReveal<HTMLElement>();
  const cultureRef = useScrollReveal<HTMLElement>();

  // 视差
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-warm text-text-primary">
      <Header />

      {/* ========== Hero 区 ========== */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden py-20"
        style={{ backgroundColor: '#F0E9DF' }}
      >
        {/* 壁画背景 + 视差 */}
        <div
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{
            backgroundImage: `url('/hero-mural.jpg')`,
            transform: `translateY(${scrollY * 0.3}px) scale(1.08)`,
            filter: 'brightness(0.75) saturate(0.85)',
          }}
        />
        {/* 明亮渐变叠加 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(248,244,237,0.6) 0%, rgba(240,233,223,0.35) 40%, rgba(248,244,237,0.7) 100%)',
          }}
        />

        {/* 粒子动画 */}
        <HeroParticles />

        {/* 文字内容 */}
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-widest text-primary"
            style={{ animation: 'heroFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          >
            守护北齐千年壁画
          </h1>
          <p
            className="text-base md:text-lg text-text-secondary mb-2"
            style={{ animation: 'heroFadeIn 0.7s ease both', animationDelay: '0.4s' }}
          >
            太原北齐壁画数字化修复管理平台
          </p>
          <p
            className="text-sm mb-10 font-medium"
            style={{
              color: '#C9A66B',
              animation: 'heroFadeIn 0.7s ease both, goldGlow 3.5s ease-in-out infinite',
              animationDelay: '0.7s, 1.4s',
            }}
          >
            以数字技术，传承晋阳文化瑰宝
          </p>
          <div
            className="flex gap-5 justify-center flex-wrap"
            style={{ animation: 'heroFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '1s' }}
          >
            <button className="hero-btn-primary" onClick={() => navigate('/murals')}>
              进入壁画库
            </button>
            <button className="hero-btn-ghost" onClick={() => navigate('/projects')}>
              新建修复项目
            </button>
          </div>
        </div>

        {/* 向下箭头 */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
          style={{
            animation: 'heroFadeIn 0.5s ease both, arrowBreathe 2.5s ease-in-out infinite',
            animationDelay: '1.8s, 2.3s',
          }}
        >
          <ArrowDownOutlined style={{ fontSize: 20, color: '#C9A66B' }} />
        </div>
      </section>

      {/* ========== 系统简介 ========== */}
      <section className="py-20 px-6 bg-bg-warm">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-5 tracking-wide">
            关于北齐壁蕴系统
          </h2>
          <p className="text-text-secondary leading-loose text-sm md:text-base">
            北齐壁蕴系统是面向文物保护工作者和研究人员的数字化修复管理平台，
            专注于太原地区北齐时期墓葬壁画的保护与修复工作。
            系统遵循《古代壁画保护修复档案规范》（GB/T 30235），
            提供从病害调查到效果评估的全流程数字化管理。
          </p>
        </div>
      </section>

      {/* ========== 数据统计区 ========== */}
      <section ref={statsRef} className="py-16 px-6 bg-bg-cream">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <CountUpBlock target={1280} label="壁画数字档案" duration={2200} className="animate-on-scroll stagger-1" />
          <CountUpBlock target={56} label="已完成修复项目" duration={1800} className="animate-on-scroll stagger-2" />
          <CountUpBlock target={420} label="修复面积 · m²" duration={2000} className="animate-on-scroll stagger-3" />
        </div>
      </section>

      {/* ========== 三大功能卡片 ========== */}
      <section ref={featuresRef} className="py-20 px-6 bg-bg-warm">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-7">
          {majorFeatures.map((f, i) => (
            <div
              key={f.title}
              className={`animate-on-scroll stagger-${i + 1} feature-card bg-bg-card rounded-2xl p-7 border border-border-warm flex flex-col min-h-[260px]`}
            >
              <div className="bg-bg-cream rounded-xl h-32 flex items-center justify-center mb-5">
                <span className="feature-icon text-4xl text-gold">{f.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 下排4个小卡片 */}
        <div ref={minorRef} className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 mt-8">
          {minorFeatures.map((f, i) => (
            <div
              key={f.title}
              className={`animate-on-scroll stagger-${i + 1} feature-card bg-bg-card rounded-xl p-5 text-center border border-border-warm`}
            >
              <span className="feature-icon text-2xl text-gold-dark block mb-2">{f.icon}</span>
              <p className="text-sm font-medium text-text-primary">{f.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== 修复前后对比 ========== */}
      <section ref={comparisonRef} className="py-20 px-6 bg-bg-cream">
        <div className="max-w-5xl mx-auto">
          <div className="animate-on-scroll bg-bg-card rounded-2xl border border-border-warm h-72 md:h-[380px] flex items-center justify-center mb-8 overflow-hidden group cursor-pointer">
            <div className="flex items-center gap-3 text-text-light transition-transform duration-500 group-hover:scale-105">
              <FundProjectionScreenOutlined className="text-5xl" />
              <span className="text-lg">修复前后对比预览</span>
            </div>
          </div>
          <div className="animate-on-scroll stagger-2">
            <h3 className="text-xl font-bold text-text-primary mb-2">
              精选修复案例：Before &amp; After
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
              重点案例：徐显秀墓《宴饮图》，北壁第二层，长约 3.2m。
              经过精密的红外扫描和 AI 辅助识别，发现了 14 处微裂纹、3 处大面积脱落区。
              历时 8 个月的科学修复，壁画色彩与线条得到高度还原。
            </p>
          </div>
        </div>
      </section>

      {/* ========== 核心功能亮点 ========== */}
      <section ref={coreFeatRef} className="py-20 px-6 bg-bg-warm">
        <div className="max-w-6xl mx-auto">
          <h2 className="animate-on-scroll text-2xl md:text-3xl font-bold text-primary text-center mb-12 tracking-wide">
            核心功能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {coreFeatures.map((f, i) => (
              <div
                key={f.title}
                className={`animate-on-scroll stagger-${i + 1} feature-card p-6 rounded-xl bg-bg-card border border-border-warm`}
              >
                <span className="feature-icon text-3xl text-primary block mb-4">{f.icon}</span>
                <h3 className="text-base font-semibold mb-2 text-text-primary">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 文化与价值区 ========== */}
      <section ref={cultureRef} className="py-20 px-6 bg-bg-cream">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="animate-on-scroll text-2xl md:text-3xl font-bold text-text-primary mb-5 tracking-wide">
            千载古韵 · 守望传承
          </h2>
          <p className="animate-on-scroll stagger-1 text-text-secondary leading-loose text-sm max-w-2xl mx-auto mb-3">
            北齐壁画是中国古代绘画艺术的珍贵遗产，承载着一千四百余年的历史记忆。
            太原地区的北齐墓葬壁画以徐显秀墓为代表，展现了北朝时期独特的艺术风格与社会风貌。
          </p>
          <p className="animate-on-scroll stagger-2 text-text-secondary leading-loose text-sm max-w-2xl mx-auto mb-14">
            我们以科技与匠心守护千年瑰宝，让北齐壁画在数字世界中延续生命，成为当代文化传承的一部分。
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {valueIcons.map((v, i) => (
              <div key={v.label} className={`animate-on-scroll stagger-${i + 1} flex flex-col items-center gap-3`}>
                <div className="w-16 h-16 rounded-full bg-bg-card border border-border-warm flex items-center justify-center text-2xl text-gold shadow-sm">
                  {v.icon}
                </div>
                <span className="text-sm text-text-secondary">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 页脚 ========== */}
      <footer className="py-12 px-6 text-sm" style={{ backgroundColor: '#2A2118', color: '#A89888' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="text-white font-bold text-lg mb-2" style={{ color: '#C9A66B' }}>壁蕴</div>
              <p className="text-xs leading-relaxed opacity-60">
                北齐壁画数字化修复管理系统
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3" style={{ color: '#D4AF87' }}>平台功能</h4>
              <ul className="space-y-2 opacity-60">
                <li className="hover:opacity-100 cursor-pointer transition-opacity">壁画管理</li>
                <li className="hover:opacity-100 cursor-pointer transition-opacity">病害标注</li>
                <li className="hover:opacity-100 cursor-pointer transition-opacity">修复项目</li>
                <li className="hover:opacity-100 cursor-pointer transition-opacity">数据分析</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3" style={{ color: '#D4AF87' }}>资源中心</h4>
              <ul className="space-y-2 opacity-60">
                <li className="hover:opacity-100 cursor-pointer transition-opacity">知识库</li>
                <li className="hover:opacity-100 cursor-pointer transition-opacity">数字档案</li>
                <li className="hover:opacity-100 cursor-pointer transition-opacity">修复案例</li>
                <li className="hover:opacity-100 cursor-pointer transition-opacity">技术标准</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3" style={{ color: '#D4AF87' }}>联系我们</h4>
              <ul className="space-y-2 opacity-60">
                <li className="flex items-center gap-2"><MailOutlined /> info@northernqi.org</li>
                <li className="flex items-center gap-2"><PhoneOutlined /> 0351-88888888</li>
                <li className="flex items-center gap-2"><EnvironmentOutlined /> 太原市文物保护中心</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3" style={{ color: '#D4AF87' }}>更多信息</h4>
              <ul className="space-y-2 opacity-60">
                <li className="hover:opacity-100 cursor-pointer transition-opacity">关于我们</li>
                <li className="hover:opacity-100 cursor-pointer transition-opacity">合作伙伴</li>
                <li className="hover:opacity-100 cursor-pointer transition-opacity">使用条款</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 text-center opacity-40" style={{ borderColor: '#3F2E1E' }}>
            <p>© 2026 太原北齐壁画博物馆 · 北齐壁蕴系统 v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
