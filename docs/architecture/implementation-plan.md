# MoneyTrack Pro 实施顺序

## 阶段 0：基础骨架
1. 初始化 monorepo 根配置
2. 初始化 backend 项目
3. 初始化 mobile 项目
4. 建立 shared 包
5. 建立 dev / prod / test 环境变量模板

## 阶段 1：数据与后端核心
1. 完成 Prisma schema
2. 完成 migration
3. 实现 auth 模块
4. 实现 category 模块
5. 实现 transaction 模块
6. 实现 budget 模块
7. 实现 analytics 模块
8. 实现 export 模块
9. 实现 attachment 基础接口
10. 实现 health check

## 阶段 2：前端核心
1. 建立主题系统
2. 建立组件规范
3. 建立 API 客户端
4. 建立状态管理
5. 实现登录页
6. 实现首页
7. 实现快速记账页
8. 实现交易列表/详情/编辑页
9. 实现预算页
10. 实现统计页
11. 实现设置页

## 阶段 3：质量保障
1. 后端单元测试
2. 后端集成测试
3. 后端 API 测试
4. 前端关键 hook 测试
5. 关键流程端到端验证

## 阶段 4：工程化与交付
1. Dockerfile
2. docker-compose
3. nginx
4. github actions
5. 部署脚本
6. 备份与恢复方案
7. 上线检查清单
8. 路线图

## 执行要求
- 先做 schema 和 API 契约
- 再做可运行代码
- 再补测试
- 最后做部署与运维包装
- 任何阶段发现设计缺陷，先修正模型和接口，再继续实现
