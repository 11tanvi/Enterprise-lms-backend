import React from "react";
import { Event } from "../types/event";
import { CheckCircle2, Edit2, Trash2 } from "lucide-react";

interface EventCardProps {
  event: Event;
  onRegister: (id: number) => void;
  isAdmin: boolean;
  onViewRegistrations?: (id: number) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (id: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onRegister,
  isAdmin,
  onViewRegistrations,
  onEdit,
  onDelete,
}) => {
  const isDeadlinePassed = new Date(event.registrationDeadline) < new Date();

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-150 flex flex-col h-full">
      <div className="relative h-48 w-full bg-gray-100">
        <img
          src={event.imageUrl || "/placeholder-event.png"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
            {event.location}
          </span>
          <span className="text-xs text-gray-500">
            Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-950 mb-2 line-clamp-1">
          {event.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
          {event.description}
        </p>

        <div className="text-xs text-gray-500 border-t border-gray-100 pt-3 mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-medium text-gray-700">Event Date:</span>
            {new Date(event.timeline).toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          {isAdmin ? (
            <>
              <button
                onClick={() => onViewRegistrations?.(event.id)}
                className="w-full text-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                View Registered Students
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit?.(event)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => onDelete?.(event.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => onRegister(event.id)}
              disabled={event.isRegistered || isDeadlinePassed}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                event.isRegistered
                  ? "bg-green-50 text-green-700 border border-green-200 cursor-not-allowed"
                  : isDeadlinePassed
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {event.isRegistered ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Registered
                </>
              ) : isDeadlinePassed ? (
                "Registration Closed"
              ) : (
                "Register Now"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};