import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { USER_ROLE_MAP } from '@/constants';

/** 顶部导航栏 — 官网首页和公开页面使用 */
export default function Header() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + 名称 */}
        <Link to="/" className="flex items-center gap-2 text-white no-underline">
          <span className="text-2xl">🏛</span>
          <div className="leading-tight">
            <div className="font-bold text-sm">北齐壁蕴</div>
            <div className="text-[10px] opacity-70">Mural Guardian</div>
          </div>
        </Link>

        {/* 右侧：用户信息或登录入口 */}
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <Button
                type="link"
                className="!text-white/80 hover:!text-white"
                onClick={() => navigate('/dashboard')}
              >
                进入系统
              </Button>
              {user && (
                <span className="text-white/70 text-xs">
                  <UserOutlined className="mr-1" />
                  {user.username}（{USER_ROLE_MAP[user.role]}）
                </span>
              )}
            </>
          ) : (
            <Button
              type="link"
              className="!text-white/80 hover:!text-white"
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
