import clsx from 'clsx';

/** Khối nội dung nền trắng, dùng làm đơn vị bố cục chính của mọi trang. */
export default function Card({ title, description, actions, className, bodyClassName, children }) {
  const hasHeader = title || description || actions;

  return (
    <section className={clsx('rounded-lg bg-white shadow-sm ring-1 ring-gray-200', className)}>
      {hasHeader && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}
