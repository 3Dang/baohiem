import { useId, useState } from 'react';
import clsx from 'clsx';
import Icon from './Icon';

/**
 * Khung một field: label + control + thông báo lỗi.
 * Tách riêng để mọi loại input đều có cùng khoảng cách và cách báo lỗi.
 */
export function Field({ id, label, required, error, hint, children }) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className={clsx(
            'mb-1.5 block text-sm font-medium text-gray-700',
            required && 'required-mark',
          )}
        >
          {label}
        </label>
      )}
      {children}
      {/* aria-live để screen reader đọc lỗi ngay khi backend trả về */}
      {error ? (
        <p className="mt-1 text-xs text-red-600" aria-live="polite">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

/** Class dùng chung cho input/select để giao diện đồng nhất. */
const controlClass = (error) =>
  clsx(
    'block w-full rounded-md border-0 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm',
    'ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset',
    'disabled:bg-gray-50 disabled:text-gray-500',
    error ? 'ring-red-400 focus:ring-red-500' : 'ring-gray-300 focus:ring-brand-500',
  );

/**
 * Input văn bản. `name` phải khớp tên field backend để map lỗi 422 tự động.
 */
export function TextField({ label, required, error, hint, className, ...rest }) {
  const autoId = useId();
  const id = rest.id || autoId;

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        className={clsx(controlClass(error), className)}
        {...rest}
      />
    </Field>
  );
}

/** Input mật khẩu kèm nút hiện/ẩn. */
export function PasswordField({ label, required, error, hint, ...rest }) {
  const autoId = useId();
  const id = rest.id || autoId;
  const [revealed, setRevealed] = useState(false);

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={revealed ? 'text' : 'password'}
          required={required}
          aria-invalid={Boolean(error)}
          // pr-10 để chữ không chạy dưới nút hiện/ẩn
          className={clsx(controlClass(error), 'pr-10')}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setRevealed((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-gray-400 hover:text-gray-600"
          // tabIndex -1: bàn phím đi thẳng từ mật khẩu sang nút submit
          tabIndex={-1}
          title={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          <Icon name={revealed ? 'eyeOff' : 'eye'} />
          <span className="sr-only">{revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</span>
        </button>
      </div>
    </Field>
  );
}

/** Ô chọn. `options` dạng [{ value, label }]. */
export function SelectField({ label, required, error, hint, options = [], placeholder, ...rest }) {
  const autoId = useId();
  const id = rest.id || autoId;

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <select id={id} aria-invalid={Boolean(error)} className={controlClass(error)} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Checkbox có nhãn nằm ngang, dùng cho "Ghi nhớ đăng nhập". */
export function CheckboxField({ label, ...rest }) {
  const autoId = useId();
  const id = rest.id || autoId;

  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        {...rest}
      />
      <label htmlFor={id} className="text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
}
