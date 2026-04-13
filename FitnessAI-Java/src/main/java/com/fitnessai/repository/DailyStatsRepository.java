package com.fitnessai.repository;

import com.fitnessai.model.DailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyStatsRepository extends JpaRepository<DailyStats, Long> {
    
    Optional<DailyStats> findByUserIdAndStatDateAndExerciseType(String userId, LocalDate statDate, String exerciseType);
    
    List<DailyStats> findByUserIdAndStatDateBetweenOrderByStatDateDesc(String userId, LocalDate startDate, LocalDate endDate);
    
    List<DailyStats> findByUserIdAndStatDate(String userId, LocalDate statDate);
}
