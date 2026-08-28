/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Màu chủ đạo lấy từ sidebar xanh đậm của hệ thống hiện tại
        brand: {
          50: '#eef2ff',
          100: '#dde5fb',
          200: '#bcc9f5',
          300: '#8fa4e9',
          400: '#5c78d8',
          500: '#3a55c0',
          600: '#2b3f9e',
          700: '#22317c',
          800: '#182566',
          900: '#111c4f',
          950: '#0b1236',
        },
      },
    },
  },
  plugins: [],
};
