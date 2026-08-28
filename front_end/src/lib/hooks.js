import { useEffect, useRef, useState } from 'react';

/**
 * Trì hoãn giá trị để tránh gọi API mỗi lần người dùng gõ.
 * Dùng cho ô tìm kiếm toàn hệ thống và filter của bảng dữ liệu.
 */
export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Gọi `handler` khi click ra ngoài phần tử được ref.
 * Dùng cho dropdown người dùng, popover thông báo.
 */
export function useClickOutside(handler) {
  const ref = useRef(null);
  // Giữ handler trong ref để không phải gắn lại listener mỗi lần render
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) handlerRef.current();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return ref;
}
