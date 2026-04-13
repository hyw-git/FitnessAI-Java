package com.fitnessai.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * 自定义数据库健康检查指示器
 * 
 * 用于监控 Neon Cloud PostgreSQL 数据库的连接状态
 */
@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    @Autowired
    private DataSource dataSource;

    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) { // 2秒超时
                return Health.up()
                        .withDetail("database", "PostgreSQL")
                        .withDetail("provider", "Neon Cloud")
                        .withDetail("status", "Connected")
                        .withDetail("connection_valid", true)
                        .build();
            } else {
                return Health.down()
                        .withDetail("database", "PostgreSQL")
                        .withDetail("status", "Connection invalid")
                        .build();
            }
        } catch (SQLException e) {
            return Health.down()
                    .withDetail("database", "PostgreSQL")
                    .withDetail("error", e.getMessage())
                    .withDetail("status", "Connection failed")
                    .build();
        }
    }
}
