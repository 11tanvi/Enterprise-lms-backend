package com.geeknito.geeknito_backend.event.repository;

import com.geeknito.geeknito_backend.entity.learning.EventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, Long> {
    // Spring Boot automatically gives us save(), findById(), findAll(), etc!
}