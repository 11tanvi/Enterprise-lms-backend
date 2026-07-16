package com.geeknito.geeknito_backend.event.controller;

import com.geeknito.geeknito_backend.event.dto.EventRequestDTO;
import com.geeknito.geeknito_backend.event.dto.EventResponseDTO;
import com.geeknito.geeknito_backend.event.service.EventService;
import com.geeknito.geeknito_backend.user.dto.UserResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.userdetails.UserDetails;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;

import java.util.List;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    // ADMIN ONLY: Create an event
    @PostMapping
    @PreAuthorize("hasAuthority('admin')") 
    public ResponseEntity<EventResponseDTO> createEvent(@RequestBody EventRequestDTO requestDTO) {
        return ResponseEntity.ok(eventService.createEvent(requestDTO));
    }

    // ALL LOGGED IN USERS: View all events
    @GetMapping
    public ResponseEntity<List<EventResponseDTO>> getAllEvents(Authentication authentication) {
        // We pass the username to check if the current student is already registered!
        return ResponseEntity.ok(eventService.getAllEvents(authentication.getName()));
    }

    // STUDENT ONLY: Register for an event
    @PostMapping("/{eventId}/register")
    @PreAuthorize("hasAuthority('student')")
    public ResponseEntity<String> registerForEvent(@PathVariable Long eventId, Authentication authentication) {
        
        // 1. Cast directly to YOUR custom UserEntity instead of UserDetails
        UserEntity user = (UserEntity) authentication.getPrincipal();
        
        // 2. Extract the email string
        String studentEmail = user.getEmail(); 
        
        System.out.println("DEBUG: Successfully extracted email: " + studentEmail);
        
        // 3. Pass only the email string to the service
        eventService.registerStudentForEvent(eventId, studentEmail);
        return ResponseEntity.ok("Successfully registered for the event!");
    }

    // ADMIN ONLY: View registered students for a specific event
    @GetMapping("/{eventId}/registrations")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<List<UserResponseDTO>> getRegisteredStudents(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getRegisteredStudents(eventId));
    }

    // ADMIN ONLY: Update an event
    @PutMapping("/{eventId}")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<EventResponseDTO> updateEvent(@PathVariable Long eventId, @RequestBody EventRequestDTO requestDTO) {
        return ResponseEntity.ok(eventService.updateEvent(eventId, requestDTO));
    }

    // ADMIN ONLY: Delete an event
    @DeleteMapping("/{eventId}")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<String> deleteEvent(@PathVariable Long eventId) {
        eventService.deleteEvent(eventId);
        return ResponseEntity.ok("Event successfully deleted");
    }
}