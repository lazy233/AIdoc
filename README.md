# 结业报告工坊

这是一个面向教培场景的结业报告生成系统骨架，包含：

- `frontend`：React + TypeScript 前端，已经实现四个完整页面
- `backend`：FastAPI + `python-pptx` 后端骨架，提供模板、数据、历史记录与生成任务接口

## 已完成内容

### 前端

- 顶部 Tab 导航：`生成工作台`、`模板中心`、`数据管理`、`历史记录`
- 工作台首页：参考你提供的 WPS AI PPT 风格，完成了大输入区、推荐模板、生成队列、页面结构草案和工作流展示
- 模板中心：模板分类、精选模板、模块库、模板策略
- 数据管理：数据源状态、风险提醒、导入记录、学员明细搜索与状态筛选
- 历史记录：统计卡片、任务筛选、任务卡片、交付复用建议
- 前端接口层已预留，后端未启动时会自动回退到本地演示数据

### 后端

- FastAPI 项目结构
- `/api/workbench`
- `/api/templates`
- `/api/data`
- `/api/history`
- `/api/generation/tasks`
- `python-pptx` 生成服务占位
- AI 页面大纲服务占位
- Mock Repository 占位，后续可以替换成真实数据库访问层

## 目录结构

```text
.
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ data/
│  │  ├─ sections/
│  │  ├─ services/
│  │  └─ types.ts
│  └─ package.json
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ core/
│  │  ├─ models/
│  │  └─ services/
│  ├─ storage/
│  └─ requirements.txt
└─ package.json
```

## 启动方式

### 1. 前端

```bash
npm install
npm run frontend:dev
```

如果只在 `frontend` 目录运行，也可以：

```bash
cd frontend
npm install
npm run dev
```

### 2. 后端

建议先安装依赖：

```bash
pip install -r backend/requirements.txt
```

如果你需要自定义配置，可以先复制：

```bash
copy backend\\.env.example backend\\.env
```

然后启动：

```bash
npm run backend:dev
```

或者：

```bash
python -m uvicorn app.main:app --reload --app-dir backend
```

## 生成接口说明

示例请求：

```json
{
  "topic": "高二数学春季班结业报告",
  "templateId": "term-growth",
  "studentIds": ["S001", "S002"],
  "pageCount": 24,
  "outputFormat": "pptx+pdf",
  "tone": "professional"
}
```

当前后端会：

- 生成一个演示版页面大纲
- 尝试用 `python-pptx` 生成一个简单 PPT
- 把任务写入历史记录

如果没有安装 `python-pptx`，后端会回退生成一个说明文件，避免接口直接报错。

## 后续建议

下一步最值得做的三件事：

1. 把 `MockRepository` 替换成真实数据库 / Excel / 教务系统访问层
2. 把模板定义从“演示数据”升级成“PPT 母版 + 模块配置 + 字段映射”
3. 接入你实际使用的 AI 文案生成能力，把教师评语、家长建议、续班推荐自动写出来
# AIdoc
