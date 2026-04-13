package com.fitnessai.analyzer;

import com.fitnessai.model.PoseLandmark;
import com.fitnessai.dto.PoseAnalysisResponse;
import com.fitnessai.model.ExerciseType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 开合跳动作分析器
 *
 * 基于手臂和腿部协调检测开合跳动作并进行计数
 */
public class JumpingJackAnalyzer extends PoseAnalyzer {

    // 开合跳特定参数
    private static final double ARM_THRESHOLD = 1.8;              // 手臂张开比例阈值
    private static final double ARM_HEIGHT_THRESHOLD = 0.1;        // 手臂高度阈值
    private static final int REQUIRED_FRAMES = 6;                 // 确认状态所需帧数
    private static final int COOLDOWN_FRAMES = 20;                 // 冷却时间
    private static final double ARM_RATIO_CHANGE_THRESHOLD = 0.3;  // 手臂比例变化阈值

    // 状态变量
    private int jumpCount = 0;
    private int consecutiveOpenFrames = 0;
    private int consecutiveClosedFrames = 0;
    private String movementPhase = "none";      // none, opening, closing, complete
    private boolean inOpenPosition = false;
    private double lastArmRatio = 0.0;

    public JumpingJackAnalyzer() {
        super();
        this.cooldownCounter = 0;
        logger.info("🤸‍♀️ 初始化开合跳分析器");
    }

    @Override
    public ExerciseType getExerciseType() {
        return ExerciseType.JUMPING_JACK;
    }

    @Override
    public PoseAnalysisResponse analyze(List<PoseLandmark> landmarks) {
        if (!isPoseVisible(landmarks, new int[]{11, 12, 15, 16})) { // 肩部和手腕
            return createBasicErrorResponse("请确保上半身在摄像头范围内", ExerciseType.JUMPING_JACK);
        }

        try {
            // 分析开合跳状态
            JumpingJackAnalysisResult result = analyzeJumpingJackPosition(landmarks);

            // 确定当前状态
            String currentState = detectJumpingJackState(result);

            // 更新连续帧计数
            updateFrameCounters(currentState);

            // 确认状态
            String confirmedState = confirmState();

            // 更新计数
            boolean countUpdated = updateCount(confirmedState, result);

            // 生成反馈
            String feedback = generateFeedback(confirmedState, result);

            // 计算得分
            int score = calculateScore(confirmedState, result);

            // 计算准确率
            double accuracy = calculateAccuracy(jumpCount + (countUpdated ? 1 : 0), jumpCount);

            // 创建响应
            PoseAnalysisResponse response = PoseAnalysisResponse.success(
                true, score, feedback, jumpCount, ExerciseType.JUMPING_JACK, accuracy
            );

            // 添加详细信息
            Map<String, Object> details = new HashMap<>();
            details.put("state", confirmedState);
            details.put("arm_ratio", Math.round(result.armRatio * 100.0) / 100.0);
            details.put("arms_open", result.armsOpen);
            details.put("arms_raised", result.armsRaised);
            details.put("movement_phase", movementPhase);
            details.put("cooldown", cooldownCounter);
            response.setDetails(details);

            logger.debug("开合跳分析 - 状态: {}, 计数: {}, 手臂比例: {:.2f}, 反馈: {}",
                        confirmedState, jumpCount, result.armRatio, feedback);

            return response;

        } catch (Exception e) {
            logger.error("开合跳分析错误: {}", e.getMessage(), e);
            return createErrorResponse("分析失败: " + e.getMessage(), ExerciseType.JUMPING_JACK);
        }
    }

    @Override
    public void reset() {
        super.reset();
        jumpCount = 0;
        consecutiveOpenFrames = 0;
        consecutiveClosedFrames = 0;
        movementPhase = "none";
        inOpenPosition = false;
        lastArmRatio = 0.0;
        cooldownCounter = 0;
        logger.info("🔄 重置开合跳分析器 - 计数: {}", jumpCount);
    }

    /**
     * 分析开合跳姿势
     */
    private JumpingJackAnalysisResult analyzeJumpingJackPosition(List<PoseLandmark> landmarks) {
        PoseLandmark leftShoulder = landmarks.get(11);
        PoseLandmark rightShoulder = landmarks.get(12);
        PoseLandmark leftWrist = landmarks.get(15);
        PoseLandmark rightWrist = landmarks.get(16);

        // 计算肩部和手腕的距离
        double shoulderDistance = calculateDistance(leftShoulder, rightShoulder);
        double wristDistance = calculateDistance(leftWrist, rightWrist);

        // 计算手臂比例
        double armRatio = wristDistance / Math.max(shoulderDistance, 0.1);

        // 检查手臂是否抬高
        boolean leftArmRaised = leftWrist.getY() < leftShoulder.getY() - ARM_HEIGHT_THRESHOLD;
        boolean rightArmRaised = rightWrist.getY() < rightShoulder.getY() - ARM_HEIGHT_THRESHOLD;
        boolean armsRaised = leftArmRaised && rightArmRaised;

        // 更严格的手臂张开判断
        boolean armsOpen = armRatio > ARM_THRESHOLD && armsRaised;

        // 检查手臂比例变化的连续性
        double armRatioChange = Math.abs(armRatio - lastArmRatio);
        boolean isSmoothMovement = armRatioChange < ARM_RATIO_CHANGE_THRESHOLD;
        lastArmRatio = armRatio;

        return new JumpingJackAnalysisResult(armRatio, armsOpen, armsRaised, isSmoothMovement);
    }

    /**
     * 检测开合跳状态
     */
    private String detectJumpingJackState(JumpingJackAnalysisResult result) {
        if (result.armsOpen && result.isSmoothMovement) {
            return "open";
        } else {
            return "closed";
        }
    }

    /**
     * 更新帧计数器
     */
    private void updateFrameCounters(String currentState) {
        if (currentState.equals("open")) {
            consecutiveOpenFrames++;
            consecutiveClosedFrames = 0;
        } else if (currentState.equals("closed")) {
            consecutiveClosedFrames++;
            consecutiveOpenFrames = 0;
        }
    }

    /**
     * 确认状态
     */
    private String confirmState() {
        if (consecutiveOpenFrames >= REQUIRED_FRAMES) {
            return "open";
        } else if (consecutiveClosedFrames >= REQUIRED_FRAMES) {
            return "closed";
        }
        return lastState;
    }

    /**
     * 更新计数
     */
    private boolean updateCount(String currentState, JumpingJackAnalysisResult result) {
        if (cooldownCounter > 0) {
            cooldownCounter--;
        }

        if (!currentState.equals(lastState)) {
            // 状态变化：闭合 -> 张开
            if (!lastState.equals("open") && currentState.equals("open")) {
                if (movementPhase.equals("none") || movementPhase.equals("complete")) {
                    movementPhase = "opening";
                    inOpenPosition = true;
                    logger.debug("👐 开合跳开始张开");
                }
            }
            // 状态变化：张开 -> 闭合
            else if (lastState.equals("open") && currentState.equals("closed")) {
                if (movementPhase.equals("opening") && inOpenPosition) {
                    movementPhase = "closing";
                    inOpenPosition = false;

                    // 完成一次完整的开合跳动作
                    if (cooldownCounter == 0) {
                        jumpCount++;
                        cooldownCounter = COOLDOWN_FRAMES;
                        movementPhase = "complete";
                        logger.info("✅ 开合跳计数增加: {}", jumpCount);
                        return true;
                    } else {
                        logger.debug("⏱️ 开合跳在冷却期间，不计数。剩余冷却: {}", cooldownCounter);
                    }
                }
            }
            stateChangedFrames = 0;
        } else {
            stateChangedFrames++;
        }

        lastState = currentState;
        return false;
    }

    /**
     * 生成反馈
     */
    private String generateFeedback(String confirmedState, JumpingJackAnalysisResult result) {
        if (confirmedState.equals("open")) {
            if (movementPhase.equals("opening")) {
                return "很好！手臂张开，准备合拢";
            } else {
                return "保持手臂张开姿势";
            }
        } else { // closed
            if (movementPhase.equals("closing")) {
                return "很好！完成一次开合跳";
            } else if (movementPhase.equals("complete")) {
                return "准备下一次开合跳";
            } else {
                // 给出具体的改进建议
                if (!result.armsRaised) {
                    return "请将手臂抬高到肩部以上";
                } else {
                    return "请跳起并张开手臂";
                }
            }
        }
    }

    /**
     * 计算得分
     */
    private int calculateScore(String confirmedState, JumpingJackAnalysisResult result) {
        int baseScore = 60;

        if (confirmedState.equals("open")) {
            // 张开状态的得分
            if (result.armsOpen && result.armsRaised) {
                return 90;  // 完美张开
            } else if (result.armsRaised) {
                return 75;  // 手臂抬高但未完全张开
            } else {
                return 65;  // 基础分
            }
        } else {
            // 闭合状态的得分
            if (movementPhase.equals("complete")) {
                return 85;  // 完成了完整动作
            } else if (movementPhase.equals("closing")) {
                return 80;  // 正在闭合
            } else {
                return baseScore;
            }
        }
    }

    /**
     * 开合跳分析结果内部类
     */
    private static class JumpingJackAnalysisResult {
        double armRatio;
        boolean armsOpen;
        boolean armsRaised;
        boolean isSmoothMovement;

        JumpingJackAnalysisResult(double armRatio, boolean armsOpen, boolean armsRaised, boolean isSmoothMovement) {
            this.armRatio = armRatio;
            this.armsOpen = armsOpen;
            this.armsRaised = armsRaised;
            this.isSmoothMovement = isSmoothMovement;
        }
    }
}