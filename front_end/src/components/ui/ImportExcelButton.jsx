import { useRef, useState } from 'react';
import Button from './Button';
import Icon from './Icon';
import Modal from './Modal';
import Alert from './Alert';
import { useToast } from './Toast';
import http, { ApiError } from '@/lib/http';
import { formatNumber } from '@/lib/format';

/** Định dạng tệp kê khai mà cơ quan BHXH chấp nhận. */
const ACCEPTED = '.xls,.xlsx';
const MAX_SIZE_MB = 20;

/**
 * Nút "Nhập thông tin từ Excel" ở đầu trang danh sách.
 *
 * Mở hộp thoại chọn tệp rồi `POST <endpoint>` dạng multipart (field `file`).
 * Backend trả `{ total, imported, errors: [{ row, message }] }`; số dòng lỗi
 * hiện ngay trong hộp thoại để người dùng sửa tệp gốc, còn danh sách phía sau
 * được làm mới qua `onImported`.
 *
 * @param {{ endpoint: string, label?: string, title?: string,
 *           variant?: string, onImported?: () => void }} props
 */
export default function ImportExcelButton({
  endpoint,
  label = 'Nhập thông tin từ Excel',
  title,
  variant = 'secondary',
  onImported,
}) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(false);

  /** Đóng hộp thoại và xoá kết quả lần trước để lần sau mở ra không lẫn. */
  const close = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
    setMessage(null);
  };

  const pickFile = (event) => {
    const selected = event.target.files?.[0];
    setResult(null);
    setMessage(null);

    // Chặn tệp quá lớn ngay tại client để không mất thời gian upload vô ích
    if (selected && selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage(`Tệp vượt quá ${MAX_SIZE_MB} MB.`);
      setFile(null);
      return;
    }

    setFile(selected ?? null);
  };

  const submit = async () => {
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const payload = new FormData();
    payload.append('file', file);

    try {
      const data = await http.post(endpoint, payload);
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      toast.success(`Đã nhập ${formatNumber(data.imported)}/${formatNumber(data.total)} dòng.`);
      onImported?.();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Nhập tệp thất bại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        <Icon name="upload" className="h-4 w-4" />
        {label}
      </Button>

      <Modal
        open={open}
        onClose={uploading ? () => {} : close}
        title={title ?? label}
        size="md"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={close} disabled={uploading}>
              Đóng
            </Button>
            <Button onClick={submit} loading={uploading} disabled={!file}>
              Nhập dữ liệu
            </Button>
          </>
        }
      >
        {message && <Alert className="mb-4">{message}</Alert>}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={pickFile}
          aria-label="Tệp Excel"
          className="block w-full cursor-pointer rounded-md text-sm text-gray-700 ring-1 ring-inset ring-gray-300 file:mr-3 file:cursor-pointer file:border-0 file:bg-gray-50 file:px-3 file:py-2 file:text-sm file:text-gray-700"
        />
        <p className="mt-1 text-xs text-gray-500">
          Định dạng {ACCEPTED}, tối đa {MAX_SIZE_MB} MB.
        </p>

        {result && (
          <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-700 ring-1 ring-gray-200">
            <p className="font-medium text-gray-900">
              Thành công {formatNumber(result.imported)}/{formatNumber(result.total)} dòng
            </p>
            {result.errors?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.errors.map((error) => (
                  <li key={error.row} className="text-red-600">
                    Dòng {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
