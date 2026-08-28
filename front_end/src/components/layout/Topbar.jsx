import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/features/auth/AuthContext';
import { useClickOutside, useDebouncedValue } from '@/lib/hooks';

/** Ô tìm kiếm toàn hệ thống; gõ xong 400ms mới bắn query lên server. */
function GlobalSearch() {
  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term);
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    if (debounced.trim()) navigate(`/search?q=${encodeURIComponent(debounced.trim())}`);
  };

  return (
    <form onSubmit={submit} className="relative hidden sm:block" role="search">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      />
      <input
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Tìm kiếm"
        aria-label="Tìm kiếm toàn hệ thống"
        className="w-56 rounded-md border-0 bg-white py-1.5 pl-9 pr-3 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 lg:w-72"
      />
    </form>
  );
}

/** Menu người dùng: thông tin tài khoản và đăng xuất. */
function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
    // AuthProvider xoá user → route bảo vệ tự chuyển về /login
  };

  const initials = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-gray-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm text-gray-700 sm:block">
          {user?.name}
        </span>
        <Icon name="chevronDown" className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200"
        >
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={signingOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
          >
            {signingOut ? <Spinner className="h-4 w-4" /> : <Icon name="logout" className="h-4 w-4" />}
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Thanh trên: nút mở sidebar (mobile), tìm kiếm, thông báo, menu người dùng.
 *
 * @param {{ onOpenSidebar: () => void, unreadCount?: number }} props
 */
export default function Topbar({ onOpenSidebar, unreadCount = 0 }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="text-gray-500 hover:text-gray-700 lg:hidden"
      >
        <Icon name="menu" className="h-6 w-6" />
        <span className="sr-only">Mở rộng thanh bên</span>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <GlobalSearch />

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative text-gray-500 hover:text-gray-700"
          title="Thông báo"
        >
          <Icon name="bell" className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Mở thông báo</span>
        </button>

        <UserMenu />
      </div>
    </header>
  );
}
