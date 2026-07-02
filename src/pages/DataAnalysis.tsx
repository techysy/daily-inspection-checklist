import { useMemo, useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Settings } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { Task, ParamField } from '../types';

interface TrendSeries {
  taskName: string;
  paramLabel: string;
  unit: string;
  deviceName?: string;
  data: { date: string; value: number; deviceName?: string }[];
}

function extractNumericParams(tasks: Task[]): TrendSeries[] {
  const seriesMap = new Map<string, TrendSeries>();

  const sorted = [...tasks].sort(
    (a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime()
  );

  for (const task of sorted) {
    if (!task.paramFields || !task.completionParams || !task.completedAt) continue;
    const date = task.completedAt.split('T')[0];

    const firstParamField = task.paramFields[0];
    const deviceName = firstParamField ? String(task.completionParams[firstParamField.key] || '') : undefined;

    for (const field of task.paramFields) {
      if (!isNumericField(field)) continue;

      const raw = task.completionParams[field.key];
      if (raw === undefined || raw === '') continue;
      const num = Number(raw);
      if (isNaN(num)) continue;

      const seriesKey = `${task.name}||${field.label}`;
      if (!seriesMap.has(seriesKey)) {
        seriesMap.set(seriesKey, {
          taskName: task.name,
          paramLabel: field.label,
          unit: getUnit(field),
          deviceName: deviceName,
          data: [],
        });
      }
      seriesMap.get(seriesKey)!.data.push({ date, value: num, deviceName });
    }
  }

  return Array.from(seriesMap.values());
}

function isNumericField(field: ParamField): boolean {
  return (
    field.type === 'number' ||
    field.type === 'percent' ||
    field.calculationType === 'percentage' ||
    field.calculationType === 'duration'
  );
}

function getUnit(field: ParamField): string {
  if (field.type === 'percent' || field.calculationType === 'percentage') return '%';
  if (field.calculationType === 'duration') return field.durationUnit === 'days' ? '天' : '小时';
  return '';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function DataAnalysis() {
  const tasks = useTaskStore((s) => s.tasks);
  const [selectedTask, setSelectedTask] = useState<string>('all');
  const [showCharts, setShowCharts] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.completed && t.completedAt),
    [tasks]
  );

  const allSeries = useMemo(() => extractNumericParams(completedTasks), [completedTasks]);

  const taskNames = useMemo(() => {
    const names = new Set(allSeries.map((s) => s.taskName));
    return Array.from(names);
  }, [allSeries]);

  const filteredSeries = useMemo(() => {
    if (selectedTask === 'all') return allSeries;
    return allSeries.filter((s) => s.taskName === selectedTask);
  }, [allSeries, selectedTask]);

  if (allSeries.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">数据可视化</h2>
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          暂无数值型参数数据，请先完成带参数的任务
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">数据可视化</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部任务</option>
            {taskNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-48">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCharts}
                    onChange={(e) => setShowCharts(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">显示趋势图表</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCharts ? (
        <div className="space-y-6">
          {filteredSeries.map((series) => (
            <TrendChart key={`${series.taskName}||${series.paramLabel}`} series={series} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          图表已隐藏，请在设置中开启显示
        </div>
      )}
    </div>
  );
}

function TrendChart({ series }: { series: TrendSeries }) {
  const option = {
    title: {
      text: series.deviceName 
        ? `${series.deviceName} - ${series.paramLabel}`
        : `${series.taskName} - ${series.paramLabel}`,
      left: 'center',
      textStyle: { fontSize: 14, color: '#374151' },
    },
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const p = params[0];
        const dataIndex = p.dataIndex;
        const deviceName = series.data[dataIndex]?.deviceName;
        const deviceLine = deviceName ? `<br/>设备: <b>${deviceName}</b>` : '';
        return `${p.axisValue}${deviceLine}<br/>${series.paramLabel}: <b>${p.value}${series.unit}</b>`;
      },
    },
    grid: { left: 60, right: 20, top: 50, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: series.data.map((d) => formatDate(d.date)),
      axisLabel: { color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value' as const,
      name: series.unit ? `(${series.unit})` : '',
      axisLabel: { color: '#6b7280' },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [
      {
        type: 'line' as const,
        data: series.data.map((d) => d.value),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59,130,246,0.25)' },
              { offset: 1, color: 'rgba(59,130,246,0.02)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <ReactECharts option={option} style={{ height: 300 }} />
    </div>
  );
}
