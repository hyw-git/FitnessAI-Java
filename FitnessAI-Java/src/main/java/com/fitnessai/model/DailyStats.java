package com.fitnessai.model;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * 每日统计实体类
 */
@Entity
@Table(name = "daily_stats", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "stat_date", "exercise_type"})
})
public class DailyStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;
    
    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate = LocalDate.now();
    
    @Column(name = "exercise_type", nullable = false, length = 50)
    private String exerciseType;
    
    @Column(name = "total_count")
    private Integer totalCount = 0;
    
    @Column(name = "total_duration")
    private Integer totalDuration = 0;  // 秒
    
    @Column(name = "total_calories")
    private Integer totalCalories = 0;
    
    @Column(name = "avg_accuracy")
    private Double avgAccuracy = 0.0;
    
    @Column(name = "sessions_count")
    private Integer sessionsCount = 0;
    
    // Constructors
    public DailyStats() {}
    
    public DailyStats(String userId, String exerciseType) {
        this.userId = userId;
        this.exerciseType = exerciseType;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public LocalDate getStatDate() { return statDate; }
    public void setStatDate(LocalDate statDate) { this.statDate = statDate; }
    
    public String getExerciseType() { return exerciseType; }
    public void setExerciseType(String exerciseType) { this.exerciseType = exerciseType; }
    
    public Integer getTotalCount() { return totalCount; }
    public void setTotalCount(Integer totalCount) { this.totalCount = totalCount; }
    
    public Integer getTotalDuration() { return totalDuration; }
    public void setTotalDuration(Integer totalDuration) { this.totalDuration = totalDuration; }
    
    public Integer getTotalCalories() { return totalCalories; }
    public void setTotalCalories(Integer totalCalories) { this.totalCalories = totalCalories; }
    
    public Double getAvgAccuracy() { return avgAccuracy; }
    public void setAvgAccuracy(Double avgAccuracy) { this.avgAccuracy = avgAccuracy; }
    
    public Integer getSessionsCount() { return sessionsCount; }
    public void setSessionsCount(Integer sessionsCount) { this.sessionsCount = sessionsCount; }
    
    // 累加统计
    public void addRecord(int count, int duration, double accuracy) {
        this.totalCount += count;
        this.totalDuration += duration;
        this.sessionsCount++;
        // 计算新的平均准确率
        this.avgAccuracy = (this.avgAccuracy * (this.sessionsCount - 1) + accuracy) / this.sessionsCount;
    }
}
