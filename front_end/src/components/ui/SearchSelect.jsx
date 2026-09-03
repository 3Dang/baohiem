import { useEffect, useId, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import Icon from './Icon';
import Spinner from './Spinner';
import { Field, controlRing } from './Field';
import { useClickOutside, useDebouncedValue } from '@/lib/hooks';

/** Bỏ dấu để "can tho" cũng tìm ra "Cần Thơ" — người dùng ít gõ dấu khi tìm nhanh. */
const plain = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

/**
 * Ô chọn có tìm kiếm, dùng cho danh mục dài (hơn hai trăm đại lý, hơn ba nghìn
 * xã): `select` thuần buộc người dùng cuộn cả danh sách, còn ở đây gõ vài chữ
 * là ra.
 *
 * Phát `onChange({ target: { value } })` giống input thật để dùng lẫn được với
 * `SelectField` — trang khai thêm `searchable` là đổi được, không sửa gì khác.
 *
 * Khai `onSearch` thì việc tìm do server làm: `options` được hiểu là kết quả của
 * từ khoá hiện tại nên không lọc lại ở client. Cần cho danh mục dài hơn một
 * trang (hơn ba nghìn xã) — lọc trong số đã tải thì những dòng ngoài trang đầu
 * coi như không tồn tại, mà người dùng không hề biết. `note` là dòng nhắc ở cuối
 * danh sách khi kết quả bị cắt.
 *
 * @param {{ label?: string, required?: boolean, error?: string, hint?: string,
 *           options?: Array<{ value: string, label: string }>, value?: string,
 *           onChange?: (event: { target: { value: string } }) => void,
 *           onSearch?: (term: string) => void, note?: string,
 *           placeholder?: string, searchPlaceholder?: string, loading?: boolean,
 *           clearable?: boolean, disabled?: boolean, id?: string }} props
 */
export default function SearchSelect({
  label,
  required,
  error,
  hint,
  options = [],
  value = '',
  onChange,
  onSearch,
  note,
  placeholder = 'Chọn một tuỳ chọn',
  searchPlaceholder = 'Tìm kiếm…',
  loading = false,
  clearable = false,
  disabled = false,
  id: idProp,
}) {
  const autoId = useId();
  const id = idProp || autoId;
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const searchRef = useRef(null);
  const boxRef = useClickOutside(() => setOpen(false));

  const selected = options.find((option) => String(option.value) === String(value));

  /*
   * Giá trị đang lưu có thể không nằm trong trang danh mục vừa tải (3.320 xã chỉ
   * tải 200 dòng đầu) hoặc bị từ khoá hiện tại lọc ra. Hiện thẳng giá trị đó thay
   * vì rơi về placeholder: mở bản ghi ra sửa mà ô chọn trông như chưa chọn gì thì
   * người dùng chọn lại, và một giá trị đúng bị ghi đè.
   */
  const shownLabel = selected?.label ?? (value === '' ? null : String(value));

  /*
   * Server tìm thì lọc lại ở client là sai: kết quả đã là của từ khoá này, lọc
   * thêm một lần theo cùng từ khoá chỉ bỏ mất những dòng khớp theo cách khác
   * (mã đơn vị, tên đầy đủ) mà server đã tính là khớp.
   */
  const shown = useMemo(() => {
    if (onSearch) return options;

    const needle = plain(term).trim();
    if (!needle) return options;
    return options.filter((option) => plain(option.label).includes(needle));
  }, [onSearch, options, term]);

  // Chờ người dùng ngừng gõ mới gọi API, nếu không mỗi ký tự là một request
  const debouncedTerm = useDebouncedValue(term, 300);
  // Giữ trong ref để effect chỉ chạy khi từ khoá đổi, không chạy lại mỗi render
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    onSearchRef.current?.(debouncedTerm);
  }, [debouncedTerm]);

  /** Mở panel và đưa con trỏ vào ô tìm kiếm ngay, khỏi phải bấm thêm một lần. */
  const openPanel = () => {
    if (disabled) return;
    setOpen(true);
    setTerm('');
    setActive(0);
    // Panel chưa có trong DOM ở thời điểm này nên focus phải chờ lượt render sau
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  const choose = (option) => {
    onChange?.({ target: { value: option.value } });
    setOpen(false);
  };

  /** Điều hướng bằng bàn phím: khai báo ở ô tìm kiếm vì con trỏ đang nằm đó. */
  const onSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((prev) => Math.min(Math.max(prev + step, 0), shown.length - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (shown[active]) choose(shown[active]);
      return;
    }

    // Esc đóng panel nhưng không được đóng luôn cả hộp thoại chứa nó
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <div ref={boxRef} className="relative">
        <div className={clsx('flex items-stretch', controlRing(error), disabled && 'bg-gray-50')}>
          <button
            type="button"
            id={id}
            disabled={disabled}
            onClick={() => (open ? setOpen(false) : openPanel())}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-invalid={Boolean(error)}
            className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm disabled:cursor-not-allowed"
          >
            <span
              className={clsx(
                'min-w-0 flex-1 truncate',
                shownLabel ? 'text-gray-900' : 'text-gray-400',
              )}
            >
              {shownLabel ?? placeholder}
            </span>
            {loading ? (
              <Spinner className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <Icon name="chevronDown" className="h-4 w-4 shrink-0 text-gray-400" />
            )}
          </button>

          {clearable && shownLabel && !disabled && (
            <button
              type="button"
              onClick={() => onChange?.({ target: { value: '' } })}
              title={`Bỏ chọn ${label ?? ''}`.trim()}
              tabIndex={-1}
              className="flex w-8 shrink-0 items-center justify-center text-gray-400 hover:text-gray-700"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
              <span className="sr-only">Bỏ chọn</span>
            </button>
          )}
        </div>

        {open && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-gray-200">
            <div className="border-b border-gray-100 p-2">
              <input
                ref={searchRef}
                type="search"
                value={term}
                onChange={(event) => {
                  setTerm(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="block w-full rounded border-0 bg-gray-50 px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* max-h + cuộn: danh mục xã có hàng nghìn dòng, không thể trải hết */}
            <ul role="listbox" aria-label={label} className="max-h-60 overflow-y-auto py-1 text-sm">
              {loading && <li className="px-3 py-2 text-gray-500">Đang tìm kiếm…</li>}

              {!loading && shown.length === 0 && (
                <li className="px-3 py-2 text-gray-500">Không có kết quả nào khớp.</li>
              )}

              {shown.map((option, index) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={String(option.value) === String(value)}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option)}
                    className={clsx(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left',
                      index === active ? 'bg-brand-50 text-brand-900' : 'text-gray-700',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {String(option.value) === String(value) && (
                      <Icon name="check" className="h-4 w-4 shrink-0 text-brand-600" />
                    )}
                  </button>
                </li>
              ))}

              {/* Kết quả bị cắt: nói rõ để người dùng gõ thêm chữ thay vì kết
                  luận danh mục không có đơn vị mình cần */}
              {note && !loading && shown.length > 0 && (
                <li className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500">{note}</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </Field>
  );
}
