package com.fitnessai.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户实体类
 */
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", unique = true, nullable = false, length = 100)
    private String userId;
    
    @Column(length = 100)
    private String name = "健身达人";
    
    private Integer age = 25;
    
    private Integer height = 170;  // cm
    
    private Integer weight = 65;   // kg
    
    @Column(length = 50)
    private String goal = "减脂";  // 减脂/增肌/塑形/保持健康
    
    @Column(length = 20)
    private String avatar = "🏋️";
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Constructors
    public User() {}
    
    public User(String userId) {
        this.userId = userId;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }
    
    public Integer getWeight() { return weight; }
    public void setWeight(Integer weight) { this.weight = weight; }
    
    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }
    
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
