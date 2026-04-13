package com.fitnessai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.TimeZone;

/**
 * FitnessAI 主应用程序类
 *
 * 这是Spring Boot应用程序的入口点。
 * 提供RESTful API服务，支持实时姿势分析和运动计数。
 *
 * @author FitnessAI Team
 * @version 1.0.0
 */
@SpringBootApplication
@CrossOrigin(origins = "*", maxAge = 3600)
public class FitnessAiApplication {

    public static void main(String[] args) {
        // 设置时区为北京时间 (UTC+8)
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Shanghai"));
        
        SpringApplication.run(FitnessAiApplication.class, args);
        System.out.println("启动FitnessAI Java后端服务...");
        System.out.println("API服务: http://localhost:8080");
        System.out.println("健康检查: http://localhost:8080/api");
        System.out.println("时区设置: Asia/Shanghai (UTC+8)");
        System.out.println("FitnessAI - 智能健身辅助系统");

    }
}