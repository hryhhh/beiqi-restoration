import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import type { LoginRequest } from '@/types';

export default function LoginPage() {
  const { login } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-bg-warm">
      <div className="w-96 bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-primary text-center mb-2">
          北齐壁蕴系统
        </h1>
        <p className="text-text-secondary text-center mb-8 text-sm">
          Northern Qi Mural Guardian
        </p>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block
              className="!bg-primary !border-primary hover:!bg-primary-light">
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
