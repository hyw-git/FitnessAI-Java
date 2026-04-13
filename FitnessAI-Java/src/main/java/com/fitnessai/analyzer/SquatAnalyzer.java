package com.fitnessai.analyzer;

import com.fitnessai.model.PoseLandmark;
import com.fitnessai.dto.PoseAnalysisResponse;
import com.fitnessai.model.ExerciseType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 深蹲动作分析器
 *
 * 基于膝盖角度检测深蹲动作并进行计数
 */
public class SquatAnalyzer extends PoseAnalyzer {

    // 深蹲特定参数
    private static final double ANGLE_THRESHOLD = 140.0;    // 下蹲角度阈值
    private static final double STANDING_THRESHOLD = 140.0; // 站立角度阈值
    private static final int REQUIRED_FRAMES = 2;            // 确认状态所需帧数

    // 状态变量
    private int squatCount = 0;
    private boolean inSquatPosition = false;
    private int consecutiveUpFrames = 0;
    private int consecutiveDownFrames = 0;

    public SquatAnalyzer() {
        super();
        logger.info("🏋️‍♀️ 初始化深蹲分析器");
    }

    @Override
    public ExerciseType getExerciseType() {
        return ExerciseType.SQUAT;
    }

    @Override
    public PoseAnalysisResponse analyze(List<PoseLandmark> landmarks) {
        if (!isPoseVisible(landmarks, new int[]{23, 24, 25, 26})) { // 髋部和膝盖
            return createBasicErrorResponse("请确保下半身在摄像头范围内", ExerciseType.SQUAT);
        }

        try {
            // 计算膝盖角度
            double kneeAngle = calculateKneeAngle(landmarks);

            // 确定当前状态
            String currentState = detectSquatState(kneeAngle);

            // 更新连续帧计数
            updateFrameCounters(currentState);

            // 确认状态
            String confirmedState = confirmState();

            // 更新计数
            boolean countUpdated = updateCount(confirmedState);

            // 生成反馈
            String feedback = generateFeedback(confirmedState);

            // 计算得分
            int score = calculateScore(confirmedState, kneeAngle);

            // 计算准确率
            double accuracy = calculateAccuracy(squatCount + (countUpdated ? 1 : 0), squatCount);

            // 创建响应
            PoseAnalysisResponse response = PoseAnalysisResponse.success(
                true, (int)score, feedback, squatCount, ExerciseType.SQUAT, accuracy
            );

            // 添加详细信息
            Map<String, Object> details = new HashMap<>();
            details.put("knee_angle", Math.round(kneeAngle * 10.0) / 10.0);
            details.put("state", confirmedState);
            details.put("cooldown", cooldownCounter);
            response.setDetails(details);

            logger.debug("深蹲分析 - 角度: {:.1f}, 状态: {}, 计数: {}, 反馈: {}",
                        kneeAngle, confirmedState, squatCount, feedback);

            return response;

        } catch (Exception e) {
            logger.error("深蹲分析错误: {}", e.getMessage(), e);
            return createErrorResponse("分析失败: " + e.getMessage(), ExerciseType.SQUAT);
        }
    }

    @Override
    public void reset() {
        super.reset();
        squatCount = 0;
        inSquatPosition = false;
        consecutiveUpFrames = 0;
        consecutiveDownFrames = 0;
        logger.info("🔄 重置深蹲分析器 - 计数: {}", squatCount);
    }

    /**
     * 计算膝盖角度
     */
    private double calculateKneeAngle(List<PoseLandmark> landmarks) {
        // 使用可见性更好的一侧
        double leftVisibility = landmarks.get(23).getVisibility() + landmarks.get(25).getVisibility() + landmarks.get(27).getVisibility();
        double rightVisibility = landmarks.get(24).getVisibility() + landmarks.get(26).getVisibility() + landmarks.get(28).getVisibility();

        if (leftVisibility > rightVisibility) {
            // 使用左侧
            return calculateAngle(landmarks.get(23), landmarks.get(25), landmarks.get(27));
        } else {
            // 使用右侧
            return calculateAngle(landmarks.get(24), landmarks.get(26), landmarks.get(28));
        }
    }

    /**
     * 检测深蹲状态
     */
    private String detectSquatState(double kneeAngle) {
        if (kneeAngle < ANGLE_THRESHOLD) {
            return "down";
        } else if (kneeAngle > STANDING_THRESHOLD) {
            return "up";
        } else {
            // 在过渡区域，保持上一个状态，防止抖动
            return lastState;
        }
    }

    /**
     * 更新帧计数器
     */
    private void updateFrameCounters(String currentState) {
        if (currentState.equals("up")) {
            consecutiveUpFrames++;
            consecutiveDownFrames = 0;
        } else if (currentState.equals("down")) {
            consecutiveDownFrames++;
            consecutiveUpFrames = 0;
        }
    }

    /**
     * 确认状态
     */
    private String confirmState() {
        if (consecutiveUpFrames >= REQUIRED_FRAMES) {
            return "up";
        } else if (consecutiveDownFrames >= REQUIRED_FRAMES) {
            return "down";
        }
        return lastState;
    }

    /**
     * 更新计数
     */
    private boolean updateCount(String currentState) {
        updateCooldown();

        if (currentState != lastState) {
            if (stateChangedFrames >= REQUIRED_FRAMES) {
                if (!lastState.equals("down") && currentState.equals("down") && !isCooldownActive()) {
                    inSquatPosition = true;
                    logger.debug("👇 检测到下蹲");
                } else if (lastState.equals("down") && currentState.equals("up") && inSquatPosition) {
                    if (!isCooldownActive()) {
                        squatCount++;
                        startCooldown();
                        logger.info("✅ 深蹲计数增加: {}", squatCount);
                        return true;
                    }
                    inSquatPosition = false;
                }
                stateChangedFrames = 0;
            } else {
                logger.debug("🔄 深蹲状态变化不稳定: {} -> {}", lastState, currentState);
            }
        } else {
            stateChangedFrames++;
        }

        lastState = currentState;
        return false;
    }

    /**
     * 生成反馈
     */
    private String generateFeedback(String confirmedState) {
        if (confirmedState.equals("down")) {
            return "很好！下蹲姿势正确，请站起来完成动作";
        } else {
            return "站立姿势正确，请尝试下蹲";
        }
    }

    /**
     * 计算得分
     */
    private int calculateScore(String confirmedState, double kneeAngle) {
        if (confirmedState.equals("down")) {
            // 下蹲越深，得分越高，但基础分更高
            return (int)Math.max(70, 100 - Math.max(0, kneeAngle - 90));
        } else {
            // 站得越直，得分越高，但基础分更高
            return (int)Math.min(100, Math.max(70, kneeAngle));
        }
    }
}