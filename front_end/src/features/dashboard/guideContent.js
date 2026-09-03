/**
 * Nội dung hướng dẫn nghiệp vụ hiển thị trên Bảng điều khiển.
 *
 * Tách khỏi component để phần JSX chỉ lo trình bày: sửa/bổ sung quy tắc nghiệp
 * vụ chỉ cần sửa dữ liệu ở đây. Trong các chuỗi, phần đặt giữa hai dấu ` sẽ
 * được render thành <code> (thường là tên cột/bảng trong cơ sở dữ liệu).
 */

/** Hướng dẫn theo từng loại hồ sơ. `key` quyết định bộ màu ở BusinessGuide. */
export const SCHEME_GUIDES = [
  {
    key: 'd03',
    title: 'Nghiệp vụ D03 - Bảo hiểm Y tế Hộ gia đình (BHYT)',
    blocks: [
      {
        title: 'Đặc điểm chính',
        type: 'list',
        items: [
          ['Đơn vị thời gian', 'Theo ngày cụ thể (timestamp)'],
          ['Thời hạn', 'Thường 12 tháng/lần đóng'],
          ['Loại hình', 'Theo hộ gia đình (D03)'],
          ['Phạm vi', 'Khám chữa bệnh trên toàn quốc'],
        ],
      },
      {
        title: 'Quy tắc tính ngày giá trị',
        type: 'cases',
        cases: [
          {
            tone: 'emerald',
            title: 'Trường hợp 1: Còn hạn hoặc hết hạn < 90 ngày',
            rule: 'Nối tiếp từ ngày hết hạn cũ',
            note: 'Ngày biên không ảnh hưởng, ngày giá trị giữ nguyên',
          },
          {
            tone: 'amber',
            title: 'Trường hợp 2: Hết hạn > 90 ngày hoặc tham gia mới',
            rule: 'Ngày biên + 30 ngày',
            note: 'Thời gian chờ 30 ngày kể từ ngày đóng tiền',
          },
        ],
      },
      {
        title: 'Nghiệp vụ "Tham gia giảm" (Participant Down)',
        type: 'list',
        items: [
          ['Mục đích', 'Giảm số tháng đóng khi khách hàng muốn rút ngắn thời hạn'],
          ['Tác động', 'Ngày hết hạn được tính lại theo số tháng mới'],
          ['Timeline', 'Tự động cập nhật `bhyt_card_expiry_date` của Customer'],
          ['Lưu ý', 'Kiểm tra pending records trong 7 ngày tránh trùng lặp'],
        ],
      },
      {
        title: 'Thay đổi ngày biên (Bulk Action)',
        type: 'list',
        items: [
          ['Chức năng', 'Đổi ngày biên hàng loạt cho nhiều bản ghi'],
          ['Tính lại ngày giá trị', 'Tự động nếu có tác động (hết > 90 ngày/mới)'],
          ['Giữ nguyên', 'Nếu còn hạn hoặc < 90 ngày (nối tiếp)'],
          ['Tùy chọn', 'Checkbox bật/tắt tính toán tự động'],
        ],
      },
    ],
  },
  {
    key: 'd05',
    title: 'Nghiệp vụ D05 - Bảo hiểm Xã hội Tự nguyện (BHXH)',
    blocks: [
      {
        title: 'Đặc điểm chính',
        type: 'list',
        items: [
          ['Đơn vị thời gian', 'Theo tháng (MM/YYYY format)'],
          ['Thời hạn', 'Linh hoạt 1, 3, 6, 12 tháng'],
          ['Mức đóng', 'Từ 1.500.000đ - 100.000.000đ (bước 50.000đ)'],
          ['Hỗ trợ', 'Ngân sách hỗ trợ 10-20%'],
        ],
      },
      {
        title: 'Quy tắc tính tháng bắt đầu',
        type: 'cases',
        cases: [
          {
            tone: 'emerald',
            title: 'Trường hợp 1: Đã tham gia trước đó',
            rule: 'Tự động nối tiếp tháng tiếp theo',
            note: 'Không cần nhập, hệ thống tính từ record gần nhất (kể cả pending/draft)',
          },
          {
            tone: 'sky',
            title: 'Trường hợp 2: Tham gia lần đầu',
            rule: 'Tháng hiện tại',
            note: 'Bắt đầu đóng từ tháng hiện tại',
          },
          {
            tone: 'amber',
            title: 'Trường hợp 3: Đóng trễ',
            rule: 'Tính lãi tự động',
            note: 'Hệ thống tính `late_payment_months` và lãi suất bổ sung',
          },
        ],
      },
      {
        title: 'Timeline Tự động',
        type: 'list',
        items: [
          ['Boot Event', 'Tự động cập nhật khi tạo record mới'],
          ['Kiểm tra', 'Chỉ update nếu là record có expiry date lớn nhất'],
          ['Trạng thái', 'Bao gồm published, active, pending, draft, reviewing'],
          ['Lịch sử', 'Lưu vào `insurance_timeline_history`'],
        ],
      },
      {
        title: 'Quy đổi ngày biên',
        type: 'list',
        items: [
          ['Vai trò', 'Ngày biên KHÔNG ảnh hưởng ngày giá trị BHXH'],
          ['Mục đích', 'Chỉ để ghi nhận thời điểm đóng tiền'],
          ['Khác biệt D03', 'D03 ngày biên có thể tác động (+30 ngày), D05 thì không'],
          ['Logic', 'BHXH chỉ quan tâm tháng bắt đầu và số tháng đóng'],
        ],
      },
    ],
  },
];

/**
 * Bảng so sánh D03 vs D05.
 *
 * Mỗi ô là chuỗi (dùng `\n` để xuống dòng) hoặc `{ mark, tone, text }` khi cần
 * nhấn mạnh một cụm từ bằng màu.
 */
export const COMPARISON = {
  columns: ['Khía cạnh', 'BHYT D03', 'BHXH D05'],
  rows: [
    ['Đơn vị thời gian', 'Ngày (timestamp)', 'Tháng (MM/YYYY)'],
    [
      'Ngày biên',
      { mark: 'Quan trọng', tone: 'emerald', text: '(tác động validity)' },
      { mark: 'Ít quan trọng', tone: 'muted', text: '(chỉ ghi nhận)' },
    ],
    [
      'Quy tắc nối tiếp',
      'Còn hạn/< 90 ngày → nối\n> 90 ngày → +30 ngày',
      'Tự động nối theo tháng',
    ],
    ['Late payment', 'Không có', { mark: 'Có', tone: 'emerald', text: '(+ lãi)' }],
    ['Timeline update', 'Thủ công (qua service)', 'Tự động (boot event)'],
    [
      'Check pending',
      { mark: '7 ngày', tone: 'emerald' },
      { mark: '7 ngày', tone: 'emerald' },
    ],
  ],
};

/** Các điểm cần nhớ khi tạo/sửa hồ sơ, hiển thị ở khối cảnh báo cuối trang. */
export const IMPORTANT_NOTES = [
  'Luôn kiểm tra pending records trước khi tạo mới (7 ngày)',
  'Tính toán ngày giá trị dựa trên TẤT CẢ records (kể cả draft/pending)',
  'Chỉ update Customer timeline nếu là record mới nhất',
  'Ngày biên chỉ ảnh hưởng D03 (nếu hết > 90 ngày), không ảnh hưởng D05',
  'Tham gia giảm (Participant Down) tự động cập nhật timeline',
];
