import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Edit2, Save, Repeat, FileText, Pencil } from 'lucide-react';
import type { Task, TaskRecurrence, ParamField } from '../types';
import { useTaskStore } from '../store/taskStore';
import { ParamFieldEditor } from './ParamFieldEditor';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
  onEditTemplate?: (task: Task) => void;
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

export function TaskItem({ task, onDelete, onEditTemplate }: TaskItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editDetails, setEditDetails] = useState(task.details || '');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionParams, setCompletionParams] = useState<Record<string, string | number | boolean>>({});
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editRecurrence, setEditRecurrence] = useState<TaskRecurrence>(task.recurrence);
  const [editWeeklyDays, setEditWeeklyDays] = useState<number[]>(task.weeklyDays || []);
  const [editMonthlyDay, setEditMonthlyDay] = useState(task.monthlyDay || 1);
  const [editParamFields, setEditParamFields] = useState<ParamField[]>(task.paramFields || []);
  const [isEditingParamFields, setIsEditingParamFields] = useState(false);
  const [editParamFieldsForEdit, setEditParamFieldsForEdit] = useState<ParamField[]>([]);
  const [isEditingCompletionParams, setIsEditingCompletionParams] = useState(false);
  const [editCompletionParams, setEditCompletionParams] = useState<Record<string, string | number | boolean>>({});

  const { updateTaskDetails, completeTask, uncompleteTask, editTask, updateTaskCompletionParams } = useTaskStore();

  const handleSaveDetails = () => {
    updateTaskDetails(task.id, editDetails.trim());
    setIsEditingDetails(false);
  };

  const handleEditCompletionParams = () => {
    setEditCompletionParams({ ...task.completionParams });
    setIsEditingCompletionParams(true);
  };

  const handleSaveCompletionParams = () => {
    const calculatedParams = calculateDerivedFields(editCompletionParams);
    updateTaskCompletionParams(task.id, calculatedParams);
    setIsEditingCompletionParams(false);
  };

  const handleEditParamChange = (key: string, value: string | number | boolean) => {
    const newParams = { ...editCompletionParams, [key]: value };
    const calculatedParams = calculateDerivedFields(newParams);
    setEditCompletionParams(calculatedParams);
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
      const paramsWithDefaults: Record<string, string | number | boolean> = { ...completionParams };
      
      task.paramFields.forEach((field) => {
        if (field.defaultValue !== undefined && paramsWithDefaults[field.key] === undefined) {
          paramsWithDefaults[field.key] = field.defaultValue;
        }
      });
      
      const missingFields = task.paramFields
        .filter((field) => field.required && !field.calculationType)
        .filter((field) => {
          const value = paramsWithDefaults[field.key];
          return value === undefined || value === '' || value === 0;
        });
      if (missingFields.length > 0) {
        const fieldNames = missingFields.map((f) => f.label).join('、');
        alert(`请填写必填参数：${fieldNames}`);
        return;
      }
      
      const calculatedParams = calculateDerivedFields(paramsWithDefaults);
      completeTask(task.id, Object.keys(calculatedParams).length > 0 ? calculatedParams : undefined);
    } else {
      completeTask(task.id, Object.keys(completionParams).length > 0 ? completionParams : undefined);
    }
    setShowCompleteModal(false);
    setCompletionParams({});
  };

  const calculateDerivedFields = (params: Record<string, string | number | boolean>): Record<string, string | number | boolean> => {
    const result = { ...params };
    if (!task.paramFields) return result;
    
    task.paramFields.forEach((field) => {
      const hasDenominator = field.denominatorKey || field.fixedDenominatorValue !== undefined;
      if (field.calculationType && field.calculationType !== 'none' && field.numeratorKey && hasDenominator) {
        const decimals = field.decimalPlaces ?? 2;
        let calculatedValue: number | string;
        
        if (field.calculationType === 'duration') {
          const startTime = String(params[field.numeratorKey] || '');
          const endTime = String(params[field.denominatorKey!] || '');
          
          if (startTime && endTime) {
            const normalizedStart = startTime.replace(/\//g, '-');
            const normalizedEnd = endTime.replace(/\//g, '-');
            
            const start = new Date(normalizedStart);
            const end = new Date(normalizedEnd);
            
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              const diffMs = end.getTime() - start.getTime();
              let diffHours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
              
              if (field.durationUnit === 'days') {
                diffHours = diffHours / 24;
                if (diffHours >= 1) {
                  const days = Math.floor(diffHours);
                  const remainingHours = ((diffHours - days) * 24).toFixed(decimals);
                  calculatedValue = `${days}天${parseFloat(remainingHours) > 0 ? parseFloat(remainingHours) + '小时' : ''}`;
                } else {
                  calculatedValue = diffHours.toFixed(decimals);
                }
              } else {
                if (diffHours >= 24) {
                  const days = Math.floor(diffHours / 24);
                  const remainingHours = (diffHours % 24).toFixed(decimals);
                  calculatedValue = `${days}天${parseFloat(remainingHours) > 0 ? parseFloat(remainingHours) + '小时' : ''}`;
                } else {
                  calculatedValue = diffHours.toFixed(decimals);
                }
              }
            } else {
              calculatedValue = '0';
            }
          } else {
            calculatedValue = '0';
          }
        } else if (field.calculationType === 'percentage') {
          const numField = task.paramFields?.find((f) => f.key === field.numeratorKey);
          
          if (field.fixedDenominatorValue !== undefined) {
            const numerator = Number(params[field.numeratorKey]);
            const denominator = field.fixedDenominatorValue;
            const value = denominator !== 0 ? (numerator / denominator) * 100 : 0;
            calculatedValue = value.toFixed(decimals);
          } else if (numField?.type === 'boolean') {
            const booleanFields = task.paramFields.filter((f) => f.type === 'boolean');
            const trueCount = booleanFields.filter((f) => params[f.key] === true).length;
            const denominator = Number(params[field.denominatorKey]);
            const value = denominator && denominator !== 0 ? (trueCount / denominator) * 100 : 0;
            calculatedValue = value.toFixed(decimals);
          } else {
            const numerator = Number(params[field.numeratorKey]);
            const denominator = Number(params[field.denominatorKey]);
            const value = denominator && denominator !== 0 ? (numerator / denominator) * 100 : 0;
            calculatedValue = value.toFixed(decimals);
          }
        } else {
          calculatedValue = '0';
        }
        
        result[field.key] = calculatedValue;
      }
    });
    
    return result;
  };

  const handleParamChange = (key: string, value: string | number | boolean) => {
    const newParams = { ...completionParams, [key]: value };
    const calculatedParams = calculateDerivedFields(newParams);
    setCompletionParams(calculatedParams);
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
            <ParamFieldEditor
              fields={editParamFields}
              onAdd={(field) => setEditParamFields((prev) => [...prev, field])}
              onRemove={(index) => setEditParamFields((prev) => prev.filter((_, i) => i !== index))}
            />
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
            <button onClick={() => setShowDetails(!showDetails)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title={showDetails ? '收起详情' : '展开详情'}>
              {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
          <button onClick={() => setIsEditingTask(true)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="编辑任务模板（名称、周期、参数定义）">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="删除任务">
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

        {(task.completionParams || task.paramFields) && (
          <div className="px-4 pb-4 ml-14">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">详细信息</p>
                  {onEditTemplate ? (
                    <button onClick={() => {
                      setEditParamFieldsForEdit(task.paramFields || []);
                      setIsEditingParamFields(true);
                    }} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1" title="修改参数字段定义">
                      <Pencil className="w-3 h-3" />
                      修改参数
                    </button>
                  ) : task.completed ? (
                    <button onClick={handleEditCompletionParams} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1" title="编辑已完成的参数值">
                      <Pencil className="w-3 h-3" />
                      更新
                    </button>
                  ) : null}
                </div>
                {isEditingCompletionParams ? (
                  <div className="space-y-3">
                    {task.paramFields?.map((field) => {
                      const isCalculated = !!field.calculationType;
                      const fieldValue = editCompletionParams[field.key];
                      let displayValue: string | number | boolean;
                      
                      if (typeof fieldValue === 'boolean') {
                        const trueLabel = field.booleanTrueLabel || '是';
                        const falseLabel = field.booleanFalseLabel || '否';
                        displayValue = fieldValue ? trueLabel : falseLabel;
                      } else if (typeof fieldValue === 'string') {
                        displayValue = fieldValue;
                      } else if (field.type === 'percent' && fieldValue !== undefined) {
                        displayValue = `${Number(fieldValue).toFixed(field.decimalPlaces ?? 2)}%`;
                      } else if (field.calculationType === 'duration' && typeof fieldValue === 'string') {
                        displayValue = fieldValue;
                      } else if (field.calculationType === 'duration' && typeof fieldValue === 'number') {
                        displayValue = fieldValue.toFixed(field.decimalPlaces ?? 2);
                      } else {
                        displayValue = fieldValue;
                      }
                      
                      return (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {field.label}
                            {isCalculated && <span className="text-green-600 ml-1">(自动计算)</span>}
                          </label>
                          {isCalculated ? (
                            <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm">
                              {displayValue !== undefined ? displayValue : '--'}
                            </div>
                          ) : field.type === 'boolean' ? (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleEditParamChange(field.key, editCompletionParams[field.key] !== true)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  editCompletionParams[field.key] === true
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                              >
                                {field.booleanTrueLabel || '是'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditParamChange(field.key, false)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  editCompletionParams[field.key] === false || editCompletionParams[field.key] === undefined
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                              >
                                {field.booleanFalseLabel || '否'}
                              </button>
                            </div>
                          ) : field.type === 'percent' ? (
                            <input
                              type="number"
                              value={typeof fieldValue === 'number' ? fieldValue : ''}
                              onChange={(e) => handleEditParamChange(field.key, parseFloat(e.target.value) || '')}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`请输入${field.label}`}
                            />
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              value={typeof fieldValue === 'number' ? fieldValue : ''}
                              onChange={(e) => handleEditParamChange(field.key, parseFloat(e.target.value) || '')}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`请输入${field.label}`}
                            />
                          ) : (
                            <input
                              type="text"
                              value={typeof fieldValue === 'string' ? fieldValue : ''}
                              onChange={(e) => handleEditParamChange(field.key, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`请输入${field.label}`}
                            />
                          )}
                        </div>
                      );
                    })}
                    <div className="flex gap-2 mt-4">
                      <button onClick={handleSaveCompletionParams} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        保存修改
                      </button>
                      <button onClick={() => setIsEditingCompletionParams(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {task.completionParams && Object.entries(task.completionParams).map(([key, value]) => {
                      const field = task.paramFields?.find((f) => f.key === key);
                      let displayValue: string | number | boolean;
                      if (typeof value === 'boolean') {
                        const trueLabel = field?.booleanTrueLabel || '是';
                        const falseLabel = field?.booleanFalseLabel || '否';
                        displayValue = value ? trueLabel : falseLabel;
                      } else if (typeof value === 'string') {
                        displayValue = value;
                      } else if (field?.type === 'percent') {
                        displayValue = `${Number(value).toFixed(field.decimalPlaces ?? 2)}%`;
                      } else if (field?.calculationType === 'duration' && typeof value === 'number') {
                        displayValue = value.toFixed(field.decimalPlaces ?? 2);
                      } else {
                        displayValue = value;
                      }
                      return (
                        <p key={key} className="text-sm text-gray-600">
                          <span className="font-medium">{field?.label || key}:</span> {displayValue}
                        </p>
                      );
                    })}
                  </>
                )}
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
                task.paramFields.map((field) => {
                  const isCalculated = !!field.calculationType;
                  const fieldValue = completionParams[field.key];
                  let displayValue: string | number | boolean;
                  
                  if (typeof fieldValue === 'boolean') {
                    const trueLabel = field.booleanTrueLabel || '是';
                    const falseLabel = field.booleanFalseLabel || '否';
                    displayValue = fieldValue ? trueLabel : falseLabel;
                  } else if (typeof fieldValue === 'string') {
                    displayValue = fieldValue;
                  } else if (field.type === 'percent' && fieldValue !== undefined) {
                    displayValue = `${Number(fieldValue).toFixed(2)}%`;
                  } else if (field.calculationType === 'duration' && typeof fieldValue === 'number') {
                    displayValue = fieldValue.toFixed(2);
                  } else {
                    displayValue = fieldValue;
                  }
                  
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        {isCalculated && <span className="text-green-600 ml-1 text-xs">(自动计算)</span>}
                      </label>
                      {isCalculated ? (
                        <div className="flex items-center gap-1">
                          <div className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700">
                            {displayValue !== undefined ? displayValue : '--'}
                          </div>
                        </div>
                      ) : field.type === 'boolean' ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleParamChange(field.key, completionParams[field.key] !== true)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              completionParams[field.key] === true
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                            }`}
                          >
                            {field.booleanTrueLabel || '是'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleParamChange(field.key, false)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              completionParams[field.key] === false || completionParams[field.key] === undefined
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                            }`}
                          >
                            {field.booleanFalseLabel || '否'}
                          </button>
                        </div>
                      ) : (
                        <div className={field.type === 'percent' ? 'flex items-center gap-1' : ''}>
                          <input
                            type={field.type === 'percent' || field.type === 'number' ? 'number' : 'text'}
                            value={String(completionParams[field.key] !== undefined ? completionParams[field.key] : field.defaultValue ?? '')}
                            onChange={(e) => handleParamChange(field.key, field.type === 'number' || field.type === 'percent' ? (parseFloat(e.target.value) || 0) : e.target.value)}
                            placeholder={field.placeholder}
                            className={`${field.type === 'percent' ? 'flex-1' : 'w-full'} px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required={field.required}
                            {...(field.type === 'percent' ? { min: 0, max: 100 } : {})}
                          />
                          {field.type === 'percent' && <span className="text-gray-500 text-sm">%</span>}
                        </div>
                      )}
                    </div>
                  );
                })
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

      {isEditingParamFields && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">修改参数字段</h3>
              <button onClick={() => { setIsEditingParamFields(false); setEditParamFieldsForEdit([]); }} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <ParamFieldEditor
                fields={editParamFieldsForEdit}
                onAdd={(field) => setEditParamFieldsForEdit((prev) => [...prev, field])}
                onRemove={(index) => setEditParamFieldsForEdit((prev) => prev.filter((_, i) => i !== index))}
              />
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-3">
                <button onClick={() => { setIsEditingParamFields(false); setEditParamFieldsForEdit([]); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  取消
                </button>
                <button onClick={() => {
                  editTask(task.id, task.name, task.details, editParamFieldsForEdit.length > 0 ? editParamFieldsForEdit : undefined, task.recurrence, task.weeklyDays, task.monthlyDay);
                  setIsEditingParamFields(false);
                  setEditParamFieldsForEdit([]);
                }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
