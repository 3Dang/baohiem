import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { CheckboxField, PasswordField, TextField } from '@/components/ui/Field';
import { useAuth } from './AuthContext';
import { ApiError } from '@/lib/http';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'BẢO HIỂM';

/**
 * Trang đăng nhập.
 *
 * Gửi POST /auth/login { email, password, remember }.
 * Lỗi 422 được map vào từng field theo tên; lỗi khác hiện ở Alert phía trên form.
 */
export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Đã đăng nhập thì không cho quay lại trang này
  if (isAuthenticated) return <Navigate to="/" replace />;

  const update = (name) => (event) =>
    setForm((prev) => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setMessage(null);

    try {
      await login(form);
      // Quay lại trang người dùng định vào trước khi bị chặn, mặc định là dashboard
      const from = new URLSearchParams(location.search).get('from');
      navigate(from || '/', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors({
          email: error.fieldError('email'),
          password: error.fieldError('password'),
        });
        // 422 đã hiện lỗi dưới field, không cần lặp lại ở Alert
        if (error.status !== 422) setMessage(error.message);
      } else {
        setMessage('Đã xảy ra lỗi không xác định.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <main className="w-full max-w-md rounded-xl bg-white px-6 py-10 shadow-sm ring-1 ring-gray-200 sm:px-10">
        <header className="mb-8 text-center">
          <p className="text-base font-bold tracking-tight text-brand-700">{APP_NAME}</p>
          <h1 className="mt-3 text-xl font-semibold text-gray-900">
            Đăng nhập vào tài khoản của bạn
          </h1>
        </header>

        {message && <Alert className="mb-5">{message}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <TextField
            name="email"
            type="email"
            label="E-mail"
            required
            autoComplete="username"
            autoFocus
            value={form.email}
            onChange={update('email')}
            error={fieldErrors.email}
          />

          <PasswordField
            name="password"
            label="Mật khẩu"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={update('password')}
            error={fieldErrors.password}
          />

          <CheckboxField
            name="remember"
            label="Ghi nhớ đăng nhập"
            checked={form.remember}
            onChange={update('remember')}
          />

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>
      </main>
    </div>
  );
}
