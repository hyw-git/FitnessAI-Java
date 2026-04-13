package com.fitnessai.analyzer;

import com.fitnessai.model.PoseLandmark;
import com.fitnessai.dto.PoseAnalysisResponse;
import com.fitnessai.model.ExerciseType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * 姿势分析器基类
 *
 * 提供基础的姿势分析功能和工具方法
 */
public abstract class PoseAnalyzer {

    protected static final Logger logger = LoggerFactory.getLogger(PoseAnalyzer.class);

    // 配置参数
    protected static final double MIN_DETECTION_CONFIDENCE = 0.5;
    protected static final int MIN_STABLE_FRAMES = 3;
    protected static final int COOLDOWN_FRAMES = 10;

    // 状态跟踪变量
    protected int stateChangedFrames = 0;
    protected int cooldownCounter = 0;
    protected String lastState = "";

    /**
     * 分析姿势
     *
     * @param landmarks MediaPipe姿态关键点
     * @return 分析结果
     */
    public abstract PoseAnalysisResponse analyze(List<PoseLandmark> landmarks);

    /**
     * 获取运动类型
     *
     * @return 运动类型
     */
    public abstract ExerciseType getExerciseType();

    /**
     * 重置分析器状态
     */
    public void reset() {
        stateChangedFrames = 0;
        cooldownCounter = 0;
        lastState = "";
        logger.info("✅ 重置分析器状态: {}", getExerciseType());
    }

    /**
     * 检查关键点是否可见
     *
     * @param landmarks 姿态关键点
     * @param requiredLandmarks 需要检查的关键点索引
     * @return 是否可见
     */
    protected boolean isPoseVisible(List<PoseLandmark> landmarks, int[] requiredLandmarks) {
        if (landmarks == null || landmarks.size() < 33) {
            return false;
        }

        if (requiredLandmarks == null) {
            // 默认检查上半身关键点
            requiredLandmarks = new int[]{11, 12, 13, 14}; // 左肩, 右肩, 左肘, 右肘
        }

        for (int idx : requiredLandmarks) {
            if (idx >= landmarks.size() || !landmarks.get(idx).isVisible(MIN_DETECTION_CONFIDENCE)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 计算三个点形成的角度
     *
     * @param a 点A
     * @param b 点B（顶点）
     * @param c 点C
     * @return 角度（度）
     */
    protected double calculateAngle(PoseLandmark a, PoseLandmark b, PoseLandmark c) {
        if (a == null || b == null || c == null) {
            return 180.0;
        }

        // 计算向量
        double baX = a.getX() - b.getX();
        double baY = a.getY() - b.getY();
        double bcX = c.getX() - b.getX();
        double bcY = c.getY() - b.getY();

        // 计算点积
        double dotProduct = baX * bcX + baY * bcY;

        // 计算向量长度
        double baLength = Math.sqrt(baX * baX + baY * baY);
        double bcLength = Math.sqrt(bcX * bcX + bcY * bcY);

        // 计算夹角（弧度）
        try {
            double cosAngle = dotProduct / (baLength * bcLength);
            // 防止浮点数计算导致的越界
            cosAngle = Math.max(Math.min(cosAngle, 1.0), -1.0);
            double angleRad = Math.acos(cosAngle);

            // 转换为角度
            return Math.toDegrees(angleRad);
        } catch (Exception e) {
            return 180.0; // 如果计算出错，返回180度
        }
    }

    /**
     * 计算两点之间的距离
     *
     * @param a 点A
     * @param b 点B
     * @return 距离
     */
    protected double calculateDistance(PoseLandmark a, PoseLandmark b) {
        if (a == null || b == null) {
            return 0.0;
        }

        double dx = a.getX() - b.getX();
        double dy = a.getY() - b.getY();
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 创建错误响应
     *
     * @param error 错误信息
     * @param exerciseType 运动类型
     * @return 错误响应
     */
    protected PoseAnalysisResponse createErrorResponse(String error, ExerciseType exerciseType) {
        logger.warn("❌ 姿势分析错误: {}", error);
        return PoseAnalysisResponse.error(error, false, 0, "分析失败，请重试", 0);
    }

    /**
     * 创建错误响应（带基本反馈）
     *
     * @param feedback 反馈信息
     * @param exerciseType 运动类型
     * @return 错误响应
     */
    protected PoseAnalysisResponse createBasicErrorResponse(String feedback, ExerciseType exerciseType) {
        return PoseAnalysisResponse.error(feedback, false, 0, feedback, 0);
    }

    /**
     * 更新冷却计数器
     */
    protected void updateCooldown() {
        if (cooldownCounter > 0) {
            cooldownCounter--;
        }
    }

    /**
     * 检查是否在冷却期
     *
     * @return 是否在冷却期
     */
    protected boolean isCooldownActive() {
        return cooldownCounter > 0;
    }

    /**
     * 启动冷却
     */
    protected void startCooldown() {
        cooldownCounter = COOLDOWN_FRAMES;
        logger.debug("🕒 启动冷却期: {} 帧", COOLDOWN_FRAMES);
    }

    /**
     * 计算基础准确率
     *
     * @param totalCount 总次数
     * @param correctCount 正确次数
     * @return 准确率（0-1）
     */
    protected double calculateAccuracy(int totalCount, int correctCount) {
        if (totalCount == 0) return 0.0;
        return Math.min(1.0, (double) correctCount / totalCount);
    }
}