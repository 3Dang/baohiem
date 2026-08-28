import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import { navigation } from '@/config/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { formatNumber } from '@/lib/format';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'BẢO HIỂM';

/** Một mục điều hướng; NavLink tự gắn class khi đang ở đúng route. */
function NavItem({ item, badge, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-white/15 font-medium text-white'
            : 'text-brand-100 hover:bg-white/10 hover:text-white',
        )
      }
    >
      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {badge != null && <Badge tone="brand">{formatNumber(badge)}</Badge>}
    </NavLink>
  );
}

/** Nhóm menu có thể thu gọn. Nhóm không có nhãn thì luôn mở. */
function NavSection({ section, badges, onNavigate }) {
  const [open, setOpen] = useState(true);

  if (section.items.length === 0) return null;

  return (
    <div className="mb-1">
      {section.label && (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-brand-200/80 hover:text-white"
          aria-expanded={open}
        >
          {section.label}
          <Icon
            name="chevronDown"
            className={clsx('h-4 w-4 transition-transform', !open && '-rotate-90')}
          />
        </button>
      )}
      {open && (
        <div className="space-y-0.5">
          {section.items.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              badge={item.countKey ? badges?.[item.countKey] : undefined}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Sidebar cố định trên desktop, dạng overlay trên mobile.
 *
 * @param {{ open: boolean, onClose: () => void, badges?: Record<string, number> }} props
 */
export default function Sidebar({ open, onClose, badges }) {
  const { can } = useAuth();

  // Lọc theo quyền trước khi render để không hiện mục người dùng không được vào
  const sections = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => can(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Lớp phủ chỉ xuất hiện khi mở sidebar trên mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 transition-transform',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <span className="truncate text-base font-bold tracking-tight text-white">
            {APP_NAME}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-200 hover:text-white lg:hidden"
          >
            <Icon name="close" className="h-6 w-6" />
            <span className="sr-only">Thu gọn thanh bên</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-6" aria-label="Điều hướng chính">
          {sections.map((section) => (
            <NavSection
              key={section.id}
              section={section}
              badges={badges}
              // Trên mobile, chọn xong thì đóng sidebar để thấy nội dung
              onNavigate={() => window.innerWidth < 1024 && onClose()}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
