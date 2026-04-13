# FitnessAI 开发指南

本文档包含项目的本地启动、数据库配置、Docker 部署和 API 测试说明。

---

## 📋 目录

- [环境要求](#环境要求)
- [数据库配置](#数据库配置)
- [本地启动](#本地启动)
- [Docker 部署](#docker-部署)
- [Swagger API 测试](#swagger-api-测试)
- [常见问题](#常见问题)

---

## 环境要求

### 必需
| 工具 | 版本 | 说明 |
|------|------|------|
| **Java JDK** | 17+ | 后端运行环境 |
| **Node.js** | 18+ | 前端运行环境 |
| **Git** | 任意 | 版本控制 |

### 可选
| 工具 | 用途 |
|------|------|
| **Maven** | 本地构建后端（也可用 IDE） |
| **Docker Desktop** | 容器化部署 |
| **IntelliJ IDEA** | Java 开发 IDE |
| **DBeaver / pgAdmin** | 数据库可视化工具 |

---

## 数据库配置

项目使用 **Neon** 云端 PostgreSQL 数据库，所有团队成员共享同一个数据库。

### 连接信息

```
Host:     ep-weathered-star-a1x699tf-pooler.ap-southeast-1.aws.neon.tech
Port:     5432
Database: neondb
Username: neondb_owner
Password: npg_Oqet2AQ4WlIc
SSL Mode: require
```

### IntelliJ IDEA 配置

1. 打开 **View** → **Tool Windows** → **Database**
2. 点击 **+** → **Data Source** → **PostgreSQL**
3. 填入连接信息：
   - **Host**: `ep-weathered-star-a1x699tf-pooler.ap-southeast-1.aws.neon.tech`
   - **Port**: `5432`
   - **Database**: `neondb`
   - **User**: `neondb_owner`
   - **Password**: `npg_Oqet2AQ4WlIc`
4. 在 URL 框中确保有 `?sslmode=require`：
   ```
   jdbc:postgresql://ep-weathered-star-a1x699tf-pooler.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require
   ```
5. 点击 **Download** 下载驱动（如有提示）
6. 点击 **Test Connection** 测试
7. 成功后点击 **OK**

### DBeaver 配置

1. 点击 **新建连接** → 选择 **PostgreSQL**
2. 填入连接信息（同上）
3. 切换到 **SSL** 标签页：
   - 勾选 **Use SSL**
   - **SSL mode** 选择 `require`
4. 点击 **测试连接**
5. 成功后点击 **完成**

### pgAdmin 4 配置

1. 右键 **Servers** → **Register** → **Server**
2. **General** 标签：Name 填 `FitnessAI Neon`
3. **Connection** 标签：填入连接信息
4. **SSL** 标签：SSL mode 设置为 `Require`
5. 点击 **Save**

---

## 本地启动

### 后端启动

#### 方法 1：使用 IntelliJ IDEA（推荐）

1. 用 IntelliJ 打开 `FitnessAI-Java` 目录
2. 等待 Maven 依赖下载完成
3. 找到 `FitnessAiApplication.java` 文件
4. 右键点击 → **Run 'FitnessAiApplication'**
5. 看到 `Started FitnessAiApplication` 表示启动成功

#### 方法 2：使用 Maven 命令行

```bash
cd FitnessAI-Java
mvn spring-boot:run
```

#### 后端访问地址

| 服务 | 地址 |
|------|------|
| API 根路径 | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| API 文档 | http://localhost:8080/v3/api-docs |

---

### 前端启动

```bash
cd frontend
npm install      # 首次运行需要安装依赖
npm start        # 启动开发服务器
```

#### 前端访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:3000 |

> 💡 **提示**：前端开发模式支持热更新，修改代码后浏览器会自动刷新。

---

## Docker 部署

### 前置要求

- 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- 确保 Docker Desktop 正在运行

### 启动所有服务

```bash
cd FitnessAI              # 进入项目根目录
docker-compose up --build  # 构建并启动（第一次运行需要等待依赖下载，超级慢）
```

### 只启动后端

```bash
docker-compose up --build backend
```

### 只启动前端

```bash
docker-compose up --build frontend
```

### 后台运行

```bash
docker-compose up -d --build   # 后台启动
docker-compose logs -f         # 查看日志
docker-compose down            # 停止服务
```

### Docker 服务地址

| 服务 | 地址 |
|------|------|
| 后端 API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| 前端页面 | http://localhost:3000 |

### 常用 Docker 命令

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs fitnessai-backend -f
docker logs fitnessai-frontend -f

# 停止所有容器
docker-compose down

# 清理未使用的镜像（释放空间）
docker system prune

# 完全重建（清除缓存）
docker-compose build --no-cache
docker-compose up
```

---

## Swagger API 测试

### 访问 Swagger UI

1. 确保后端已启动
2. 打开浏览器访问：http://localhost:8080/swagger-ui.html

### Swagger 界面说明

- **左侧**：API 分组（按 Controller 分类）
- **展开 API**：点击任意 API 路径展开详情
- **Try it out**：点击后可以直接测试 API
- **Execute**：发送请求
- **Response**：查看返回结果

### 测试步骤示例

1. 打开 Swagger UI
2. 找到要测试的 API（如 `/api/users`）
3. 点击 **Try it out**
4. 填写请求参数（如有）
5. 点击 **Execute**
6. 查看 **Response body** 中的返回数据

### API 文档 JSON

如需获取原始 OpenAPI 文档：
- http://localhost:8080/v3/api-docs

---

## 常见问题

### Q: 数据库连接失败

**A:** 检查以下几点：
1. 确保网络正常（Neon 是云数据库，在新加坡，需要联网）
2. 检查 `application.properties` 中的配置是否正确
3. 确保 URL 包含 `?sslmode=require`

### Q: 端口被占用

**A:** 
```bash
# Windows - 查看 8080 端口占用
netstat -ano | findstr :8080

# 杀死占用端口的进程
taskkill /PID <进程ID> /F
```

### Q: Docker 构建失败

**A:**
1. 确保 Docker Desktop 正在运行
2. 尝试清理并重建：
   ```bash
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

### Q: 前端无法连接后端

**A:**
1. 确保后端已启动且运行在 8080 端口
2. 检查浏览器控制台是否有 CORS 错误
3. 确保后端 CORS 配置正确

### Q: Maven 下载依赖很慢

**A:** 可以配置阿里云镜像。在 `~/.m2/settings.xml` 中添加：
```xml
<mirrors>
  <mirror>
    <id>aliyun</id>
    <mirrorOf>central</mirrorOf>
    <url>https://maven.aliyun.com/repository/public</url>
  </mirror>
</mirrors>
```

---

## 开发建议

| 场景 | 推荐方式 |
|------|----------|
| 日常开发 | 本地启动（IDE + npm start） |
| 调试 API | 本地后端 + Swagger |
| 测试部署 | Docker Compose |
| 演示项目 | Docker Compose |


---

*最后更新：2024年12月14日*
