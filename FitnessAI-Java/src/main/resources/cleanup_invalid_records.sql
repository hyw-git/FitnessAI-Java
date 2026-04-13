-- ==========================================
-- 清理无效运动记录脚本
-- 执行条件：count < 3 且 duration < 30
-- ==========================================

-- 1. 首先查看有多少无效记录（预览）
SELECT 
    id, 
    user_id, 
    exercise_type, 
    count, 
    duration, 
    score,
    record_date
FROM exercise_records 
WHERE count < 3 AND duration < 30
ORDER BY record_date DESC;

-- 2. 统计无效记录数量
SELECT 
    COUNT(*) as invalid_count,
    SUM(count) as total_invalid_exercises
FROM exercise_records 
WHERE count < 3 AND duration < 30;

-- 3. 删除无效的运动记录
-- 警告：执行前请确保已备份数据！
DELETE FROM exercise_records 
WHERE count < 3 AND duration < 30;

-- 4. 清理孤立的 training_sessions（没有关联记录的会话）
-- 首先查看孤立的会话
SELECT 
    ts.session_id,
    ts.user_id,
    ts.exercise_type,
    ts.total_count,
    ts.start_time,
    ts.status
FROM training_sessions ts
LEFT JOIN exercise_records er ON ts.session_id = er.session_id
WHERE er.id IS NULL
  AND ts.total_count < 3
  AND TIMESTAMPDIFF(SECOND, ts.start_time, COALESCE(ts.end_time, NOW())) < 30;

-- 5. 删除无效的 training_sessions
DELETE FROM training_sessions 
WHERE session_id IN (
    SELECT session_id FROM (
        SELECT ts.session_id
        FROM training_sessions ts
        LEFT JOIN exercise_records er ON ts.session_id = er.session_id
        WHERE er.id IS NULL
          AND ts.total_count < 3
          AND TIMESTAMPDIFF(SECOND, ts.start_time, COALESCE(ts.end_time, NOW())) < 30
    ) AS temp
);

-- 6. 清理 daily_stats 中没有意义的记录（可选）
-- 保留统计，但标记为已清理
-- UPDATE daily_stats SET is_cleaned = true WHERE total_count < 3;

-- 7. 验证清理结果
SELECT 
    'exercise_records' as table_name,
    COUNT(*) as remaining_records
FROM exercise_records
UNION ALL
SELECT 
    'training_sessions' as table_name,
    COUNT(*) as remaining_records
FROM training_sessions;
