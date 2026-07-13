package com.geeknito.geeknito_backend.entity.learning;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

@Entity
@Table(
    name = "assignments",
    indexes = {
        @Index(name = "idx_assignments_course", columnList = "course_id"),
        @Index(name = "idx_assignments_teacher", columnList = "teacher_id"),
        @Index(name = "idx_assignments_status", columnList = "status"),
        @Index(name = "idx_assignments_available_from", columnList = "available_from"),
        @Index(name = "idx_assignments_due_date", columnList = "due_date")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"course", "teacher", "assignmentBatches"})
public class AssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Assignment title is required")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    @NotNull(message = "Course is required")
    private CourseEntity course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    @NotNull(message = "Teacher is required")
    private UserEntity teacher;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private AssignmentStatus status = AssignmentStatus.DRAFT;

    @Column(name = "available_from")
    private LocalDateTime availableFrom;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @NotNull(message = "Max marks is required")
    @Min(value = 1, message = "Max marks must be at least 1")
    @Column(name = "max_marks", nullable = false)
    @Builder.Default
    private Integer maxMarks = 100;

    @NotNull(message = "Passing marks is required")
    @Min(value = 0, message = "Passing marks cannot be negative")
    @Column(name = "passing_marks", nullable = false)
    @Builder.Default
    private Integer passingMarks = 40;

    @NotNull(message = "Time limit is required")
    @Min(value = 0, message = "Time limit cannot be negative")
    @Column(name = "time_limit_minutes", nullable = false)
    @Builder.Default
    private Integer timeLimitMinutes = 0; // 0 means no limit

    @Column(name = "allow_late_submission", nullable = false)
    @Builder.Default
    private boolean allowLateSubmission = false;

    @Column(name = "shuffle_questions", nullable = false)
    @Builder.Default
    private boolean shuffleQuestions = false;

    @Column(name = "show_result_immediately", nullable = false)
    @Builder.Default
    private boolean showResultImmediately = true;

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    @Column(name = "auto_submit", nullable = false)
    @Builder.Default
    private boolean autoSubmit = true;

    @Column(name = "shuffle_options", nullable = false)
    @Builder.Default
    private boolean shuffleOptions = true;

    @Column(name = "negative_marking", nullable = false)
    @Builder.Default
    private boolean negativeMarking = false;

    @Column(name = "show_detailed_answers", nullable = false)
    @Builder.Default
    private boolean showDetailedAnswers = false;

    @Column(name = "enable_certificates", nullable = false)
    @Builder.Default
    private boolean enableCertificates = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AssignmentBatchEntity> assignmentBatches = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
