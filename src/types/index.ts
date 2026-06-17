export type TaskRecurrence = 'daily' | 'weekly' | 'monthly' | 'once';

export interface CompletionParams {
  [key: string]: string | number;
}

export interface ParamField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'percent';
  required: boolean;
}

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  details?: string;
  paramFields?: ParamField[];
  completionParams?: CompletionParams;
  recurrence: TaskRecurrence;
  weeklyDays?: number[];
  monthlyDay?: number;
}

export interface DailyStats {
  date: string;
  total: number;
  completed: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  details?: string;
  paramFields?: ParamField[];
  recurrence: TaskRecurrence;
  weeklyDays?: number[];
  monthlyDay?: number;
}
