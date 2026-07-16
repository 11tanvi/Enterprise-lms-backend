package com.geeknito.geeknito_backend.event.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventRequestDTO {
    private String title;
    private String description;
    private String imageUrl;
    private LocalDateTime timeline;
    private LocalDateTime registrationDeadline;
    private String location;
}