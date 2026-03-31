BEGIN;

-- 壁画基础数据
INSERT INTO murals (
  id, name, era, site, material, tomb_location, dimensions, description,
  status, health_index, is_featured, created_at, updated_at
) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '九原岗北朝壁画（东壁）',
    '北齐',
    '忻州九原岗',
    '灰泥彩绘',
    '东壁主墓室',
    '420cm x 260cm',
    '东壁局部存在起甲与空鼓现象，已进入重点监测。',
    'restoring',
    42,
    true,
    now() - interval '40 days',
    now() - interval '1 day'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '娄睿墓鞍马游骑图',
    '北齐',
    '太原娄睿墓',
    '泥地矿物颜料',
    '甬道北壁',
    '360cm x 210cm',
    '颜料层老化褪色，存在局部污染。',
    'assessing',
    58,
    false,
    now() - interval '33 days',
    now() - interval '2 days'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '湾漳大墓仪仗出行图',
    '北齐',
    '磁县湾漳大墓',
    '灰泥彩绘',
    '前室西壁',
    '380cm x 230cm',
    '整体结构稳定，处于常态化监测阶段。',
    'monitoring',
    76,
    false,
    now() - interval '29 days',
    now() - interval '3 days'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '徐显秀墓宴饮图',
    '北齐',
    '太原王家峰',
    '矿物颜料',
    '后室南壁',
    '300cm x 180cm',
    '一期修复已完成，准备整理归档。',
    'completed',
    88,
    false,
    now() - interval '25 days',
    now() - interval '4 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 病害标注（用于方案模块关联）
INSERT INTO damage_annotations (
  id, mural_id, image_layer, damage_type, severity, coordinates,
  area, area_percent, description, version, created_at, updated_at
) VALUES
  (
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'visible',
    'flaking',
    3,
    '{"type":"polygon","points":[{"x":120.5,"y":80.2},{"x":210.1,"y":92.7},{"x":198.4,"y":168.9},{"x":115.3,"y":154.6}]}'::jsonb,
    0.43,
    3.1,
    '东壁中部颜料层起甲，边缘存在轻微空鼓。',
    1,
    now() - interval '18 days',
    now() - interval '12 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 项目数据
INSERT INTO projects (
  id, name, description, status, progress, budget, start_date, end_date, created_at, updated_at
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '九原岗东壁抢救性修复',
    '针对起甲、空鼓与颜料层剥落区域进行分区加固和表面清理。',
    'in_progress',
    46,
    180000,
    now() - interval '20 days',
    NULL,
    now() - interval '21 days',
    now() - interval '1 day'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '娄睿墓壁画保护评估',
    '完成病害普查与环境参数基线采集，形成评估报告。',
    'pending',
    12,
    95000,
    now() - interval '8 days',
    NULL,
    now() - interval '9 days',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 项目与壁画关联
INSERT INTO project_murals (project_id, mural_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002')
ON CONFLICT (project_id, mural_id) DO NOTHING;

-- 项目阶段
INSERT INTO project_phases (
  id, project_id, name, "order", status, created_at, updated_at
) VALUES
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001', '评估与建档', 1, 'completed', now() - interval '21 days', now() - interval '15 days'),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001', '病害处理与加固', 2, 'in_progress', now() - interval '15 days', now() - interval '1 day'),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000001', '复核与归档', 3, 'pending', now() - interval '6 days', now() - interval '6 days'),
  ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000002', '现场勘查', 1, 'in_progress', now() - interval '9 days', now() - interval '2 days'),
  ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000002', '环境采样', 2, 'pending', now() - interval '7 days', now() - interval '7 days'),
  ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000002', '报告整理', 3, 'pending', now() - interval '6 days', now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;

-- 任务
INSERT INTO rest_tasks (
  id, phase_id, title, description, status, created_at, updated_at
) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000011',
    '完成高精度正射影像采集',
    '对东壁进行分区采样与影像拼接。',
    'completed',
    now() - interval '20 days',
    now() - interval '16 days'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000012',
    '注射加固空鼓区域',
    '按网格分区注入改性材料并记录回弹率。',
    'in_progress',
    now() - interval '14 days',
    now() - interval '1 day'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000013',
    '提交阶段复核报告',
    '汇总检测数据与施工日志。',
    'pending',
    now() - interval '5 days',
    now() - interval '5 days'
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000021',
    '完成病害类型统计',
    '按病害等级输出分层统计表。',
    'in_progress',
    now() - interval '8 days',
    now() - interval '2 days'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000022',
    '布设温湿度监测点',
    '在甬道与主室设置长期监测点位。',
    'pending',
    now() - interval '7 days',
    now() - interval '7 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 材料消耗
INSERT INTO material_records (
  id, project_id, name, quantity, unit, cost, created_at
) VALUES
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '改性环氧树脂', 12.5, 'kg', 4200, now() - interval '10 days'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '无纺布', 30, 'm2', 1800, now() - interval '9 days')
ON CONFLICT (id) DO NOTHING;

-- 修复方案
INSERT INTO restoration_plans (
  id, annotation_id, method, materials, expected_result, status, created_at, updated_at
) VALUES
  (
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '采用分区注射灌浆与表面微整固，先处理起甲边缘再回填空鼓层。',
    '改性环氧树脂、低粘度加固剂、矿物颜料',
    '起甲区域稳定，空鼓回弹率显著降低，色层连续性恢复。',
    'approved',
    now() - interval '14 days',
    now() - interval '11 days'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    '先做小样测试，再实施分层清洗与局部补色。',
    '中性清洗剂、纤维素棉签、矿物颜料',
    '污染层去除后不破坏原有彩绘边界。',
    'pending',
    now() - interval '6 days',
    now() - interval '2 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 方案审批（使用已有 reviewer 账号）
INSERT INTO plan_reviews (
  id, plan_id, reviewer_id, result, comment, created_at
)
SELECT
  '80000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  u.id,
  'approved',
  '方法可行，建议增加关键点位复测记录。',
  now() - interval '11 days'
FROM users u
WHERE u.role = 'reviewer'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- 方案状态变更
INSERT INTO plan_status_changes (
  id, plan_id, from_status, to_status, changed_at
) VALUES
  ('90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'draft', 'pending', now() - interval '13 days'),
  ('90000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'pending', 'approved', now() - interval '11 days'),
  ('90000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', 'draft', 'pending', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- 知识库文档
INSERT INTO knowledge_docs (
  id, title, content, category, created_at, updated_at
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    '北齐壁画加固流程（现场版）',
    E'# 北齐壁画加固流程\n\n1. 病害分级与网格建档\n2. 小样测试与参数确认\n3. 分区注射与表层整固\n4. 复测与回访记录',
    'standard_process',
    now() - interval '20 days',
    now() - interval '3 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    '修复材料兼容性清单',
    E'# 修复材料兼容性\n\n- 改性环氧树脂\n- 丙烯酸乳液\n- 无机矿物颜料\n\n> 使用前需做附着力与色差测试',
    'material_manual',
    now() - interval '16 days',
    now() - interval '4 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    '娄睿墓壁画保护案例复盘',
    E'# 案例复盘\n\n本案例记录了污染层去除、起甲边缘整固和复测流程。',
    'case_study',
    now() - interval '12 days',
    now() - interval '2 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    '文物保护工程数据留痕要求',
    E'# 数据留痕要求\n\n- 关键操作可追溯\n- 图像与日志双归档\n- 审批意见可审计',
    'regulation',
    now() - interval '9 days',
    now() - interval '1 day'
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    '壁画病害分级判定表（V1）',
    E'# 病害分级判定\n\n## 一级（轻微）\n- 可见表层污染，结构稳定\n\n## 二级（中等）\n- 局部起甲、细裂缝，需跟踪监测\n\n## 三级（较重）\n- 空鼓或剥落趋势明显，需制定加固方案\n\n## 四级（严重）\n- 连续裂隙或大面积脱落风险，需立即处置',
    'standard_process',
    now() - interval '18 days',
    now() - interval '2 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000006',
    '色层清洗剂配比与禁忌',
    E'# 清洗剂配比\n\n- 中性去离子水：乙醇 = 7:3（小样先行）\n- 凝胶载体停留时间建议 < 90 秒\n\n# 禁忌\n\n- 禁用强碱性溶液直接接触彩绘层\n- 禁止在未固化区域进行重复擦拭\n- 禁止跨病害区域复用棉签',
    'material_manual',
    now() - interval '15 days',
    now() - interval '2 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000007',
    '徐显秀墓南壁修复后监测记录摘编',
    E'# 监测摘编\n\n- 第 1 周：色差变化 < 1.0（DeltaE）\n- 第 4 周：空鼓回弹率稳定\n- 第 8 周：温湿度波动可控，未见新发裂隙\n\n结论：修复后状态稳定，建议转入季度巡检。',
    'case_study',
    now() - interval '13 days',
    now() - interval '1 day'
  ),
  (
    'a0000000-0000-0000-0000-000000000008',
    '文物修复影像命名与归档规范',
    E'# 命名规范\n\n`<壁画编号>_<区域>_<光谱类型>_<日期>_<版本>`\n\n示例：`MURAL-001_EAST_VISIBLE_20260320_V02`\n\n# 归档要求\n\n- 原始图、处理图、报告图分目录保存\n- 元数据需包含采集设备、操作者、时间戳\n- 同步写入审计日志与项目任务附件',
    'regulation',
    now() - interval '11 days',
    now() - interval '1 day'
  ),
  (
    'a0000000-0000-0000-0000-000000000009',
    '补色作业流程与复原边界控制',
    E'# 补色流程\n\n1. 映射缺损边界并二次复核\n2. 进行可逆材料小样调色\n3. 采用分层、低饱和度补色\n4. 记录每次补色范围与材料批次\n\n# 边界控制\n\n- 复原边界不得覆盖原始彩绘纹理\n- 距离原始边缘保留最小缓冲带',
    'standard_process',
    now() - interval '10 days',
    now() - interval '1 day'
  ),
  (
    'a0000000-0000-0000-0000-000000000010',
    '支护与微环境控制材料速查表',
    E'# 材料速查\n\n- 无酸衬纸：临时遮护与隔离\n- 微孔薄膜：湿度缓释\n- 硅胶干燥剂：小空间控湿\n- 轻质支护板：运输与转运防震\n\n建议：每次使用后登记批次、数量与回收情况。',
    'material_manual',
    now() - interval '8 days',
    now() - interval '1 day'
  ),
  (
    'a0000000-0000-0000-0000-000000000011',
    '湾漳大墓裂隙治理案例',
    E'# 裂隙治理案例\n\n问题：前室西壁出现贯通细裂缝。\n\n处置：\n- 建立裂隙宽度基线\n- 进行局部注浆与表层整固\n- 连续 6 周进行位移监测\n\n结果：裂隙扩展趋势得到抑制，未出现二次剥落。',
    'case_study',
    now() - interval '7 days',
    now() - interval '1 day'
  ),
  (
    'a0000000-0000-0000-0000-000000000012',
    '外包作业安全与审批清单',
    E'# 外包作业审批清单\n\n- 施工单位资质核验\n- 关键岗位人员实名登记\n- 现场风险告知与应急预案签署\n- 每日作业结束后影像与日志回传\n\n未经审批不得进入核心作业区。',
    'regulation',
    now() - interval '6 days',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 操作日志（优先绑定已有固定角色账号）
INSERT INTO audit_logs (
  id, user_id, action, target_type, target_id, details, ip_address, created_at
)
SELECT
  'b0000000-0000-0000-0000-000000000001',
  u.id,
  'create',
  'mural',
  '10000000-0000-0000-0000-000000000001',
  '{"note":"创建壁画档案"}'::jsonb,
  '10.0.0.11',
  now() - interval '7 days'
FROM users u
WHERE u.role = 'chief_restorer'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (
  id, user_id, action, target_type, target_id, details, ip_address, created_at
)
SELECT
  'b0000000-0000-0000-0000-000000000002',
  u.id,
  'update',
  'project',
  '20000000-0000-0000-0000-000000000001',
  '{"note":"更新项目进度"}'::jsonb,
  '10.0.0.12',
  now() - interval '6 days'
FROM users u
WHERE u.role = 'assistant'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (
  id, user_id, action, target_type, target_id, details, ip_address, created_at
)
SELECT
  'b0000000-0000-0000-0000-000000000003',
  u.id,
  'review',
  'plan',
  '70000000-0000-0000-0000-000000000001',
  '{"result":"approved"}'::jsonb,
  '10.0.0.21',
  now() - interval '5 days'
FROM users u
WHERE u.role = 'reviewer'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (
  id, user_id, action, target_type, target_id, details, ip_address, created_at
)
SELECT
  'b0000000-0000-0000-0000-000000000004',
  u.id,
  'export',
  'admin',
  'dataset',
  '{"scope":"murals,projects"}'::jsonb,
  '10.0.0.1',
  now() - interval '4 days'
FROM users u
WHERE u.role = 'admin'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO NOTHING;

COMMIT;
