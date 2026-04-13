package com.fitnessai.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 主控制器
 *
 * 提供基础API接口和演示页面
 */
@RestController
@RequestMapping
@CrossOrigin(origins = "*", maxAge = 3600)
@io.swagger.v3.oas.annotations.Hidden
public class MainController {

    private static final Logger logger = LoggerFactory.getLogger(MainController.class);

    /**
     * API状态接口
     *
     * @return API状态信息
     */
    @GetMapping("/api")
    public Map<String, Object> apiStatus() {
        logger.info("📡 API状态检查");

        return Map.of(
            "message", "FitnessAI Backend API",
            "version", "1.0.0",
            "status", "running",
            "timestamp", LocalDateTime.now(),
            "framework", "Spring Boot",
            "java_version", System.getProperty("java.version")
        );
    }

    /**
     * 健康检查接口
     *
     * @return 健康状态
     */
    @GetMapping("/api/health")
    public Map<String, Object> healthCheck() {
        return Map.of(
            "status", "UP",
            "timestamp", LocalDateTime.now(),
            "uptime", getUptime()
        );
    }

    /**
     * 系统信息接口
     *
     * @return 系统信息
     */
    @GetMapping("/api/system")
    public Map<String, Object> systemInfo() {
        Runtime runtime = Runtime.getRuntime();

        return Map.of(
            "java_version", System.getProperty("java.version"),
            "java_vendor", System.getProperty("java.vendor"),
            "os_name", System.getProperty("os.name"),
            "os_version", System.getProperty("os.version"),
            "os_arch", System.getProperty("os.arch"),
            "available_processors", runtime.availableProcessors(),
            "max_memory", formatBytes(runtime.maxMemory()),
            "total_memory", formatBytes(runtime.totalMemory()),
            "free_memory", formatBytes(runtime.freeMemory())
        );
    }

    /**
     * 演示页面HTML
     *
     * @return 演示页面HTML
     */
    @GetMapping("/demo")
    public String demoPage() {
        return generateDemoHtml();
    }

    /**
     * 根路径重定向到演示页面
     *
     * @return 演示页面HTML
     */
    @GetMapping("/")
    public String index() {
        return generateDemoHtml();
    }

    /**
     * 计算系统运行时间
     *
     * @return 运行时间描述
     */
    private String getUptime() {
        long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
        long hours = uptime / (1000 * 60 * 60);
        long minutes = (uptime % (1000 * 60 * 60)) / (1000 * 60);
        long seconds = ((uptime % (1000 * 60 * 60)) % (1000 * 60)) / 1000;

        return String.format("%d小时%d分钟%d秒", hours, minutes, seconds);
    }

    /**
     * 格式化字节数为可读格式
     *
     * @param bytes 字节数
     * @return 格式化后的字符串
     */
    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        return String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0));
    }

    /**
     * 生成演示页面HTML
     *
     * @return 演示页面HTML
     */
    private String generateDemoHtml() {
        return "<!DOCTYPE html>\n" +
               "<html>\n" +
               "<head>\n" +
               "    <title>FitnessAI Java Backend Demo</title>\n" +
               "    <meta charset=\"UTF-8\">\n" +
               "    <style>\n" +
               "        body {\n" +
               "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n" +
               "            margin: 0;\n" +
               "            padding: 40px;\n" +
               "            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n" +
               "            color: white;\n" +
               "            min-height: 100vh;\n" +
               "        }\n" +
               "        .container {\n" +
               "            max-width: 800px;\n" +
               "            margin: 0 auto;\n" +
               "            background: rgba(255,255,255,0.1);\n" +
               "            padding: 30px;\n" +
               "            border-radius: 15px;\n" +
               "            backdrop-filter: blur(10px);\n" +
               "            box-shadow: 0 8px 32px rgba(0,0,0,0.1);\n" +
               "        }\n" +
               "        h1 {\n" +
               "            font-size: 2.5em;\n" +
               "            margin-bottom: 20px;\n" +
               "            text-align: center;\n" +
               "        }\n" +
               "        .status {\n" +
               "            background: rgba(0,0,0,0.3);\n" +
               "            padding: 20px;\n" +
               "            border-radius: 8px;\n" +
               "            margin: 20px 0;\n" +
               "        }\n" +
               "        .btn {\n" +
               "            background: #4CAF50;\n" +
               "            color: white;\n" +
               "            padding: 12px 24px;\n" +
               "            border: none;\n" +
               "            border-radius: 6px;\n" +
               "            cursor: pointer;\n" +
               "            margin: 8px;\n" +
               "            font-size: 16px;\n" +
               "            transition: all 0.3s ease;\n" +
               "        }\n" +
               "        .btn:hover {\n" +
               "            background: #45a049;\n" +
               "            transform: translateY(-2px);\n" +
               "        }\n" +
               "        .btn-secondary {\n" +
               "            background: #2196F3;\n" +
               "        }\n" +
               "        .btn-secondary:hover {\n" +
               "            background: #1976D2;\n" +
               "        }\n" +
               "        .feature-grid {\n" +
               "            display: grid;\n" +
               "            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n" +
               "            gap: 20px;\n" +
               "            margin: 30px 0;\n" +
               "        }\n" +
               "        .feature-card {\n" +
               "            background: rgba(255,255,255,0.2);\n" +
               "            padding: 20px;\n" +
               "            border-radius: 10px;\n" +
               "            border: 1px solid rgba(255,255,255,0.1);\n" +
               "        }\n" +
               "        .status-item {\n" +
               "            margin: 10px 0;\n" +
               "            display: flex;\n" +
               "            justify-content: space-between;\n" +
               "        }\n" +
               "        .status-value {\n" +
               "            font-weight: bold;\n" +
               "            color: #4CAF50;\n" +
               "        }\n" +
               "        .loading {\n" +
               "            color: #FFC107;\n" +
               "        }\n" +
               "        .error {\n" +
               "            color: #F44336;\n" +
               "        }\n" +
               "        .success {\n" +
               "            color: #4CAF50;\n" +
               "        }\n" +
               "        #session-info {\n" +
               "            margin-top: 20px;\n" +
               "            padding: 15px;\n" +
               "            background: rgba(0,0,0,0.2);\n" +
               "            border-radius: 8px;\n" +
               "        }\n" +
               "    </style>\n" +
               "</head>\n" +
               "<body>\n" +
               "    <div class=\"container\">\n" +
               "        <h1>🏃‍♀️ FitnessAI Java Backend</h1>\n" +
               "        <p style=\"text-align: center; font-size: 1.2em; margin-bottom: 30px;\">\n" +
               "            智能健身辅助系统 - 基于Java Spring Boot的后端API服务\n" +
               "        </p>\n" +
               "\n" +
               "        <div class=\"status\">\n" +
               "            <h3>📊 系统状态</h3>\n" +
               "            <div class=\"status-item\">\n" +
               "                <span>API状态:</span>\n" +
               "                <span id=\"api-status\" class=\"loading\">检查中...</span>\n" +
               "            </div>\n" +
               "            <div class=\"status-item\">\n" +
               "                <span>健康状态:</span>\n" +
               "                <span id=\"health-status\" class=\"loading\">检查中...</span>\n" +
               "            </div>\n" +
               "            <div class=\"status-item\">\n" +
               "                <span>支持的运动:</span>\n" +
               "                <span id=\"exercises\" class=\"loading\">加载中...</span>\n" +
               "            </div>\n" +
               "            <div class=\"status-item\">\n" +
               "                <span>Java版本:</span>\n" +
               "                <span id=\"java-version\" class=\"loading\">检查中...</span>\n" +
               "            </div>\n" +
               "        </div>\n" +
               "\n" +
               "        <div class=\"feature-grid\">\n" +
               "            <div class=\"feature-card\">\n" +
               "                <h3>🎯 开始训练</h3>\n" +
               "                <button class=\"btn\" onclick=\"startSession('squat')\">开始深蹲训练</button>\n" +
               "                <button class=\"btn\" onclick=\"startSession('pushup')\">开始俯卧撑训练</button>\n" +
               "                <button class=\"btn\" onclick=\"startSession('plank')\">开始平板支撑训练</button>\n" +
               "                <button class=\"btn\" onclick=\"startSession('jumping_jack')\">开始开合跳训练</button>\n" +
               "                <div id=\"session-info\"></div>\n" +
               "            </div>\n" +
               "\n" +
               "            <div class=\"feature-card\">\n" +
               "                <h3>📋 API测试</h3>\n" +
               "                <button class=\"btn btn-secondary\" onclick=\"testAPI('/api')\">测试API状态</button>\n" +
               "                <button class=\"btn btn-secondary\" onclick=\"testAPI('/api/health')\">测试健康检查</button>\n" +
               "                <button class=\"btn btn-secondary\" onclick=\"testAPI('/api/exercises')\">获取运动类型</button>\n" +
               "                <button class=\"btn btn-secondary\" onclick=\"testAPI('/api/system')\">获取系统信息</button>\n" +
               "            </div>\n" +
               "        </div>\n" +
               "\n" +
               "        <div class=\"feature-card\">\n" +
               "            <h3>💡 技术特色</h3>\n" +
               "            <ul style=\"list-style: none; padding: 0;\">\n" +
               "                <li>🔧 <strong>Spring Boot 3.2</strong> - 现代化Java框架</li>\n" +
               "                <li>🗄️ <strong>H2 Database</strong> - 内存数据库支持</li>\n" +
               "                <li>🧮 <strong>Apache Commons Math</strong> - 数学计算库</li>\n" +
               "                <li>📐 <strong>实时姿势分析</strong> - 四种运动类型支持</li>\n" +
               "                <li>🔄 <strong>会话管理</strong> - 完整的训练流程跟踪</li>\n" +
               "                <li>📊 <strong>数据统计</strong> - 详细的训练数据分析</li>\n" +
               "            </ul>\n" +
               "        </div>\n" +
               "    </div>\n" +
               "\n" +
               "    <script>\n" +
               "        // 检查API状态\n" +
               "        fetch('/api')\n" +
               "            .then(r => r.json())\n" +
               "            .then(data => {\n" +
               "                document.getElementById('api-status').textContent = '✅ ' + data.status;\n" +
               "                document.getElementById('api-status').className = 'status-value success';\n" +
               "                document.getElementById('java-version').textContent = data.java_version;\n" +
               "                document.getElementById('java-version').className = 'status-value';\n" +
               "            })\n" +
               "            .catch(e => {\n" +
               "                document.getElementById('api-status').textContent = '❌ 离线';\n" +
               "                document.getElementById('api-status').className = 'status-value error';\n" +
               "            });\n" +
               "\n" +
               "        // 检查健康状态\n" +
               "        fetch('/api/health')\n" +
               "            .then(r => r.json())\n" +
               "            .then(data => {\n" +
               "                document.getElementById('health-status').textContent = '✅ ' + data.status;\n" +
               "                document.getElementById('health-status').className = 'status-value success';\n" +
               "            })\n" +
               "            .catch(e => {\n" +
               "                document.getElementById('health-status').textContent = '❌ 异常';\n" +
               "                document.getElementById('health-status').className = 'status-value error';\n" +
               "            });\n" +
               "\n" +
               "        // 获取运动类型\n" +
               "        fetch('/api/exercises')\n" +
               "            .then(r => r.json())\n" +
               "            .then(data => {\n" +
               "                const names = data.map(ex => ex.name).join(', ');\n" +
               "                document.getElementById('exercises').textContent = names;\n" +
               "                document.getElementById('exercises').className = 'status-value';\n" +
               "            })\n" +
               "            .catch(e => {\n" +
               "                document.getElementById('exercises').textContent = '加载失败';\n" +
               "                document.getElementById('exercises').className = 'status-value error';\n" +
               "            });\n" +
               "\n" +
               "        // 开始训练会话\n" +
               "        function startSession(exerciseType) {\n" +
               "            const requestData = {\n" +
               "                exercise_type: exerciseType,\n" +
               "                user_id: 'demo_user'\n" +
               "            };\n" +
               "\n" +
               "            fetch('/api/session/start', {\n" +
               "                method: 'POST',\n" +
               "                headers: {'Content-Type': 'application/json'},\n" +
               "                body: JSON.stringify(requestData)\n" +
               "            })\n" +
               "            .then(r => r.json())\n" +
               "            .then(data => {\n" +
               "                if (data.session_id) {\n" +
               "                    document.getElementById('session-info').innerHTML = \n" +
               "                        '<p class=\"success\">✅ 训练会话已创建!</p>' +\n" +
               "                        '<p>会话ID: ' + data.session_id + '</p>' +\n" +
               "                        '<p>运动类型: ' + exerciseType + '</p>' +\n" +
               "                        '<button class=\"btn\" onclick=\"endSession(\\'' + data.session_id + '\\')\">结束会话</button>';\n" +
               "                } else {\n" +
               "                    document.getElementById('session-info').innerHTML = \n" +
               "                        '<p class=\"error\">❌ 启动失败: ' + (data.error || '未知错误') + '</p>';\n" +
               "                }\n" +
               "            })\n" +
               "            .catch(e => {\n" +
               "                document.getElementById('session-info').innerHTML = \n" +
               "                    '<p class=\"error\">❌ 启动失败: ' + e.message + '</p>';\n" +
               "            });\n" +
               "        }\n" +
               "\n" +
               "        // 结束训练会话\n" +
               "        function endSession(sessionId) {\n" +
               "            fetch('/api/session/' + sessionId + '/end', {\n" +
               "                method: 'POST'\n" +
               "            })\n" +
               "            .then(r => r.json())\n" +
               "            .then(data => {\n" +
               "                if (data.summary) {\n" +
               "                    const summary = data.summary;\n" +
               "                    document.getElementById('session-info').innerHTML = \n" +
               "                        '<p class=\"success\">✅ 会话已结束!</p>' +\n" +
               "                        '<p>总次数: ' + summary.total_count + '</p>' +\n" +
               "                        '<p>正确次数: ' + summary.correct_count + '</p>' +\n" +
               "                        '<p>准确率: ' + (summary.accuracy * 100).toFixed(1) + '%</p>';\n" +
               "                } else {\n" +
               "                    document.getElementById('session-info').innerHTML = \n" +
               "                        '<p class=\"error\">❌ 结束失败: ' + (data.error || '未知错误') + '</p>';\n" +
               "                }\n" +
               "            })\n" +
               "            .catch(e => {\n" +
               "                document.getElementById('session-info').innerHTML = \n" +
               "                    '<p class=\"error\">❌ 结束失败: ' + e.message + '</p>';\n" +
               "            });\n" +
               "        }\n" +
               "\n" +
               "        // 测试API接口\n" +
               "        function testAPI(endpoint) {\n" +
               "            fetch(endpoint)\n" +
               "                .then(r => r.json())\n" +
               "                .then(data => {\n" +
               "                    alert('API测试成功!\\n\\n接口: ' + endpoint + '\\n\\n响应: ' + JSON.stringify(data, null, 2));\n" +
               "                })\n" +
               "                .catch(e => {\n" +
               "                    alert('API测试失败: ' + e.message);\n" +
               "                });\n" +
               "        }\n" +
               "    </script>\n" +
               "</body>\n" +
               "</html>";
    }
}