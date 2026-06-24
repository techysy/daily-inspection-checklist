import { useState } from 'react';
import { Calendar, TrendingUp, Repeat, Clock, FileText, Plus, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { TaskItem } from '../components/TaskItem';
import type { TaskRecurrence, ParamField, TaskTemplate } from '../types';

type TabType = 'history' | 'recurring' | 'templates';

const WEEK_DAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
];

export function History() {
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const { getHistoryStats, getRecurringTasks, addTask, deleteTask, resetRecurringTaskStatus, getTemplates, addTemplate, editTemplate, deleteTemplate } = useTaskStore();
  const history = getHistoryStats();
  const recurringTasks = getRecurringTasks();
  const templates = getTemplates();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    details: '',
    recurrence: 'once' as TaskRecurrence,
    weeklyDays: [] as number[],
    monthlyDay: 1,
    paramFields: [] as ParamField[],
  });
  const [newParamLabel, setNewParamLabel] = useState('');
  const [newParamPlaceholder, setNewParamPlaceholder] = useState('');
  const [newParamType, setNewParamType] = useState<'text' | 'number' | 'percent'>('text');
  const [newParamRequired, setNewParamRequired] = useState(false);
  
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringForm, setRecurringForm] = useState({
    name: '',
    details: '',
    recurrence: 'daily' as TaskRecurrence,
    weeklyDays: [] as number[],
    monthlyDay: 1,
    paramFields: [] as ParamField[],
  });
  const [recurringParamLabel, setRecurringParamLabel] = useState('');
  const [recurringParamPlaceholder, setRecurringParamPlaceholder] = useState('');
  const [recurringParamType, setRecurringParamType] = useState<'text' | 'number' | 'percent'>('text');
  const [recurringParamRequired, setRecurringParamRequired] = useState(false);
  
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      details: '',
      recurrence: 'once',
      weeklyDays: [],
      monthlyDay: 1,
      paramFields: [],
    });
    setShowCreateModal(true);
  };
  
  const handleOpenEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      details: template.details || '',
      recurrence: template.recurrence,
      weeklyDays: template.weeklyDays || [],
      monthlyDay: template.monthlyDay || 1,
      paramFields: template.paramFields || [],
    });
    setShowEditModal(true);
  };
  
  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) {
      alert('请输入模板名称');
      return;
    }
    
    const templateData = {
      name: templateForm.name.trim(),
      details: templateForm.details.trim() || undefined,
      recurrence: templateForm.recurrence,
      weeklyDays: templateForm.recurrence === 'weekly' && templateForm.weeklyDays.length > 0 ? templateForm.weeklyDays : undefined,
      monthlyDay: templateForm.recurrence === 'monthly' ? templateForm.monthlyDay : undefined,
      paramFields: templateForm.paramFields.length > 0 ? templateForm.paramFields : undefined,
    };
    
    if (editingTemplate) {
      editTemplate(editingTemplate.id, templateData);
      setShowEditModal(false);
    } else {
      addTemplate(templateData);
      setShowCreateModal(false);
    }
  };
  
  const addParamField = () => {
    if (!newParamLabel.trim()) return;
    const newField: ParamField = {
      key: newParamLabel.trim().replace(/\s+/g, '-').toLowerCase(),
      label: newParamLabel.trim(),
      placeholder: newParamPlaceholder.trim() || `请输入${newParamLabel}`,
      type: newParamType,
      required: newParamRequired,
    };
    setTemplateForm((prev) => ({ ...prev, paramFields: [...prev.paramFields, newField] }));
    setNewParamLabel('');
    setNewParamPlaceholder('');
    setNewParamRequired(false);
  };
  
  const removeParamField = (index: number) => {
    setTemplateForm((prev) => ({
      ...prev,
      paramFields: prev.paramFields.filter((_, i) => i !== index),
    }));
  };
  
  const toggleDay = (day: number) => {
    setTemplateForm((prev) => ({
      ...prev,
      weeklyDays: prev.weeklyDays.includes(day) 
        ? prev.weeklyDays.filter((d) => d !== day) 
        : [...prev.weeklyDays, day],
    }));
  };

  const toggleRecurringDay = (day: number) => {
    setRecurringForm((prev) => ({
      ...prev,
      weeklyDays: prev.weeklyDays.includes(day)
        ? prev.weeklyDays.filter((d) => d !== day)
        : [...prev.weeklyDays, day],
    }));
  };

  const addRecurringParamField = () => {
    if (!recurringParamLabel.trim()) return;
    const newField: ParamField = {
      key: recurringParamLabel.trim().replace(/\s+/g, '-').toLowerCase(),
      label: recurringParamLabel.trim(),
      placeholder: recurringParamPlaceholder.trim() || `请输入${recurringParamLabel}`,
      type: recurringParamType,
      required: recurringParamRequired,
    };
    setRecurringForm((prev) => ({ ...prev, paramFields: [...prev.paramFields, newField] }));
    setRecurringParamLabel('');
    setRecurringParamPlaceholder('');
    setRecurringParamRequired(false);
  };

  const removeRecurringParamField = (index: number) => {
    setRecurringForm((prev) => ({
      ...prev,
      paramFields: prev.paramFields.filter((_, i) => i !== index),
    }));
  };

  const handleSaveRecurringTask = () => {
    if (!recurringForm.name.trim()) {
      alert('请输入任务名称');
      return;
    }
    if (recurringForm.recurrence === 'weekly' && recurringForm.weeklyDays.length === 0) {
      alert('请至少选择一个星期几');
      return;
    }
    if (recurringForm.recurrence === 'monthly' && (recurringForm.monthlyDay < 1 || recurringForm.monthlyDay > 31)) {
      alert('请选择有效的日期（1-31）');
      return;
    }
    addTask(
      recurringForm.name.trim(),
      recurringForm.details.trim() || undefined,
      recurringForm.paramFields.length > 0 ? recurringForm.paramFields : undefined,
      recurringForm.recurrence,
      recurringForm.weeklyDays.length > 0 ? recurringForm.weeklyDays : undefined,
      recurringForm.monthlyDay
    );
    setShowRecurringModal(false);
    setRecurringForm({
      name: '',
      details: '',
      recurrence: 'daily',
      weeklyDays: [],
      monthlyDay: 1,
      paramFields: [],
    });
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { weekday: 'short' });
  };

  const getDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const totalCompleted = history.reduce((sum, h) => sum + h.completed, 0);
  const totalTasks = history.reduce((sum, h) => sum + h.total, 0);
  const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          历史记录
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'recurring'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Repeat className="w-5 h-5" />
          周期任务 ({recurringTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <FileText className="w-5 h-5" />
          任务模板 ({templates.length})
        </button>
      </div>

      {activeTab === 'history' && (
        <>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">本周统计</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{totalCompleted}</p>
                <p className="text-sm text-gray-500 mt-1">总完成</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-600">{totalTasks}</p>
                <p className="text-sm text-gray-500 mt-1">总任务</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{overallRate}%</p>
                <p className="text-sm text-gray-500 mt-1">完成率</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">每日完成情况</h2>
            </div>
            {history.length === 0 || history.every((h) => h.total === 0) ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无历史记录</p>
              </div>
            ) : (
              <div className="flex items-end justify-between h-64 gap-4">
                {history.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-sm font-medium text-gray-700 mb-1">
                        {day.completed}/{day.total}
                      </span>
                      <div
                        className="w-full bg-gray-100 rounded-t-lg overflow-hidden"
                        style={{ height: '160px' }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500"
                          style={{
                            height: day.total > 0 ? `${(day.completed / Math.max(...history.map((h) => h.total))) * 100}%` : '0%',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {getDayName(day.date)}
                    </span>
                    <span className="text-xs text-gray-400">{getDateDisplay(day.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'recurring' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Repeat className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">周期任务管理</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRecurringModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建周期任务
              </button>
              {recurringTasks.length > 0 && (
                <button
                  onClick={resetRecurringTaskStatus}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  重置所有周期任务状态
                </button>
              )}
            </div>
          </div>

          {recurringTasks.length === 0 ? (
            <div className="text-center py-12">
              <Repeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">暂无周期任务</h3>
              <p className="text-gray-400">点击上方按钮创建周期任务</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recurringTasks.map((task) => (
                <TaskItem key={task.id} task={task} onDelete={deleteTask} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">任务模板</h2>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              创建模板
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">暂无任务模板</h3>
              <p className="text-gray-400">点击上方按钮创建任务模板</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{template.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {template.recurrence === 'daily' ? '每天' : template.recurrence === 'weekly' ? '每周' : template.recurrence === 'monthly' ? '每月' : '一次'}
                        </span>
                        {template.paramFields && template.paramFields.length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded">
                            {template.paramFields.length} 个参数
                          </span>
                        )}
                      </div>
                      {template.details && (
                        <p className="text-sm text-gray-500 mt-2">{template.details}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定要删除这个模板吗？')) {
                            deleteTemplate(template.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingTemplate ? '编辑任务模板' : '创建任务模板'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">模板名称 *</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="输入模板名称"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">任务描述信息</label>
                  <textarea
                    value={templateForm.details}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, details: e.target.value }))}
                    placeholder="输入模板描述信息（可选）"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">执行频率</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'once', label: '一次' },
                      { value: 'daily', label: '每天' },
                      { value: 'weekly', label: '每周' },
                      { value: 'monthly', label: '每月' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTemplateForm((prev) => ({ ...prev, recurrence: option.value as TaskRecurrence }))}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          templateForm.recurrence === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {templateForm.recurrence === 'weekly' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {WEEK_DAYS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            templateForm.weeklyDays.includes(day.value)
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {templateForm.recurrence === 'monthly' && (
                    <div className="mt-3">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={templateForm.monthlyDay}
                        onChange={(e) => setTemplateForm((prev) => ({
                          ...prev,
                          monthlyDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)),
                        }))}
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">号</span>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {templateForm.paramFields.length > 0 ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        收起参数字段 ({templateForm.paramFields.length})
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        添加参数字段
                      </>
                    )}
                  </button>
                  {templateForm.paramFields.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {templateForm.paramFields.map((field, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{field.label}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                            {field.type === 'text' ? '文本' : field.type === 'number' ? '数字' : '百分比'}
                          </span>
                          {field.required && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded font-medium">
                              必填
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeParamField(index)}
                            className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={newParamLabel}
                      onChange={(e) => setNewParamLabel(e.target.value)}
                      placeholder="参数名称"
                      className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newParamPlaceholder}
                      onChange={(e) => setNewParamPlaceholder(e.target.value)}
                      placeholder="提示文字"
                      className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newParamType}
                      onChange={(e) => setNewParamType(e.target.value as 'text' | 'number' | 'percent')}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">文本</option>
                      <option value="number">数字</option>
                      <option value="percent">百分比</option>
                    </select>
                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newParamRequired}
                        onChange={(e) => setNewParamRequired(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">必填</span>
                    </label>
                    <button
                      type="button"
                      onClick={addParamField}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTemplate ? '保存修改' : '创建模板'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecurringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">创建周期任务</h3>
              <button
                onClick={() => setShowRecurringModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">任务名称 *</label>
                  <input
                    type="text"
                    value={recurringForm.name}
                    onChange={(e) => setRecurringForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="输入任务名称"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">任务描述信息</label>
                  <textarea
                    value={recurringForm.details}
                    onChange={(e) => setRecurringForm((prev) => ({ ...prev, details: e.target.value }))}
                    placeholder="输入任务描述信息（可选）"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">执行频率</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'daily', label: '每天' },
                      { value: 'weekly', label: '每周' },
                      { value: 'monthly', label: '每月' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRecurringForm((prev) => ({ ...prev, recurrence: option.value as TaskRecurrence }))}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          recurringForm.recurrence === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {recurringForm.recurrence === 'weekly' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {WEEK_DAYS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleRecurringDay(day.value)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            recurringForm.weeklyDays.includes(day.value)
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {recurringForm.recurrence === 'monthly' && (
                    <div className="mt-3">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={recurringForm.monthlyDay}
                        onChange={(e) => setRecurringForm((prev) => ({
                          ...prev,
                          monthlyDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)),
                        }))}
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">号</span>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {recurringForm.paramFields.length > 0 ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        收起参数字段 ({recurringForm.paramFields.length})
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        添加参数字段
                      </>
                    )}
                  </button>
                  {recurringForm.paramFields.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {recurringForm.paramFields.map((field, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{field.label}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                            {field.type === 'text' ? '文本' : field.type === 'number' ? '数字' : '百分比'}
                          </span>
                          {field.required && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded font-medium">
                              必填
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeRecurringParamField(index)}
                            className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={recurringParamLabel}
                      onChange={(e) => setRecurringParamLabel(e.target.value)}
                      placeholder="参数名称"
                      className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={recurringParamPlaceholder}
                      onChange={(e) => setRecurringParamPlaceholder(e.target.value)}
                      placeholder="提示文字"
                      className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={recurringParamType}
                      onChange={(e) => setRecurringParamType(e.target.value as 'text' | 'number' | 'percent')}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">文本</option>
                      <option value="number">数字</option>
                      <option value="percent">百分比</option>
                    </select>
                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recurringParamRequired}
                        onChange={(e) => setRecurringParamRequired(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">必填</span>
                    </label>
                    <button
                      type="button"
                      onClick={addRecurringParamField}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowRecurringModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveRecurringTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
