import clsx from 'clsx';
import Icon from './Icon';
import Button from './Button';
import FieldGroup from './FieldGroup';
import { SelectField, TextField } from './Field';

const GRID = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-2 lg:grid-cols-5',
};

/**
 * Khai báo dành cho bộ lọc, không phải thuộc tính HTML — phải loại bỏ trước
 * khi trải phần còn lại xuống input, nếu không React sẽ cảnh báo prop lạ.
 */
const META_KEYS = new Set([
  'name',
  'label',
  'type',
  'options',
  'placeholder',
  'pair',
  'group',
  'groupHint',
  'groupIcon',
  'chipLabel',
  'defaultValue',
]);

/**
 * Thanh bộ lọc phía trên bảng dữ liệu.
 *
 * Bố cục theo hệ thống cũ: tiêu đề "Bộ lọc" bên trái, "Đặt lại bộ lọc" bên
 * phải, các điều kiện xếp thành lưới, rồi một hàng chip cho biết bộ lọc nào
 * đang có hiệu lực — người dùng thấy ngay vì sao bảng đang trống.
 *
 * Field khai báo `{ name, label, type, options?, placeholder?, group?,
 * groupHint?, groupIcon? }`. Có `group` thì các field cùng nhóm được bọc trong
 * một khối nền xanh; `groupHint`/`groupIcon` khai ở field đầu của nhóm để mô tả
 * nhóm đó lọc theo cái gì.
 *
 * `onApply` biến bộ lọc thành dạng phải bấm mới chạy — dùng cho trang mà mỗi
 * lần truy vấn đều nặng (báo cáo tổng hợp).
 *
 * @param {{ fields: Array<object>, values: Record<string, any>,
 *           onChange: (name: string, value: any) => void,
 *           chips?: Array<{ key: string, names: string[], label: string }>,
 *           onClearChip?: (names: string[]) => void, onReset?: () => void,
 *           onApply?: () => void, columns?: 1|2|3|4|5 }} props
 */
export default function FilterBar({
  fields,
  values,
  onChange,
  chips = [],
  onClearChip,
  onReset,
  onApply,
  columns = 4,
}) {
  const groupNames = [...new Set(fields.map((field) => field.group).filter(Boolean))];

  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <h3 className="text-sm font-semibold text-gray-900">Bộ lọc</h3>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      <div className="p-4">
        {groupNames.length > 0 ? (
          <div className={clsx('grid gap-4', GRID[Math.min(groupNames.length, 3)])}>
            {groupNames.map((group) => {
              const groupFields = fields.filter((field) => field.group === group);
              const { groupHint, groupIcon } = groupFields[0];

              return (
                <FieldGroup key={group} title={group} icon={groupIcon} hint={groupHint}>
                  {groupFields.map((field) => (
                    <FilterField
                      key={field.name}
                      field={field}
                      value={values[field.name]}
                      onChange={onChange}
                    />
                  ))}
                </FieldGroup>
              );
            })}
          </div>
        ) : (
          <div className={clsx('grid gap-4', GRID[columns])}>
            {fields.map((field) => (
              <FilterField
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={onChange}
              />
            ))}
          </div>
        )}

        {/* Bộ lọc phải bấm mới chạy: dùng khi mỗi lần truy vấn đều nặng */}
        {onApply && (
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={onApply}>
              <Icon name="filter" className="h-4 w-4" />
              Áp dụng bộ lọc
            </Button>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2">
          <span className="text-xs font-medium text-gray-600">Bộ lọc đang kích hoạt</span>
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-800 ring-1 ring-brand-200"
            >
              {chip.label}
              {onClearChip && (
                <button
                  type="button"
                  onClick={() => onClearChip(chip.names)}
                  title={`Bỏ điều kiện ${chip.label}`}
                  className="rounded-full p-0.5 text-brand-500 hover:bg-brand-100 hover:text-brand-800"
                >
                  <Icon name="close" className="h-3 w-3" />
                  <span className="sr-only">Bỏ điều kiện {chip.label}</span>
                </button>
              )}
            </span>
          ))}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Bỏ tất cả điều kiện"
              className="ml-auto rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
            >
              <Icon name="close" className="h-4 w-4" />
              <span className="sr-only">Bỏ tất cả điều kiện</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Một điều kiện lọc: select nếu có `options`, còn lại là input theo `type`. */
function FilterField({ field, value, onChange }) {
  const { name, label, type = 'text', options, placeholder } = field;
  const attrs = Object.fromEntries(Object.entries(field).filter(([key]) => !META_KEYS.has(key)));

  const shared = {
    label,
    value: value ?? '',
    onChange: (event) => onChange(name, event.target.value),
  };

  return options ? (
    <SelectField {...shared} {...attrs} options={options} placeholder={placeholder ?? 'Tất cả'} />
  ) : (
    <TextField {...shared} {...attrs} type={type} placeholder={placeholder} />
  );
}
