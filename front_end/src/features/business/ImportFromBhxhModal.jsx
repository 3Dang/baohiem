import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import FieldGroup from '@/components/ui/FieldGroup';
import SearchSelect from '@/components/ui/SearchSelect';
import { TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useOptionsQuery } from '@/features/resource/useOptions';
import http, { ApiError } from '@/lib/http';
import { endpoints } from '@/lib/endpoints';
import { RECEIPT_TYPE_OPTIONS } from './receiptTypes';

/**
 * Dải biên lai hợp lệ: "51-100". Kiểm tại client vì gõ sai dải là cấp phát sai
 * số biên cho đại lý — sai rồi thì phải thu hồi cả loạt, rất khó hoàn tác.
 */
const RANGE_PATTERN = /^\s*(\d+)\s*-\s*(\d+)\s*$/;

const rangeError = (value) => {
  const matched = RANGE_PATTERN.exec(value);
  if (!matched) return 'Nhập theo dạng "51-100" (hai số cách nhau bằng dấu gạch ngang).';

  const [, from, to] = matched;
  if (Number(from) > Number(to)) return 'Số bắt đầu phải nhỏ hơn hoặc bằng số kết thúc.';

  return undefined;
};

const EMPTY = { bookNo: '', range: '', agentName: '', receiptType: '' };

/**
 * "Nhập từ bhxh": lấy một dải biên lai từ cổng BHXH vào hệ thống.
 *
 * Không phải form CRUD nên không dùng `ResourceFormModal`: nó gửi một dải số
 * biên chứ không tạo một bản ghi, và người dùng phải đọc câu cảnh báo trước khi
 * bấm — nhập sai dải thì các số biên đã cấp phát cho đại lý phải thu hồi lại.
 *
 * `agentName` để trống được: quyển nhập về có thể chưa giao cho ai, cấp phát sau.
 *
 * @param {{ onImported?: () => void }} props
 */
export default function ImportFromBhxhModal({ onImported }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState(null);

  const agents = useOptionsQuery(endpoints.resources.agents, { valueKey: 'name', enabled: open });

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const errors = {
    bookNo: values.bookNo.trim() ? undefined : 'Chọn quyển biên lai.',
    range: rangeError(values.range),
    receiptType: values.receiptType ? undefined : 'Chọn loại biên lai.',
  };
  const invalid = Object.values(errors).some(Boolean);

  const close = () => {
    setOpen(false);
    setValues(EMPTY);
    setTouched(false);
    setFailure(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (invalid) return;

    setSending(true);
    setFailure(null);

    const [, fromNo, toNo] = RANGE_PATTERN.exec(values.range);

    try {
      const result = await http.post(endpoints.receipts.importFromBhxh, {
        bookNo: values.bookNo.trim(),
        fromNo: Number(fromNo),
        toNo: Number(toNo),
        // Chưa chọn đại lý thì gửi null: quyển nhập về chờ cấp phát sau
        agentName: values.agentName || null,
        receiptType: values.receiptType,
      });

      toast.success(`Đã nhận ${result?.imported ?? Number(toNo) - Number(fromNo) + 1} số biên lai.`);
      onImported?.();
      close();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'Không nhận được dữ liệu từ cổng BHXH.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Icon name="building" className="h-4 w-4" />
        Nhập từ bhxh
      </Button>

      <Modal
        open={open}
        onClose={sending ? () => {} : close}
        title="Nhập từ bhxh"
        description="Vui lòng kiểm tra kỹ thông tin trước khi tạo, mọi thao tác rất khó hoàn tác!!!"
        descriptionTone="danger"
        size="xl"
        footerAlign="start"
        footer={
          <>
            <Button type="submit" form="import-bhxh-form" loading={sending}>
              Gửi
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={sending}>
              Huỷ bỏ
            </Button>
          </>
        }
      >
        {failure && (
          <Alert className="mb-4" title="Không nhập được">
            {failure}
          </Alert>
        )}

        <form id="import-bhxh-form" onSubmit={submit} noValidate>
          <FieldGroup title="Thông tin dải biên lai" icon="receipt">
            <TextField
              label="Quyển"
              required
              value={values.bookNo}
              onChange={(event) => setValue('bookNo', event.target.value)}
              placeholder="VD: S0001"
              error={touched ? errors.bookNo : undefined}
            />
            <TextField
              label="Từ số - Đến số"
              required
              value={values.range}
              onChange={(event) => setValue('range', event.target.value)}
              placeholder="Ví dụ: 51-100, viết liền số biên"
              error={touched ? errors.range : undefined}
            />
            <SearchSelect
              label="Đại lý"
              value={values.agentName}
              onChange={(event) => setValue('agentName', event.target.value)}
              options={agents.options}
              loading={agents.loading}
              clearable
              placeholder="Chọn đại lý"
              hint="Nếu không chọn đại lý thì sẽ cấp phát biên lai sau."
            />
            <SearchSelect
              label="Loại"
              required
              value={values.receiptType}
              onChange={(event) => setValue('receiptType', event.target.value)}
              options={RECEIPT_TYPE_OPTIONS}
              placeholder="Chọn loại biên lai"
              error={touched ? errors.receiptType : undefined}
            />
          </FieldGroup>
        </form>
      </Modal>
    </>
  );
}
