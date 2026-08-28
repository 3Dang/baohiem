import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import Icon from '@/components/ui/Icon';

/**
 * Toast thông báo góc phải trên. Thay cho hệ thống notification của Filament.
 * Gọi `toast.success('...')` / `toast.error('...')` từ bất kỳ component nào.
 */
const ToastContext = createContext(null);

const TONE_STYLES = {
  success: { box: 'ring-green-200', icon: 'check', iconColor: 'text-green-600' },
  error: { box: 'ring-red-200', icon: 'warning', iconColor: 'text-red-600' },
  info: { box: 'ring-gray-200', icon: 'inbox', iconColor: 'text-brand-600' },
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (tone, message, duration = 4000) => {
      const id = nextId.current++;
      setItems((prev) => [...prev, { id, tone, message }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message, 6000),
      info: (message) => push('info', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {items.map((item) => {
          const style = TONE_STYLES[item.tone];
          return (
            <div
              key={item.id}
              className={clsx(
                'pointer-events-auto flex items-start gap-3 rounded-lg bg-white p-3 text-sm shadow-lg ring-1',
                style.box,
              )}
            >
              <Icon name={style.icon} className={clsx('mt-0.5 h-5 w-5 shrink-0', style.iconColor)} />
              <p className="min-w-0 flex-1 text-gray-800">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" className="h-4 w-4" />
                <span className="sr-only">Đóng thông báo</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast phải được dùng bên trong <ToastProvider>');
  return context;
}
