import { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import type { ParamField, DurationUnit } from '../types';
import { useToastStore } from '../store/toastStore';

interface ParamFieldEditorProps {
  fields: ParamField[];
  onAdd: (field: ParamField) => void;
  onRemove: (index: number) => void;
  showRequired?: boolean;
}

export function ParamFieldEditor({ fields, onAdd, onRemove, showRequired = true }: ParamFieldEditorProps) {
  const showToast = useToastStore((s) => s.showToast);
  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [type, setType] = useState<'text' | 'number' | 'percent' | 'boolean' | 'calc-percentage' | 'calc-duration'>('text');
  const [required, setRequired] = useState(false);
  const [numeratorKey, setNumeratorKey] = useState('');
  const [denominatorKey, setDenominatorKey] = useState('');
  const [fixedDenominatorValue, setFixedDenominatorValue] = useState('');
  const [useFixedDenominator, setUseFixedDenominator] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('hours');

  const isCalc = type === 'calc-percentage' || type === 'calc-duration';

  const handleAdd = () => {
    if (!label.trim()) return;

    const newKey = label.trim().replace(/\s+/g, '-').toLowerCase();
    if (fields.some((f) => f.key === newKey)) {
      showToast('参数名称重复，请修改参数名称');
      return;
    }

    let parsedDefault: string | number | boolean | undefined;
    if (!isCalc && defaultValue.trim() !== '') {
      if (type === 'number' || type === 'percent') {
        parsedDefault = parseFloat(defaultValue);
      } else if (type === 'boolean') {
        parsedDefault = defaultValue === 'true' || defaultValue === '1';
      } else {
        parsedDefault = defaultValue;
      }
    }

    const field: ParamField = {
      key: label.trim().replace(/\s+/g, '-').toLowerCase(),
      label: label.trim(),
      placeholder: placeholder.trim() || `请输入${label}`,
      type: isCalc ? 'number' : type,
      required,
      defaultValue: parsedDefault,
      calculationType: type === 'calc-percentage' ? 'percentage' : type === 'calc-duration' ? 'duration' : undefined,
      numeratorKey: isCalc ? numeratorKey : undefined,
      denominatorKey: isCalc && !useFixedDenominator ? denominatorKey : undefined,
      fixedDenominatorValue: isCalc && useFixedDenominator ? parseFloat(fixedDenominatorValue) : undefined,
      decimalPlaces: isCalc ? decimalPlaces : undefined,
      durationUnit: type === 'calc-duration' ? durationUnit : undefined,
    };

    onAdd(field);
    setLabel('');
    setPlaceholder('');
    setDefaultValue('');
    setType('text');
    setRequired(false);
    setNumeratorKey('');
    setDenominatorKey('');
    setFixedDenominatorValue('');
    setUseFixedDenominator(false);
    setDecimalPlaces(2);
    setDurationUnit('hours');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const canAddCalc = isCalc && numeratorKey && (
    useFixedDenominator ? fixedDenominatorValue !== '' : denominatorKey
  );

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="参数名称"
          className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <input
          type="text"
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="提示文字"
          className="flex-1 min-w-[100px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        {!isCalc && (
          <input
            type="text"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="默认值"
            className="flex-1 min-w-[80px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        )}
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as typeof type);
            setNumeratorKey('');
            setDenominatorKey('');
            setFixedDenominatorValue('');
            setUseFixedDenominator(false);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="text">文本</option>
          <option value="number">数字</option>
          <option value="percent">百分比</option>
          <option value="boolean">是否</option>
          <option disabled className="text-gray-400">──────────</option>
          <option value="calc-percentage">计算百分比</option>
          <option value="calc-duration">计算时长</option>
        </select>
        {showRequired && !isCalc && (
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">必填</span>
          </label>
        )}
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          添加
        </button>
      </div>

      {isCalc && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{type === 'calc-duration' ? '开始时间' : '分子字段'}</label>
              <select
                value={numeratorKey}
                onChange={(e) => setNumeratorKey(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">选择字段</option>
                {fields.filter((f) => f.calculationType === undefined).map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
            {type === 'calc-duration' ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">结束时间</label>
                <select
                  value={denominatorKey}
                  onChange={(e) => setDenominatorKey(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">选择结束时间</option>
                  {fields.filter((f) => f.key !== numeratorKey && f.calculationType === undefined).map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">分母</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setUseFixedDenominator(false); setDenominatorKey(''); }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        !useFixedDenominator ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      选字段
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUseFixedDenominator(true); setDenominatorKey(''); }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        useFixedDenominator ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      固定值
                    </button>
                  </div>
                </div>
                {useFixedDenominator ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">固定分母值</label>
                    <input
                      type="number"
                      min="0"
                      value={fixedDenominatorValue}
                      onChange={(e) => setFixedDenominatorValue(e.target.value)}
                      placeholder="如: 10"
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">分母字段</label>
                    <select
                      value={denominatorKey}
                      onChange={(e) => setDenominatorKey(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">选择字段</option>
                      {fields.filter((f) => f.key !== numeratorKey && f.calculationType === undefined).map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">小数位数</label>
              <select
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="0">0位</option>
                <option value="1">1位</option>
                <option value="2">2位</option>
                <option value="3">3位</option>
              </select>
            </div>
            {type === 'calc-duration' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">时间单位</label>
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="hours">小时</option>
                  <option value="days">天</option>
                </select>
              </div>
            )}
          </div>
          {canAddCalc && (
            <p className="text-xs text-blue-600">
              {type === 'calc-percentage'
                ? `计算公式: ${numeratorKey ? fields.find(f => f.key === numeratorKey)?.label || '分子' : '分子'} / ${useFixedDenominator ? fixedDenominatorValue : denominatorKey ? fields.find(f => f.key === denominatorKey)?.label || '分母' : '分母'} × 100%`
                : `计算公式: 结束时间 - 开始时间`}
            </p>
          )}
        </div>
      )}

      {fields.length > 0 && (
        <div className="mt-3 space-y-2">
          {fields.map((field, index) => (
            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{field.label}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                {field.calculationType === 'percentage' ? '计算百分比' : field.calculationType === 'duration' ? '计算时长' : field.type === 'text' ? '文本' : field.type === 'number' ? '数字' : field.type === 'percent' ? '百分比' : '是否'}
              </span>
              {field.required && (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded font-medium">必填</span>
              )}
              {field.calculationType && field.calculationType !== 'none' && (
                <>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                    {field.decimalPlaces}位小数
                  </span>
                  {field.calculationType === 'duration' && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded font-medium">
                      {field.durationUnit === 'hours' ? '小时' : '天'}
                    </span>
                  )}
                  {field.fixedDenominatorValue !== undefined && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">
                      固定分母: {field.fixedDenominatorValue}
                    </span>
                  )}
                </>
              )}
              {field.defaultValue !== undefined && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded font-medium">
                  默认: {String(field.defaultValue)}
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
