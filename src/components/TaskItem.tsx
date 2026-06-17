import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Edit2, Save, Repeat, FileText, Pencil, PlusCircle } from 'lucide-react';
import type { Task, TaskRecurrence, ParamField } from '../types';
import { useTaskStore } from '../store/taskStore';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
}

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const getRecurrenceLabel = (task: Task): string => {
  switch (task.recurrence) {
    case 'daily':
      return '每天';
    case 'weekly':
      if (task.weeklyDays && task.weeklyDays.length > 0) {
        const dayOrder = [1, 2, 3, 4, 5, 6, 0];
        const dayMap: Record<number, string> = {
          0: '周日',
          1: '周一',
          2: '周二',
          3: '周三',
          4: '周四',
          5: '周五',
          6: '周六',
        };
        return task.weeklyDays
          .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
          .map((d) => dayMap[d])
          .join('、');
      }
      return '每周';
    case 'monthly':
      return `${task.monthlyDay || 1}号`;
    case 'once':
    default:
      return '临时';
  }
};

export function TaskItem({ task, onDelete }: TaskItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editDetails, setEditDetails] = useState(task.details || '');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionParams, setCompletionParams] = useState<Record<string, string | number>>({});
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editRecurrence, setEditRecurrence] = useState<TaskRecurrence>(task.recurrence);
  const [editWeeklyDays, setEditWeeklyDays] = useState<number[]>(task.weeklyDays || []);
  const [editMonthlyDay, setEditMonthlyDay] = useState(task.monthlyDay || 1);
  const [editParamFields, setEditParamFields] = useState<ParamField[]>(task.paramFields || []);
  const [newParamLabel, setNewParamLabel] = useState('');
  const [newParamPlaceholder, setNewParamPlaceholder] = useState('');
  const [newParamType, setNewParamType] = useState<'text' | 'number' | 'percent'>('text');

  const { updateTaskDetails, completeTask, uncompleteTask, editTask } = useTaskStore();

  const handleSaveDetails = () => {
    updateTaskDetails(task.id, editDetails.trim());
    setIsEditingDetails(false);
  };

  const handleComplete = () => {
    if (task.completed) {
      uncompleteTask(task.id);
    } else {
      setShowCompleteModal(true);
    }
  };

  const handleConfirmComplete = () => {
    if (task.paramFields) {
      const missingFields = task.paramFields
        .filter((field) => field.required)
        .filter((field) => {
          const value = completionParams[field.key];
          return value === undefined || value === '' || value === 0;
        });
      if (missingFields.length > 0) {
        const fieldNames = missingFields.map((f) => f.label).join('、');
        alert(`请填写必填参数：${fieldNames}`);
        return;
      }
    }
    completeTask(task.id, Object.keys(completionParams).length > 0 ? completionParams : undefined);
    setShowCompleteModal(false);
    setCompletionParams({});
  };

  const handleParamChange = (key: string, value: string | number) => {
    setCompletionParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveTask = () => {
    if (!editName.trim()) {
      alert('请输入任务名称');
      return;
    }
    if (editRecurrence === 'weekly' && editWeeklyDays.length === 0) {
      alert('请至少选择一个星期几');
      return;
    }
    editTask(task.id, editName.trim(), editDetails.trim() || undefined, editParamFields.length > 0 ? editParamFields : undefined, editRecurrence, editRecurrence === 'weekly' ? editWeeklyDays : undefined, editRecurrence === 'monthly' ? editMonthlyDay : undefined);
    setIsEditingTask(false);
  };

  const toggleWeeklyDay = (day: number) => {
    setEditWeeklyDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleMonthlyDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setEditMonthlyDay(Math.min(31, Math.max(1, value)));
  };

  const addEditParamField = () => {
    if (!newParamLabel.trim()) return;
    const newField: ParamField = {
      key: newParamLabel.trim().replace(/\s+/g, '-').toLowerCase(),
      label: newParamLabel.trim(),
      placeholder: newParamPlaceholder.trim() || `请输入${newParamLabel}`,
      type: newParamType,
      required: false,
    };
    setEditParamFields((prev) => [...prev, newField]);
    setNewParamLabel('');
    setNewParamPlaceholder('');
  };

  const removeEditParamField = (index: number) => {
    setEditParamFields((prev) => prev.filter((_, i) => i !== index));
  };

  const recurrenceColors: Record<string, string> = {
    daily: 'bg-green-100 text-green-700',
    weekly: 'bg-blue-100 text-blue-700',
    monthly: 'bg-purple-100 text-purple-700',
    once: 'bg-gray-100 text-gray-600',
  };

  if (isEditingTask) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务名称</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务描述信息</label>
            <textarea value={editDetails} onChange={(e) => setEditDetails(e.target.value)} rows={2} placeholder="输入任务描述信息（可选）..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">执行频率</label>
            <div className="flex gap-2">
              {[{ value: 'once' as TaskRecurrence, label: '临时任务' }, { value: 'daily' as TaskRecurrence, label: '每天' }, { value: 'weekly' as TaskRecurrence, label: '每周' }, { value: 'monthly' as TaskRecurrence, label: '每月' }].map((option) => (
                <button key={option.value} type="button" onClick={() => { setEditRecurrence(option.value); if (option.value !== 'weekly') setEditWeeklyDays([]); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${editRecurrence === option.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {option.label}
                </button>
              ))}
            </div>
            {editRecurrence === 'weekly' && (
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEK_DAYS.map((day, index) => (
                  <button key={index} type="button" onClick={() => toggleWeeklyDay(index)} className={`px-2 py-1 rounded-lg text-xs transition-colors ${editWeeklyDays.includes(index) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {day}
                  </button>
                ))}
              </div>
            )}
            {editRecurrence === 'monthly' && (
              <div className="mt-2">
                <input type="number" min="1" max="31" value={editMonthlyDay} onChange={handleMonthlyDayChange} className="w-20 px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="ml-1 text-gray-600 text-sm">号</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">详情字段</label>
            <div className="flex gap-2 flex-wrap mb-2">
              <input type="text" value={newParamLabel} onChange={(e) => setNewParamLabel(e.target.value)} placeholder="参数名称" className="flex-1 min-w-[120px] px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <input type="text" value={newParamPlaceholder} onChange={(e) => setNewParamPlaceholder(e.target.value)} placeholder="提示文字" className="flex-1 min-w-[120px] px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <select value={newParamType} onChange={(e) => setNewParamType(e.target.value as 'text' | 'number' | 'percent')} className="px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="text">文本</option>
                <option value="number">数字</option>
                <option value="percent">百分比</option>
              </select>
              <button type="button" onClick={addEditParamField} className="px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm">
                <PlusCircle className="w-3 h-3" />
                添加
              </button>
            </div>
            {editParamFields.length > 0 && (
              <div className="space-y-1">
                {editParamFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-700">{field.label}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded">
                      {field.type === 'text' ? '文本' : field.type === 'number' ? '数字' : '百分比'}
                    </span>
                    {field.required && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">
                        必填
                      </span>
                    )}
                    <button type="button" onClick={() => removeEditParamField(index)} className="ml-auto p-1 text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSaveTask} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              保存
            </button>
            <button onClick={() => { setIsEditingTask(false); setEditName(task.name); setEditRecurrence(task.recurrence); setEditWeeklyDays(task.weeklyDays || []); setEditMonthlyDay(task.monthlyDay || 1); setEditParamFields(task.paramFields || []); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              取消
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-lg border transition-all duration-200 overflow-hidden ${task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}>
        <div className="flex items-center gap-4 p-4">
          <button onClick={handleComplete} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}>
            {task.completed && <Check className="w-4 h-4 text-white" />}
          </button>
          <div className="flex-1">
            <span className={`text-base ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.name}
            </span>
            {task.recurrence !== 'once' && (
              <span className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${recurrenceColors[task.recurrence]}`}>
                <Repeat className="w-3 h-3" />
                {getRecurrenceLabel(task)}
              </span>
            )}
            {task.paramFields && task.paramFields.length > 0 && (
              <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                <FileText className="w-3 h-3" />
                {task.paramFields.length}个参数
              </span>
            )}
          </div>
          {task.details && (
            <button onClick={() => setShowDetails(!showDetails)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
              {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
          <button onClick={() => setIsEditingTask(true)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
            <Pencil className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showDetails && (
          <div className="px-4 pb-4 ml-14">
            {isEditingDetails ? (
              <div className="flex gap-2">
                <textarea value={editDetails} onChange={(e) => setEditDetails(e.target.value)} rows={3} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                <button onClick={handleSaveDetails} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                  <Save className="w-4 h-4" />
                  保存
                </button>
                <button onClick={() => { setIsEditingDetails(false); setEditDetails(task.details || ''); }} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg flex-1">
                  {task.details}
                </p>
                <button onClick={() => setIsEditingDetails(true)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {task.completionParams && (
          <div className="px-4 pb-4 ml-14">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">详细信息</p>
                {Object.entries(task.completionParams).map(([key, value]) => {
                  const field = task.paramFields?.find((f) => f.key === key);
                  return (
                    <p key={key} className="text-sm text-gray-600">
                      <span className="font-medium">{key}:</span> {value}{field?.type === 'percent' ? '%' : ''}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">填写详细信息</h3>
            <p className="text-sm text-gray-500 mb-4">请填写以下参数：</p>
            
            <div className="space-y-3">
              {task.paramFields && task.paramFields.length > 0 ? (
                task.paramFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className={field.type === 'percent' ? 'flex items-center gap-1' : ''}>
                      <input
                        type={field.type === 'percent' ? 'number' : field.type}
                        value={(completionParams[field.key] as string) || ''}
                        onChange={(e) => handleParamChange(field.key, field.type === 'number' || field.type === 'percent' ? (parseInt(e.target.value) || 0) : e.target.value)}
                        placeholder={field.placeholder}
                        className={`${field.type === 'percent' ? 'flex-1' : 'w-full'} px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        required={field.required}
                        {...(field.type === 'percent' ? { min: 0, max: 100 } : {})}
                      />
                      {field.type === 'percent' && <span className="text-gray-500 text-sm">%</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">该任务没有设置完成参数</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCompleteModal(false); setCompletionParams({}); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                取消
              </button>
              <button onClick={handleConfirmComplete} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
