package com.geeknito.geeknito_backend.event.service;

import com.geeknito.geeknito_backend.entity.learning.EventEntity;
import com.geeknito.geeknito_backend.entity.learning.EventRegistrationEntity;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.event.dto.EventRequestDTO;
import com.geeknito.geeknito_backend.event.dto.EventResponseDTO;
import com.geeknito.geeknito_backend.event.repository.EventRegistrationRepository;
import com.geeknito.geeknito_backend.event.repository.EventRepository;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
import com.geeknito.geeknito_backend.user.dto.UserResponseDTO;
import com.geeknito.geeknito_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public EventResponseDTO createEvent(EventRequestDTO requestDTO) {
        EventEntity event = new EventEntity();
        event.setTitle(requestDTO.getTitle());
        event.setDescription(requestDTO.getDescription());
        event.setImageUrl(requestDTO.getImageUrl());
        event.setTimeline(requestDTO.getTimeline());
        event.setRegistrationDeadline(requestDTO.getRegistrationDeadline());
        event.setLocation(requestDTO.getLocation());

        EventEntity savedEvent = eventRepository.save(event);
        return mapToDTO(savedEvent, false);
    }

    @Override
    public List<EventResponseDTO> getAllEvents(String currentUsername) {
        UserEntity currentUser = userRepository.findByEmail(currentUsername)
                .orElse(null);

        return eventRepository.findAll().stream()
                .map(event -> {
                    boolean isRegistered = false;
                    if (currentUser != null && currentUser.getRole().equals("STUDENT")) {
                        isRegistered = registrationRepository.existsByEventIdAndStudentId(event.getId(), currentUser.getId());
                    }
                    return mapToDTO(event, isRegistered);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void registerStudentForEvent(Long eventId, String studentEmail) {
        EventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
                
        UserEntity student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (registrationRepository.existsByEventIdAndStudentId(event.getId(), student.getId())) {
            throw new IllegalStateException("Student is already registered for this event");
        }

        EventRegistrationEntity registration = new EventRegistrationEntity();
        registration.setEvent(event);
        registration.setStudent(student);
        registrationRepository.save(registration);
    }

    @Override
    public List<UserResponseDTO> getRegisteredStudents(Long eventId) {
        List<EventRegistrationEntity> registrations = registrationRepository.findByEventId(eventId);
        
        return registrations.stream()
                .map(reg -> {
                    UserEntity student = reg.getStudent();
                    UserResponseDTO dto = new UserResponseDTO();
                    dto.setId(student.getId());
                    dto.setFullName(student.getFullName());
                    dto.setEmail(student.getEmail());
                    dto.setRole(student.getRole());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private EventResponseDTO mapToDTO(EventEntity event, boolean isRegistered) {
        return EventResponseDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .imageUrl(event.getImageUrl())
                .timeline(event.getTimeline())
                .registrationDeadline(event.getRegistrationDeadline())
                .location(event.getLocation())
                .isRegistered(isRegistered)
                .build();
    }

    // ADMIN ONLY: Update an existing event
    @Override
    @Transactional
    public EventResponseDTO updateEvent(Long id, EventRequestDTO requestDTO) {
        EventEntity event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found")); // Fixed Exception

        event.setTitle(requestDTO.getTitle());
        event.setDescription(requestDTO.getDescription());
        event.setLocation(requestDTO.getLocation());
        event.setTimeline(requestDTO.getTimeline());
        event.setRegistrationDeadline(requestDTO.getRegistrationDeadline());
        
        // Only update image if one was provided
        if (requestDTO.getImageUrl() != null && !requestDTO.getImageUrl().isEmpty()) {
            event.setImageUrl(requestDTO.getImageUrl());
        }

        EventEntity updatedEvent = eventRepository.save(event);
        
        return mapToDTO(updatedEvent, false); // Fixed Method Call
    }

    // ADMIN ONLY: Delete an event
    @Override
    @Transactional
    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Event not found"); // Fixed Exception
        }
        eventRepository.deleteById(id);
    }
}