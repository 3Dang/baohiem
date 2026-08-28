import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { SelectField, TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { downloadFile } from '@/lib/http';

/** Định dạng tệp kết xuất mà backend hỗ trợ. */
const FORMAT_OPTIONS = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'xml', label: 'XML (gửi cơ quan BHXH)' },
];

/**
 * Trang xuất hồ sơ kê khai (D03 / D05 / AR).
 *
 * GET <endpoint>?from=&to=&format= trả về tệp nhị phân. Tên tệp ưu tiên lấy
 * từ header `Content-Disposition`; nếu thiếu thì tự sinh theo kỳ kết xuất để
 * người dùng không nhận về nhiều tệp trùng tên.
 */
export default function ExportPage({ title, description, endpoint, fileBaseName }) {
  const toast = useToast();
  const [form, setForm] = useState({ from: '', to: '', format: 'xlsx' });
  const [message, setMessage] = useState(null);
  const [exporting, setExporting] = useState(false);

  const update = (name) => (event) =>
    setForm((prev) => ({ ...prev, [name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setExporting(true);
    setMessage(null);

    try {
      const { blob, fileName } = await downloadFile(endpoint, {
        params: form,
        fallbackName: `${fileBaseName}_${form.from}_${form.to}.${form.format}`,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      // Giải phóng blob ngay sau khi trình duyệt nhận lệnh tải
      URL.revokeObjectURL(url);

      toast.success('Đã tạo tệp kết xuất.');
    } catch {
      // Lỗi trả về dưới dạng blob nên không đọc được message chi tiết
      setMessage('Xuất dữ liệu thất bại. Kiểm tra lại kỳ kết xuất rồi thử lại.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader title={title} description={description} />

      {message && <Alert className="mb-4">{message}</Alert>}

      <Card title="Điều kiện kết xuất">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              name="from"
              type="date"
              label="Từ ngày"
              required
              value={form.from}
              onChange={update('from')}
            />
            <TextField
              name="to"
              type="date"
              label="Đến ngày"
              required
              // Chặn chọn ngày kết thúc trước ngày bắt đầu ngay trên UI
              min={form.from || undefined}
              value={form.to}
              onChange={update('to')}
            />
            <SelectField
              name="format"
              label="Định dạng"
              options={FORMAT_OPTIONS}
              value={form.format}
              onChange={update('format')}
            />
          </div>

          <Button type="submit" loading={exporting}>
            <Icon name="upload" className="h-4 w-4" />
            {exporting ? 'Đang tạo tệp…' : 'Xuất dữ liệu'}
          </Button>
        </form>
      </Card>
    </>
  );
}
