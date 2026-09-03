import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toggle from '@/components/ui/Toggle';
import http from '@/lib/http';
import { useToast } from '@/components/ui/Toast';

/**
 * Ô công tắc trong bảng: bật/tắt một cờ boolean của bản ghi.
 *
 * Gửi `PATCH /<endpoint>/<id>` với đúng một trường thay đổi, thay vì PUT cả
 * bản ghi — như vậy không ghi đè những trường mà bảng không hiển thị.
 *
 * @param {{ endpoint: string, row: object, field: string, label?: string }} props
 */
export default function ToggleCell({ endpoint, row, field, label = 'Trạng thái' }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (next) => http.patch(`${endpoint}/${row.id}`, { [field]: next }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
    onError: (error) => toast.error(error.message),
  });

  return (
    <Toggle
      checked={Boolean(row[field])}
      loading={mutation.isPending}
      onChange={(next) => mutation.mutate(next)}
      label={`${label}: ${row[field] ? 'đang bật' : 'đang tắt'}`}
    />
  );
}
