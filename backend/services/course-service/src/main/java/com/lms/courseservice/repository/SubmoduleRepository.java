package com.lms.courseservice.repository;

import com.lms.courseservice.entity.Submodule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SubmoduleRepository extends JpaRepository<Submodule, UUID> {
}