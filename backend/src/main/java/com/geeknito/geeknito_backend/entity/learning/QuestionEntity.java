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
    name = "questions",
    indexes = {
        @Index(name = "idx_questions_assignment", columnList = "assignment_id"),
        @Index(name = "idx_questions_display_order", columnList = "display_order")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"assignment", "options"})
public class QuestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    @NotNull(message = "Assignment is required")
    private AssignmentEntity assignment;

    @NotBlank(message = "Question title is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 50)
    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    @NotNull(message = "Marks is required")
    @Min(value = 1, message = "Marks must be at least 1")
    @Column(nullable = false)
    @Builder.Default
    private Integer marks = 1;

    @NotNull(message = "Display order is required")
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean required = true;

    @NotNull(message = "Negative marks is required")
    @Column(name = "negative_marks", nullable = false)
    @Builder.Default
    private Integer negativeMarks = 0;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<QuestionOptionEntity> options = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
