# 架构设计

## 总体原则
- Clean Architecture + Repository Pattern
- 前后端分离，可独立构建、测试、部署
- 业务代码按 feature 切分，不按技术角色平铺
- 共享 schema / constants / utils 抽到 monorepo 公共包，减少前后端重复定义
- v1 先做单用户架构，账号体系保留扩展到多用户能力

## 目录职责

### apps/backend
后端服务主工程。

- `src/config`：应用、数据库、安全、日志等配置聚合
- `constants`：错误码、枚举映射、业务常量
- `db/prisma`：Prisma 客户端初始化与数据库访问辅助
- `errors`：统一业务异常、错误码映射、全局异常结构
- `features/*`：按领域功能拆分
  - `validators`：请求输入校验
  - `controllers`：协议层，只做入参转换与响应组装
  - `services`：业务规则层
  - `repositories`：数据访问层
  - `routes`：路由定义与中间件挂载
- `infrastructure/cache`：缓存抽象（v1 预留 Redis）
- `infrastructure/logger`：Winston 日志初始化与分级策略
- `infrastructure/storage`：文件存储抽象（本地 -> 对象存储可替换）
- `infrastructure/http`：Axios/外部服务客户端封装
- `middlewares`：认证、限流、审计、错误处理、请求上下文
- `routes`：根路由聚合
- `schemas`：公共 zod schema
- `types`：公共 TS 类型
- `utils`：金额、时间、分页、格式化等通用工具
- `prisma`：schema 与迁移
- `tests`：unit / integration / api 分层测试

### apps/mobile
React Native + Expo 前端工程。

- `app/`：Expo Router 页面入口
- `src/api`：后端接口客户端
- `src/components`：通用 UI 组件
- `src/features`：业务视图与状态组合
- `src/hooks`：可复用 hook
- `src/navigation`：导航结构与深链处理
- `src/providers`：全局 provider（主题、查询、错误边界）
- `src/store`：Zustand 全局状态
- `src/theme`：色彩、字体、间距、主题系统
- `src/utils`：表单、金额、日期、离线缓存工具
- `src/types`：前端类型定义
- `assets`：图标、图片、字体

### packages/shared
前后端共享代码包。

- `constants`：业务常量
- `schemas`：共享 zod schema
- `types`：共享类型
- `utils`：金额、时间、格式化逻辑

### deploy
部署、脚本与 CI/CD 配置。

- `nginx`：反向代理与安全头配置
- `scripts`：部署、备份、恢复、初始化脚本
- `ci`：流水线配置与辅助脚本

### docs
产品、架构、API、安全、运维文档。

## 为什么这样设计
1. `feature-first` 优于 `layer-first`，便于后续团队并行开发
2. Repository + Service + Controller 分层，确保业务规则不泄漏到路由和数据库层
3. shared 包减少“前后端两套定义不一致”的系统性风险
4. infrastructure 层独立，方便未来替换缓存、存储、通知、AI 供应商
5. 测试目录按层次拆分，避免后期混测导致回归成本上升

## 后续扩展方式
- 增加新功能：在 `features/` 下新增 domain 模块即可
- 增加新平台：新增 `apps/client-*`，复用 `packages/shared`
- 增加多用户：扩展 `auth -> user -> device -> sync` 链路
- 增加 AI：在 `features/insights` 或 `infrastructure/ai` 插入供应商抽象层
- 增加任务/提醒：引入异步任务队列，不影响主记账域
