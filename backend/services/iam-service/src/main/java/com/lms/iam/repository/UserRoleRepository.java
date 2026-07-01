package com.lms.iam.repository;

import com.lms.iam.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    // Custom query method to find all roles assigned to a specific user
    List<UserRole> findByUserId(UUID userId);
}