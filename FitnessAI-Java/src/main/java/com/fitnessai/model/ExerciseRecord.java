package com.fitnessai.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * 运动记录实体类
 */
@Entity
@Table(name = "exercise_records")
public class ExerciseRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;
    
    @Column(name = "exercise_type", nullable = false, length = 50)
    private String exerciseType;  // squat/pushup/plank/jumping_jack
    
    @Column(nullable = false)
    private Integer count = 0;
    
    @Column(nullable = false)
    private Integer duration = 0;  // 秒
    
    private Integer score = 0;
    
    private Double accuracy = 0.0;
    
    @Column(name = "is_correct")
    private Boolean correct = false;
    
    private String feedback;
    
    @Column(name = "record_date")
    private LocalDate recordDate;
    
    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;
    
    // Constructors
    public ExerciseRecord() {}
    
    public ExerciseRecord(String userId, String exerciseType, Integer count, Integer duration) {
        this.userId = userId;
        this.exerciseType = exerciseType;
        this.count = count;
        this.duration = duration;
    }
    
    /**
     * JPA 持久化前回调
     * 在保存到数据库之前设置时间戳，确保时间戳准确反映持久化时间
     * 使用北京时间 (UTC+8)
     */
    @PrePersist
    protected void onCreate() {
        ZoneId beijingZone = ZoneId.of("Asia/Shanghai");
        if (recordDate == null) {
            recordDate = LocalDate.now(beijingZone);
        }
        if (recordedAt == null) {
            recordedAt = LocalDateTime.now(beijingZone);
        }
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getExerciseType() { return exerciseType; }
    public void setExerciseType(String exerciseType) { this.exerciseType = exerciseType; }
    
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
    
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    
    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }
    
    public Boolean isCorrect() { return correct; }
    public Boolean getCorrect() { return correct; }
    public void setCorrect(Boolean correct) { this.correct = correct; }
    
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    
    public LocalDate getRecordDate() { return recordDate; }
    public void setRecordDate(LocalDate recordDate) { this.recordDate = recordDate; }
    
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}