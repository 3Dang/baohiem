import { register } from 'node:module';

/** Nạp hook phân giải trước khi script kiểm tra chạy (`node --import`). */
register('./vite-resolve.mjs', import.meta.url);
