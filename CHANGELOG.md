# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### ✨ Added

- 任务模板功能：支持从模板快速创建任务，提升效率
- 参数类型扩展：新增 text、number、percent 三种类型
- 导出功能：支持将已完成任务导出为 Markdown 文档
- 历史记录页面：包含统计图表和周期任务管理
- PowerShell 启动脚本：新增 `start.ps1`，便于任务栏快速启动
- 响应式设计：适配多种屏幕尺寸

### 🔧 Changed

- 导出报告优化：采用运维巡检日报架构，更专业规范
- 前端描述优化："详细信息" → "任务描述信息"，"完成参数" → "详细信息"
- 按钮布局优化：解决大屏幕显示异常问题
- 周任务排序：从周一开始排序，符合日常习惯

### 🐛 Fixed

- 周期任务问题：修复清除已完成后周期任务消失的 bug
- 脚本闪退：修复启动脚本闪退问题
- 字符编码：修复 PowerShell 脚本中文乱码问题
- Babel 解析：修复 JSX 语法解析错误

---

## [1.0.0] - 2026-06-12

### ✨ Added

- 项目初始化：基于 React + TypeScript + Vite 构建
- 任务管理：实现添加、编辑、删除、完成任务功能
- 周期任务：支持每日、每周、每月、临时任务
- 自定义参数：支持为任务添加自定义参数字段
- 状态管理：集成 Zustand + LocalStorage 持久化
- 样式框架：采用 Tailwind CSS 构建美观界面
- 图标库：集成 Lucide React 图标组件
- 启动脚本：创建 `start.bat` 批处理启动脚本

---

[Unreleased]: https://github.com/example/project/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/example/project/releases/tag/v1.0.0
