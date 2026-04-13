package com.fitnessai.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * MediaPipe姿势关键点数据模型
 *
 * 对应MediaPipe Pose识别的33个身体关键点
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PoseLandmark {
    private double x;
    private double y;
    private double z;
    private double visibility = 1.0;

    // 默认构造函数
    public PoseLandmark() {}

    // 完整构造函数
    public PoseLandmark(double x, double y, double z, double visibility) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.visibility = visibility;
    }

    // Getters and Setters
    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }

    public double getZ() {
        return z;
    }

    public void setZ(double z) {
        this.z = z;
    }

    public double getVisibility() {
        return visibility;
    }

    public void setVisibility(double visibility) {
        this.visibility = Math.max(0.0, Math.min(1.0, visibility));
    }

    /**
     * 检查关键点是否可见
     *
     * @param minConfidence 最小置信度阈值
     * @return 是否可见
     */
    public boolean isVisible(double minConfidence) {
        return visibility >= minConfidence;
    }

    @Override
    public String toString() {
        return String.format("PoseLandmark{x=%.3f, y=%.3f, z=%.3f, visibility=%.3f}",
                           x, y, z, visibility);
    }
}