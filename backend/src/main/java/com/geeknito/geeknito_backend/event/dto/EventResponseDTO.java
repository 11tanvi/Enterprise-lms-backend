package com.geeknito.geeknito_backend.event.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EventResponseDTO {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private LocalDateTime timeline;
    private LocalDateTime registrationDeadline;
    private String location;
    private boolean isRegistered; // We will calculate this for the logged-in student!
}