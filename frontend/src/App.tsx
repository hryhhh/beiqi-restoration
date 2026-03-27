import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from '@/router';

/** Ant Design 主题配置 */
const theme = {
  token: {
    colorPrimary: '#8B2E2E',
    borderRadius: 6,
  },
};

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
