import type { Task, ParamField, CompletionParams } from '../types';

interface ParsedTask {
  name: string;
  date: string;
  params: { label: string; value: string }[];
  completedAt?: string;
}

function parseDateHeader(content: string): string | null {
  const match = content.match(/【(\d+)月(\d+)日/);
  if (!match) return null;
  const month = match[1].padStart(2, '0');
  const day = match[2].padStart(2, '0');
  const year = new Date().getFullYear();
  return `${year}-${month}-${day}`;
}

function parseTasks(content: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const lines = content.split('\n');

  let currentDate = '';
  let currentTask: ParsedTask | null = null;

  for (const line of lines) {
    const dateMatch = line.match(/【(\d+)月(\d+)日/);
    if (dateMatch) {
      const month = dateMatch[1].padStart(2, '0');
      const day = dateMatch[2].padStart(2, '0');
      currentDate = `${new Date().getFullYear()}-${month}-${day}`;
    }

    const taskMatch = line.match(/^\d+\.\s+(.+)/);
    if (taskMatch) {
      if (currentTask) tasks.push(currentTask);
      currentTask = {
        name: taskMatch[1].trim(),
        date: currentDate,
        params: [],
      };
      continue;
    }

    if (currentTask) {
      const paramMatch = line.match(/^\s{2,}(.+?):\s*(.+)/);
      if (paramMatch) {
        const key = paramMatch[1].trim();
        const value = paramMatch[2].trim();
        if (key !== '完成时间') {
          currentTask.params.push({ label: key, value });
        } else {
          currentTask.completedAt = value;
        }
      }
    }
  }

  if (currentTask) tasks.push(currentTask);
  return tasks;
}

function parseValue(raw: string): string | number {
  const cleaned = raw.replace(/[°%天小时]/g, '').trim();
  const num = Number(cleaned);
  if (!isNaN(num) && cleaned !== '') return num;
  return raw;
}

function inferParamType(value: string | number): ParamField['type'] {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (value.includes('%')) return 'percent';
    if (/^\d+(\.\d+)?$/.test(value.replace(/[°天小时]/g, ''))) return 'number';
  }
  return 'text';
}

export function importFromReport(content: string): Task[] {
  const parsed = parseTasks(content);
  const date = parseDateHeader(content) || new Date().toISOString().split('T')[0];

  const taskGroups = new Map<string, ParsedTask[]>();
  for (const t of parsed) {
    const key = `${t.name}||${t.date}`;
    if (!taskGroups.has(key)) taskGroups.set(key, []);
    taskGroups.get(key)!.push(t);
  }

  const tasks: Task[] = [];

  for (const [, group] of taskGroups) {
    const first = group[0];
    const allParams = group.flatMap((g) => g.params);
    const uniqueLabels = [...new Set(allParams.map((p) => p.label))];

    const paramFields: ParamField[] = uniqueLabels.map((label) => {
      const sample = allParams.find((p) => p.label === label);
      const parsedVal = sample ? parseValue(sample.value) : '';
      return {
        key: label.replace(/\s+/g, '-').toLowerCase(),
        label,
        placeholder: String(parsedVal),
        type: inferParamType(parsedVal),
        required: false,
      };
    });

    const lastEntry = group[group.length - 1];
    const completionParams: CompletionParams = {};
    for (const p of lastEntry.params) {
      const field = paramFields.find((f) => f.label === p.label);
      if (field) {
        completionParams[field.key] = parseValue(p.value);
      }
    }

    const taskDate = first.date || date;
    const completedAt = lastEntry.completedAt
      ? `${taskDate}T${lastEntry.completedAt}:00`
      : `${taskDate}T12:00:00`;

    tasks.push({
      id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: first.name,
      completed: true,
      createdAt: taskDate,
      completedAt,
      paramFields: paramFields.length > 0 ? paramFields : undefined,
      completionParams: Object.keys(completionParams).length > 0 ? completionParams : undefined,
      recurrence: 'once',
    });
  }

  return tasks;
}

export function parseImportPreview(content: string): {
  date: string;
  taskCount: number;
  tasks: { name: string; paramCount: number }[];
} {
  const date = parseDateHeader(content) || '未知日期';
  const parsed = parseTasks(content);
  const grouped = new Map<string, ParsedTask[]>();
  for (const t of parsed) {
    if (!grouped.has(t.name)) grouped.set(t.name, []);
    grouped.get(t.name)!.push(t);
  }

  return {
    date,
    taskCount: grouped.size,
    tasks: Array.from(grouped.entries()).map(([name, arr]) => ({
      name,
      paramCount: arr[0].params.length,
    })),
  };
}
