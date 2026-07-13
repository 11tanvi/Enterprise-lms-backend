export interface Batch {
  id: number | string;
  name: string;
  batchCode?: string;
  courseId: number;
  courseName?: string;
  courseTitle?: string;
  teacherId?: number;
  teacherName?: string;
  startDate?: string;
  endDate?: string;
  studentIds: (number | string)[];
  studentCount?: number;
  capacity?: number;
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchStudent {
  batchId: number | string;
  studentId: number | string;
  studentName?: string;
  studentEmail?: string;
  enrolledAt?: string;
}

export interface BatchMetric {
  totalBatches: number;
  activeBatches: number;
  totalStudents: number;
  averageProgress?: number;
}
