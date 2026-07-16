package com.geeknito.geeknito_backend.event.service;

import com.geeknito.geeknito_backend.event.dto.EventRequestDTO;
import com.geeknito.geeknito_backend.event.dto.EventResponseDTO;
import com.geeknito.geeknito_backend.user.dto.UserResponseDTO;

import java.util.List;

public interface EventService {
    EventResponseDTO createEvent(EventRequestDTO requestDTO);
    List<EventResponseDTO> getAllEvents(String currentUsername); 
    void registerStudentForEvent(Long eventId, String studentEmail);
    List<UserResponseDTO> getRegisteredStudents(Long eventId);
    
    // Add these two new methods to the interface!
    EventResponseDTO updateEvent(Long eventId, EventRequestDTO requestDTO);
    void deleteEvent(Long eventId);
}