import { useRef, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import DataTable from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import http, { ApiError } from '@/lib/http';
import { formatNumber } from '@/lib/format';

/** Định dạng tệp kê khai mà cơ quan BHXH chấp nhận. */
const ACCEPTED = '.xls,.xlsx';
const MAX_SIZE_MB = 20;

/**
 * Trang nhập hồ sơ kê khai (D03 / D05 / AR) từ tệp Excel.
 *
 * POST <endpoint> dạng multipart/form-data với field `file`.
 * Backend trả về `{ total, imported, errors: [{ row, message }] }` để
 * người dùng biết chính xác dòng nào sai mà sửa lại trong tệp gốc.
 */
export default function ImportPage({ title, description, endpoint, templateUrl }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = (event) => {
    const selected = event.target.files?.[0];
    setResult(null);
    setMessage(null);

    if (!selected) {
      setFile(null);
      return;
    }

    // Chặn tệp quá lớn ngay tại client để không mất thời gian upload vô ích
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage(`Tệp vượt quá ${MAX_SIZE_MB} MB.`);
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const payload = new FormData();
    payload.append('file', file);

    try {
      const data = await http.post(endpoint, payload);
      setResult(data);
      toast.success(`Đã nhập ${formatNumber(data.imported)}/${formatNumber(data.total)} dòng.`);
      // Xoá lựa chọn để tránh nhập trùng cùng một tệp
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Nhập tệp thất bại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          templateUrl && (
            <Button variant="secondary" onClick={() => window.open(templateUrl, '_blank')}>
              <Icon name="document" className="h-4 w-4" />
              Tải tệp mẫu
            </Button>
          )
        }
      />

      {message && <Alert className="mb-4">{message}</Alert>}

      <Card title="Chọn tệp kê khai">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="import-file"
              className="mb-1.5 block text-sm font-medium text-gray-700 required-mark"
            >
              Tệp Excel
            </label>
            <input
              ref={inputRef}
              id="import-file"
              type="file"
              accept={ACCEPTED}
              onChange={pickFile}
              required
              className="block w-full max-w-lg cursor-pointer rounded-md text-sm text-gray-700 ring-1 ring-inset ring-gray-300 file:mr-3 file:cursor-pointer file:border-0 file:bg-gray-50 file:px-3 file:py-2 file:text-sm file:text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">
              Định dạng {ACCEPTED}, tối đa {MAX_SIZE_MB} MB.
            </p>
          </div>

          <Button type="submit" loading={uploading} disabled={!file}>
            <Icon name="inbox" className="h-4 w-4" />
            {uploading ? 'Đang nhập dữ liệu…' : 'Nhập dữ liệu'}
          </Button>
        </form>
      </Card>

      {result && (
        <Card
          className="mt-4"
          title="Kết quả nhập"
          description={`Thành công ${formatNumber(result.imported)}/${formatNumber(result.total)} dòng · Lỗi ${formatNumber(result.errors?.length ?? 0)} dòng`}
          bodyClassName="p-0"
        >
          {result.errors?.length > 0 && (
            <DataTable
              rows={result.errors}
              rowKey={(row) => row.row}
              columns={[
                { key: 'row', header: 'Dòng', width: '6rem', align: 'right' },
                { key: 'message', header: 'Lỗi' },
              ]}
            />
          )}
        </Card>
      )}
    </>
  );
}
