import { ClipboardList, History } from 'lucide-react';

interface HeaderProps {
  currentPage: 'home' | 'history';
  onNavigate: (page: 'home' | 'history') => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-7 h-7" />
              每日巡检清单
            </h1>
            <p className="text-blue-100 mt-1">{dateStr}</p>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === 'home'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'text-white hover:bg-blue-500'
              }`}
            >
              今日任务
            </button>
            <button
              onClick={() => onNavigate('history')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                currentPage === 'history'
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'text-white hover:bg-blue-500'
              }`}
            >
              <History className="w-4 h-4" />
              历史记录
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
