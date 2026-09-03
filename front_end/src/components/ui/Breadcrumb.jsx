import { Link } from 'react-router-dom';
import Icon from './Icon';

/**
 * Đường dẫn phân cấp phía trên tiêu đề trang, ví dụ "Biên lai › Danh sách".
 *
 * Mục cuối là vị trí hiện tại nên không phải liên kết. Các mục trước có `to`
 * thì bấm được, không có thì chỉ là nhãn nhóm (nhiều nhóm trong hệ thống
 * không có trang riêng để trỏ tới).
 *
 * @param {{ items: Array<{ label: string, to?: string }> }} props
 */
export default function Breadcrumb({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Đường dẫn">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-1">
              {index > 0 && (
                <Icon name="chevronRight" className="h-3 w-3 text-gray-300" aria-hidden="true" />
              )}
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-brand-700 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-brand-700' : undefined} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
