import { Toaster as HotToaster } from 'react-hot-toast';

export default function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          padding: '14px 18px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#fff' },
          style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
          style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
          duration: 5000,
        },
      }}
    />
  );
}
