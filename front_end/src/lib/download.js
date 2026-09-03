import { downloadFile } from './http';

/**
 * Tải một tệp kết xuất về máy.
 *
 * Tách khỏi `ExportButton` vì kết xuất không chỉ đến từ một cái nút: hành động
 * hàng loạt "Xuất các dòng đã chọn" cũng cần đúng chuỗi việc này (gọi API →
 * tạo liên kết tạm → bấm hộ → thu hồi blob), và làm lại ở mỗi chỗ thì sớm muộn
 * sẽ có chỗ quên `revokeObjectURL`.
 *
 * @param {string} endpoint đường dẫn trả về tệp nhị phân
 * @param {{ params?: object, fileBaseName: string, extension?: string }} options
 *        `fileBaseName` chỉ dùng khi server không gửi `Content-Disposition`
 */
export async function downloadExport(endpoint, { params, fileBaseName, extension = 'xlsx' }) {
  const { blob, fileName } = await downloadFile(endpoint, {
    params,
    fallbackName: `${fileBaseName}_${new Date().toISOString().slice(0, 10)}.${extension}`,
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // Giải phóng blob ngay sau khi trình duyệt nhận lệnh tải
  URL.revokeObjectURL(url);
}
