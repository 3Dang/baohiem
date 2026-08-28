import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import http, { tokenStore } from '@/lib/http';
import { endpoints } from '@/lib/endpoints';

/**
 * Trạng thái đăng nhập dùng chung toàn app.
 *
 * Hợp đồng với backend:
 * - POST /auth/login  { email, password, remember } → { token, user }
 * - GET  /auth/me     → { user }  (dùng để phục hồi phiên khi refresh trang)
 * - POST /auth/logout → 204
 *
 * `user.permissions` là mảng slug quyền; UI dùng `can()` để ẩn/hiện menu.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Đang xác minh token sẵn có — chưa biết đăng nhập hay chưa
  const [initializing, setInitializing] = useState(Boolean(tokenStore.get()));

  // Phục hồi phiên khi tải lại trang: token nằm ở localStorage, user lấy từ server
  useEffect(() => {
    if (!tokenStore.get()) return;

    let cancelled = false;
    http
      .get(endpoints.auth.me)
      .then((data) => {
        if (!cancelled) setUser(data.user ?? data);
      })
      .catch(() => tokenStore.clear())
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await http.post(endpoints.auth.login, credentials);
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    // Thu hồi token phía server nếu được, nhưng luôn dọn phiên phía client
    try {
      await http.post(endpoints.auth.logout);
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => {
    const permissions = new Set(user?.permissions ?? []);
    return {
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      logout,
      /** Kiểm tra quyền; không truyền gì nghĩa là ai cũng xem được. */
      can: (permission) => !permission || permissions.has(permission),
    };
  }, [user, initializing, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return context;
}
