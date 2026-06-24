package com.lms.courseservice.repository;

import com.lms.courseservice.entity.Content;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ContentRepository extends JpaRepository<Content, UUID> {
}