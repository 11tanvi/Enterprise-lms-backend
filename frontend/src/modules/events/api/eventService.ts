import apiClient from "../../../lib/apiClient";
import { Event, EventRequest } from "../types/event";

export const eventService = {
  /**
   * ADMIN, TEACHER, STUDENT: Fetch all events
   */
  getAllEvents: async (): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>("/events");
    return response.data;
  },

  /**
   * ADMIN ONLY: Create a new event
   */
  createEvent: async (eventData: EventRequest): Promise<Event> => {
    const response = await apiClient.post<Event>("/events", eventData);
    return response.data;
  },

  /**
   * STUDENT ONLY: Register for an event
   */
  registerForEvent: async (eventId: number): Promise<string> => {
    const response = await apiClient.post<string>(`/events/${eventId}/register`);
    return response.data;
  },

  /**
   * ADMIN ONLY: Get a list of students registered for a specific event
   */
  getRegisteredStudents: async (eventId: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/events/${eventId}/registrations`);
    return response.data;
  },

  /**
   * ADMIN ONLY: Update an event
   */
  updateEvent: async (eventId: number, eventData: EventRequest): Promise<Event> => {
    const response = await apiClient.put<Event>(`/events/${eventId}`, eventData);
    return response.data;
  },

  /**
   * ADMIN ONLY: Delete an event
   */
  deleteEvent: async (eventId: number): Promise<void> => {
    await apiClient.delete(`/events/${eventId}`);
  },
};