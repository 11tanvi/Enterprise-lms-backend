package com.geeknito.geeknito_backend.event.repository;

import com.geeknito.geeknito_backend.entity.learning.EventRegistrationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistrationEntity, Long> {
    
    // Checks if a student is already registered for a specific event
    boolean existsByEventIdAndStudentId(Long eventId, Long studentId);
    
    // Gets all registrations (which include student details) for a specific event
    List<EventRegistrationEntity> findByEventId(Long eventId);
}