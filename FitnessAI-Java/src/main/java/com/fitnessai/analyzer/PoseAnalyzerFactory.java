package com.fitnessai.analyzer;

import com.fitnessai.model.ExerciseType;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 姿势分析器工厂
 *
 * 根据运动类型创建对应的分析器实例
 */
@Component
public class PoseAnalyzerFactory {

    private final Map<ExerciseType, PoseAnalyzer> analyzerMap = new HashMap<>();

    /**
     * 创建分析器实例
     *
     * @param exerciseType 运动类型
     * @return 分析器实例
     */
    public PoseAnalyzer createAnalyzer(ExerciseType exerciseType) {
        synchronized (analyzerMap) {
            return analyzerMap.computeIfAbsent(exerciseType, this::createNewAnalyzer);
        }
    }

    /**
     * 获取分析器实例（如果已存在）
     *
     * @param exerciseType 运动类型
     * @return 分析器实例，如果不存在返回null
     */
    public PoseAnalyzer getAnalyzer(ExerciseType exerciseType) {
        synchronized (analyzerMap) {
            return analyzerMap.get(exerciseType);
        }
    }

    /**
     * 重置指定类型的分析器
     *
     * @param exerciseType 运动类型
     */
    public void resetAnalyzer(ExerciseType exerciseType) {
        synchronized (analyzerMap) {
            PoseAnalyzer analyzer = analyzerMap.get(exerciseType);
            if (analyzer != null) {
                analyzer.reset();
            }
        }
    }

    /**
     * 重置所有分析器
     */
    public void resetAllAnalyzers() {
        synchronized (analyzerMap) {
            analyzerMap.values().forEach(PoseAnalyzer::reset);
        }
    }

    /**
     * 清除所有分析器
     */
    public void clearAllAnalyzers() {
        synchronized (analyzerMap) {
            analyzerMap.clear();
        }
    }

    /**
     * 获取当前活跃的分析器数量
     *
     * @return 分析器数量
     */
    public int getActiveAnalyzerCount() {
        synchronized (analyzerMap) {
            return analyzerMap.size();
        }
    }

    /**
     * 创建新的分析器实例
     *
     * @param exerciseType 运动类型
     * @return 新的分析器实例
     */
    private PoseAnalyzer createNewAnalyzer(ExerciseType exerciseType) {
        switch (exerciseType) {
            case SQUAT:
                return new SquatAnalyzer();
            case PUSHUP:
                return new PushupAnalyzer();
            case PLANK:
                return new PlankAnalyzer();
            case JUMPING_JACK:
                return new JumpingJackAnalyzer();
            default:
                // 默认返回深蹲分析器
                return new SquatAnalyzer();
        }
    }

    /**
     * 验证运动类型是否支持
     *
     * @param exerciseType 运动类型
     * @return 是否支持
     */
    public boolean isSupported(ExerciseType exerciseType) {
        return exerciseType != null;
    }
}