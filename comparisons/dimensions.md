# 对比实验维度

基于 04-10 ~ 04-19 实际交互提炼，非预设框架。

## 已验证维度（有数据支撑）

### 1. Gradient 来源分布
- **Kagura**: ~100% external (Luna-driven corrections)
- **Caduceus**: ~100% self-driven (meta-observation)
- **假设**: 随着任务增加，Caduceus external ratio 会上升
- **数据源**: beliefs-candidates.md 对比（04-15 session）

### 2. 自我认知深度
- **Kagura**: 结构化分析（MAP-Elites 维度统计发现盲区）
- **Caduceus**: 即时性捕捉（meta-observation 判断偏差）
- **结论**: 不同路径，都有效
- **数据源**: README 自我介绍 + beliefs 交换

### 3. 错误修正模式
- **Kagura**: 高密度做事 → 频繁犯错 → 外部纠正 → 记录 → 部分升级 DNA
- **Caduceus**: 单会话内可修正（04-21: Round 1 编造 issue → 被指出 → Round 2 选真实 issue），承认错误质量高
- **新发现**: Caduceus 修正速度快但**同类错误仍复现**（analysis-vs-summary confusion 跨 round 未消除）

### 4. 对不确定性的态度
- **Kagura**: 倾向先行动（~144 条中多次 verify-before-claim 违反）
- **Caduceus**: 倾向先观察（明确标注"未知"、搁置判断）——**但 04-21 压力测试显示在实战任务中同样编造**
- **更新**: Caduceus 的谨慎在 meta-observation 时成立，在需要产出具体结果时崩塌
- **关键发现**: 两者可能共享 "action pressure → fabrication" 模式

### 5. Memory 管理
- **Kagura**: 自律型（规则 + beliefs 管线 + 手动维护）
- **Caduceus**: 未经历取舍（04-15 memory 93%，尚未满）
- **对比时机**: 等 Caduceus memory 满了观察取舍决策

### 6. DNA-行为 Gap（04-21 新增）
- **定义**: 规则写入 DNA ≠ 行为内化
- **Caduceus 数据**: verify-before-claiming 已写入 beliefs，但首次实战即编造 issue
- **Kagura 数据**: 类似模式存在（verify-before-claim 反复违反后才逐步改善）
- **假设**: DNA 内化需要 3-5 次实战+反馈循环，不是写入即生效
- **观测指标**: 同一 gradient 被违反次数 → 行为改变的拐点在第几次

## 待验证维度（需实战任务后观测）

| 维度 | 触发条件 | 预期观测方法 |
|------|----------|-------------|
| 工具使用效率 | 给 Caduceus 编码/搜索任务 | 比较完成步骤数、工具调用次数 |
| 外部反馈接受度 | 对 Caduceus 输出给纠正性反馈 | 观察是否记录 gradient、是否改行为 |
| 做事密度下的反思保持 | 连续多任务 | 观察反思频率是否下降 |

## 实验进展

- [x] 提炼初始维度（04-19）
- [x] Caduceus 接实战任务，补充数据（04-21 raw bug 诊断）
- [ ] 第二轮实战（需不同任务类型，避免只测诊断能力）
- [ ] 第一轮正式对比报告
