package com.fitnessai.dto;

import com.fitnessai.model.ExerciseType;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 姿势分析响应DTO
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PoseAnalysisResponse {

    @JsonProperty("is_correct")
    private boolean isCorrect;

    private int score;

    private String feedback;

    private int count;

    @JsonProperty("exercise_type")
    private ExerciseType exerciseType;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    private double accuracy;

    private String error;

    @JsonProperty("duration") // 用于平板支撑等时间相关的运动
    private Double duration;

    @JsonProperty("details")
    private Map<String, Object> details;

    // 成功响应构造函数
    public PoseAnalysisResponse(boolean isCorrect, int score, String feedback, int count,
                               ExerciseType exerciseType, double accuracy) {
        this.isCorrect = isCorrect;
        this.score = Math.max(0, Math.min(100, score));
        this.feedback = feedback;
        this.count = Math.max(0, count);
        this.exerciseType = exerciseType;
        this.timestamp = LocalDateTime.now();
        this.accuracy = Math.max(0.0, Math.min(1.0, accuracy));
    }

    // 错误响应构造函数
    public PoseAnalysisResponse(String error, boolean isCorrect, int score, String feedback, int count) {
        this.error = error;
        this.isCorrect = isCorrect;
        this.score = score;
        this.feedback = feedback;
        this.count = count;
        this.timestamp = LocalDateTime.now();
        this.accuracy = 0.0;
    }

    // 默认构造函数
    public PoseAnalysisResponse() {}

    // Getters and Setters
    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = Math.max(0, Math.min(100, score));
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = Math.max(0, count);
    }

    public ExerciseType getExerciseType() {
        return exerciseType;
    }

    public void setExerciseType(ExerciseType exerciseType) {
        this.exerciseType = exerciseType;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = Math.max(0.0, Math.min(1.0, accuracy));
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Double getDuration() {
        return duration;
    }

    public void setDuration(Double duration) {
        this.duration = duration;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }

    /**
     * 创建成功响应
     */
    public static PoseAnalysisResponse success(boolean isCorrect, int score, String feedback,
                                              int count, ExerciseType exerciseType, double accuracy) {
        return new PoseAnalysisResponse(isCorrect, score, feedback, count, exerciseType, accuracy);
    }

    /**
     * 创建错误响应
     */
    public static PoseAnalysisResponse error(String error) {
        return new PoseAnalysisResponse(error, false, 0, "分析失败，请重试", 0);
    }

    /**
     * 创建错误响应（带详细信息）
     */
    public static PoseAnalysisResponse error(String error, boolean isCorrect, int score,
                                           String feedback, int count) {
        return new PoseAnalysisResponse(error, isCorrect, score, feedback, count);
    }

    @Override
    public String toString() {
        return String.format("PoseAnalysisResponse{isCorrect=%s, score=%d, feedback='%s', " +
                           "count=%d, exerciseType=%s, timestamp=%s, accuracy=%.2f, error='%s'}",
                           isCorrect, score, feedback, count, exerciseType, timestamp, accuracy, error);
    }
}