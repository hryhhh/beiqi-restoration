import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { USER_ROLE_MAP } from '@/constants';
import brandLogo from '../../assets/logo.jpg';

/** 顶部导航栏 — 玻璃拟态风格 */
export default function Header() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 glass-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <img src={brandLogo} alt="北齐壁蕴 Logo" className="brand-logo-img" />
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-wide" style={{ color: '#8B3A2F' }}>
              北齐壁画
            </div>
            <div className="text-[10px] tracking-wider" style={{ color: '#C9A66B' }}>
              Mural Guardian
            </div>
          </div>
        </Link>

        {/* 右侧 */}
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <Button
                type="primary"
                size="small"
                className="rounded-md! font-medium! tracking-wide!"
                style={{ background: 'linear-gradient(135deg, #8B3A2F, #A85044)', border: 'none' }}
                onClick={() => navigate('/dashboard')}
              >
                进入系统
              </Button>
              {user && (
                <span className="text-xs" style={{ color: '#7A6B5D' }}>
                  <UserOutlined className="mr-1" />
                  {user.username}（{USER_ROLE_MAP[user.role]}）
                </span>
              )}
            </>
          ) : (
            <Button
              type="primary"
              size="small"
              className="rounded-md! font-medium! tracking-wide!"
              style={{ background: 'linear-gradient(135deg, #8B3A2F, #A85044)', border: 'none' }}
              onClick={() => navigate('/login')}
            >
              进入系统
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
