import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FieldGroup from '@/components/ui/FieldGroup';
import SearchSelect from '@/components/ui/SearchSelect';
import Toggle from '@/components/ui/Toggle';
import {
  CheckboxField,
  Field,
  SelectField,
  TextareaField,
  TextField,
} from '@/components/ui/Field';
import { useOptionsQuery } from './useOptions';

/** Kiểu field mang giá trị đúng/sai, không phải chuỗi như input thường. */
const BOOLEAN_TYPES = new Set(['checkbox', 'toggle']);

/**
 * Khai báo dành cho form, không phải thuộc tính HTML — phải loại bỏ trước khi
 * trải phần còn lại xuống input, nếu không React cảnh báo prop lạ.
 */
const META_KEYS = new Set([
  'name',
  'label',
  'type',
  'options',
  'optionsFrom',
  'searchable',
  'checkedValue',
  'uncheckedValue',
  'hint',
  'colSpan',
  'group',
  'groupIcon',
  'groupHint',
  'groupColumns',
  'groupCollapsible',
  'defaultValue',
]);

const attrsOf = (field) =>
  Object.fromEntries(Object.entries(field).filter(([key]) => !META_KEYS.has(key)));

/** Ô chiếm nhiều cột: ghi chú trải hết hàng, tên đơn vị rộng gấp đôi ô mã. */
const COL_SPAN = {
  2: 'sm:col-span-2',
  3: 'sm:col-span-2 lg:col-span-3',
  4: 'sm:col-span-2 lg:col-span-4',
  full: 'col-span-full',
};

const GRID = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Ô đúng/sai đang bật hay tắt.
 *
 * Có bản ghi lưu trạng thái bằng chuỗi (`attachmentStatus: 'attached'`) nhưng ô
 * nhập vẫn là một checkbox — `checkedValue` khai chuỗi tương ứng, nhờ vậy cột
 * trong bảng và ô trong form nói về cùng một trường thay vì hai trường song song.
 */
const isChecked = (field, value) =>
  'checkedValue' in field ? value === field.checkedValue : Boolean(value);

/**
 * Chuyển giá trị backend về dạng dùng được cho input.
 * Riêng `date` phải cắt còn `yyyy-MM-dd` vì input[type=date] không nhận ISO đầy đủ.
 */
const toInputValue = (value, field) => {
  if (BOOLEAN_TYPES.has(field.type)) return isChecked(field, value);
  if (value == null) return '';
  if (field.type === 'date') return String(value).slice(0, 10);
  return String(value);
};

/**
 * Chuyển state form về payload gửi API.
 *
 * Input HTML luôn cho ra chuỗi, nên phải quy đổi lại: field `number` thành số,
 * công tắc/checkbox thành `true`/`false` (hoặc cặp `checkedValue` /
 * `uncheckedValue` nếu bản ghi lưu trạng thái bằng chuỗi), và ô rỗng của field
 * không bắt buộc thành `null` để backend ghi NULL thay vì chuỗi trắng (cột
 * `effective_to` rỗng nghĩa là "đang áp dụng", không phải "").
 */
const toPayload = (fields, values) =>
  Object.fromEntries(
    fields.map((field) => {
      const raw = values[field.name];

      if (BOOLEAN_TYPES.has(field.type)) {
        if ('checkedValue' in field) {
          return [field.name, raw ? field.checkedValue : (field.uncheckedValue ?? null)];
        }
        return [field.name, Boolean(raw)];
      }

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
      toInputValue(record?.[field.name] ?? field.defaultValue, field),
    ]),
  );

/**
 * Một ô trong form.
 *
 * Là component riêng (không phải hàm render) vì ô chọn có thể tự nạp danh mục
 * qua `optionsFrom`, mà nạp dữ liệu thì phải gọi hook — hook không được gọi
 * trong vòng lặp của component cha.
 *
 * `optionsFrom.dependsOn` là ô chọn phụ thuộc: phường/xã chỉ truy vấn sau khi
 * biết tỉnh/thành, và gửi kèm tỉnh đó làm điều kiện lọc. Chưa chọn cha thì ô
 * con khoá lại — mở ra danh sách cả nước thì người dùng phải tự nhớ xã nào
 * thuộc tỉnh nào.
 */
function FormField({ field, values, error, onChange }) {
  const { name, label, type = 'text', required, hint, options, optionsFrom } = field;
  const attrs = attrsOf(field);
  const id = useId();

  /*
   * Ô chọn nạp từ danh mục thì mặc định có ô tìm kiếm: danh mục nào cũng dài
   * (143 quận/huyện, 217 đại lý, hơn ba nghìn xã) nên cuộn tay không dùng được.
   * Danh sách khai cứng tại trang (loại bảo hiểm, trạng thái) chỉ vài dòng, ô
   * tìm kiếm chỉ thêm một cú bấm.
   */
  const searchable = field.searchable ?? Boolean(optionsFrom);

  const parent = optionsFrom?.dependsOn;
  const parentValue = parent ? values[parent] : undefined;
  const ready = !parent || Boolean(parentValue);

  // Từ khoá đang gõ trong ô chọn: tìm trên server nên phải giữ ở đây để đưa vào
  // truy vấn, chứ không để `SearchSelect` tự lọc trong số đã tải
  const [term, setTerm] = useState('');

  const loaded = useOptionsQuery(optionsFrom?.endpoint, {
    labelKey: optionsFrom?.labelKey,
    // Danh mục lưu theo **tên** đơn vị (bảng dữ liệu cũng hiện tên), nên giá trị
    // của option là tên chứ không phải id
    valueKey: optionsFrom?.valueKey ?? 'name',
    enabled: Boolean(optionsFrom) && ready,
    search: term,
    params: parent && parentValue ? { [optionsFrom.param ?? parent]: parentValue } : undefined,
  });

  const value = values[name];
  const shared = { label, required, hint, error };

  if (BOOLEAN_TYPES.has(type)) {
    /*
     * Công tắc và checkbox không có ô nhập nên tự nhiên nằm cao hơn các field
     * cùng hàng; đẩy xuống đáy ô để mọi control trên một hàng thẳng chân nhau.
     */
    return (
      <div className="flex flex-col justify-end">
        {type === 'toggle' ? (
          <Field id={id} label={label} required={required} error={error} hint={hint}>
            <Toggle
              id={id}
              checked={Boolean(value)}
              onChange={(next) => onChange(name, next)}
              label={label}
            />
          </Field>
        ) : (
          // Checkbox tự mang nhãn nằm ngang, nên `Field` chỉ còn lo lỗi và hint
          <Field error={error} hint={hint}>
            <CheckboxField
              label={label}
              checked={Boolean(value)}
              onChange={(event) => onChange(name, event.target.checked)}
            />
          </Field>
        )}
      </div>
    );
  }

  const control = { ...shared, value: value ?? '' };
  const change = (event) => onChange(name, event.target.value);

  if (type === 'textarea') {
    return <TextareaField {...control} {...attrs} onChange={change} />;
  }

  if (options || optionsFrom) {
    if (!searchable) {
      return (
        <SelectField
          {...control}
          {...attrs}
          options={options ?? loaded.options}
          loading={loaded.loading}
          disabled={attrs.disabled || !ready}
          onChange={change}
        />
      );
    }

    return (
      <SearchSelect
        {...control}
        {...attrs}
        options={options ?? loaded.options}
        loading={loaded.loading}
        disabled={attrs.disabled || !ready}
        onChange={change}
        // Danh sách khai cứng tại trang đã có đủ ở client, chỉ danh mục nạp từ
        // API mới cần tìm trên server
        onSearch={optionsFrom ? setTerm : undefined}
        note={
          loaded.truncated
            ? `Danh mục có ${loaded.total} mục, chưa hiện hết — gõ để tìm trên toàn danh mục.`
            : undefined
        }
      />
    );
  }

  return <TextField {...control} {...attrs} type={type} onChange={change} />;
}


/**
 * Chia field thành các khối liền nhau theo `group`.
 *
 * Gom theo các field **liền kề** (như `groupBy` của bảng) để thứ tự khai báo
 * quyết định thứ tự trên màn hình: khai xen kẽ hai khối thì được đúng hai khối
 * ở đúng chỗ đó, không bị dồn lại thành một.
 */
const sectionsOf = (fields) => {
  const sections = [];

  fields.forEach((field) => {
    const group = field.group ?? null;
    const last = sections[sections.length - 1];

    if (last && last.group === group) last.fields.push(field);
    else sections.push({ group, fields: [field] });
  });

  return sections;
};

/**
 * Hộp thoại thêm/sửa dùng chung, sinh form từ mảng khai báo field.
 *
 * Mỗi field: `{ name, label, type?, required?, options?, optionsFrom?, hint?,
 * placeholder?, prefix?, prefixIcon?, colSpan?, group?, ...attrs }`.
 * `type` theo input HTML (`text` mặc định, `number`, `date`) hoặc `textarea`,
 * `checkbox`, `toggle`; có `options`/`optionsFrom` thì thành ô chọn — ô chọn nạp
 * từ danh mục kèm sẵn ô tìm kiếm, `searchable` bật/tắt riêng.
 *
 * Field khai `group` được bọc trong một khối nền xanh có tiêu đề — cùng hình
 * dáng với khối của thanh bộ lọc. `groupIcon`, `groupHint`, `groupColumns`,
 * `groupCollapsible` khai ở field đầu của khối.
 *
 * Lỗi 422 của backend được gắn vào đúng field nhờ `name` khớp tên field API.
 *
 * `resetToken` là tín hiệu xoá form mà vẫn giữ hộp thoại mở: trang cha tăng nó
 * lên sau khi "Tạo & tạo thêm" lưu xong. Đặt ở trang cha vì chỉ nó biết lần lưu
 * đã thành công hay chưa — xoá form ngay lúc bấm thì lỗi 422 trả về sẽ không còn
 * dữ liệu nào để sửa.
 *
 * @param {{ open: boolean, title: string, fields: Array<object>,
 *           record?: object|null, submitting?: boolean, columns?: 1|2|3|4,
 *           size?: string, resetToken?: number,
 *           error?: import('@/lib/http').ApiError,
 *           onSubmit: (values: object, options: { again: boolean }) => void,
 *           onClose: () => void }} props
 */
export default function ResourceFormModal({
  open,
  title,
  fields,
  record,
  submitting = false,
  columns = 2,
  size = 'xl',
  resetToken = 0,
  error,
  onSubmit,
  onClose,
}) {
  const [values, setValues] = useState(() => buildValues(fields, record));
  // Nút nào vừa bấm: "Tạo & tạo thêm" giữ hộp thoại mở để nhập bản ghi kế tiếp
  const againRef = useRef(false);

  // Nạp lại khi mở hộp thoại, đổi bản ghi đang sửa, hoặc vừa "Tạo & tạo thêm"
  useEffect(() => {
    if (open) setValues(buildValues(fields, record));
    // fields là hằng khai báo ở cấp module nên không cần theo dõi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record, resetToken]);

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const submit = (event) => {
    event.preventDefault();
    const again = againRef.current;
    againRef.current = false;
    onSubmit(toPayload(fields, values), { again });
  };

  const renderField = (field) => (
    <div key={field.name} className={COL_SPAN[field.colSpan]}>
      <FormField
        field={field}
        values={values}
        error={error?.fieldError(field.name)}
        onChange={setValue}
      />
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={title}
      size={size}
      footerAlign="start"
      footer={
        <>
          <Button type="submit" form="resource-form" loading={submitting}>
            {record ? 'Lưu' : 'Tạo'}
          </Button>
          {/* Nhập danh mục là việc làm cả loạt: mỗi lần lưu lại phải bấm "Tạo
              mới" và chờ hộp thoại mở lại thì nhập mười dòng mất mười lần chờ */}
          {!record && (
            <Button
              type="submit"
              form="resource-form"
              variant="secondary"
              disabled={submitting}
              onClick={() => {
                againRef.current = true;
              }}
            >
              Tạo &amp; tạo thêm
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Huỷ bỏ
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

      <form id="resource-form" onSubmit={submit} noValidate className="space-y-4">
        {sectionsOf(fields).map((section, index) =>
          section.group ? (
            <FieldGroup
              // Tên khối có thể xuất hiện ở hai đoạn rời nhau nên phải kèm vị trí
              key={`${section.group}-${index}`}
              title={section.group}
              icon={section.fields[0].groupIcon}
              hint={section.fields[0].groupHint}
              columns={section.fields[0].groupColumns ?? columns}
              collapsible={section.fields[0].groupCollapsible}
            >
              {section.fields.map(renderField)}
            </FieldGroup>
          ) : (
            <div
              // Khối không có tiêu đề nên không có khoá tự nhiên nào ngoài vị trí
              key={`plain-${index}`}
              className={clsx('grid gap-4', GRID[columns])}
            >
              {section.fields.map(renderField)}
            </div>
          ),
        )}
      </form>
    </Modal>
  );
}

