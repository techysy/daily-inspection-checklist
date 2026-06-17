# 每日巡检清单

一个基于 React + TypeScript + Vite 构建的每日巡检清单应用，支持任务管理、周期任务、自定义参数、任务模板和导出功能。

## 📁 项目结构

```
src/
├── components/          # UI组件层
│   ├── AddTask.tsx      # 添加任务表单（支持详情、周期、参数配置、模板选择）
│   ├── Empty.tsx        # 空状态组件
│   ├── ExportButton.tsx # 导出按钮组件
│   ├── Header.tsx       # 页面头部导航
│   ├── StatsCard.tsx    # 统计卡片组件
│   ├── TaskItem.tsx     # 任务项组件（展示、编辑、完成）
│   └── TaskList.tsx     # 任务列表组件
├── pages/               # 页面层
│   ├── Home.tsx         # 首页（今日任务）
│   └── History.tsx      # 历史记录页面（统计图表、周期任务管理、模板管理）
├── store/               # 状态管理层
│   └── taskStore.ts     # Zustand状态管理（含LocalStorage持久化）
├── types/               # 类型定义层
│   └── index.ts         # TypeScript类型定义（含任务模板）
├── hooks/               # 自定义Hooks
│   └── useTheme.ts      # 主题切换Hook
├── lib/                 # 工具函数
│   └── utils.ts         # 通用工具函数
├── App.tsx              # 应用根组件
├── main.tsx             # 应用入口
└── index.css            # 全局样式（Tailwind）
```

## 🛠️ 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18.2.0 |
| 类型系统 | TypeScript | 5.5.4 |
| 构建工具 | Vite | 6.5.0 |
| 样式框架 | Tailwind CSS | 3.4.14 |
| 状态管理 | Zustand | 4.5.5 |
| 图标库 | Lucide React | 0.453.0 |

## 🏗️ 架构设计

### 1. 组件架构

采用 **分层组件架构**，遵循单一职责原则：

- **展示组件**：`TaskItem`, `StatsCard`, `Empty` - 负责UI渲染，接收props并展示数据
- **容器组件**：`TaskList`, `AddTask` - 包含业务逻辑，管理表单状态
- **页面组件**：`Home`, `History` - 页面级组件，组合子组件

### 2. 状态管理

使用 **Zustand** 进行集中状态管理，特点：

- **单一store**：所有任务数据集中管理
- **持久化**：通过 `zustand/middleware/persist` 自动同步到 LocalStorage
- **中间件模式**：支持日志、持久化等中间件扩展
- **类型安全**：完整的TypeScript类型定义

### 3. 数据模型

```typescript
// 任务类型
interface Task {
  id: string;           // 唯一标识
  name: string;         // 任务名称
  completed: boolean;   // 完成状态
  createdAt: string;    // 创建日期
  completedAt?: string; // 完成时间
  details?: string;     // 详细信息
  paramFields?: ParamField[]; // 自定义参数字段
  completionParams?: Record<string, string | number>; // 完成参数值
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly'; // 执行频率
  weeklyDays?: number[]; // 每周执行的日期
  monthlyDay?: number;   // 每月执行的日期
}

// 参数字段定义
interface ParamField {
  key: string;          // 参数标识
  label: string;        // 显示标签
  placeholder: string;  // 提示文字（可作为默认值）
  type: 'text' | 'number' | 'percent'; // 输入类型
  required: boolean;    // 是否必填
}

// 任务模板
interface TaskTemplate {
  id: string;           // 唯一标识
  name: string;         // 模板名称
  details?: string;     // 模板详情
  paramFields?: ParamField[]; // 模板参数字段
  recurrence: TaskRecurrence; // 执行频率
  weeklyDays?: number[]; // 每周执行的日期
  monthlyDay?: number;   // 每月执行的日期
}
```

### 4. 核心功能模块

| 模块 | 功能 | 说明 |
|------|------|------|
| **任务管理** | 添加、编辑、删除任务 | 支持详细信息填写 |
| **周期任务** | 每天/每周/每月重复 | 周任务从周一开始排序 |
| **参数化完成** | 自定义填写字段 | 支持必填/选填，提示文字作为默认值 |
| **任务模板** | 从模板快速创建任务 | 可创建、编辑、删除模板 |
| **导出功能** | 导出为MD文档 | 包含完整任务信息和参数 |
| **历史记录** | 查看完成统计 | 柱状图展示最近7天数据 |

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

或使用启动脚本（推荐）：

```powershell
# PowerShell脚本（推荐用于任务栏快速启动）
.\start.ps1
```

```batch
@REM 批处理脚本
.\start.bat
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 📋 功能特性

### ✅ 已实现功能

1. **今日任务管理**
   - 添加新任务（含详细信息）
   - 标记任务完成（支持参数填写）
   - 删除任务
   - 清除已完成任务

2. **周期任务**
   - 临时任务（仅执行一次）
   - 每日任务
   - 每周任务（选择星期几，周一至周日排序）
   - 每月任务（选择日期）

3. **自定义参数**
   - 创建任务时添加参数字段
   - 支持文本/数字/百分比类型
   - 支持必填/选填设置
   - 提示文字作为默认值

4. **任务模板**
   - 创建任务模板（包含名称、详情、参数、周期）
   - 编辑已有模板
   - 删除模板
   - 从模板快速创建任务

5. **导出功能**
   - 导出已完成任务为Markdown文档
   - 包含任务详情、参数、完成时间
   - 未填写的非必填参数显示提示文字

6. **历史记录**
   - 本周完成统计
   - 每日完成情况柱状图
   - 周期任务管理（编辑、删除、重置状态）
   - 任务模板管理

7. **其他特性**
   - 数据自动持久化（LocalStorage）
   - 响应式设计
   - 简洁美观的UI界面

## 🎯 使用流程

```
1. 进入首页 → 添加巡检任务
   ├─ 填写任务名称
   ├─ 填写详细信息（默认展开）
   ├─ 设置周期（可选，默认隐藏）
   ├─ 添加完成参数（可选，默认隐藏）
   └─ 或从模板创建（点击"从模板创建"按钮）

2. 执行巡检 → 完成任务
   └─ 填写自定义参数（必填项必须填写）

3. 导出报告 → 点击"导出清单"
   └─ 下载Markdown格式巡检报告

4. 查看历史 → 切换到"历史记录"
   ├─ 查看本周统计
   ├─ 查看每日完成柱状图
   ├─ 管理周期任务
   └─ 管理任务模板
```

## 🔧 配置说明

### 启动脚本

| 脚本文件 | 类型 | 说明 |
|----------|------|------|
| `start.ps1` | PowerShell | **推荐**，支持彩色输出、错误处理，便于任务栏快速启动 |
| `start.bat` | 批处理 | 兼容所有Windows环境 |

### PowerShell脚本使用注意

如果运行脚本时提示"无法加载文件"，请以管理员身份打开PowerShell并执行：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 环境变量

无需额外环境变量，所有配置均在代码中硬编码。

## 📝 导出格式示例

```markdown
# 每日巡检清单

## 2026年6月11日 星期三

### 已完成任务 (2项)

1. **环卫车辆视频检查**
   - 详细信息: 检查所有车辆视频是否正常
   - 完成参数:
     - 工牌实际在线人数 *: 15
     - 巡检人员: 张三
     - 异常情况: 无异常
   - 完成时间: 11:43

2. **设备状态检查**
   - 详细信息: 检查机房设备运行状态
   - 完成参数:
     - 温度: 24°C
     - 湿度: 60%
     - 设备数量 *: 10
     - 在线率: 95%
   - 完成时间: 11:50
```

## 📄 许可证

MIT License
