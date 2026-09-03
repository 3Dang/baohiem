/**
 * Lưu thay đổi của chế độ demo trong bộ nhớ (thêm/sửa/xoá) để bảng phản ánh
 * đúng thao tác vừa làm. Mất khi tải lại trang — chấp nhận được vì đây chỉ là
 * lớp giả lập backend; xoá cùng thư mục `demo/` khi API thật sẵn sàng.
 */

/** Thay đổi theo từng path: `{ created: [], updated: Map, deleted: Set }`. */
const changes = new Map();

const bucketOf = (path) => {
  if (!changes.has(path)) {
    changes.set(path, { created: [], updated: new Map(), deleted: new Set() });
  }
  return changes.get(path);
};

/** Id của bản ghi mới: đếm xuống từ một mốc lớn để không đụng id sinh sẵn. */
let nextId = 900_000;

export function createRow(path, values) {
  const row = { id: (nextId += 1), ...values };
  // Thêm vào đầu để người dùng thấy ngay bản ghi mình vừa tạo
  bucketOf(path).created.unshift(row);
  return row;
}

export function updateRow(path, id, values) {
  const bucket = bucketOf(path);
  const created = bucket.created.find((row) => row.id === id);

  // Sửa bản ghi vừa tạo thì ghi thẳng vào đó, không cần lưu patch riêng
  if (created) {
    Object.assign(created, values);
    return created;
  }

  const merged = { ...(bucket.updated.get(id) ?? {}), ...values, id };
  bucket.updated.set(id, merged);
  return merged;
}

export function deleteRow(path, id) {
  const bucket = bucketOf(path);
  const index = bucket.created.findIndex((row) => row.id === id);

  if (index !== -1) bucket.created.splice(index, 1);
  else bucket.deleted.add(id);
}

/**
 * Danh sách sinh sẵn của từng path, dựng một lần rồi giữ lại.
 *
 * Bộ sinh chỉ phụ thuộc chỉ số nên kết quả không đổi giữa các lần gọi. Vài
 * bảng có hàng trăm nghìn dòng (audit log, lịch sử bảo hiểm) — dựng lại mỗi
 * request thì mỗi lần đổi trang phải chờ gần một giây.
 */
const generatedRows = new Map();

const generate = (path, build, total) => {
  if (!generatedRows.has(path)) {
    generatedRows.set(
      path,
      Array.from({ length: total }, (_, i) => ({ id: i + 1, ...build(i) })),
    );
  }
  return generatedRows.get(path);
};

/**
 * Áp thay đổi lên danh sách sinh sẵn.
 *
 * @param {string} path
 * @param {(index: number) => object} build bộ sinh dòng theo chỉ số
 * @param {number} total tổng số dòng gốc
 * @returns {object[]} danh sách đầy đủ sau khi thêm/sửa/xoá
 */
export function applyChanges(path, build, total) {
  const bucket = changes.get(path);
  const generated = generate(path, build, total);

  // Không có thay đổi nào thì dùng thẳng danh sách gốc, không sao chép lại
  if (!bucket) return generated;

  return [...bucket.created, ...generated]
    .filter((row) => !bucket.deleted.has(row.id))
    .map((row) => ({ ...row, ...(bucket.updated.get(row.id) ?? {}) }));
}
