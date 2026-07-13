package com.geeknito.geeknito_backend.entity.learning;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "submissions",
    indexes = {
        @Index(name = "idx_submissions_assignment", columnList = "assignment_id"),
        @Index(name = "idx_submissions_student", columnList = "student_id"),
        @Index(name = "idx_submissions_status", columnList = "status"),
        @Index(name = "idx_submissions_submitted_at", columnList = "submitted_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"assignment", "student", "answers"})
public class SubmissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    @NotNull(message = "Assignment is required")
    private AssignmentEntity assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    @NotNull(message = "Student is required")
    private UserEntity student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.IN_PROGRESS;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "total_marks")
    private Integer totalMarks;

    @Column(name = "obtained_marks")
    private Integer obtainedMarks;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "time_taken_minutes")
    private Integer timeTakenMinutes;

    @Column(name = "is_late_submission", nullable = false)
    @Builder.Default
    private boolean isLateSubmission = false;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<StudentAnswerEntity> answers = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
