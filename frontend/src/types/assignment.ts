export type QuestionType =
  | "MCQ"
  | "Coding"
  | "Essay"
  | "ShortAnswer"
  | "FileUpload";

export interface MCQDetails {
  options: string[];
  optionIds?: string[];
  correctOptionIndex: number;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface CodingDetails {
  starterCode: string;
  language: string;
  testCases: TestCase[];
}

export interface FileUploadDetails {
  allowedExtensions: string[];
  maxSizeMB: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  prompt: string;
  points: number;
  order: number;

  // Specific details based on question type
  mcqDetails?: MCQDetails;
  codingDetails?: CodingDetails;
  fileUploadDetails?: FileUploadDetails;
}

export type AssignmentStatus =
  | "Draft"
  | "Published"
  | "Closed"
  | "Graded"
  | "Submitted"
  | "Overdue"
  | "Late"
  | "In Progress";

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: number;
  courseTitle: string;
  assignedBatchIds?: number[];
  assignedBatchNames?: string[];
  totalMarks: number;
  durationMinutes: number; // 0 for no limit
  dueDate: string;
  createdAt: string;
  status: AssignmentStatus;
  questions: Question[];
  teacherId?: number; // Teacher ID of the owner
  teacherName?: string;
  passingMarks?: number;
  maxAttempts?: string;
  autoSubmit?: boolean;
  negativeMarking?: boolean;
  showScoreImmediately?: boolean;
  showDetailedAnswers?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  allowLateSubmission?: boolean;
  enableCertificates?: boolean;
}

export interface Answer {
  questionId: string;
  questionType: QuestionType;
  questionTitle?: string;
  questionPrompt?: string;
  maxMarks?: number;
  options?: { id: string; optionText: string; isCorrect: boolean }[];
  mcqSelectedIndex?: number;
  selectedOptionId?: string;
  selectedOptionText?: string;
  codingSubmission?: {
    code: string;
    language: string;
    allTestsPassed?: boolean;
  };
  essayText?: string;
  pointsEarned?: number;
  teacherFeedback?: string;
  shortAnswerText?: string;
  fileUploadData?: {
    fileName: string;
    fileUrl: string;
    fileSize?: string;
  };
  parsedPrompt?: string;
  parsedDetails?: any;
  frontendType?: string;
}

export type SubmissionStatus = "Submitted" | "Pending" | "Graded";

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string;
  startedAt?: string;
  answers: Answer[];
  score?: number; // Total points awarded after grading
  status: SubmissionStatus;
  graderFeedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  percentage?: number;
  totalMarks?: number;
}
