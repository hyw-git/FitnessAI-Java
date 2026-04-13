package com.fitnessai.controller;

import com.fitnessai.model.*;
import com.fitnessai.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 用户API控制器
 */
@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    @Autowired
    private UserService userService;
    
    /**
     * 获取用户资料
     */
    @GetMapping("/{userId}/profile")
    public ResponseEntity<?> getUserProfile(@PathVariable String userId) {
        logger.info("📋 获取用户资料: {}", userId);
        try {
            User user = userService.getOrCreateUser(userId);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("❌ 获取用户资料失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 更新用户资料
     */
    @PutMapping("/{userId}/profile")
    public ResponseEntity<?> updateUserProfile(@PathVariable String userId, @RequestBody Map<String, Object> data) {
        logger.info("📝 更新用户资料: {}", userId);
        try {
            User user = userService.updateUserProfile(
                userId,
                (String) data.get("name"),
                data.get("age") != null ? ((Number) data.get("age")).intValue() : null,
                data.get("height") != null ? ((Number) data.get("height")).intValue() : null,
                data.get("weight") != null ? ((Number) data.get("weight")).intValue() : null,
                (String) data.get("goal"),
                (String) data.get("avatar")
            );
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("❌ 更新用户资料失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 保存运动记录
     * 注意：无效记录（count < 3 且 duration < 30）会被过滤，不保存到数据库
     */
    @PostMapping("/{userId}/records")
    public ResponseEntity<?> saveExerciseRecord(@PathVariable String userId, @RequestBody Map<String, Object> data) {
        logger.info("💪 保存运动记录: {}", userId);
        try {
            String exerciseType = (String) data.get("exercise_type");
            int count = ((Number) data.getOrDefault("count", 0)).intValue();
            int duration = ((Number) data.getOrDefault("duration", 0)).intValue();
            int score = ((Number) data.getOrDefault("score", 0)).intValue();
            double accuracy = ((Number) data.getOrDefault("accuracy", 0.0)).doubleValue();
            
            ExerciseRecord record = userService.saveExerciseRecord(userId, exerciseType, count, duration, score, accuracy);
            
            // 如果记录被过滤（无效记录），返回204 No Content
            if (record == null) {
                logger.info("⏭️ 记录被过滤（无效记录：count={}, duration={}）", count, duration);
                return ResponseEntity.noContent().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", record.getId());
            response.put("exercise_type", record.getExerciseType());
            response.put("count", record.getCount());
            // 返回秒数，前端自己格式化显示（分钟和秒）
            response.put("duration", record.getDuration() != null ? record.getDuration() : 0);
            response.put("score", record.getScore());
            response.put("accuracy", record.getAccuracy());
            // 添加空值检查，避免 NullPointerException，使用北京时间
            ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
            response.put("date", record.getRecordDate() != null ? record.getRecordDate().toString() : LocalDate.now(beijingZone).toString());
            response.put("recorded_at", record.getRecordedAt() != null ? record.getRecordedAt().toString() : LocalDateTime.now(beijingZone).toString());  // 添加 recorded_at 字段，与前端接口一致
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ 保存运动记录失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 获取历史记录（支持筛选和排序）
     */
    @GetMapping("/{userId}/records")
    public ResponseEntity<?> getHistoryRecords(
            @PathVariable String userId,
            @RequestParam(required = false) String exerciseType,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) Integer maxScore,
            @RequestParam(required = false) Double minAccuracy,
            @RequestParam(required = false) Double maxAccuracy,
            @RequestParam(required = false, defaultValue = "date") String sortBy) {
        logger.info("📊 获取历史记录: {}, 筛选: exerciseType={}, sortBy={}", userId, exerciseType, sortBy);
        try {
            List<ExerciseRecord> records = userService.getFilteredHistoryRecords(
                    userId, exerciseType,
                    minScore, maxScore, minAccuracy, maxAccuracy, sortBy
            );
            
            // 转换为前端友好的格式
            // 返回秒数，前端自己格式化显示（分钟和秒）
            List<Map<String, Object>> result = records.stream().map(r -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", r.getId());
                map.put("exercise_type", r.getExerciseType());
                map.put("count", r.getCount());
                // 返回秒数，前端自己格式化显示
                map.put("duration", r.getDuration() != null ? r.getDuration() : 0);
                map.put("score", r.getScore());
                map.put("accuracy", r.getAccuracy());
                // 添加空值检查，避免 NullPointerException，使用北京时间
                ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
                map.put("date", r.getRecordDate() != null ? r.getRecordDate().toString() : LocalDate.now(beijingZone).toString());
                map.put("recorded_at", r.getRecordedAt() != null ? r.getRecordedAt().toString() : LocalDateTime.now(beijingZone).toString());
                return map;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("❌ 获取历史记录失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 获取今日统计
     */
    @GetMapping("/{userId}/stats/today")
    public ResponseEntity<?> getTodayStats(@PathVariable String userId) {
        logger.info("📈 获取今日统计: {}", userId);
        try {
            List<DailyStats> stats = userService.getTodayStats(userId);
            int totalCount = userService.getTodayTotalCount(userId);
            
            ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
            Map<String, Object> response = new HashMap<>();
            response.put("date", LocalDate.now(beijingZone).toString());
            response.put("total_count", totalCount);
            response.put("by_exercise", stats.stream().map(s -> {
                Map<String, Object> map = new HashMap<>();
                map.put("exercise_type", s.getExerciseType());
                map.put("count", s.getTotalCount());
                map.put("duration", s.getTotalDuration());
                map.put("sessions", s.getSessionsCount());
                map.put("avg_accuracy", s.getAvgAccuracy());
                return map;
            }).collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ 获取今日统计失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 获取特定运动今日次数
     */
    @GetMapping("/{userId}/stats/today/{exerciseType}")
    public ResponseEntity<?> getTodayExerciseCount(@PathVariable String userId, @PathVariable String exerciseType) {
        logger.info("📈 获取今日 {} 次数: {}", exerciseType, userId);
        try {
            int count = userService.getTodayCountByExercise(userId, exerciseType);
            ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
            return ResponseEntity.ok(Map.of(
                "exercise_type", exerciseType,
                "count", count,
                "date", LocalDate.now(beijingZone).toString()
            ));
        } catch (Exception e) {
            logger.error("❌ 获取今日运动次数失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 预览无效记录（不删除）
     * 条件：count < 3 且 duration < 30
     */
    @GetMapping("/admin/cleanup/preview")
    public ResponseEntity<?> previewInvalidRecords(
            @RequestParam(defaultValue = "3") int minCount,
            @RequestParam(defaultValue = "30") int minDuration) {
        logger.info("🔍 预览无效记录 - 最小次数: {}, 最小时长: {}秒", minCount, minDuration);
        try {
            List<ExerciseRecord> invalidRecords = userService.getInvalidRecords(minCount, minDuration);
            long count = userService.countInvalidRecords(minCount, minDuration);
            
            List<Map<String, Object>> recordList = invalidRecords.stream().map(r -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", r.getId());
                map.put("user_id", r.getUserId());
                map.put("exercise_type", r.getExerciseType());
                map.put("count", r.getCount());
                map.put("duration", r.getDuration());
                map.put("score", r.getScore());
                // 添加空值检查，避免 NullPointerException，使用北京时间
                ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
                map.put("date", r.getRecordDate() != null ? r.getRecordDate().toString() : LocalDate.now(beijingZone).toString());
                return map;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "total_invalid_records", count,
                "min_count_threshold", minCount,
                "min_duration_threshold", minDuration,
                "records", recordList
            ));
        } catch (Exception e) {
            logger.error("❌ 预览无效记录失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 执行清理无效记录
     * 条件：count < 3 且 duration < 30
     */
    @DeleteMapping("/admin/cleanup")
    public ResponseEntity<?> cleanupInvalidRecords(
            @RequestParam(defaultValue = "3") int minCount,
            @RequestParam(defaultValue = "30") int minDuration) {
        logger.info("🧹 清理无效记录 - 最小次数: {}, 最小时长: {}秒", minCount, minDuration);
        try {
            // 先统计要删除的数量
            long countBefore = userService.countInvalidRecords(minCount, minDuration);
            
            // 执行删除
            int deletedCount = userService.cleanupInvalidRecords(minCount, minDuration);
            
            logger.info("✅ 成功清理 {} 条无效记录", deletedCount);
            
            return ResponseEntity.ok(Map.of(
                "deleted_count", deletedCount,
                "min_count_threshold", minCount,
                "min_duration_threshold", minDuration,
                "message", String.format("成功清理 %d 条无效记录", deletedCount)
            ));
        } catch (Exception e) {
            logger.error("❌ 清理无效记录失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 获取仪表板数据
     * 包括：进度、卡路里消耗、历史锻炼数据
     */
    @GetMapping("/{userId}/dashboard")
    public ResponseEntity<?> getDashboard(@PathVariable String userId) {
        logger.info("📊 获取仪表板数据: {}", userId);
        try {
            Map<String, Object> dashboard = userService.getDashboardData(userId);
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            logger.error("❌ 获取仪表板数据失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
