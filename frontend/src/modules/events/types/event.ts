export interface Event {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  timeline: string;
  registrationDeadline: string;
  location: string;
  isRegistered: boolean;
}

export interface EventRequest {
  title: string;
  description: string;
  imageUrl: string;
  timeline: string; // Must be an ISO date string
  registrationDeadline: string; // Must be an ISO date string
  location: string;
}