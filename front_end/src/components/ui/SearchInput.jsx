import Icon from '@/components/ui/Icon';

/**
 * Ô tìm kiếm trong thanh công cụ của bảng dữ liệu.
 * Việc trì hoãn gõ do useResourceList xử lý, ở đây chỉ là input thuần.
 */
export default function SearchInput({ value, onChange, placeholder = 'Tìm kiếm…' }) {
  return (
    <div className="relative">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border-0 py-2 pl-9 pr-3 text-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 sm:w-64"
      />
    </div>
  );
}
