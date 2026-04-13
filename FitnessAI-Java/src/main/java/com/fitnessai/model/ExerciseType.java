package com.fitnessai.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 运动类型枚举
 */
public enum ExerciseType {
    SQUAT("squat", "深蹲"),
    PUSHUP("pushup", "俯卧撑"),
    PLANK("plank", "平板支撑"),
    JUMPING_JACK("jumping_jack", "开合跳");

    private final String id;
    private final String displayName;

    ExerciseType(String id, String displayName) {
        this.id = id;
        this.displayName = displayName;
    }

    @JsonValue
    public String getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static ExerciseType fromId(String id) {
        for (ExerciseType type : values()) {
            if (type.id.equals(id)) {
                return type;
            }
        }
        return SQUAT; // 默认值
    }
}