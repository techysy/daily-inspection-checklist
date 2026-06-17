import { AddTask } from '../components/AddTask';
import { StatsCard } from '../components/StatsCard';
import { TaskList } from '../components/TaskList';

export function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <StatsCard />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">今日巡检任务</h2>
            <p className="text-sm text-gray-500 mb-4">完成以下巡检任务，确保各项工作正常运行</p>
            <TaskList />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-6 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 mb-4">添加新任务</h2>
            <AddTask />
          </div>
        </div>
      </div>
    </div>
  );
}
