import { useState } from 'react';
import clsx from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { COMPARISON, IMPORTANT_NOTES, SCHEME_GUIDES } from './guideContent';

/** Bộ màu theo loại hồ sơ, để D03 và D05 phân biệt được ngay bằng mắt. */
const SCHEME_TONES = {
  d03: { box: 'bg-blue-50/60 ring-blue-200', title: 'text-blue-900', blockTitle: 'text-blue-800' },
  d05: {
    box: 'bg-violet-50/60 ring-violet-200',
    title: 'text-violet-900',
    blockTitle: 'text-violet-800',
  },
};

/** Màu viền của từng trường hợp trong quy tắc tính ngày/tháng. */
const CASE_TONES = {
  emerald: 'border-emerald-500 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-500 bg-amber-50 text-amber-900',
  sky: 'border-sky-500 bg-sky-50 text-sky-900',
};

/** Màu cho cụm từ được nhấn mạnh trong bảng so sánh. */
const MARK_TONES = {
  emerald: 'text-emerald-700 font-medium',
  muted: 'text-gray-500',
};

/**
 * Đổi phần đặt giữa hai dấu ` thành <code>.
 * Nhờ vậy nội dung trong guideContent.js viết được tên cột/bảng mà vẫn là chuỗi thuần.
 */
function withCode(text) {
  return text.split('`').map((part, index) =>
    index % 2 === 1 ? (
      <code
        key={`${part}-${index}`}
        className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.8em] text-gray-800"
      >
        {part}
      </code>
    ) : (
      part
    ),
  );
}

/** Danh sách "Nhãn: nội dung" — dạng khối phổ biến nhất trong hướng dẫn. */
function DefinitionList({ items }) {
  return (
    <ul className="space-y-1.5 text-sm text-gray-700">
      {items.map(([term, description]) => (
        <li key={term} className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
          <span>
            <span className="font-medium text-gray-900">{term}:</span> {withCode(description)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Các trường hợp tính ngày/tháng giá trị, mỗi trường hợp một dải màu. */
function CaseList({ cases }) {
  return (
    <div className="space-y-2">
      {cases.map((item) => (
        <div
          key={item.title}
          className={clsx('rounded-r-md border-l-4 px-3 py-2', CASE_TONES[item.tone])}
        >
          <p className="text-sm font-medium">{item.title}</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900">{withCode(item.rule)}</p>
          <p className="mt-0.5 text-xs text-gray-600">{withCode(item.note)}</p>
        </div>
      ))}
    </div>
  );
}

/** Một khối nội dung trong hướng dẫn của D03 hoặc D05. */
function GuideBlock({ block, titleClass }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <h4 className={clsx('mb-3 text-sm font-semibold', titleClass)}>{block.title}</h4>
      {block.type === 'cases' ? (
        <CaseList cases={block.cases} />
      ) : (
        <DefinitionList items={block.items} />
      )}
    </div>
  );
}

/** Một ô của bảng so sánh: chuỗi thuần, hoặc cụm từ nhấn mạnh kèm chú thích. */
function ComparisonCell({ value }) {
  if (typeof value === 'string') {
    // Nội dung có thể gồm nhiều dòng (quy tắc nối tiếp của D03)
    return value.split('\n').map((line) => (
      <span key={line} className="block">
        {line}
      </span>
    ));
  }

  return (
    <>
      <span className={MARK_TONES[value.tone]}>{value.mark}</span>
      {value.text && ` ${value.text}`}
    </>
  );
}

/** Bảng so sánh hai nghiệp vụ, cuộn ngang được trên màn hình nhỏ. */
function ComparisonTable() {
  const [head, ...bodyColumns] = COMPARISON.columns;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-2.5 text-left font-medium text-gray-600">
              {head}
            </th>
            {bodyColumns.map((column) => (
              <th key={column} scope="col" className="px-4 py-2.5 text-left font-medium text-gray-600">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {COMPARISON.rows.map(([aspect, ...cells]) => (
            <tr key={aspect} className="hover:bg-gray-50">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-gray-900">
                {aspect}
              </th>
              {cells.map((cell, index) => (
                <td key={bodyColumns[index]} className="px-4 py-2.5 text-gray-700">
                  <ComparisonCell value={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Hướng dẫn nghiệp vụ BHXH/BHYT trên Bảng điều khiển.
 *
 * Mặc định thu gọn để số liệu tổng quan và hoạt động gần đây vẫn nằm trong tầm
 * mắt; người dùng mở ra khi cần tra lại quy tắc tính ngày giá trị.
 */
export default function BusinessGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      title="Hướng dẫn nghiệp vụ bảo hiểm xã hội & y tế"
      description="Quy tắc tính ngày giá trị, nối tiếp thời hạn và các điểm cần kiểm tra trước khi tạo hồ sơ."
      actions={
        <Button variant="secondary" size="sm" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? 'Thu gọn' : 'Xem hướng dẫn'}
          <Icon
            name="chevronDown"
            className={clsx('h-4 w-4 transition-transform', expanded && 'rotate-180')}
          />
        </Button>
      }
      bodyClassName={expanded ? undefined : 'hidden'}
    >
      {/* Chỉ dựng nội dung khi mở: hướng dẫn dài, không cần nằm sẵn trong DOM */}
      {expanded && (
      <div className="space-y-4">
        {SCHEME_GUIDES.map((guide) => {
          const tone = SCHEME_TONES[guide.key];
          return (
            <section key={guide.key} className={clsx('rounded-lg p-4 ring-1', tone.box)}>
              <h3 className={clsx('mb-3 text-sm font-semibold', tone.title)}>{guide.title}</h3>
              <div className="space-y-3">
                {guide.blocks.map((block) => (
                  <GuideBlock key={block.title} block={block} titleClass={tone.blockTitle} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="rounded-lg bg-white ring-1 ring-gray-200">
          <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">
            So sánh D03 và D05
          </h3>
          <ComparisonTable />
        </section>

        <div className="rounded-r-md border-l-4 border-amber-500 bg-amber-50 p-4">
          <div className="flex gap-3">
            <Icon name="warning" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">Lưu ý quan trọng</p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
                {IMPORTANT_NOTES.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-600"
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      )}
    </Card>
  );
}
