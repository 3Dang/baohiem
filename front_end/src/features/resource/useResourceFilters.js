import { useMemo, useState } from 'react';

/**
 * State cho thanh bộ lọc của trang danh sách.
 *
 * Mỗi field khai báo `{ name, label, type, options?, defaultValue?, pair?, chipLabel? }`.
 * `defaultValue` là giá trị lúc mới vào trang (ví dụ kỳ lọc mặc định là tháng
 * này) — nút "Đặt lại bộ lọc" đưa về đúng các giá trị đó, không phải về rỗng.
 *
 * `pair` gộp nhiều field thành một chip duy nhất (khoảng ngày "từ … đến …"
 * hiển thị một chip thay vì hai, đúng như hệ thống cũ).
 *
 * `defer` tách "đang chọn" khỏi "đã áp dụng": bảng chỉ truy vấn lại khi bấm
 * "Áp dụng bộ lọc". Dùng cho trang mà mỗi lần truy vấn đều nặng (báo cáo tổng
 * hợp trải trên nhiều bảng), tránh gọi API sau từng lần đổi một ô.
 *
 * @param {Array<object>} fields
 * @param {{ defer?: boolean }} [options]
 */
export function useResourceFilters(fields = [], { defer = false } = {}) {
  const defaults = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ''])),
    [fields],
  );

  const [values, setValues] = useState(defaults);
  // Chỉ dùng khi `defer`: bản sao đã xác nhận, là thứ thật sự gửi lên API
  const [applied, setApplied] = useState(defaults);

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  /** Bỏ một chip: xoá mọi field thuộc chip đó về giá trị rỗng. */
  const clearNames = (names) => {
    const cleared = Object.fromEntries(names.map((name) => [name, '']));
    setValues((prev) => ({ ...prev, ...cleared }));
    // Chip mô tả điều kiện đang có hiệu lực, nên bỏ chip phải áp dụng ngay
    setApplied((prev) => ({ ...prev, ...cleared }));
  };

  const reset = () => {
    setValues(defaults);
    setApplied(defaults);
  };

  const apply = () => setApplied(values);

  // Chip đọc từ giá trị đã áp dụng: chúng cho biết bảng đang lọc theo cái gì,
  // không phải người dùng đang gõ dở cái gì
  const source = defer ? applied : values;

  /** Chip mô tả các điều kiện đang có giá trị, gộp theo `pair`. */
  const chips = useMemo(() => {
    const result = [];
    const done = new Set();

    fields.forEach((field) => {
      if (done.has(field.name)) return;

      const group = field.pair ? fields.filter((item) => item.pair === field.pair) : [field];
      group.forEach((item) => done.add(item.name));

      // Chip chỉ hiện khi có ít nhất một field trong nhóm được đặt giá trị
      if (!group.some((item) => source[item.name])) return;

      result.push({
        key: field.pair ?? field.name,
        names: group.map((item) => item.name),
        label: (field.chipLabel ?? defaultChipLabel)(source, group),
      });
    });

    return result;
  }, [fields, source]);

  /** Chỉ gửi lên API những điều kiện có giá trị, để query string gọn. */
  const params = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(source).filter(([, value]) => value !== '' && value != null),
      ),
    [source],
  );

  return { values, setValue, clearNames, reset, apply, chips, params, isDirty: chips.length > 0 };
}

/** Nhãn chip mặc định: "Nhãn: giá trị", ghép bằng "đến" nếu là cặp. */
function defaultChipLabel(values, group) {
  const parts = group
    .filter((field) => values[field.name])
    .map((field) => labelOf(field, values[field.name]));

  return parts.join(' → ');
}

/** Với select thì hiện nhãn tuỳ chọn, không hiện value thô. */
function labelOf(field, value) {
  const option = field.options?.find((item) => String(item.value) === String(value));
  const shown = option ? option.label : value;
  return `${field.label}: ${shown}`;
}
