import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import http, { ApiError } from '@/lib/http';
import { endpoints } from '@/lib/endpoints';

/**
 * Trang cài đặt hệ thống.
 *
 * GET  /settings → `{ groups: [{ key, label, fields: [{ key, label, value, hint, type }] }] }`
 * PUT  /settings ← `{ values: { <fieldKey>: value } }`
 *
 * Backend quyết định có những cấu hình nào; frontend chỉ render theo mô tả,
 * nhờ vậy thêm cấu hình mới không cần sửa code phía client.
 */
export default function SettingsPage({ title = 'Cài đặt hệ thống', endpoint = endpoints.resources.settings }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  // Chỉ chứa các field người dùng đã sửa, gửi PUT gọn hơn và tránh ghi đè giá trị khác
  const [changes, setChanges] = useState({});

  const { data, isLoading, error } = useQuery({
    queryKey: [endpoint],
    queryFn: () => http.get(endpoint),
  });

  const save = useMutation({
    mutationFn: (values) => http.put(endpoint, { values }),
    onSuccess: () => {
      toast.success('Đã lưu cài đặt.');
      setChanges({});
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: (mutationError) =>
      toast.error(mutationError instanceof ApiError ? mutationError.message : 'Lưu thất bại.'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-gray-400">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const valueOf = (field) => changes[field.key] ?? field.value ?? '';
  const dirty = Object.keys(changes).length > 0;

  return (
    <>
      <PageHeader
        title={title}
        actions={
          <Button
            onClick={() => save.mutate(changes)}
            loading={save.isPending}
            disabled={!dirty}
          >
            Lưu thay đổi
          </Button>
        }
      />

      {error && (
        <Alert className="mb-4" title="Không tải được cài đặt">
          {error.message}
        </Alert>
      )}

      <div className="space-y-4">
        {data?.groups?.map((group) => (
          <Card key={group.key} title={group.label}>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <TextField
                  key={field.key}
                  name={field.key}
                  type={field.type || 'text'}
                  label={field.label}
                  hint={field.hint}
                  value={valueOf(field)}
                  onChange={(event) =>
                    setChanges((prev) => ({ ...prev, [field.key]: event.target.value }))
                  }
                  error={save.error instanceof ApiError ? save.error.fieldError(field.key) : undefined}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
