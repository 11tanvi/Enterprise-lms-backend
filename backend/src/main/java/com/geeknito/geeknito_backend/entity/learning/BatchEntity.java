package com.geeknito.geeknito_backend.entity.learning;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a cohort/learning batch of students enrolled in a specific course.
 *
 * <p>Validation Constraint:
 * - startDate must be before endDate (startDate &lt; endDate).
 * - This will be enforced programmatically in the service layer.
 * </p>
 */
@Entity
@Table(
    name = "batches",
    uniqueConstraints = @UniqueConstraint(name = "uq_course_batch_name", columnNames = {"course_id", "name"}),
    indexes = {
        @Index(name = "idx_batches_course", columnList = "course_id"),
        @Index(name = "idx_batches_code", columnList = "batch_code")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"course", "students", "teacher"})
public class BatchEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Batch name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Batch code is required")
    @Column(name = "batch_code", nullable = false, unique = true)
    private String batchCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private CourseEntity course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private UserEntity teacher;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BatchStudentEntity> students = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
