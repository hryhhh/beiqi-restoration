import type { ReactNode } from 'react';
import {
  PictureOutlined,
  BugOutlined,
  ToolOutlined,
  SwapOutlined,
  ExperimentOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  AuditOutlined,
  LockOutlined,
  FileTextOutlined,
  RobotOutlined,
  SyncOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  AreaChartOutlined,
} from '@ant-design/icons';

interface FeatureItem {
  icon: ReactNode;
  title: string;
  desc: string;
}

interface BadgeItem {
  icon: ReactNode;
  label: string;
  desc: string;
}

interface StatItem {
  target: number;
  label: string;
  duration: number;
  icon: ReactNode;
  suffix?: string;
}

interface FooterGroup {
  title: string;
  items: string[];
}

interface ContactItem {
  icon: ReactNode;
  text: string;
}

export const aboutDescription =
  '北齐壁画系统是面向文物保护工作者和研究人员的数字化修复管理平台，以数字技术赋能文物保护，专注于太原地区北齐时期墓葬壁画的科学修复与永久保存。系统严格遵循《古代壁画保护修复档案规范》（GB/T 30235），提供从病害调查、方案制定到效果评估的全流程数字化闭环管理。';

export const stats: StatItem[] = [
  { target: 1280, label: '壁画数字档案', duration: 2200, icon: <DatabaseOutlined /> },
  { target: 56, label: '已完成修复项目', duration: 1800, icon: <CheckCircleOutlined /> },
  { target: 420, label: '修复面积', duration: 2000, icon: <AreaChartOutlined />, suffix: ' m²' },
];

export const statsCaption = '实时更新 · 数据来源于太原北齐壁画保护基地';

export const majorFeatures: FeatureItem[] = [
  {
    icon: <PictureOutlined />,
    title: '壁画库管理',
    desc: '全球高清扫描、云端存储与智能检索，构建完整的壁画数字档案体系。',
  },
  {
    icon: <BugOutlined />,
    title: '病害精准识别',
    desc: 'AI 精准定位裂缝、空鼓、起甲、霉斑等病害，辅助专家快速诊断评估。',
  },
  {
    icon: <ToolOutlined />,
    title: '流程数字化闭环',
    desc: '从现状调查到监测验收，七阶段标准修复流程全程数字化管理追踪。',
  },
];

export const minorFeatures = [
  { icon: <SyncOutlined />, title: '前后智能对比' },
  { icon: <BookOutlined />, title: '知识库集成' },
  { icon: <FileTextOutlined />, title: '数字档案' },
  { icon: <RobotOutlined />, title: 'AI修复建议' },
];

export const coreFeatures: FeatureItem[] = [
  { icon: <PictureOutlined />, title: '壁画库管理', desc: '系统化管理壁画数字档案，支持多光谱图像存储与检索' },
  { icon: <BugOutlined />, title: '病害精准标注', desc: '多边形、矩形标注工具，精确记录病害区域与严重程度' },
  { icon: <ToolOutlined />, title: '修复项目全流程', desc: '七阶段标准修复流程管理，任务分配与进度追踪' },
  { icon: <SwapOutlined />, title: '修复前后对比', desc: '并排与滑块叠加对比，直观评估修复效果' },
  { icon: <ExperimentOutlined />, title: 'AI 图像分析', desc: '智能病害检测辅助标注，自动生成修复报告' },
  { icon: <BookOutlined />, title: '知识库与档案', desc: '修复标准流程、材料手册、案例库一站式查阅' },
];

export const comparisonCase = {
  alt: '徐显秀墓《宴饮图》修复前后对比样例',
  title: '精选修复案例：徐显秀墓《宴饮图》',
  description:
    '北壁第二层，长约 3.2m。经精密红外扫描与 AI 辅助识别，发现 14 处微裂纹、3 处大面积脱落区。历时 8 个月科学修复，壁画色彩与线条得到高度还原，千年画卷重焕生机。',
};

export const cultureParagraphs = [
  '北齐壁画是中国古代绘画艺术的珍贵遗产，承载着一千四百余年的历史记忆。太原地区的北齐墓葬壁画以徐显秀墓为代表，展现了北朝时期独特的艺术风格与社会风貌。',
  '我们以科技与匠心守护千年瑰宝，让北齐壁画在数字世界中延续生命。',
];

export const trustBadges: BadgeItem[] = [
  { icon: <SafetyCertificateOutlined />, label: '权威国家级', desc: '国家文物局指导' },
  { icon: <TeamOutlined />, label: 'AI+专家协作', desc: '人机协同修复' },
  { icon: <AuditOutlined />, label: '标准与规范', desc: 'GB/T 30235 合规' },
  { icon: <LockOutlined />, label: '安全数据保护', desc: '全链路加密溯源' },
];

export const footerGroups: FooterGroup[] = [
  {
    title: '平台功能',
    items: ['壁画管理', '病害标注', '修复项目', '数据分析'],
  },
  {
    title: '资源中心',
    items: ['知识库', '数字档案', '修复案例', '技术标准'],
  },
  {
    title: '更多信息',
    items: ['关于我们', '合作伙伴', '使用条款'],
  },
];

export const footerContacts: ContactItem[] = [
  { icon: <MailOutlined />, text: 'info@northernqi.org' },
  { icon: <PhoneOutlined />, text: '0351-88888888' },
  { icon: <EnvironmentOutlined />, text: '太原市文物保护中心' },
];

export const footerDescription = '北齐壁画数字化修复管理系统';
export const footerCopyright = '© 2026 太原北齐墓葬壁画博物馆 · 北齐壁画系统 v1.0.0';
