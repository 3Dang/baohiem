import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@/lib/http';
import { useToast } from '@/components/ui/Toast';

/**
 * Ba mutation thêm / sửa / xoá cho một endpoint REST.
 *
 * Quy ước với backend: `POST /<endpoint>`, `PUT /<endpoint>/:id`,
 * `DELETE /<endpoint>/:id`. Sau mỗi lần thành công, mọi query của endpoint đó
 * bị đánh dấu cũ để bảng tự tải lại — không cần tự sửa cache tại chỗ.
 *
 * @param {string} endpoint
 * @param {{ labels?: { created?: string, updated?: string, deleted?: string } }} [options]
 */
export function useResourceMutations(endpoint, { labels = {} } = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();

  // queryKey của useResourceList là [endpoint, params] → khớp theo phần tử đầu
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [endpoint] });

  const create = useMutation({
    mutationFn: (values) => http.post(endpoint, values),
    onSuccess: () => {
      invalidate();
      toast.success(labels.created ?? 'Đã thêm bản ghi mới.');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, values }) => http.put(`${endpoint}/${id}`, values),
    onSuccess: () => {
      invalidate();
      toast.success(labels.updated ?? 'Đã lưu thay đổi.');
    },
  });

  const remove = useMutation({
    mutationFn: (id) => http.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success(labels.deleted ?? 'Đã xoá bản ghi.');
    },
    // Xoá không có form để gắn lỗi, nên báo bằng toast
    onError: (error) => toast.error(error.message),
  });

  /**
   * Xoá nhiều bản ghi đã chọn.
   *
   * Dùng `Promise.allSettled` để một bản ghi lỗi (đang bị ràng buộc, ai đó vừa
   * xoá…) không chặn những bản ghi còn lại, rồi báo đúng bao nhiêu cái trượt.
   */
  const removeMany = useMutation({
    mutationFn: async (ids) => {
      const results = await Promise.allSettled(ids.map((id) => http.delete(`${endpoint}/${id}`)));
      return { failed: results.filter((item) => item.status === 'rejected').length };
    },
    onSuccess: ({ failed }, ids) => {
      invalidate();

      if (failed === 0) toast.success(`Đã xoá ${ids.length} bản ghi.`);
      else if (failed === ids.length) toast.error('Không xoá được bản ghi nào.');
      else toast.error(`Đã xoá ${ids.length - failed} bản ghi, ${failed} bản ghi thất bại.`);
    },
    onError: (error) => toast.error(error.message),
  });

  return { create, update, remove, removeMany };
}
