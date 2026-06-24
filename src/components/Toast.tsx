import { useToastStore } from '../store/toastStore';

export function Toast() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg text-sm animate-fade-in"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
