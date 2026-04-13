# ============================================
# 阶段 1: Maven 构建阶段
# ============================================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# 先复制 pom.xml 并下载依赖（利用 Docker 缓存）
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 复制源代码并构建
COPY src ./src
RUN mvn clean package -DskipTests -B

# ============================================
# 阶段 2: 运行阶段（精简镜像）
# ============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 从构建阶段复制 JAR 文件
COPY --from=builder /app/target/*.jar app.jar

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
