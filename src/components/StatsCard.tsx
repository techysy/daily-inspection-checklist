import { CheckCircle, Circle, Trash2 } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { ExportButton } from './ExportButton';

export function StatsCard() {
  const { getTodayStats, clearTodayCompleted } = useTaskStore();
  const { total, completed } = getTodayStats();
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">今日进度</h2>
        <div className="flex gap-3">
          <ExportButton />
          {completed > 0 && (
            <button
              onClick={clearTodayCompleted}
              className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清除已完成
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-600">完成进度</span>
            <span className="font-semibold text-blue-600">{progress}%</span>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">{completed}</p>
            <p className="text-xs text-gray-500">已完成</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
              <Circle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-600 mt-2">{total}</p>
            <p className="text-xs text-gray-500">总任务</p>
          </div>
        </div>
      </div>
    </div>
  );
}
