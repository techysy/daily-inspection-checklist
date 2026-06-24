import { Download } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';

export function ExportButton() {
  const { exportCompletedTasks, getTodayStats } = useTaskStore();
  const { completed } = getTodayStats();

  const handleExport = () => {
    const content = exportCompletedTasks();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `巡检报告_${today}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={completed === 0}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        completed === 0
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
      }`}
    >
      <Download className="w-4 h-4" />
      导出报告 ({completed})
    </button>
  );
}
