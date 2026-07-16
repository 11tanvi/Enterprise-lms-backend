package com.geeknito.geeknito_backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geeknito.geeknito_backend.entity.learning.EventEntity;
import com.geeknito.geeknito_backend.event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class EventDataSeeder {

    private final EventRepository eventRepository;
    private final ObjectMapper objectMapper;

    @Bean
    public CommandLineRunner seedEvents() {
        return args -> {
            if (eventRepository.count() == 0) {
                try {
                    // Read the file from src/main/resources
                    List<Map<String, Object>> events = objectMapper.readValue(
                        new ClassPathResource("events.json").getInputStream(),
                        new TypeReference<List<Map<String, Object>>>(){}
                    );

                    for (Map<String, Object> item : events) {
                        EventEntity event = new EventEntity();
                        event.setTitle((String) item.get("title"));
                        event.setDescription((String) item.get("description"));
                        event.setLocation((String) item.get("locationOrLink"));
                        
                        // Convert ISO string dates to LocalDateTime
                        String startTimeStr = (String) item.get("startTime");
                        event.setTimeline(LocalDateTime.ofInstant(Instant.parse(startTimeStr), ZoneId.of("UTC")));
                        event.setRegistrationDeadline(LocalDateTime.ofInstant(Instant.parse(startTimeStr), ZoneId.of("UTC")));

                        eventRepository.save(event);
                    }
                    System.out.println("Seeded " + events.size() + " events successfully!");
                } catch (Exception e) {
                    System.err.println("Failed to seed events: " + e.getMessage());
                }
            }
        };
    }
}