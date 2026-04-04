import { useState } from 'react';
import { Form, Input, Button, App } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { LoginRequest } from '@/types';
import brandLogo from '../../assets/logo.jpg';

export default function LoginPage() {
  const { login } = useAuth();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await login(values);
    } catch {
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* 背景装饰层 */}
      <div className="login-bg" />
      <div className="login-bg-overlay" />

      {/* 顶部导航 */}
      <header className="login-header">
        <div className="login-logo">
          <img src={brandLogo} alt="北齐壁蕴 Logo" className="login-logo-image" />
          <span className="login-logo-text">北齐壁蕴</span>
        </div>
        <Link to="/" className="login-back-link">返回官网</Link>
      </header>

      {/* 登录卡片 */}
      <main className="login-main">
        <div className="login-card">
          {/* 卡片顶部装饰线 */}
          <div className="login-card-accent" />

          <h1 className="login-title">守护北齐千年壁画</h1>
          <p className="login-subtitle">北齐壁画数字化修复管理平台</p>

          <Form onFinish={onFinish} size="large" className="login-form">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input
                prefix={<UserOutlined className="login-input-icon" />}
                placeholder="用户名 / 账号"
                className="login-input"
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                prefix={<LockOutlined className="login-input-icon" />}
                placeholder="密码"
                className="login-input"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-btn"
              >
                登录系统
              </Button>
            </Form.Item>
          </Form>

          <div className="login-links">
            <a className="login-link">忘记密码？</a>
            <span className="login-link-divider">|</span>
            <a className="login-link">没有账号？联系管理员</a>
          </div>

          {/* 信任徽章 */}
          <div className="login-trust">
            <SafetyCertificateOutlined className="login-trust-icon" />
            <span>太原北齐壁画保护基地 · 国家文物局指导项目</span>
          </div>
        </div>
      </main>

      {/* 底部页脚 */}
      <footer className="login-footer">
        <span>© 2026 太原北齐墓葬壁画 · 北齐壁蕴系统 v1.0.0</span>
      </footer>
    </div>
  );
}
