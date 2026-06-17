import { ClipboardList } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { TaskItem } from './TaskItem';

export function TaskList() {
  const { getTodayTasks, deleteTask } = useTaskStore();
  const tasks = getTodayTasks();

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">暂无任务</h3>
        <p className="text-gray-400">添加一个新的巡检任务开始吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onDelete={deleteTask} />
      ))}
    </div>
  );
}
