import React, { useEffect, useState } from "react";
import { eventService } from "../api/eventService";
import { Event } from "../types/event";
import { EventCard } from "../components/EventCard";
import { Plus } from "lucide-react";
import { CreateEventModal } from "../components/CreateEventModal";
import { ViewRegistrationsModal } from "../components/ViewRegistrationsModal";
import { EditEventModal } from "../components/EditEventModal"; // <-- Imported Edit Modal
import { useApp } from "../../../context/AppContext";

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<Event | null>(null);

  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === "admin";

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getAllEvents();
      setEvents(data);
      setError(null);
    } catch (err: any) {
      setError("Failed to load campus events. Make sure backend is online.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: number) => {
    try {
      await eventService.registerForEvent(eventId);
      setEvents(prev =>
        prev.map(evt => (evt.id === eventId ? { ...evt, isRegistered: true } : evt))
      );
    } catch (err: any) {
      alert(err.response?.data || "Registration failed.");
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      return;
    }
    try {
      await eventService.deleteEvent(eventId);
      // Remove the deleted event from the UI instantly
      setEvents(prev => prev.filter(evt => evt.id !== eventId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01AC9F]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Campus Events & Hackathons</h1>
          <p className="text-sm text-gray-500">Discover scope updates, hackathons, and register instantly.</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#01AC9F] hover:bg-[#008f84] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 border border-red-150 rounded-lg">
          {error}
        </div>
      )}

      {events.length === 0 && !error ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <p className="text-gray-500 text-sm">No upcoming events found right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              onRegister={handleRegister}
              onViewRegistrations={(id) => {
                setSelectedEventId(id);
                setIsRegistrationsModalOpen(true);
              }}
              // Map the new edit and delete handlers!
              onEdit={(evt) => {
                setSelectedEventToEdit(evt);
                setIsEditModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchEvents();
        }} 
      />

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEventToEdit(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedEventToEdit(null);
          fetchEvents(); // Reload to show edited data
        }}
        eventToEdit={selectedEventToEdit}
      />

      <ViewRegistrationsModal
        isOpen={isRegistrationsModalOpen}
        onClose={() => {
          setIsRegistrationsModalOpen(false);
          setSelectedEventId(null);
        }}
        eventId={selectedEventId}
      />
    </div>
  );
};