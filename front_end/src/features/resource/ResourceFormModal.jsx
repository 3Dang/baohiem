import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { SelectField, TextField } from '@/components/ui/Field';

/**
 * Chuyển giá trị backend về dạng dùng được cho input.
 * Riêng `date` phải cắt còn `yyyy-MM-dd` vì input[type=date] không nhận ISO đầy đủ.
 */
const toInputValue = (value, type) => {
  if (value == null) return '';
  if (type === 'date') return String(value).slice(0, 10);
  return String(value);
};

/**
 * Chuyển state form về payload gửi API.
 *
 * Input HTML luôn cho ra chuỗi, nên phải quy đổi lại: field `number` thành số,
 * và ô rỗng của field không bắt buộc thành `null` để backend ghi NULL thay vì
 * chuỗi trắng (cột `effective_to` rỗng nghĩa là "đang áp dụng", không phải "").
 */
const toPayload = (fields, values) =>
  Object.fromEntries(
    fields.map((field) => {
      const raw = values[field.name];
      const text = typeof raw === 'string' ? raw.trim() : raw;

      if (text === '' || text == null) return [field.name, field.required ? '' : null];
      if (field.type === 'number') return [field.name, Number(text)];
      return [field.name, text];
    }),
  );

/** Dựng state ban đầu của form từ khai báo field và bản ghi đang sửa. */
const buildValues = (fields, record) =>
  Object.fromEntries(
    fields.map((field) => [
      field.name,
      toInputValue(record?.[field.name] ?? field.defaultValue, field.type),
    ]),
  );

/**
 * Hộp thoại thêm/sửa dùng chung, sinh form từ mảng khai báo field.
 *
 * Mỗi field: `{ name, label, type?, required?, options?, hint?, placeholder?,
 * colSpan?, ...attrs }` — `type` theo input HTML (`text` mặc định, `number`,
 * `date`) hoặc `select` khi có `options`.
 *
 * Lỗi 422 của backend được gắn vào đúng field nhờ `name` khớp tên field API.
 *
 * @param {{ open: boolean, title: string, fields: Array<object>,
 *           record?: object|null, submitting?: boolean, error?: import('@/lib/http').ApiError,
 *           onSubmit: (values: object) => void, onClose: () => void }} props
 */
export default function ResourceFormModal({
  open,
  title,
  fields,
  record,
  submitting = false,
  error,
  onSubmit,
  onClose,
}) {
  const [values, setValues] = useState(() => buildValues(fields, record));

  // Nạp lại khi mở hộp thoại hoặc đổi bản ghi đang sửa
  useEffect(() => {
    if (open) setValues(buildValues(fields, record));
    // fields là hằng khai báo ở cấp module nên không cần theo dõi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record]);

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit(toPayload(fields, values));
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={title}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button type="submit" form="resource-form" loading={submitting}>
            Lưu
          </Button>
        </>
      }
    >
      {/* Lỗi chung (409, 500…); lỗi 422 đã nằm dưới từng field */}
      {error && error.status !== 422 && (
        <Alert className="mb-4" title="Không lưu được">
          {error.message}
        </Alert>
      )}

      <form id="resource-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const { name, label, type = 'text', required, options, hint, colSpan, ...attrs } = field;
          const shared = {
            label,
            required,
            hint,
            error: error?.fieldError(name),
            value: values[name] ?? '',
            onChange: (event) => setValue(name, event.target.value),
          };

          return (
            <div key={name} className={colSpan === 2 ? 'sm:col-span-2' : undefined}>
              {options ? (
                <SelectField {...shared} {...attrs} options={options} />
              ) : (
                <TextField {...shared} {...attrs} type={type} />
              )}
            </div>
          );
        })}
      </form>
    </Modal>
  );
}
