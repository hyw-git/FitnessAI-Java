package com.fitnessai.service;

import com.fitnessai.model.*;
import com.fitnessai.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 用户服务类
 */
@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ExerciseRecordRepository exerciseRecordRepository;
    
    @Autowired
    private DailyStatsRepository dailyStatsRepository;
    
    /**
     * 获取或创建用户
     */
    public User getOrCreateUser(String userId) {
        return userRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User newUser = new User(userId);
                    return userRepository.save(newUser);
                });
    }
    
    /**
     * 更新用户资料
     */
    public User updateUserProfile(String userId, String name, Integer age, Integer height, Integer weight, String goal, String avatar) {
        User user = getOrCreateUser(userId);
        if (name != null) user.setName(name);
        if (age != null) user.setAge(age);
        if (height != null) user.setHeight(height);
        if (weight != null) user.setWeight(weight);
        if (goal != null) user.setGoal(goal);
        if (avatar != null) user.setAvatar(avatar);
        return userRepository.save(user);
    }
    
    /**
     * 保存运动记录
     * 过滤无效记录：count < 3 且 duration < 30 的记录不保存
     * @return 保存的记录，如果记录无效则返回null
     */
    public ExerciseRecord saveExerciseRecord(String userId, String exerciseType, int count, int duration, int score, double accuracy) {
        // 确保用户存在
        getOrCreateUser(userId);
        
        // 过滤无效记录：count < 3 且 duration < 30 的记录不保存到数据库
        if (count < 3 && duration < 30) {
            // 记录被过滤，不保存到数据库，返回null
            return null;
        }
        
        // 创建记录
        ExerciseRecord record = new ExerciseRecord(userId, exerciseType, count, duration);
        record.setScore(score);
        record.setAccuracy(accuracy);
        
        ExerciseRecord savedRecord = exerciseRecordRepository.save(record);
        
        // 更新每日统计
        updateDailyStats(userId, exerciseType, count, duration, accuracy);
        
        return savedRecord;
    }
    
    /**
     * 更新每日统计
     */
    private void updateDailyStats(String userId, String exerciseType, int count, int duration, double accuracy) {
        ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
        LocalDate today = LocalDate.now(beijingZone);
        
        DailyStats stats = dailyStatsRepository.findByUserIdAndStatDateAndExerciseType(userId, today, exerciseType)
                .orElseGet(() -> {
                    DailyStats newStats = new DailyStats(userId, exerciseType);
                    newStats.setStatDate(today);
                    return newStats;
                });
        
        stats.addRecord(count, duration, accuracy);
        
        // 计算并更新卡路里
        User user = getOrCreateUser(userId);
        int calories = calculateCalories(exerciseType, duration, user.getWeight());
        stats.setTotalCalories(stats.getTotalCalories() + calories);
        
        dailyStatsRepository.save(stats);
    }
    
    /**
     * 计算卡路里消耗
     * 使用MET (Metabolic Equivalent of Task) 值
     * 公式: Calories = MET × weight(kg) × duration(hours)
     */
    private int calculateCalories(String exerciseType, int durationSeconds, Integer weight) {
        if (weight == null || weight <= 0) {
            weight = 65; // 默认体重
        }
        
        // MET值定义（每小时的代谢当量）
        Map<String, Double> metValues = new HashMap<>();
        metValues.put("squat", 5.0);
        metValues.put("pushup", 8.0);
        metValues.put("plank", 3.0);
        metValues.put("jumping_jack", 8.0);
        
        Double met = metValues.getOrDefault(exerciseType.toLowerCase(), 5.0);
        double durationHours = durationSeconds / 3600.0;
        
        // 计算卡路里（四舍五入到整数）
        return (int) Math.round(met * weight * durationHours);
    }
    
    /**
     * 获取用户历史记录
     */
    public List<ExerciseRecord> getHistoryRecords(String userId) {
        return exerciseRecordRepository.findByUserIdOrderByRecordedAtDesc(userId);
    }
    
    /**
     * 获取筛选和排序后的历史记录
     */
    public List<ExerciseRecord> getFilteredHistoryRecords(
            String userId,
            String exerciseType,
            Integer minScore,
            Integer maxScore,
            Double minAccuracy,
            Double maxAccuracy,
            String sortBy) {
        
        // 先获取筛选后的记录
        List<ExerciseRecord> records = exerciseRecordRepository.findFiltered(
                userId,
                exerciseType,
                minScore,
                maxScore,
                minAccuracy,
                maxAccuracy
        );
        
        // 在内存中排序（使用 null-safe 比较器，避免 NullPointerException）
        if (sortBy == null || sortBy.isEmpty() || sortBy.equals("date")) {
            // 按日期降序，如果日期相同则按时间戳降序（最新的在前）
            records.sort((a, b) -> {
                LocalDate dateA = a.getRecordDate();
                LocalDate dateB = b.getRecordDate();
                LocalDateTime timeA = a.getRecordedAt();
                LocalDateTime timeB = b.getRecordedAt();
                
                // 处理 null 值
                if (dateA == null && dateB == null) {
                    // 如果日期都为null，按时间戳排序
                    if (timeA == null && timeB == null) return 0;
                    if (timeA == null) return 1;
                    if (timeB == null) return -1;
                    return timeB.compareTo(timeA);  // 降序
                }
                if (dateA == null) return 1;  // null 排在后面
                if (dateB == null) return -1;  // null 排在后面
                
                // 先按日期比较
                int dateCompare = dateB.compareTo(dateA);  // 降序
                if (dateCompare != 0) {
                    return dateCompare;
                }
                
                // 日期相同，按时间戳排序
                if (timeA == null && timeB == null) return 0;
                if (timeA == null) return 1;
                if (timeB == null) return -1;
                return timeB.compareTo(timeA);  // 降序
            });
        } else if (sortBy.equals("date_asc")) {
            // 按日期升序，如果日期相同则按时间戳升序
            records.sort((a, b) -> {
                LocalDate dateA = a.getRecordDate();
                LocalDate dateB = b.getRecordDate();
                LocalDateTime timeA = a.getRecordedAt();
                LocalDateTime timeB = b.getRecordedAt();
                
                // 处理 null 值
                if (dateA == null && dateB == null) {
                    // 如果日期都为null，按时间戳排序
                    if (timeA == null && timeB == null) return 0;
                    if (timeA == null) return 1;
                    if (timeB == null) return -1;
                    return timeA.compareTo(timeB);  // 升序
                }
                if (dateA == null) return 1;  // null 排在后面
                if (dateB == null) return -1;  // null 排在后面
                
                // 先按日期比较
                int dateCompare = dateA.compareTo(dateB);  // 升序
                if (dateCompare != 0) {
                    return dateCompare;
                }
                
                // 日期相同，按时间戳排序
                if (timeA == null && timeB == null) return 0;
                if (timeA == null) return 1;
                if (timeB == null) return -1;
                return timeA.compareTo(timeB);  // 升序
            });
        } else if (sortBy.equals("count")) {
            records.sort((a, b) -> Integer.compare(b.getCount(), a.getCount()));
        } else if (sortBy.equals("count_asc")) {
            records.sort((a, b) -> Integer.compare(a.getCount(), b.getCount()));
        } else if (sortBy.equals("duration")) {
            records.sort((a, b) -> Integer.compare(b.getDuration(), a.getDuration()));
        } else if (sortBy.equals("duration_asc")) {
            records.sort((a, b) -> Integer.compare(a.getDuration(), b.getDuration()));
        } else if (sortBy.equals("score")) {
            records.sort((a, b) -> Integer.compare(b.getScore() != null ? b.getScore() : 0, 
                                                   a.getScore() != null ? a.getScore() : 0));
        } else if (sortBy.equals("score_asc")) {
            records.sort((a, b) -> Integer.compare(a.getScore() != null ? a.getScore() : 0, 
                                                   b.getScore() != null ? b.getScore() : 0));
        } else if (sortBy.equals("accuracy")) {
            records.sort((a, b) -> Double.compare(b.getAccuracy() != null ? b.getAccuracy() : 0.0, 
                                                  a.getAccuracy() != null ? a.getAccuracy() : 0.0));
        } else if (sortBy.equals("accuracy_asc")) {
            records.sort((a, b) -> Double.compare(a.getAccuracy() != null ? a.getAccuracy() : 0.0, 
                                                  b.getAccuracy() != null ? b.getAccuracy() : 0.0));
        } else {
            // 默认按日期降序，如果日期相同则按时间戳降序（最新的在前）
            records.sort((a, b) -> {
                LocalDate dateA = a.getRecordDate();
                LocalDate dateB = b.getRecordDate();
                LocalDateTime timeA = a.getRecordedAt();
                LocalDateTime timeB = b.getRecordedAt();
                
                // 处理 null 值
                if (dateA == null && dateB == null) {
                    // 如果日期都为null，按时间戳排序
                    if (timeA == null && timeB == null) return 0;
                    if (timeA == null) return 1;
                    if (timeB == null) return -1;
                    return timeB.compareTo(timeA);  // 降序
                }
                if (dateA == null) return 1;  // null 排在后面
                if (dateB == null) return -1;  // null 排在后面
                
                // 先按日期比较
                int dateCompare = dateB.compareTo(dateA);  // 降序
                if (dateCompare != 0) {
                    return dateCompare;
                }
                
                // 日期相同，按时间戳排序
                if (timeA == null && timeB == null) return 0;
                if (timeA == null) return 1;
                if (timeB == null) return -1;
                return timeB.compareTo(timeA);  // 降序
            });
        }
        
        return records;
    }
    
    /**
     * 获取最近的记录
     */
    public List<ExerciseRecord> getRecentRecords(String userId) {
        return exerciseRecordRepository.findTop10ByUserIdOrderByRecordedAtDesc(userId);
    }
    
    /**
     * 获取今日某运动的总次数
     */
    public int getTodayCountByExercise(String userId, String exerciseType) {
        ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
        Integer count = exerciseRecordRepository.getTodayCountByExercise(userId, LocalDate.now(beijingZone), exerciseType);
        return count != null ? count : 0;
    }
    
    /**
     * 获取今日总次数
     */
    public int getTodayTotalCount(String userId) {
        ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
        Integer count = exerciseRecordRepository.getTodayTotalCount(userId, LocalDate.now(beijingZone));
        return count != null ? count : 0;
    }
    
    /**
     * 获取每日统计
     */
    public List<DailyStats> getDailyStats(String userId, LocalDate startDate, LocalDate endDate) {
        return dailyStatsRepository.findByUserIdAndStatDateBetweenOrderByStatDateDesc(userId, startDate, endDate);
    }
    
    /**
     * 获取今日统计
     */
    public List<DailyStats> getTodayStats(String userId) {
        ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
        return dailyStatsRepository.findByUserIdAndStatDate(userId, LocalDate.now(beijingZone));
    }
    
    /**
     * 统计无效记录数量
     * @param minCount 最小有效次数
     * @param minDuration 最小有效时长（秒）
     */
    public long countInvalidRecords(int minCount, int minDuration) {
        return exerciseRecordRepository.countInvalidRecords(minCount, minDuration);
    }
    
    /**
     * 清理无效记录
     * @param minCount 最小有效次数
     * @param minDuration 最小有效时长（秒）
     * @return 删除的记录数
     */
    public int cleanupInvalidRecords(int minCount, int minDuration) {
        return exerciseRecordRepository.deleteInvalidRecords(minCount, minDuration);
    }
    
    /**
     * 获取无效记录列表（用于预览）
     */
    public List<ExerciseRecord> getInvalidRecords(int minCount, int minDuration) {
        return exerciseRecordRepository.findInvalidRecords(minCount, minDuration);
    }
    
    /**
     * 获取仪表板数据
     * 包括：最近30天的进度、卡路里消耗、历史锻炼数据
     */
    public Map<String, Object> getDashboardData(String userId) {
        ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
        LocalDate endDate = LocalDate.now(beijingZone);
        LocalDate startDate = endDate.minusDays(29); // 最近30天
        
        // 获取用户信息
        User user = getOrCreateUser(userId);
        
        // 获取所有历史记录（最近30天）
        List<ExerciseRecord> allRecords = getHistoryRecords(userId);
        
        // 过滤最近30天的记录（过滤掉 recordDate 为 null 的记录，避免 NullPointerException）
        List<ExerciseRecord> recentRecords = allRecords.stream()
                .filter(r -> r.getRecordDate() != null)
                .filter(r -> !r.getRecordDate().isBefore(startDate) && !r.getRecordDate().isAfter(endDate))
                .collect(Collectors.toList());
        
        // 计算总卡路里（从最近30天记录计算，与每日数据保持一致）
        int totalCalories = recentRecords.stream()
                .mapToInt(r -> calculateCalories(r.getExerciseType(), r.getDuration(), user.getWeight()))
                .sum();
        
        // 计算总训练次数（最近30天）
        int totalSessions = recentRecords.size();
        
        // 计算总时长（分钟，最近30天）
        int totalDurationMinutes = recentRecords.stream()
                .mapToInt(ExerciseRecord::getDuration)
                .sum() / 60;
        
        // 按日期组织数据（用于图表）- 直接从ExerciseRecord计算，确保卡路里正确
        Map<LocalDate, Map<String, Object>> dailyDataMap = new LinkedHashMap<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toString());
            dayData.put("calories", 0);
            dayData.put("count", 0);
            dayData.put("duration", 0);
            dailyDataMap.put(date, dayData);
        }
        
        // 从ExerciseRecord填充每日数据（确保卡路里正确计算）
        // 注意：duration 统一转换为分钟，与 summary.total_duration_minutes 保持一致
        // 先累加秒数，最后统一转换为分钟，避免精度丢失
        for (ExerciseRecord record : recentRecords) {
            LocalDate date = record.getRecordDate();
            // 跳过 recordDate 为 null 的记录（虽然已过滤，但双重检查更安全）
            if (date == null || !dailyDataMap.containsKey(date)) {
                continue;
            }
            Map<String, Object> dayData = dailyDataMap.get(date);
            dayData.put("calories", ((Integer) dayData.get("calories")) + 
                    calculateCalories(record.getExerciseType(), record.getDuration(), user.getWeight()));
            dayData.put("count", ((Integer) dayData.get("count")) + record.getCount());
            // 累加秒数（先不转换，避免精度丢失）
            dayData.put("duration", ((Integer) dayData.get("duration")) + record.getDuration());
        }
        
        // 将每日数据的秒数统一转换为分钟
        for (Map<String, Object> dayData : dailyDataMap.values()) {
            int totalSeconds = (Integer) dayData.get("duration");
            dayData.put("duration", totalSeconds / 60);  // 转换为分钟
        }
        
        // 按运动类型统计（最近30天）
        // 注意：total_duration 统一转换为分钟，与 summary.total_duration_minutes 保持一致
        Map<String, Map<String, Object>> exerciseStats = new HashMap<>();
        for (ExerciseRecord record : recentRecords) {
            String exerciseType = record.getExerciseType();
            exerciseStats.putIfAbsent(exerciseType, new HashMap<>());
            Map<String, Object> stats = exerciseStats.get(exerciseType);
            stats.put("exercise_type", exerciseType);
            stats.put("total_count", ((Integer) stats.getOrDefault("total_count", 0)) + record.getCount());
            // 累加秒数（先不转换，避免精度丢失）
            stats.put("total_duration", ((Integer) stats.getOrDefault("total_duration", 0)) + record.getDuration());
            stats.put("total_calories", ((Integer) stats.getOrDefault("total_calories", 0)) + 
                    calculateCalories(exerciseType, record.getDuration(), user.getWeight()));
            stats.put("sessions", ((Integer) stats.getOrDefault("sessions", 0)) + 1);
        }
        
        // 将运动类型统计的秒数统一转换为分钟
        for (Map<String, Object> stats : exerciseStats.values()) {
            int totalSeconds = (Integer) stats.get("total_duration");
            stats.put("total_duration", totalSeconds / 60);  // 转换为分钟
        }
        
        // 构建返回数据
        Map<String, Object> dashboard = new HashMap<>();
        // 使用 HashMap 而不是 Map.of()，因为 Map.of() 不允许 null 值
        // 如果用户字段为 null，使用默认值避免 NullPointerException
        Map<String, Object> userData = new HashMap<>();
        userData.put("name", user.getName() != null ? user.getName() : "健身达人");
        userData.put("weight", user.getWeight() != null ? user.getWeight() : 65);
        userData.put("goal", user.getGoal() != null ? user.getGoal() : "减脂");
        dashboard.put("user", userData);
        dashboard.put("summary", Map.of(
                "total_calories", totalCalories,
                "total_sessions", totalSessions,
                "total_duration_minutes", totalDurationMinutes,
                "total_count", recentRecords.stream().mapToInt(ExerciseRecord::getCount).sum()
        ));
        dashboard.put("daily_data", new ArrayList<>(dailyDataMap.values()));
        dashboard.put("exercise_stats", new ArrayList<>(exerciseStats.values()));
        // 最近记录（最近30天，按日期倒序，最多10条）
        // 注意：duration 统一转换为分钟，与 summary.total_duration_minutes 保持一致
        // 使用 null-safe 排序，将 null 值排在最后
        dashboard.put("recent_records", recentRecords.stream()
                .sorted((a, b) -> {
                    LocalDate dateA = a.getRecordDate();
                    LocalDate dateB = b.getRecordDate();
                    if (dateA == null && dateB == null) return 0;
                    if (dateA == null) return 1;  // null 排在后面
                    if (dateB == null) return -1;  // null 排在后面
                    return dateB.compareTo(dateA);  // 倒序
                })
                .limit(10)
                .map(r -> {
                    // 使用 HashMap 而不是 Map.of()，因为需要处理可能的 null 值
                    Map<String, Object> recordMap = new HashMap<>();
                    recordMap.put("id", r.getId());
                    recordMap.put("exercise_type", r.getExerciseType());
                    recordMap.put("count", r.getCount());
                    // 返回秒数，前端自己格式化显示（分钟和秒）
                    recordMap.put("duration", r.getDuration() != null ? r.getDuration() : 0);
                    // 添加空值检查，避免 NullPointerException，使用方法开头定义的 beijingZone
                    recordMap.put("date", r.getRecordDate() != null ? r.getRecordDate().toString() : LocalDate.now(beijingZone).toString());
                    recordMap.put("calories", calculateCalories(r.getExerciseType(), r.getDuration(), user.getWeight()));
                    return recordMap;
                })
                .collect(Collectors.toList()));
        
        return dashboard;
    }
}
