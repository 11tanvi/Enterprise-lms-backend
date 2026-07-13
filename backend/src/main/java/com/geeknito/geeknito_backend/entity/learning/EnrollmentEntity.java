package com.geeknito.geeknito_backend.entity.learning;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "enrollments",
    uniqueConstraints = @UniqueConstraint(name = "uq_student_course", columnNames = {"student_id", "course_id"}),
    indexes = {
        @Index(name = "idx_enrollments_student", columnList = "student_id"),
        @Index(name = "idx_enrollments_course", columnList = "course_id"),
        @Index(name = "idx_enrollments_status", columnList = "status")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"student", "course"})
public class EnrollmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private UserEntity student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private CourseEntity course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EnrollmentStatus status;

    @Min(0)
    @Max(100)
    @Column(name = "progress_percentage", nullable = false)
    @Builder.Default
    private int progressPercentage = 0;

    @CreationTimestamp
    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private LocalDateTime enrolledAt;

    @UpdateTimestamp
    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
