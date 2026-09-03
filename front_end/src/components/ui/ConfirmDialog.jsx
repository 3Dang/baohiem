import Modal from './Modal';
import Button from './Button';

/**
 * Hỏi xác nhận trước một hành động không hoàn tác được (xoá bản ghi).
 *
 * @param {{ open: boolean, title?: string, message?: React.ReactNode,
 *           confirmLabel?: string, tone?: 'danger'|'primary', loading?: boolean,
 *           onConfirm: () => void, onCancel: () => void }} props
 */
export default function ConfirmDialog({
  open,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xác nhận',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      // Đang xử lý thì không cho đóng để tránh mất dấu kết quả
      onClose={loading ? () => {} : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Huỷ
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-700">{message}</p>
    </Modal>
  );
}
