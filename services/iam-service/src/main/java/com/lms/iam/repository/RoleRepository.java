package com.lms.iam.repository;

import com.lms.iam.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    // Custom query method to find a role by its exact name
    Optional<Role> findByName(String name);
}