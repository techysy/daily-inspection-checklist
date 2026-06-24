export type TaskRecurrence = 'daily' | 'weekly' | 'monthly' | 'once';

export interface CompletionParams {
  [key: string]: string | number;
}

export type ParamFieldType = 'text' | 'number' | 'percent';

export type CalculationType = 
  | 'none' 
  | 'percentage' // 百分比型: 分子 / 分母 * 100
  | 'duration'; // 时间型: 结束时间 - 开始时间

export type DurationUnit = 'hours' | 'days';

export interface ParamField {
  key: string;
  label: string;
  placeholder: string;
  type: ParamFieldType;
  required: boolean;
  calculationType?: CalculationType;
  numeratorKey?: string;
  denominatorKey?: string;
  decimalPlaces?: number;
  durationUnit?: DurationUnit;
  defaultValue?: string | number;
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
