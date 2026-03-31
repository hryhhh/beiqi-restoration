import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from '@/router';
import { useAuthStore } from '@/stores/authStore';

/** Ant Design 主题配置 */
const theme = {
  token: {
    colorPrimary: '#B5564A',
    borderRadius: 6,
  },
};

function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
