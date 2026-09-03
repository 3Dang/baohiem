import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Hook phân giải module để `node` nạp được mã nguồn viết cho Vite.
 *
 * Vite cho phép hai thứ mà Node không: import tương đối không có phần mở rộng
 * (`./store`) và alias `@/` trỏ về `src/`. Hook này thử lại theo đúng hai quy
 * ước đó, nhờ vậy script kiểm tra gọi thẳng được adapter demo mà không phải
 * dựng cả bundle.
 */
const SRC = new URL('../src/', import.meta.url);

const firstExisting = (candidates) =>
  candidates.find((url) => existsSync(fileURLToPath(url)));

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    const base = specifier.startsWith('@/')
      ? new URL(specifier.slice(2), SRC)
      : specifier.startsWith('.') && context.parentURL
        ? new URL(specifier, context.parentURL)
        : null;

    if (!base) throw error;

    const found = firstExisting([
      base,
      new URL(base.href + '.js'),
      new URL(base.href + '.jsx'),
    ]);

    if (!found) throw error;

    return { url: pathToFileURL(fileURLToPath(found)).href, shortCircuit: true };
  }
}
