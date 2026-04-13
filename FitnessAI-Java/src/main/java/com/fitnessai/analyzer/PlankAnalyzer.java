package com.fitnessai.analyzer;

import com.fitnessai.model.PoseLandmark;
import com.fitnessai.dto.PoseAnalysisResponse;
import com.fitnessai.model.ExerciseType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 平板支撑动作分析器
 *
 * 基于身体直线度和肘部弯曲检测平板支撑动作
 */
public class PlankAnalyzer extends PoseAnalyzer {

    // 平板支撑特定参数
    private static final double ELBOW_ANGLE_THRESHOLD = 120.0; // 肘部弯曲角度阈值
    private static final int MIN_STABLE_FRAMES = 10;           // 最小稳定帧数
    private static final int MAX_UNSTABLE_FRAMES = 5;          // 最大不稳定帧数
    private static final double QUALITY_THRESHOLD = 0.8;       // 姿势质量阈值
    private static final double PLANK_MIN_CONFIDENCE = 0.2;    // 平板支撑的低可见性阈值

    // 状态变量
    private long plankStartTime = 0;       // 平板支撑开始时间戳（毫秒）
    private double accumulatedDuration = 0; // 累计持续时间（秒）
    private boolean isInPlank = false;
    private int stableFrames = 0;
    private int unstableFrames = 0;

    public PlankAnalyzer() {
        super();
        logger.info("🧘 初始化平板支撑分析器");
    }

    @Override
    public ExerciseType getExerciseType() {
        return ExerciseType.PLANK;
    }

    /**
     * 平板支撑专用的可见性检查（使用更低的阈值）
     */
    private boolean isPlankPoseVisible(List<PoseLandmark> landmarks, int[] requiredLandmarks) {
        if (landmarks == null || landmarks.size() < 33) {
            return false;
        }

        int visibleCount = 0;
        for (int idx : requiredLandmarks) {
            if (idx < landmarks.size() && landmarks.get(idx).getVisibility() >= PLANK_MIN_CONFIDENCE) {
                visibleCount++;
            }
        }

        // 只要有一半以上的关键点可见就可以
        return visibleCount >= requiredLandmarks.length / 2;
    }

    @Override
    public PoseAnalysisResponse analyze(List<PoseLandmark> landmarks) {
        // 使用更宽松的可见性检查
        if (!isPlankPoseVisible(landmarks, new int[]{11, 12, 13, 14})) { // 肩部和肘部
            return createBasicErrorResponse("请确保上半身在摄像头范围内", ExerciseType.PLANK);
        }

        try {
            // 检查平板支撑姿势
            PlankAnalysisResult result = analyzePlankPosition(landmarks);

            // 更新状态
            updatePlankState(result);

            // 计算持续时间（秒）- 使用真实时间戳
            double durationSeconds = accumulatedDuration;
            if (isInPlank && plankStartTime > 0) {
                // 如果当前正在平板支撑，加上从上次开始到现在的时间
                durationSeconds += (System.currentTimeMillis() - plankStartTime) / 1000.0;
            }

            // 生成反馈
            String feedback = generateFeedback(result, durationSeconds);

            // 计算得分
            int score = calculateScore(result);

            // 计算持续时间的整数秒数（用于前端显示）
            int durationSecondsInt = (int) Math.round(durationSeconds);

            // 创建响应 - count 使用持续秒数
            PoseAnalysisResponse response = PoseAnalysisResponse.success(
                true, score, feedback, durationSecondsInt, ExerciseType.PLANK, 0.9
            );

            // 添加详细信息
            Map<String, Object> details = new HashMap<>();
            details.put("elbow_angle", Math.round(result.avgElbowAngle * 10.0) / 10.0);
            details.put("elbows_under_shoulders", result.elbowsUnderShoulders);
            details.put("stable_frames", stableFrames);
            details.put("duration_seconds", Math.round(durationSeconds * 10.0) / 10.0);
            response.setDetails(details);

            response.setDuration(durationSeconds);

            logger.debug("平板支撑分析 - 时长: {:.1f}s, 正确: {}, 稳定帧: {}, 反馈: {}",
                        durationSeconds, result.isCorrect, stableFrames, feedback);

            return response;

        } catch (Exception e) {
            logger.error("平板支撑分析错误: {}", e.getMessage(), e);
            return createErrorResponse("分析失败: " + e.getMessage(), ExerciseType.PLANK);
        }
    }

    @Override
    public void reset() {
        super.reset();
        plankStartTime = 0;
        accumulatedDuration = 0;
        isInPlank = false;
        stableFrames = 0;
        unstableFrames = 0;
        logger.info("🔄 重置平板支撑分析器");
    }

    /**
     * 分析平板支撑姿势（支持正面和侧面视角）
     */
    private PlankAnalysisResult analyzePlankPosition(List<PoseLandmark> landmarks) {
        PoseLandmark leftShoulder = landmarks.get(11);
        PoseLandmark rightShoulder = landmarks.get(12);
        PoseLandmark leftElbow = landmarks.get(13);
        PoseLandmark rightElbow = landmarks.get(14);
        PoseLandmark leftHip = landmarks.get(23);
        PoseLandmark rightHip = landmarks.get(24);
        PoseLandmark leftAnkle = landmarks.get(27);
        PoseLandmark rightAnkle = landmarks.get(28);

        // 判断视角：通过左右肩的X坐标差异来判断
        // 侧面视角时，两肩的X坐标接近；正面视角时，两肩的X坐标差异较大
        double shoulderWidthX = Math.abs(leftShoulder.getX() - rightShoulder.getX());
        boolean isSideView = shoulderWidthX < 0.15; // 阈值，小于0.15认为是侧面视角

        logger.debug("视角检测 - 肩宽差: {:.3f}, 侧面视角: {}", shoulderWidthX, isSideView);

        if (isSideView) {
            // ====== 侧面视角分析 ======
            // 使用可见性更高的一侧进行分析
            boolean useLeft = leftShoulder.getVisibility() > rightShoulder.getVisibility();
            
            PoseLandmark shoulder = useLeft ? leftShoulder : rightShoulder;
            PoseLandmark hip = useLeft ? leftHip : rightHip;
            PoseLandmark ankle = useLeft ? leftAnkle : rightAnkle;
            PoseLandmark elbow = useLeft ? leftElbow : rightElbow;

            // 检查身体是否成一条直线：计算肩-髋-踝的角度
            // 理想情况下应该接近180度（一条直线）
            double bodyLineAngle = calculateAngle(shoulder, hip, ankle);
            boolean isBodyStraight = bodyLineAngle > 150.0 && bodyLineAngle < 200.0;

            // 检查是否处于支撑姿势（肩部高度高于髋部，髋部高于脚踝 - 水平姿势）
            // 注意：Y坐标在图像中向下增加，所以这里的比较可能需要调整
            boolean isHorizontal = Math.abs(shoulder.getY() - ankle.getY()) < 0.3; // 肩和脚踝大致水平

            // 检查肘部是否弯曲（用于前臂支撑式平板）
            boolean elbowBent = elbow.getY() > shoulder.getY(); // 肘部低于肩部

            // 侧面视角的正确姿势判定
            boolean isCorrect = isBodyStraight && (isHorizontal || elbowBent);

            logger.debug("侧面视角分析 - 身体直线角度: {:.1f}, 身体挺直: {}, 水平: {}, 姿势正确: {}",
                        bodyLineAngle, isBodyStraight, isHorizontal, isCorrect);

            return new PlankAnalysisResult(isCorrect, bodyLineAngle, isBodyStraight, isSideView);
        } else {
            // ====== 正面视角分析（保持原逻辑） ======
            // 检查肘部是否弯曲（创建虚拟的手腕点来计算角度）
            PoseLandmark leftVirtualWrist = new PoseLandmark(
                leftElbow.getX(), leftElbow.getY() + 0.1, leftElbow.getZ(), 1.0
            );
            PoseLandmark rightVirtualWrist = new PoseLandmark(
                rightElbow.getX(), rightElbow.getY() + 0.1, rightElbow.getZ(), 1.0
            );

            double leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftVirtualWrist);
            double rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightVirtualWrist);
            double avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2.0;

            // 检查肘部是否在肩部下方
            boolean elbowsUnderShoulders = (leftElbow.getY() > leftShoulder.getY() &&
                                           rightElbow.getY() > rightShoulder.getY());

            // 判断姿势是否正确
            boolean isCorrect = avgElbowAngle < ELBOW_ANGLE_THRESHOLD && elbowsUnderShoulders;

            return new PlankAnalysisResult(isCorrect, avgElbowAngle, elbowsUnderShoulders, isSideView);
        }
    }

    /**
     * 更新平板支撑状态
     */
    private void updatePlankState(PlankAnalysisResult result) {
        if (result.isCorrect) {
            stableFrames++;
            unstableFrames = 0;

            if (stableFrames >= MIN_STABLE_FRAMES) {
                if (!isInPlank) {
                    isInPlank = true;
                    plankStartTime = System.currentTimeMillis(); // 记录开始时间
                    logger.info("🧘 开始平板支撑计时");
                }
                // 不再使用帧计数，时间在 analyze 方法中实时计算
            }
        } else {
            unstableFrames++;

            // 如果不稳定帧数超过阈值，减少稳定帧数
            if (unstableFrames > MAX_UNSTABLE_FRAMES) {
                if (stableFrames > 0) {
                    stableFrames--;
                }

                // 如果稳定帧数降至阈值以下，停止计时
                if (stableFrames < MIN_STABLE_FRAMES / 3) {
                    if (isInPlank) {
                        // 累加这段时间的持续时间
                        if (plankStartTime > 0) {
                            accumulatedDuration += (System.currentTimeMillis() - plankStartTime) / 1000.0;
                            plankStartTime = 0;
                        }
                        logger.info("⏹️ 停止平板支撑计时，累计: {:.1f}秒", accumulatedDuration);
                        isInPlank = false;
                    }
                }
            }
        }
    }

    /**
     * 生成反馈
     */
    private String generateFeedback(PlankAnalysisResult result, double durationSeconds) {
        if (!result.isCorrect) {
            StringBuilder feedback = new StringBuilder();
            
            if (result.isSideView) {
                // 侧面视角的反馈
                if (!result.elbowsUnderShoulders) { // 这里 elbowsUnderShoulders 在侧面视角下表示 isBodyStraight
                    feedback.append("请保持身体成一条直线，不要弯腰或塌腰");
                } else {
                    feedback.append("调整姿势，保持从头到脚呈直线");
                }
            } else {
                // 正面视角的反馈
                if (result.avgElbowAngle >= ELBOW_ANGLE_THRESHOLD) {
                    feedback.append("手肘需要弯曲");
                }
                if (!result.elbowsUnderShoulders) {
                    if (feedback.length() > 0) feedback.append("，");
                    feedback.append("肘部应在肩部下方");
                }
            }
            return feedback.length() > 0 ? feedback.toString() : "调整姿势";
        }

        // 正确姿势反馈
        if (stableFrames < MIN_STABLE_FRAMES) {
            return String.format("保持姿势稳定，还需 %d 帧", MIN_STABLE_FRAMES - stableFrames);
        }

        if (durationSeconds < 10) {
            return String.format("姿势正确，已坚持 %.1f 秒", durationSeconds);
        } else if (durationSeconds < 30) {
            return String.format("做得好！已坚持 %.1f 秒", durationSeconds);
        } else {
            return String.format("太棒了！已坚持 %.1f 秒", durationSeconds);
        }
    }

    /**
     * 计算得分
     */
    private int calculateScore(PlankAnalysisResult result) {
        return result.isCorrect ? 80 : 60;
    }

    /**
     * 平板支撑分析结果内部类
     */
    private static class PlankAnalysisResult {
        boolean isCorrect;
        double avgElbowAngle;     // 正面视角：肘部角度；侧面视角：身体直线角度
        boolean elbowsUnderShoulders; // 正面视角：肘部在肩下；侧面视角：身体是否挺直
        boolean isSideView;       // 是否为侧面视角

        PlankAnalysisResult(boolean isCorrect, double avgElbowAngle, boolean elbowsUnderShoulders, boolean isSideView) {
            this.isCorrect = isCorrect;
            this.avgElbowAngle = avgElbowAngle;
            this.elbowsUnderShoulders = elbowsUnderShoulders;
            this.isSideView = isSideView;
        }
    }
}