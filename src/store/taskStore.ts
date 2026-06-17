import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, DailyStats, TaskRecurrence, ParamField, TaskTemplate } from '../types';

interface TaskStore {
  tasks: Task[];
  history: DailyStats[];
  templates: TaskTemplate[];
  addTask: (name: string, details?: string, paramFields?: ParamField[], recurrence?: TaskRecurrence, weeklyDays?: number[], monthlyDay?: number) => void;
  editTask: (id: string, name: string, details?: string, paramFields?: ParamField[], recurrence?: TaskRecurrence, weeklyDays?: number[], monthlyDay?: number) => void;
  completeTask: (id: string, params?: Record<string, string | number>) => void;
  uncompleteTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTaskDetails: (id: string, details: string) => void;
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

      getTodayTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        const allTasks = get().tasks;
        
        const todayTasksMap = new Map<string, Task>();
        
        allTasks.forEach((task) => {
          if (isTodayTask(task, today)) {
            const key = `${task.name}-${task.recurrence}`;
            if (!todayTasksMap.has(key)) {
              todayTasksMap.set(key, {
                ...task,
                completed: task.completed && task.completedAt?.startsWith(today),
              });
            }
          }
        });
        
        return Array.from(todayTasksMap.values());
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
        const formattedDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（星期${['日', '一', '二', '三', '四', '五', '六'][today.getDay()]}）`;
        const yearMonthDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const firstCompleted = completedTasks.length > 0 
          ? new Date(Math.min(...completedTasks.map(t => new Date(t.completedAt!).getTime())))
          : today;
        const lastCompleted = completedTasks.length > 0 
          ? new Date(Math.max(...completedTasks.map(t => new Date(t.completedAt!).getTime())))
          : today;
        
        const startTime = firstCompleted.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const endTime = lastCompleted.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        const completedCount = completedTasks.length;
        const totalCount = todayTasks.length;
        const completionStatus = completedCount === totalCount && totalCount > 0 ? '全部完成' : completedCount === 0 ? '未开始' : `${completedCount}/${totalCount} 完成`;
        
        let mdContent = `# 运维巡检日报\n\n`;
        
        mdContent += `## 基本信息\n\n`;
        mdContent += `| 项目 | 内容 |\n`;
        mdContent += `|------|------|\n`;
        mdContent += `| 巡检日期 | ${formattedDate} |\n`;
        mdContent += `| 巡检时段 | ${startTime} - ${endTime} |\n`;
        mdContent += `| 巡检项总数 | ${totalCount} 项 |\n`;
        mdContent += `| 完成状态 | ${completionStatus} |\n\n`;
        
        mdContent += `---\n\n`;
        
        if (completedTasks.length === 0) {
          mdContent += `暂无已完成任务\n`;
        } else {
          completedTasks.forEach((task, index) => {
            const sectionNum = index + 1;
            mdContent += `## ${sectionNum}. ${task.name}\n\n`;
            
            const hasMetrics = task.paramFields?.some(f => f.type === 'number' || f.type === 'percent');
            
            if (task.details) {
              mdContent += `### ${sectionNum}.1 检查详情\n\n`;
              mdContent += `${task.details}\n\n`;
            }
            
            if (hasMetrics && task.paramFields) {
              mdContent += `### ${sectionNum}.2 检查指标\n\n`;
              mdContent += `| 指标 | 数值 | 状态 |\n`;
              mdContent += `|------|------|------|\n`;
              
              task.paramFields.forEach((field) => {
                const value = task.completionParams?.[field.key];
                let displayValue: string | number;
                if (value !== undefined && value !== '' && value !== 0) {
                  displayValue = field.type === 'percent' ? `${value}%` : value;
                } else if (!field.required && field.placeholder) {
                  displayValue = field.type === 'percent' ? `${field.placeholder}%` : field.placeholder;
                } else {
                  displayValue = '-';
                }
                
                let status = '正常';
                if (field.type === 'percent') {
                  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                  if (!isNaN(numValue) && numValue < 70) {
                    status = '需关注';
                  }
                }
                
                mdContent += `| ${field.label} | ${displayValue} | ${status} |\n`;
              });
              
              mdContent += `\n`;
            }
            
            if (task.paramFields && task.paramFields.length > 0) {
              mdContent += `### ${sectionNum}.${hasMetrics ? '3' : '2'} 详细信息\n\n`;
              task.paramFields.forEach((field) => {
                const value = task.completionParams?.[field.key];
                let displayValue: string | number;
                if (value !== undefined && value !== '' && value !== 0) {
                  displayValue = field.type === 'percent' ? `${value}%` : value;
                } else if (!field.required && field.placeholder) {
                  displayValue = field.type === 'percent' ? `${field.placeholder}%` : field.placeholder;
                } else {
                  displayValue = '未填写';
                }
                mdContent += `- **${field.label}**: ${displayValue}\n`;
              });
              mdContent += `\n`;
            } else if (task.completionParams) {
              mdContent += `### ${sectionNum}.2 详细信息\n\n`;
              Object.entries(task.completionParams).forEach(([key, value]) => {
                mdContent += `- **${key}**: ${value}\n`;
              });
              mdContent += `\n`;
            }
            
            if (task.completedAt) {
              const completedTime = new Date(task.completedAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              mdContent += `- **巡检时间**: ${completedTime}\n`;
            }
            
            mdContent += `\n---\n\n`;
          });
          
          mdContent += `## 巡检总结\n\n`;
          mdContent += `| 类别 | 统计 |\n`;
          mdContent += `|------|------|\n`;
          mdContent += `| 总巡检项 | ${totalCount} 项 |\n`;
          mdContent += `| 已完成 | ${completedCount} 项 |\n`;
          mdContent += `| 完成率 | ${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% |\n\n`;
          
          const notes = completedTasks.flatMap(task => {
            if (task.paramFields) {
              return task.paramFields
                .filter(f => f.label.includes('备注') || f.label.includes('异常'))
                .map(f => {
                  const value = task.completionParams?.[f.key];
                  if (value && value !== '' && String(value) !== '0') {
                    return `- **${task.name}**: ${value}`;
                  }
                  return null;
                })
                .filter(Boolean);
            }
            return [];
          });
          
          if (notes.length > 0) {
            mdContent += `### 待跟进事项\n\n`;
            notes.forEach(note => {
              mdContent += `${note}\n`;
            });
            mdContent += `\n`;
          }
          
          mdContent += `---\n\n`;
          mdContent += `*报告生成时间: ${yearMonthDay}*\n`;
          mdContent += `*巡检责任人: _________________*\n`;
        }
        
        return mdContent;
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
    }
  )
);
