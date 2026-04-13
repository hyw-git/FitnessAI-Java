package com.fitnessai.dto;

import com.fitnessai.model.ExerciseType;
import com.fitnessai.model.PoseLandmark;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * 姿势分析请求DTO
 */
public class PoseAnalysisRequest {

    @JsonProperty("pose_landmarks")
    private List<PoseLandmark> poseLandmarks;

    @JsonProperty("exercise_type")
    private ExerciseType exerciseType;

    @JsonProperty("session_id")
    private String sessionId;

    // 默认构造函数
    public PoseAnalysisRequest() {}

    // 完整构造函数
    public PoseAnalysisRequest(List<PoseLandmark> poseLandmarks, ExerciseType exerciseType, String sessionId) {
        this.poseLandmarks = poseLandmarks;
        this.exerciseType = exerciseType != null ? exerciseType : ExerciseType.SQUAT;
        this.sessionId = sessionId;
    }

    // Getters and Setters
    public List<PoseLandmark> getPoseLandmarks() {
        return poseLandmarks;
    }

    public void setPoseLandmarks(List<PoseLandmark> poseLandmarks) {
        this.poseLandmarks = poseLandmarks;
    }

    public ExerciseType getExerciseType() {
        return exerciseType;
    }

    public void setExerciseType(ExerciseType exerciseType) {
        this.exerciseType = exerciseType != null ? exerciseType : ExerciseType.SQUAT;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    /**
     * 验证请求参数
     */
    public boolean isValid() {
        return poseLandmarks != null && !poseLandmarks.isEmpty() &&
               poseLandmarks.size() >= 33 && // MediaPipe Pose有33个关键点
               exerciseType != null;
    }

    @Override
    public String toString() {
        return String.format("PoseAnalysisRequest{exerciseType=%s, sessionId='%s', " +
                           "poseLandmarksCount=%d}",
                           exerciseType, sessionId,
                           poseLandmarks != null ? poseLandmarks.size() : 0);
    }
}