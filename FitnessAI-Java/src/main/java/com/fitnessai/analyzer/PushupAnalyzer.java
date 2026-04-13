package com.fitnessai.analyzer;

import com.fitnessai.model.PoseLandmark;
import com.fitnessai.dto.PoseAnalysisResponse;
import com.fitnessai.model.ExerciseType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 俯卧撑动作分析器
 *
 * 基于手臂角度检测俯卧撑动作并进行计数
 */
public class PushupAnalyzer extends PoseAnalyzer {

    // 俯卧撑特定参数
    private static final double ANGLE_THRESHOLD = 115.0;     // 弯曲角度阈值
    private static final double STRAIGHT_THRESHOLD = 155.0;  // 伸直角度阈值
    private static final int REQUIRED_FRAMES = 5;             // 确认状态所需帧数
    private static final int COOLDOWN_FRAMES = 15;            // 冷却时间

    // 状态变量
    private int pushupCount = 0;
    private boolean inDownPosition = false;
    private int consecutiveUpFrames = 0;
    private int consecutiveDownFrames = 0;
    private double sideViewBaselineY = 0;  // 侧面视角的基线位置
    private boolean currentIsSideView = false; // 当前是否为侧面视角

    public PushupAnalyzer() {
        super();
        this.cooldownCounter = 0;
        logger.info("💪 初始化俯卧撑分析器");
    }

    @Override
    public ExerciseType getExerciseType() {
        return ExerciseType.PUSHUP;
    }

    @Override
    public PoseAnalysisResponse analyze(List<PoseLandmark> landmarks) {
        // 使用更宽松的可见性检查（侧面视角下某些关键点可能被遮挡）
        if (!isPushupPoseVisible(landmarks, new int[]{11, 12, 13, 14, 23, 24})) {
            return createBasicErrorResponse("请确保上半身在摄像头范围内", ExerciseType.PUSHUP);
        }

        try {
            // 分析俯卧撑姿势（支持正面和侧面视角）
            PushupAnalysisResult result = analyzePushupPosition(landmarks);
            double armAngle = result.angle;
            currentIsSideView = result.isSideView;

            // 确定当前状态
            String currentState = detectPushupState(armAngle);

            // 更新连续帧计数
            updateFrameCounters(currentState);

            // 确认状态
            String confirmedState = confirmState();

            // 更新计数
            boolean countUpdated = updateCount(confirmedState);

            // 生成反馈
            String feedback = generateFeedback(confirmedState);

            // 计算得分
            int score = calculateScore(confirmedState, armAngle);

            // 计算准确率
            double accuracy = calculateAccuracy(pushupCount + (countUpdated ? 1 : 0), pushupCount);

            // 创建响应
            PoseAnalysisResponse response = PoseAnalysisResponse.success(
                true, score, feedback, pushupCount, ExerciseType.PUSHUP, accuracy
            );

            // 添加详细信息
            Map<String, Object> details = new HashMap<>();
            details.put("arm_angle", Math.round(armAngle * 10.0) / 10.0);
            details.put("state", confirmedState);
            details.put("cooldown", cooldownCounter);
            response.setDetails(details);

            logger.debug("俯卧撑分析 - 角度: {:.1f}, 状态: {}, 计数: {}, 反馈: {}",
                        armAngle, confirmedState, pushupCount, feedback);

            return response;

        } catch (Exception e) {
            logger.error("俯卧撑分析错误: {}", e.getMessage(), e);
            return createErrorResponse("分析失败: " + e.getMessage(), ExerciseType.PUSHUP);
        }
    }

    @Override
    public void reset() {
        super.reset();
        pushupCount = 0;
        inDownPosition = false;
        consecutiveUpFrames = 0;
        consecutiveDownFrames = 0;
        cooldownCounter = 0;
        sideViewBaselineY = 0;
        currentIsSideView = false;
        logger.info("🔄 重置俯卧撑分析器 - 计数: {}", pushupCount);
    }

    /**
     * 俯卧撑专用的可见性检查（使用更宽松的阈值，适配侧面视角）
     */
    private static final double PUSHUP_MIN_CONFIDENCE = 0.2;  // 较低的可见性阈值
    
    private boolean isPushupPoseVisible(List<PoseLandmark> landmarks, int[] requiredLandmarks) {
        if (landmarks == null || landmarks.size() < 33) {
            return false;
        }

        int visibleCount = 0;
        for (int idx : requiredLandmarks) {
            if (idx < landmarks.size() && landmarks.get(idx).getVisibility() >= PUSHUP_MIN_CONFIDENCE) {
                visibleCount++;
            }
        }

        // 只要有一半以上的关键点可见就可以
        return visibleCount >= requiredLandmarks.length / 2;
    }

    /**
     * 分析俯卧撑姿势（支持正面和侧面视角）
     * @return PushupAnalysisResult 包含角度/位置信息和视角类型
     */
    private PushupAnalysisResult analyzePushupPosition(List<PoseLandmark> landmarks) {
        PoseLandmark leftShoulder = landmarks.get(11);
        PoseLandmark rightShoulder = landmarks.get(12);
        PoseLandmark leftElbow = landmarks.get(13);
        PoseLandmark rightElbow = landmarks.get(14);
        PoseLandmark leftHip = landmarks.get(23);
        PoseLandmark rightHip = landmarks.get(24);

        // 判断视角：通过左右肩的X坐标差异来判断
        // 侧面视角时，两肩的X坐标接近；正面视角时，两肩的X坐标差异较大
        double shoulderWidthX = Math.abs(leftShoulder.getX() - rightShoulder.getX());
        boolean isSideView = shoulderWidthX < 0.15;

        logger.debug("俯卧撑视角检测 - 肩宽差: {:.3f}, 侧面视角: {}", shoulderWidthX, isSideView);

        if (isSideView) {
            // ====== 侧面视角分析 ======
            // 使用可见性更高的一侧进行分析
            boolean useLeft = leftShoulder.getVisibility() > rightShoulder.getVisibility();
            
            PoseLandmark shoulder = useLeft ? leftShoulder : rightShoulder;
            PoseLandmark hip = useLeft ? leftHip : rightHip;
            PoseLandmark elbow = useLeft ? leftElbow : rightElbow;
            PoseLandmark wrist = landmarks.get(useLeft ? 15 : 16);
            PoseLandmark ankle = landmarks.get(useLeft ? 27 : 28);

            // 方法1：检测肘部弯曲角度（肩-肘-腕）
            double elbowAngle = calculateAngle(shoulder, elbow, wrist);
            
            // 方法2：检测肩膀和肘部的Y坐标差异
            // 下降时，肩膀会更接近地面（Y值更大），肘部弯曲
            // 上升时，肩膀远离地面（Y值更小），手臂伸直
            double shoulderElbowYDiff = shoulder.getY() - elbow.getY();
            
            // 综合判断：
            // - 肘部角度小于100度 = 下降
            // - 肘部角度大于150度 = 上升
            // - 或者通过肩膀和肘部的Y差异判断
            double virtualAngle;
            
            // 优先使用肘部角度（如果手腕可见）
            if (wrist.getVisibility() >= PUSHUP_MIN_CONFIDENCE) {
                virtualAngle = elbowAngle;
                logger.debug("侧面视角分析(肘角) - 肘部角度: {:.1f}", elbowAngle);
            } else {
                // 备用方案：使用肩膀相对肘部的位置
                // 下降时 shoulderElbowYDiff 更大（肩膀低于肘部更多）
                // 上升时 shoulderElbowYDiff 更小或为负（肩膀高于肘部）
                if (shoulderElbowYDiff > 0.05) {
                    virtualAngle = 90.0; // 下降状态
                } else if (shoulderElbowYDiff < -0.02) {
                    virtualAngle = 170.0; // 上升状态
                } else {
                    virtualAngle = 135.0; // 过渡状态
                }
                logger.debug("侧面视角分析(Y差) - 肩肘Y差: {:.3f}, 虚拟角度: {:.1f}", 
                            shoulderElbowYDiff, virtualAngle);
            }

            return new PushupAnalysisResult(virtualAngle, isSideView, shoulderElbowYDiff);
        } else {
            // ====== 正面视角分析（保持原逻辑） ======
            List<Double> armAngles = new java.util.ArrayList<>();

            // 左臂角度（如果可见）
            if (landmarks.get(15).isVisible(MIN_DETECTION_CONFIDENCE)) {
                double leftArmAngle = calculateAngle(landmarks.get(11), landmarks.get(13), landmarks.get(15));
                armAngles.add(leftArmAngle);
            }

            // 右臂角度（如果可见）
            if (landmarks.get(16).isVisible(MIN_DETECTION_CONFIDENCE)) {
                double rightArmAngle = calculateAngle(landmarks.get(12), landmarks.get(14), landmarks.get(16));
                armAngles.add(rightArmAngle);
            }

            // 计算平均角度
            double avgAngle = 180.0;
            if (!armAngles.isEmpty()) {
                avgAngle = armAngles.stream().mapToDouble(Double::doubleValue).average().orElse(180.0);
            }

            return new PushupAnalysisResult(avgAngle, isSideView, 0);
        }
    }

    /**
     * 俯卧撑分析结果内部类
     */
    private static class PushupAnalysisResult {
        double angle;           // 正面视角：实际手臂角度；侧面视角：虚拟角度
        boolean isSideView;     // 是否为侧面视角
        double relativePosition; // 侧面视角：相对位置

        PushupAnalysisResult(double angle, boolean isSideView, double relativePosition) {
            this.angle = angle;
            this.isSideView = isSideView;
            this.relativePosition = relativePosition;
        }
    }

    /**
     * 检测俯卧撑状态
     */
    private String detectPushupState(double armAngle) {
        if (armAngle < ANGLE_THRESHOLD) {
            return "down";
        } else if (armAngle > STRAIGHT_THRESHOLD) {
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
        if (cooldownCounter > 0) {
            cooldownCounter--;
        }

        if (currentState != lastState) {
            if (stateChangedFrames >= 3) {
                if (!lastState.equals("down") && currentState.equals("down") && cooldownCounter == 0) {
                    inDownPosition = true;
                    logger.debug("👇 检测到俯卧撑下降");
                } else if (lastState.equals("down") && currentState.equals("up") && inDownPosition) {
                    if (cooldownCounter == 0) {
                        pushupCount++;
                        cooldownCounter = COOLDOWN_FRAMES;
                        logger.info("✅ 俯卧撑计数增加: {}", pushupCount);
                        return true;
                    }
                    inDownPosition = false;
                }
                stateChangedFrames = 0;
            } else {
                logger.debug("🔄 俯卧撑状态变化不稳定: {} -> {}", lastState, currentState);
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
        if (currentIsSideView) {
            // 侧面视角的反馈
            if (confirmedState.equals("down")) {
                return "身体已下降，请推起身体";
            } else {
                return "保持身体挺直，准备下降";
            }
        } else {
            // 正面视角的反馈
            if (confirmedState.equals("down")) {
                return "已下降，请向上推起";
            } else {
                return "已上升，请下降";
            }
        }
    }

    /**
     * 计算得分
     */
    private int calculateScore(String confirmedState, double armAngle) {
        if (confirmedState.equals("down")) {
            // 下降越深，得分越高
            return (int)Math.max(60, 100 - Math.max(0, armAngle - 90));
        } else {
            // 手臂越直，得分越高
            return (int)Math.min(100, Math.max(60, armAngle));
        }
    }
}