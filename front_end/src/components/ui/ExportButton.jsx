import { useState } from 'react';
import Button from './Button';
import Icon from './Icon';
import { useToast } from './Toast';
import { downloadExport } from '@/lib/download';

/**
 * Nút kết xuất tệp từ một endpoint trả về nhị phân.
 *
 * Đặt ngay trên bảng để người dùng xuất đúng dữ liệu đang lọc: `params` nhận
 * từ trang cha nên tệp tải về khớp với những gì đang thấy trên màn hình.
 *
 * @param {{ endpoint: string, params?: object, fileBaseName: string,
 *           label?: string, variant?: string, icon?: string }} props
 */
export default function ExportButton({
  endpoint,
  params,
  fileBaseName,
  label = 'Xuất Excel',
  variant = 'primary',
  icon = 'upload',
}) {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const run = async () => {
    setExporting(true);
    try {
      await downloadExport(endpoint, { params, fileBaseName });
      toast.success('Đã tạo tệp kết xuất.');
    } catch {
      // Lỗi trả về dưới dạng blob nên không đọc được message chi tiết
      toast.error('Kết xuất thất bại, vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant={variant} size="sm" loading={exporting} onClick={run}>
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </Button>
  );
}
