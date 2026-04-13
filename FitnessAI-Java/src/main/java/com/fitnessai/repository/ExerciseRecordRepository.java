package com.fitnessai.repository;

import com.fitnessai.model.ExerciseRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExerciseRecordRepository extends JpaRepository<ExerciseRecord, Long> {
    
    List<ExerciseRecord> findByUserIdOrderByRecordedAtDesc(String userId);
    
    List<ExerciseRecord> findByUserIdAndRecordDate(String userId, LocalDate recordDate);
    
    List<ExerciseRecord> findByUserIdAndExerciseTypeAndRecordDate(String userId, String exerciseType, LocalDate recordDate);
    
    @Query("SELECT COALESCE(SUM(e.count), 0) FROM ExerciseRecord e WHERE e.userId = :userId AND e.recordDate = :date AND e.exerciseType = :exerciseType")
    Integer getTodayCountByExercise(@Param("userId") String userId, @Param("date") LocalDate date, @Param("exerciseType") String exerciseType);
    
    @Query("SELECT COALESCE(SUM(e.count), 0) FROM ExerciseRecord e WHERE e.userId = :userId AND e.recordDate = :date")
    Integer getTodayTotalCount(@Param("userId") String userId, @Param("date") LocalDate date);
    
    // 获取最近 N 条记录
    List<ExerciseRecord> findTop10ByUserIdOrderByRecordedAtDesc(String userId);
    
    // 查找无效记录（count < minCount 且 duration < minDuration）
    @Query("SELECT e FROM ExerciseRecord e WHERE e.count < :minCount AND e.duration < :minDuration")
    List<ExerciseRecord> findInvalidRecords(@Param("minCount") int minCount, @Param("minDuration") int minDuration);
    
    // 统计无效记录数量
    @Query("SELECT COUNT(e) FROM ExerciseRecord e WHERE e.count < :minCount AND e.duration < :minDuration")
    long countInvalidRecords(@Param("minCount") int minCount, @Param("minDuration") int minDuration);
    
    // 删除无效记录
    @Modifying
    @Query("DELETE FROM ExerciseRecord e WHERE e.count < :minCount AND e.duration < :minDuration")
    int deleteInvalidRecords(@Param("minCount") int minCount, @Param("minDuration") int minDuration);
    
    // 筛选查询（基础）
    @Query("SELECT e FROM ExerciseRecord e WHERE e.userId = :userId " +
           "AND (:exerciseType IS NULL OR e.exerciseType = :exerciseType) " +
           "AND (:minScore IS NULL OR e.score >= :minScore) " +
           "AND (:maxScore IS NULL OR e.score <= :maxScore) " +
           "AND (:minAccuracy IS NULL OR e.accuracy >= :minAccuracy) " +
           "AND (:maxAccuracy IS NULL OR e.accuracy <= :maxAccuracy)")
    List<ExerciseRecord> findFiltered(
            @Param("userId") String userId,
            @Param("exerciseType") String exerciseType,
            @Param("minScore") Integer minScore,
            @Param("maxScore") Integer maxScore,
            @Param("minAccuracy") Double minAccuracy,
            @Param("maxAccuracy") Double maxAccuracy);
}