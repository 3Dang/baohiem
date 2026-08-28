module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.3' } },
  rules: {
    // Vite dùng JSX transform mới, không cần import React ở từng file
    'react/react-in-jsx-scope': 'off',
    // Props được kiểm bằng JSDoc thay vì propTypes
    'react/prop-types': 'off',
  },
};
