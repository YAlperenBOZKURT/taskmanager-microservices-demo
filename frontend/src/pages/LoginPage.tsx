import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    const trimmedUser = username.trim();

    if (!trimmedUser) {
      errors.username = 'Kullanıcı adı boş bırakılamaz';
    }
    if (!password) {
      errors.password = 'Şifre boş bırakılamaz';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (status === 401 || status === 403) {
        setError('Kullanıcı adı veya şifre hatalı');
      } else if (status === 423) {
        setError('Hesabınız kilitlenmiş. Lütfen yöneticinizle iletişime geçin.');
      } else if (!navigator.onLine) {
        setError('İnternet bağlantınızı kontrol edin');
      } else {
        setError('Giriş yapılamadı. Lütfen tekrar deneyin.');
      }
    }
  };

  const clearFieldError = (field: 'username' | 'password') => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-2xl">TM</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">TaskManager</h1>
          <p className="text-slate-500 mt-2">Hesabınıza giriş yapın</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearFieldError('username');
                }}
                className={`w-full px-4 py-3.5 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 ${
                  fieldErrors.username ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                }`}
                placeholder="Kullanıcı adınızı girin"
                autoFocus
                autoComplete="username"
                spellCheck={false}
              />
              {fieldErrors.username && (
                <p className="text-xs text-red-500 mt-1.5">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 pr-12 ${
                    fieldErrors.password ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Şifrenizi girin"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-500 mt-1.5">{fieldErrors.password}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
