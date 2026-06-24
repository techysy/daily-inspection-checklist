import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, DailyStats, TaskRecurrence, ParamField, TaskTemplate } from '../types';

interface TaskStore {
  tasks: Task[];
  history: DailyStats[];
  templates: TaskTemplate[];
  addTask: (name: string, details?: string, paramFields?: ParamField[], recurrence?: TaskRecurrence, weeklyDays?: number[], monthlyDay?: number) => void;
  editTask: (id: string, name: string, details?: string, paramFields?: ParamField[], recurrence?: TaskRecurrence, weeklyDays?: number[], monthlyDay?: number) => void;
  completeTask: (id: string, params?: Record<string, string | number | boolean>) => void;
  uncompleteTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTaskDetails: (id: string, details: string) => void;
  updateTaskCompletionParams: (id: string, params: Record<string, string | number | boolean>) => void;
  getTodayTasks: () => Task[];
  getRecurringTasks: () => Task[];
  getTodayStats: () => { total: number; completed: number };
  getHistoryStats: () => DailyStats[];
  getCompletedTasksByDate: (date: string) => Task[];
  clearTodayCompleted: () => void;
  resetRecurringTaskStatus: () => void;
  exportCompletedTasks: (date?: string) => string;
  addTemplate: (template: Omit<TaskTemplate, 'id'>) => void;
  editTemplate: (id: string, template: Omit<TaskTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  getTemplates: () => TaskTemplate[];
  createTaskFromTemplate: (templateId: string) => void;
}

const STORAGE_KEY = 'daily-checklist-storage';

const isTodayTask = (task: Task, today: string): boolean => {
  if (task.createdAt === today) return true;
  
  const todayDate = new Date(today);
  const todayDayOfWeek = todayDate.getDay();
  const todayDateOfMonth = todayDate.getDate();
  const todayMonth = todayDate.getMonth();
  const todayYear = todayDate.getFullYear();
  
  switch (task.recurrence) {
    case 'daily':
      return task.createdAt <= today;
    case 'weekly':
      if (!task.weeklyDays || task.weeklyDays.length === 0) return false;
      return task.weeklyDays.includes(todayDayOfWeek) && task.createdAt <= today;
    case 'monthly':
      if (task.monthlyDay === undefined) return false;
      const taskDate = new Date(task.createdAt);
      const taskMonth = taskDate.getMonth();
      const taskYear = taskDate.getFullYear();
      const isSameOrLaterMonth = (todayYear > taskYear) || (todayYear === taskYear && todayMonth >= taskMonth);
      return todayDateOfMonth === task.monthlyDay && isSameOrLaterMonth;
    case 'once':
    default:
      return task.createdAt === today;
  }
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      history: [],
      templates: [],

      addTask: (name, details, paramFields, recurrence = 'once', weeklyDays, monthlyDay) => {
        const today = new Date().toISOString().split('T')[0];
        const newTask: Task = {
          id: Date.now().toString(),
          name,
          completed: false,
          createdAt: today,
          details,
          paramFields: paramFields && paramFields.length > 0 ? paramFields : undefined,
          recurrence,
          weeklyDays: recurrence === 'weekly' ? weeklyDays : undefined,
          monthlyDay: recurrence === 'monthly' ? monthlyDay : undefined,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      editTask: (id, name, details, paramFields, recurrence = 'once', weeklyDays, monthlyDay) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  name,
                  details,
                  paramFields: paramFields && paramFields.length > 0 ? paramFields : undefined,
                  recurrence,
                  weeklyDays: recurrence === 'weekly' ? weeklyDays : undefined,
                  monthlyDay: recurrence === 'monthly' ? monthlyDay : undefined,
                  completed: false,
                  completedAt: undefined,
                  completionParams: undefined,
                }
              : task
          ),
        }));
      },

      getRecurringTasks: () => {
        return get().tasks.filter((task) => task.recurrence !== 'once');
      },

      resetRecurringTaskStatus: () => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.recurrence !== 'once') {
              return {
                ...task,
                completed: false,
                completedAt: undefined,
                completionParams: undefined,
              };
            }
            return task;
          }),
        }));
      },

      updateTaskDetails: (id, details) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, details } : task
          ),
        }));
      },

      completeTask: (id, params) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                completed: true,
                completedAt: new Date().toISOString(),
                completionParams: params,
              };
            }
            return task;
          }),
        }));

        const stats = get().getTodayStats();
        set((state) => {
          const existingIndex = state.history.findIndex((h) => h.date === today);
          if (existingIndex >= 0) {
            const newHistory = [...state.history];
            newHistory[existingIndex] = { date: today, ...stats };
            return { history: newHistory };
          }
          return { history: [...state.history, { date: today, ...stats }] };
        });
      },

      uncompleteTask: (id) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                completed: false,
                completedAt: undefined,
                completionParams: undefined,
              };
            }
            return task;
          }),
        }));

        const stats = get().getTodayStats();
        set((state) => {
          const existingIndex = state.history.findIndex((h) => h.date === today);
          if (existingIndex >= 0) {
            const newHistory = [...state.history];
            newHistory[existingIndex] = { date: today, ...stats };
            return { history: newHistory };
          }
          return { history: [...state.history, { date: today, ...stats }] };
        });
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      updateTaskCompletionParams: (id, params) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                completionParams: params,
              };
            }
            return task;
          }),
        }));
      },

      getTodayTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        const allTasks = get().tasks;
        
        const todayTasksMap = new Map<string, Task>();
        const todayOnceTasks: Task[] = [];
        
        allTasks.forEach((task) => {
          if (isTodayTask(task, today)) {
            if (task.recurrence === 'once') {
              todayOnceTasks.push({
                ...task,
                completed: task.completed && task.completedAt?.startsWith(today),
              });
            } else {
              const key = `${task.name}-${task.recurrence}`;
              if (!todayTasksMap.has(key)) {
                todayTasksMap.set(key, {
                  ...task,
                  completed: task.completed && task.completedAt?.startsWith(today),
                });
              }
            }
          }
        });
        
        return [...todayOnceTasks, ...Array.from(todayTasksMap.values())];
      },

      getTodayStats: () => {
        const todayTasks = get().getTodayTasks();
        const completed = todayTasks.filter((t) => t.completed).length;
        return {
          total: todayTasks.length,
          completed,
        };
      },

      getHistoryStats: () => {
        const history = get().history;
        const today = new Date().toISOString().split('T')[0];
        const todayStats = get().getTodayStats();

        const historyMap = new Map<string, DailyStats>();
        history.forEach((h) => historyMap.set(h.date, h));
        historyMap.set(today, { date: today, ...todayStats });

        return Array.from(historyMap.values()).sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ).slice(0, 7);
      },

      getCompletedTasksByDate: (date: string) => {
        return get().tasks.filter((task) => 
          task.completed && task.completedAt?.startsWith(date)
        );
      },

      clearTodayCompleted: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          tasks: state.tasks.filter((task) => {
            if (task.recurrence === 'once') {
              return !(task.createdAt === today && task.completed);
            }
            return !task.completed;
          }),
        }));
      },

      exportCompletedTasks: (date) => {
        const exportDate = date || new Date().toISOString().split('T')[0];
        const completedTasks = get().getCompletedTasksByDate(exportDate);
        const todayTasks = get().getTodayTasks();
        
        const today = new Date(exportDate);
        const formattedDate = `${today.getMonth() + 1}月${today.getDate()}日`;
        const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()];
        
        const completedCount = completedTasks.length;
        const totalCount = todayTasks.length;
        const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const incompleteCount = totalCount - completedCount;
        
        let content = `━━━━━━━━━━━━━━━━━━━━━━\n`;
        content += `    📊 当日概览\n`;
        content += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        content += `【${formattedDate} ${weekDay}】巡检完成情况\n\n`;
        content += `📋 总任务: ${totalCount}项\n`;
        content += `✅ 已完成: ${completedCount}项 (${completionRate}%)\n`;
        content += `🔄 待完成: ${incompleteCount}项\n`;
        content += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        if (completedTasks.length === 0) {
          content += `暂无已完成任务\n`;
        } else {
          content += `📝 详细记录\n`;
          content += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          
          completedTasks.forEach((task, index) => {
            content += `${index + 1}. ${task.name}\n`;
            
            if (task.paramFields && task.paramFields.length > 0) {
              task.paramFields.forEach((field) => {
                const value = task.completionParams?.[field.key];
                const isCalculated = !!field.calculationType && field.calculationType !== 'none';
                let displayValue: string | number;
                
                const hasValue = value !== undefined && value !== '' && (isCalculated || value !== 0);
                
                if (hasValue) {
                  if (typeof value === 'boolean') {
                    const trueLabel = field.booleanTrueLabel || '是';
                    const falseLabel = field.booleanFalseLabel || '否';
                    displayValue = value ? trueLabel : falseLabel;
                  } else if (typeof value === 'string') {
                    displayValue = value;
                  } else if (field.type === 'percent') {
                    const decimals = field.decimalPlaces ?? 2;
                    displayValue = `${Number(value).toFixed(decimals)}%`;
                  } else if (isCalculated && field.type === 'number') {
                    const decimals = field.decimalPlaces ?? 2;
                    const unit = field.calculationType === 'duration' && field.durationUnit === 'days' ? '天' : '小时';
                    displayValue = `${Number(value).toFixed(decimals)}${unit}`;
                  } else {
                    displayValue = String(value);
                  }
                } else if (field.type === 'boolean') {
                  const falseLabel = field.booleanFalseLabel || '否';
                  displayValue = falseLabel;
                } else if (!field.required && field.placeholder && !isCalculated) {
                  displayValue = field.type === 'percent' ? `${Number(field.placeholder).toFixed(2)}%` : field.placeholder;
                } else if (isCalculated) {
                  const decimals = field.decimalPlaces ?? 2;
                  const zeroFixed = (0).toFixed(decimals);
                  const unit = field.calculationType === 'duration' && field.durationUnit === 'days' ? '天' : '小时';
                  displayValue = field.type === 'percent' ? `${zeroFixed}%` : `${zeroFixed}${unit}`;
                } else {
                  displayValue = '-';
                }
                
                if (field.type === 'percent') {
                  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                  if (!isNaN(numValue) && numValue < 70) {
                    content += `   WARNING: ${field.label}: ${displayValue}\n`;
                  } else {
                    content += `   OK: ${field.label}: ${displayValue}\n`;
                  }
                } else {
                  content += `   ${field.label}: ${displayValue}\n`;
                }
              });
            } else if (task.completionParams) {
              Object.entries(task.completionParams).forEach(([key, value]) => {
                content += `   ${key}: ${value}\n`;
              });
            }
            
            if (task.completedAt) {
              const completedTime = new Date(task.completedAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              content += `   完成时间: ${completedTime}\n`;
            }
            
            content += `\n`;
          });
          
          const issues = completedTasks.flatMap(task => {
            if (task.paramFields) {
              return task.paramFields
                .filter(f => f.label.includes('备注') || f.label.includes('异常') || f.label.includes('问题'))
                .map(f => {
                  const value = task.completionParams?.[f.key];
                  if (value && value !== '' && String(value) !== '0') {
                    return `${task.name}: ${value}`;
                  }
                  return null;
                })
                .filter(Boolean);
            }
            return [];
          });
          
          if (issues.length > 0) {
            content += `---\n\n`;
            content += `待跟进事项:\n`;
            issues.forEach(issue => {
              content += `   - ${issue}\n`;
            });
            content += `\n`;
          }
        }
        
        content += `---\n`;
        content += `报告生成时间: ${today.toLocaleString('zh-CN')}\n`;
        
        return content;
      },

      addTemplate: (template) => {
        const newTemplate: TaskTemplate = {
          ...template,
          id: Date.now().toString(),
        };
        set((state) => ({ templates: [...state.templates, newTemplate] }));
      },

      editTemplate: (id, template) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...template } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      getTemplates: () => {
        return get().templates;
      },

      createTaskFromTemplate: (templateId) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (template) {
          get().addTask(
            template.name,
            template.details,
            template.paramFields,
            template.recurrence,
            template.weeklyDays,
            template.monthlyDay
          );
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>;
        
        if (!state || typeof state !== 'object') {
          return { tasks: [], history: [], templates: [] };
        }
        
        const migratedTasks = ((state.tasks as any[]) || []).map((task: any) => ({
          ...task,
          completed: task.completed || false,
          completedAt: task.completedAt,
          completionParams: task.completionParams,
          paramFields: ((task.paramFields || []) as any[]).map((field: any) => ({
            ...field,
            key: field.key || field.label?.replace(/\s+/g, '-').toLowerCase() || `field-${Date.now()}`,
            label: field.label || '',
            placeholder: field.placeholder || '',
            type: field.type || 'text',
            required: field.required || false,
            calculationType: field.calculationType || undefined,
            numeratorKey: field.numeratorKey || undefined,
            denominatorKey: field.denominatorKey || undefined,
            decimalPlaces: field.decimalPlaces !== undefined ? field.decimalPlaces : 2,
            durationUnit: field.durationUnit || undefined,
            defaultValue: field.defaultValue !== undefined ? field.defaultValue : undefined,
          })),
          recurrence: task.recurrence || 'once',
          weeklyDays: task.weeklyDays,
          monthlyDay: task.monthlyDay,
        }));

        return {
          tasks: migratedTasks,
          history: (state.history as any[]) || [],
          templates: (state.templates as any[]) || [],
        };
      },
    }
  )
);
