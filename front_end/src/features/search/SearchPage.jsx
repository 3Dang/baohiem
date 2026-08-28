import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import http from '@/lib/http';

/**
 * Kết quả tìm kiếm toàn hệ thống.
 *
 * GET /search?q= → `{ groups: [{ label, items: [{ id, title, subtitle, url }] }] }`
 * `url` do backend trả về là đường dẫn nội bộ của frontend, ví dụ /receipts/12.
 */
export default function SearchPage() {
  const [params] = useSearchParams();
  const term = params.get('q') ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['search', term],
    queryFn: () => http.get('/search', { params: { q: term } }),
    enabled: term.length > 0,
  });

  const groups = data?.groups ?? [];

  return (
    <>
      <PageHeader title="Kết quả tìm kiếm" description={term ? `Từ khoá: “${term}”` : undefined} />

      {isLoading ? (
        <div className="flex justify-center py-12 text-gray-400">
          <Spinner className="h-8 w-8" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            icon="search"
            title="Không tìm thấy kết quả"
            description="Thử từ khoá khác, hoặc tìm theo mã số BHXH / số biên lai."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card
              key={group.label}
              title={group.label}
              actions={<Badge>{group.items.length}</Badge>}
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-gray-100">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.url}
                      className="block px-4 py-3 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      {item.subtitle && (
                        <p className="mt-0.5 text-xs text-gray-500">{item.subtitle}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
