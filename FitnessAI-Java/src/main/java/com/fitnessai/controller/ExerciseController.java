package com.fitnessai.controller;

import com.fitnessai.dto.PoseAnalysisRequest;
import com.fitnessai.dto.PoseAnalysisResponse;
import com.fitnessai.analyzer.PoseAnalyzer;
import com.fitnessai.analyzer.PoseAnalyzerFactory;
import com.fitnessai.model.ExerciseType;
import com.fitnessai.model.PoseLandmark;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 运动分析控制器
 *
 * 提供姿势分析和运动数据提交的API接口
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ExerciseController {

    private static final Logger logger = LoggerFactory.getLogger(ExerciseController.class);

    @Autowired
    private PoseAnalyzerFactory analyzerFactory;

    /**
     * 获取支持的运动类型列表
     *
     * @return 运动类型列表
     */
    @GetMapping("/exercises")
    public ResponseEntity<?> getExercises() {
        logger.info("📋 获取运动类型列表");

        ExerciseInfo[] exercises = {
            new ExerciseInfo(
                "squat", "深蹲",
                "训练大腿和臀部肌肉的经典动作",
                "easy",
                new String[]{"大腿", "臀部", "核心"},
                new String[]{
                    "双脚与肩同宽站立",
                    "膝盖弯曲，臀部向后坐",
                    "保持背部挺直",
                    "大腿与地面平行时停止",
                    "缓慢回到起始位置"
                }
            ),
            new ExerciseInfo(
                "pushup", "俯卧撑",
                "上肢力量训练的基础动作",
                "medium",
                new String[]{"胸部", "肩部", "三头肌"},
                new String[]{
                    "俯卧撑起始位置",
                    "手掌与肩同宽",
                    "身体保持一条直线",
                    "胸部贴近地面",
                    "推起回到起始位置"
                }
            ),
            new ExerciseInfo(
                "plank", "平板支撑",
                "核心稳定性训练的金标准",
                "medium",
                new String[]{"核心", "肩部", "背部"},
                new String[]{
                    "俯卧支撑姿势",
                    "前臂贴地，肘部在肩膀下方",
                    "身体保持一条直线",
                    "收紧核心肌群",
                    "保持静止状态"
                }
            ),
            new ExerciseInfo(
                "jumping_jack", "开合跳",
                "全身有氧运动，提高心率",
                "easy",
                new String[]{"全身", "心肺"},
                new String[]{
                    "双脚并拢站立",
                    "跳起时双腿分开",
                    "同时双臂上举过头",
                    "跳回起始位置",
                    "保持节奏连续进行"
                }
            )
        };

        return ResponseEntity.ok(exercises);
    }

    /**
     * 分析姿态数据
     *
     * @param request 姿势分析请求
     * @return 分析结果
     */
    @PostMapping("/analytics/pose")
    public ResponseEntity<?> analyzePose(@RequestBody PoseAnalysisRequest request) {
        logger.info("🎯 接收到姿势分析请求: {}", request);

        try {
            // 验证请求参数
            if (!request.isValid()) {
                logger.warn("❌ 无效的姿势分析请求: {}", request);
                PoseAnalysisResponse errorResponse = PoseAnalysisResponse.error(
                    "请求数据无效，请检查姿态数据完整性"
                );
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // 获取分析器
            ExerciseType exerciseType = request.getExerciseType();
            logger.info("🔍 解析后的运动类型: {} (ordinal={})", exerciseType, exerciseType.ordinal());
            
            PoseAnalyzer analyzer = analyzerFactory.createAnalyzer(exerciseType);
            logger.info("🔧 使用分析器: {}", analyzer.getClass().getSimpleName());

            // 进行姿势分析
            PoseAnalysisResponse response = analyzer.analyze(request.getPoseLandmarks());

            logger.info("✅ 姿势分析完成 - 运动: {}, 计数: {}, 得分: {}, 反馈: {}",
                       exerciseType, response.getCount(), response.getScore(), response.getFeedback());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ 姿势分析错误: {}", e.getMessage(), e);
            PoseAnalysisResponse errorResponse = PoseAnalysisResponse.error(
                "分析失败: " + e.getMessage()
            );
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * 重置指定运动类型的分析器
     *
     * @param exerciseType 运动类型 (squat, pushup, plank, jumping_jack)
     * @return 重置结果
     */
    @PostMapping("/analyzer/reset/{exerciseType}")
    public ResponseEntity<?> resetAnalyzer(@PathVariable String exerciseType) {
        logger.info("🔄 重置分析器请求: {}", exerciseType);

        try {
            ExerciseType type = ExerciseType.fromId(exerciseType);
            if (type == null) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "Unknown exercise type: " + exerciseType)
                );
            }

            PoseAnalyzer analyzer = analyzerFactory.getAnalyzer(type);
            if (analyzer != null) {
                analyzer.reset();
                logger.info("✅ 分析器已重置: {}", exerciseType);
                return ResponseEntity.ok(Map.of(
                    "message", "Analyzer reset successfully",
                    "exercise_type", exerciseType
                ));
            } else {
                // 如果分析器不存在，创建一个新的（会自动是干净的）
                analyzerFactory.createAnalyzer(type);
                logger.info("✅ 创建新的分析器: {}", exerciseType);
                return ResponseEntity.ok(Map.of(
                    "message", "New analyzer created",
                    "exercise_type", exerciseType
                ));
            }

        } catch (Exception e) {
            logger.error("❌ 重置分析器失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to reset analyzer: " + e.getMessage())
            );
        }
    }

    /**
     * 获取个性化推荐
     *
     * @param userId 用户ID（可选）
     * @param currentExercise 当前运动类型（可选）
     * @return 推荐信息
     */
    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(
            @RequestParam(required = false, defaultValue = "anonymous") String userId,
            @RequestParam(required = false, defaultValue = "squat") String currentExercise) {

        logger.info("🎯 获取个性化推荐 - 用户: {}, 当前运动: {}", userId, currentExercise);

        try {
            ExerciseType currentType = ExerciseType.fromId(currentExercise);

            // TODO: 基于用户历史数据生成个性化推荐
            Map<String, Object> recommendations = Map.of(
                "next_exercises", new Object[]{
                    Map.of("id", "pushup", "name", "俯卧撑", "reason", "增强上肢力量"),
                    Map.of("id", "plank", "name", "平板支撑", "reason", "强化核心稳定")
                },
                "difficulty_adjustment", "maintain",  // increase, decrease, maintain
                "suggested_sets", 3,
                "suggested_reps", 15,
                "rest_time", 60  // 秒
            );

            logger.info("✅ 个性化推荐生成完成");
            return ResponseEntity.ok(recommendations);

        } catch (Exception e) {
            logger.error("❌ 获取推荐错误: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to get recommendations: " + e.getMessage())
            );
        }
    }

    /**
     * 运动信息数据类
     */
    public static class ExerciseInfo {
        public String id;
        public String name;
        public String description;
        public String difficulty;
        public String[] target_muscles;
        public String[] instructions;

        public ExerciseInfo(String id, String name, String description, String difficulty,
                          String[] target_muscles, String[] instructions) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.difficulty = difficulty;
            this.target_muscles = target_muscles;
            this.instructions = instructions;
        }
    }
}