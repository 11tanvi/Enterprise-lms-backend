export interface Batch {
  id: string;
  name: string;
  courseId: number;
  studentIds: string[];
  startDate?: string;
  endDate?: string;
}
