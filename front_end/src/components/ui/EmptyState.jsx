import Icon from './Icon';

/**
 * Trạng thái không có dữ liệu. Luôn kèm hành động gợi ý nếu có
 * để người dùng biết bước tiếp theo.
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'Chưa có dữ liệu',
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <Icon name={icon} className="h-10 w-10 text-gray-300" />
      <p className="mt-3 text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
