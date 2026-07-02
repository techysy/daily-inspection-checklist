import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, X, FileText } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { TaskRecurrence, ParamField, TaskTemplate } from '../types';
import { ParamFieldEditor } from './ParamFieldEditor';

const WEEK_DAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
];

export function AddTask() {
  const [inputValue, setInputValue] = useState('');
  const [details, setDetails] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('once');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [showParams, setShowParams] = useState(false);
  const [paramFields, setParamFields] = useState<ParamField[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const { addTask, getTemplates, createTaskFromTemplate } = useTaskStore();
  const templates = getTemplates();

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      alert('请输入任务名称');
      return;
    }
    let valid = true;
    if (recurrence === 'weekly' && selectedDays.length === 0) {
      alert('请至少选择一个星期几');
      valid = false;
    }
    if (recurrence === 'monthly' && (monthlyDay < 1 || monthlyDay > 31)) {
      alert('请选择有效的日期（1-31）');
      valid = false;
    }
    if (valid) {
      addTask(
        trimmed,
        details.trim() || undefined,
        paramFields.length > 0 ? paramFields : undefined,
        recurrence,
        selectedDays.length > 0 ? selectedDays : undefined,
        monthlyDay
      );
      setInputValue('');
      setDetails('');
      setShowDetails(false);
      setShowRecurrence(false);
      setRecurrence('once');
      setSelectedDays([]);
      setMonthlyDay(1);
      setShowParams(false);
      setParamFields([]);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="添加新的巡检任务..."
            className="flex-1 min-w-[200px] max-w-[300px] px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <button
              type="submit"
              className="w-[100px] px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              添加
            </button>
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="w-[100px] px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-1.5 border border-gray-200 whitespace-nowrap text-sm"
            >
              <FileText className="w-4 h-4" />
              模板创建
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-3">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? '收起描述' : '任务描述信息'}
          </button>
          <button
            type="button"
            onClick={() => setShowRecurrence(!showRecurrence)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            {showRecurrence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showRecurrence ? '收起周期' : '任务周期'}
          </button>
          <button
            type="button"
            onClick={() => setShowParams(!showParams)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            {showParams ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showParams ? '收起详情' : '详细信息'}
          </button>
        </div>

        {showDetails && (
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="输入任务描述信息（可选）..."
            rows={3}
            className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        )}

        {showRecurrence && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">执行频率</label>
              <div className="flex gap-2">
                {[
                  { value: 'once' as TaskRecurrence, label: '临时任务' },
                  { value: 'daily' as TaskRecurrence, label: '每天' },
                  { value: 'weekly' as TaskRecurrence, label: '每周' },
                  { value: 'monthly' as TaskRecurrence, label: '每月' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRecurrence(option.value);
                      if (option.value !== 'weekly') setSelectedDays([]);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recurrence === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {recurrence === 'weekly' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">选择星期几（周一至周日）</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedDays.length === 5 && selectedDays.every((d) => [1, 2, 3, 4, 5].includes(d))
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    工作日
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDays([6, 0])}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedDays.length === 2 && selectedDays.every((d) => [6, 0].includes(d))
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    周末
                  </button>
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedDays.includes(day.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recurrence === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={monthlyDay}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setMonthlyDay(Math.min(31, Math.max(1, value)));
                  }}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-600">号</span>
              </div>
            )}
          </div>
        )}

        {showParams && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">添加详情字段</label>
            <ParamFieldEditor
              fields={paramFields}
              onAdd={(field) => setParamFields((prev) => [...prev, field])}
              onRemove={(index) => setParamFields((prev) => prev.filter((_, i) => i !== index))}
              onUpdate={(index, field) => setParamFields((prev) => prev.map((f, i) => i === index ? field : f))}
              onMove={(from, to) => {
                if (to < 0 || to >= paramFields.length) return;
                setParamFields((prev) => {
                  const arr = [...prev];
                  const [item] = arr.splice(from, 1);
                  arr.splice(to, 0, item);
                  return arr;
                });
              }}
            />
          </div>
        )}
      </form>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                选择任务模板
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无任务模板</p>
                  <p className="text-sm text-gray-400 mt-1">请在历史记录页面创建模板</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((template: TaskTemplate) => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => {
                        createTaskFromTemplate(template.id);
                        setShowTemplateModal(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800">{template.name}</h4>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {template.recurrence === 'daily' ? '每天' : template.recurrence === 'weekly' ? '每周' : template.recurrence === 'monthly' ? '每月' : '一次'}
                        </span>
                      </div>
                      {template.details && (
                        <p className="text-sm text-gray-500 mt-1">{template.details}</p>
                      )}
                      {template.paramFields && template.paramFields.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          包含 {template.paramFields.length} 个参数字段
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
