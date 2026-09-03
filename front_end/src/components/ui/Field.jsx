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

/**
 * Viền và nền của một control.
 *
 * Đặt trên khung ngoài khi field có ô biểu tượng đầu dòng, đặt thẳng trên input
 * khi không có — `focus-within` khớp cả hai trường hợp (một input đang focus
 * cũng khớp `:focus-within`), nhờ vậy chỉ cần một hàm cho cả hai.
 */
export const controlRing = (error) =>
  clsx(
    'rounded-md bg-white shadow-sm ring-1 ring-inset',
    error
      ? 'ring-red-400 focus-within:ring-2 focus-within:ring-red-500'
      : 'ring-gray-300 focus-within:ring-2 focus-within:ring-brand-500',
  );

/** Phần bên trong: không viền riêng vì viền đã nằm ở khung ngoài. */
export const controlBody =
  'block w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:text-gray-500';

/**
 * Ô biểu tượng đầu dòng: gợi ý loại dữ liệu của ô ngay cạnh chỗ gõ.
 *
 * `prefix` là chữ ngắn (dấu "#" cho mã định danh), `prefixIcon` là tên icon.
 * Field khai một trong hai, không khai cả hai.
 */
function Prefix({ prefix, prefixIcon }) {
  return (
    <span className="flex w-10 shrink-0 items-center justify-center self-stretch rounded-l-md border-r border-gray-200 bg-gray-50 text-gray-400">
      {prefixIcon ? (
        <Icon name={prefixIcon} className="h-4 w-4" />
      ) : (
        <span className="text-sm font-medium">{prefix}</span>
      )}
    </span>
  );
}

/** Bọc control trong khung có viền khi field khai biểu tượng đầu dòng. */
function Framed({ prefix, prefixIcon, error, disabled, children }) {
  if (!prefix && !prefixIcon) return children;

  return (
    <div className={clsx('flex items-stretch', controlRing(error), disabled && 'bg-gray-50')}>
      <Prefix prefix={prefix} prefixIcon={prefixIcon} />
      {children}
    </div>
  );
}

/**
 * Input văn bản. `name` phải khớp tên field backend để map lỗi 422 tự động.
 *
 * `prefix`/`prefixIcon` thêm ô biểu tượng ở đầu ô nhập (mã định danh có dấu "#",
 * tên đơn vị có icon tương ứng) — cách hệ thống cũ phân biệt các ô cùng độ dài
 * trên một hàng.
 */
export function TextField({
  label,
  required,
  error,
  hint,
  className,
  prefix,
  prefixIcon,
  ...rest
}) {
  const autoId = useId();
  const id = rest.id || autoId;
  const framed = Boolean(prefix || prefixIcon);

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <Framed prefix={prefix} prefixIcon={prefixIcon} error={error} disabled={rest.disabled}>
        <input
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          className={clsx(
            controlBody,
            !framed && controlRing(error),
            !framed && 'disabled:bg-gray-50',
            className,
          )}
          {...rest}
        />
      </Framed>
    </Field>
  );
}

/** Vùng nhập nhiều dòng — ghi chú, mô tả. */
export function TextareaField({ label, required, error, hint, rows = 3, className, ...rest }) {
  const autoId = useId();
  const id = rest.id || autoId;

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        className={clsx(controlBody, controlRing(error), 'disabled:bg-gray-50', className)}
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
          className={clsx(controlBody, controlRing(error), 'pr-10')}
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

/**
 * Ô chọn. `options` dạng `[{ value, label }]`.
 *
 * `loading` cho biết danh mục đang tải: ô chọn rỗng vì chưa có dữ liệu trông
 * hệt như ô chọn rỗng vì danh mục trống, mà hai việc đó khác nhau hoàn toàn.
 * `clearable` thêm nút xoá lựa chọn — bỏ chọn bằng dòng placeholder thì phải mở
 * danh sách vài trăm dòng rồi cuộn về đầu. Ô bắt buộc cũng dùng được: người dùng
 * đổi ý giữa lúc chọn, và bỏ trống rồi gửi thì lỗi hiện ngay dưới ô.
 */
export function SelectField({
  label,
  required,
  error,
  hint,
  options = [],
  placeholder,
  loading = false,
  clearable = false,
  prefix,
  prefixIcon,
  onChange,
  ...rest
}) {
  const autoId = useId();
  const id = rest.id || autoId;
  const framed = Boolean(prefix || prefixIcon);
  const canClear = clearable && Boolean(rest.value) && !rest.disabled;

  const select = (
    <select
      id={id}
      aria-invalid={Boolean(error)}
      aria-busy={loading}
      onChange={onChange}
      className={clsx(
        controlBody,
        !framed && controlRing(error),
        !framed && 'disabled:bg-gray-50',
        // Chỗ cho nút xoá nằm cạnh mũi chỉ xuống của select
        canClear && 'pr-8',
      )}
      {...rest}
    >
      {/* Đang tải: nói rõ trong chính dòng placeholder, ô chọn vẫn dùng được */}
      {(placeholder || loading) && <option value="">{loading ? 'Đang tải…' : placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <Framed prefix={prefix} prefixIcon={prefixIcon} error={error} disabled={rest.disabled}>
        {canClear ? (
          <span className="relative flex-1">
            {select}
            <button
              type="button"
              onClick={() => onChange?.({ target: { value: '' } })}
              title={`Bỏ chọn ${label ?? ''}`.trim()}
              tabIndex={-1}
              className="absolute inset-y-0 right-6 flex w-5 items-center justify-center text-gray-400 hover:text-gray-700"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
              <span className="sr-only">Bỏ chọn</span>
            </button>
          </span>
        ) : (
          select
        )}
      </Framed>
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
