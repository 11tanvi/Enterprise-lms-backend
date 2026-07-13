import apiClient from "../../../lib/apiClient";
import { Assignment, Submission, Question, Answer } from "../types";
import { Course } from "../../../types";
import { initialCourses } from "../../../data/initialData";
import { enrollmentService } from "../../../services/enrollmentService";
import type { PageResponse } from "../types";
import {
  getStoredAssignments,
  getStoredSubmissions,
  saveAssignment as localSaveAssignment,
  saveSubmission as localSaveSubmission,
} from "../utils/mockAssignments";

// Check if we should enforce mock mode fallback
const isMockMode = (): boolean => {
  return import.meta.env.VITE_USE_MOCK_API !== "false";
};

// Retrieve mock courses from localStorage to stay consistent with catalog edits
const getMockCourses = (): Course[] => {
  const saved = localStorage.getItem("educorp_courses");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  return initialCourses;
};

// Helper: Map Backend Assignment Status to Frontend Status
function mapAssignmentStatusToFrontend(backendStatus: string): any {
  if (backendStatus === "DRAFT") return "Draft";
  if (backendStatus === "PUBLISHED") return "Published";
  if (backendStatus === "CLOSED") return "Closed";
  if (backendStatus === "SCHEDULED") return "Published"; // Close enough
  return "Draft";
}

// Helper: Map Frontend Assignment Status to Backend Status
function mapAssignmentStatusToBackend(frontendStatus: string): string {
  if (frontendStatus === "Draft") return "DRAFT";
  if (frontendStatus === "Published") return "PUBLISHED";
  if (frontendStatus === "Closed") return "CLOSED";
  return "DRAFT";
}

// Helper: Map Backend Submission Status to Frontend Status
function mapSubmissionStatusToFrontend(backendStatus: string): any {
  if (backendStatus === "SUBMITTED" || backendStatus === "LATE_SUBMITTED")
    return "Submitted";
  if (backendStatus === "GRADED") return "Graded";
  return "Pending";
}

// Helper: Map Frontend QuestionType to Backend QuestionType

function mapSubmissionStatusToBackend(frontendStatus: string): string {
  if (frontendStatus === "Pending") return "IN_PROGRESS";
  if (frontendStatus === "Submitted") return "SUBMITTED";
  if (frontendStatus === "Graded") return "GRADED";
  return "IN_PROGRESS";
}

function mapQuestionTypeToFrontend(
  backendType: string,
  isCoding: boolean,
): string {
  if (isCoding) return "Coding";
  if (backendType === "MCQ" || backendType === "TRUE_FALSE") return "MCQ";
  if (backendType === "PARAGRAPH") return "Essay";
  if (backendType === "SHORT_ANSWER") return "ShortAnswer";
  if (backendType === "FILE_UPLOAD") return "FileUpload";
  return backendType;
}

function mapQuestionTypeToBackend(frontendType: string): string {
  if (frontendType === "MCQ" || frontendType === "True/False") return "MCQ";
  if (frontendType === "Essay") return "PARAGRAPH";
  if (frontendType === "ShortAnswer") return "SHORT_ANSWER";
  if (frontendType === "FileUpload") return "FILE_UPLOAD";
  if (frontendType === "Coding") return "PARAGRAPH"; // Hack to store coding details
  return "SHORT_ANSWER";
}

export const assignmentService = {
  /**
   * Fetch all courses from GET /api/v1/courses (or localStorage in mock mode)
   */
  async getCourses(): Promise<Course[]> {
    if (isMockMode()) {
      return getMockCourses();
    }

    const response = await apiClient.get<PageResponse<Course>>("/courses");
    return response.data.content;
  },

  /**
   * Fetch batches for a given course
   */
  async getBatchesForCourse(courseId: string | number): Promise<any[]> {
    if (isMockMode()) return [];
    try {
      const response = await apiClient.get<any[]>(
        `/batches/course/${courseId}`,
      );
      return response.data;
    } catch (error) {
      console.warn(
        `[assignmentService] Fetching batches for course ${courseId} failed:`,
        error,
      );
      return [];
    }
  },

  /**
   * Enroll a student in a batch via POST /api/v1/students/batches/{batchId}/enroll
   */
  async enrollInBatch(batchId: string): Promise<any> {
    // Map batch to course
    let courseId = 1;
    if (batchId.includes("compliance") || batchId.includes("gdpr")) {
      courseId = 3;
    } else if (batchId.includes("cyber")) {
      courseId = 1;
    } else if (batchId.includes("ldr") || batchId.includes("lead")) {
      courseId = 2;
    } else if (batchId.includes("pm") || batchId.includes("project")) {
      courseId = 5;
    } else if (batchId.includes("diversity")) {
      courseId = 4;
    } else {
      const num = parseInt(batchId.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num)) {
        courseId = num;
      }
    }

    enrollmentService.enroll(courseId);

    const currentBatches = JSON.parse(
      localStorage.getItem("enrolled_batch_ids") || "[]",
    );
    if (!currentBatches.includes(batchId)) {
      currentBatches.push(batchId);
      localStorage.setItem(
        "enrolled_batch_ids",
        JSON.stringify(currentBatches),
      );
    }

    if (isMockMode()) {
      return { status: "success", batchId, courseId };
    }

    try {
      const response = await apiClient.post(
        `/students/batches/${batchId}/enroll`,
      );
      return response.data;
    } catch (error) {
      console.warn(
        "[assignmentService] Enrolling in batch via live backend failed, saved to local store only:",
        error,
      );
      return { status: "success", batchId, courseId };
    }
  },

  /**
   * Fetch all assignments from Spring Boot backend (or localStorage in mock mode)
   */
  async getAssignments(): Promise<Assignment[]> {
    if (isMockMode()) {
      return getStoredAssignments();
    }
    try {
      const response = await apiClient.get<any[]>("/assignments");
      return response.data.map((dto) => ({
        id: dto.id.toString(),
        title: dto.title,
        description: dto.description || "",
        courseId: dto.courseId,
        courseTitle: dto.courseTitle,
        assignedBatchIds: dto.assignedBatchIds || [],
        assignedBatchNames: dto.assignedBatchNames || [],
        totalMarks: dto.maxMarks,
        durationMinutes: dto.timeLimitMinutes,
        dueDate: dto.dueDate ? new Date(dto.dueDate).toISOString() : "",
        createdAt: dto.createdAt
          ? new Date(dto.createdAt).toISOString()
          : new Date().toISOString(),
        status: mapAssignmentStatusToFrontend(dto.status),
        questions: [],
        teacherId: dto.teacherId,
        teacherName: dto.teacherName,
        passingMarks: dto.passingMarks,
        maxAttempts:
          dto.maxAttempts === null || dto.maxAttempts === undefined
            ? "No limit"
            : String(dto.maxAttempts),
        autoSubmit: dto.autoSubmit !== undefined ? dto.autoSubmit : true,
        negativeMarking:
          dto.negativeMarking !== undefined ? dto.negativeMarking : false,
        showScoreImmediately:
          dto.showResultImmediately !== undefined
            ? dto.showResultImmediately
            : true,
        showDetailedAnswers:
          dto.showDetailedAnswers !== undefined
            ? dto.showDetailedAnswers
            : false,
        shuffleQuestions:
          dto.shuffleQuestions !== undefined ? dto.shuffleQuestions : true,
        shuffleOptions:
          dto.shuffleOptions !== undefined ? dto.shuffleOptions : true,
        allowLateSubmission:
          dto.allowLateSubmission !== undefined
            ? dto.allowLateSubmission
            : false,
        enableCertificates:
          dto.enableCertificates !== undefined ? dto.enableCertificates : false,
      }));
    } catch (error) {
      console.warn(
        "[assignmentService] Fetching assignments from live backend failed, falling back to mock data:",
        error,
      );
      return getStoredAssignments();
    }
  },

  /**
   * Fetch assignments assigned to batches that the authenticated student belongs to
   */
  async getStudentAssignments(): Promise<Assignment[]> {
    if (isMockMode()) {
      return getStoredAssignments();
    }
    try {
      const response = await apiClient.get<any[]>("/assignments/student/me");
      return response.data.map((dto) => ({
        id: dto.id.toString(),
        title: dto.title,
        description: dto.description || "",
        courseId: dto.courseId,
        courseTitle: dto.courseTitle,
        assignedBatchIds: dto.assignedBatchIds || [],
        assignedBatchNames: dto.assignedBatchNames || [],
        totalMarks: dto.maxMarks,
        durationMinutes: dto.timeLimitMinutes,
        dueDate: dto.dueDate ? new Date(dto.dueDate).toISOString() : "",
        createdAt: dto.createdAt
          ? new Date(dto.createdAt).toISOString()
          : new Date().toISOString(),
        status: mapAssignmentStatusToFrontend(dto.status),
        questions: [],
        teacherId: dto.teacherId,
        passingMarks: dto.passingMarks,
        maxAttempts:
          dto.maxAttempts === null || dto.maxAttempts === undefined
            ? "No limit"
            : String(dto.maxAttempts),
        autoSubmit: dto.autoSubmit !== undefined ? dto.autoSubmit : true,
        negativeMarking:
          dto.negativeMarking !== undefined ? dto.negativeMarking : false,
        showScoreImmediately:
          dto.showResultImmediately !== undefined
            ? dto.showResultImmediately
            : true,
        showDetailedAnswers:
          dto.showDetailedAnswers !== undefined
            ? dto.showDetailedAnswers
            : false,
        shuffleQuestions:
          dto.shuffleQuestions !== undefined ? dto.shuffleQuestions : true,
        shuffleOptions:
          dto.shuffleOptions !== undefined ? dto.shuffleOptions : true,
        allowLateSubmission:
          dto.allowLateSubmission !== undefined
            ? dto.allowLateSubmission
            : false,
        enableCertificates:
          dto.enableCertificates !== undefined ? dto.enableCertificates : false,
      }));
    } catch (error) {
      console.warn(
        "[assignmentService] Fetching student assignments from live backend failed, falling back to mock data:",
        error,
      );
      return getStoredAssignments();
    }
  },

  /**
   * Fetch a single assignment by ID
   */
  async getAssignmentById(id: string): Promise<Assignment> {
    if (isMockMode() || id.startsWith("a-")) {
      const found = getStoredAssignments().find((a) => a.id === id);
      if (!found) throw new Error(`Assignment with ID ${id} not found`);
      return found;
    }
    try {
      const response = await apiClient.get<any>(`/assignments/${id}`);
      const dto = response.data;

      const qResponse = await apiClient.get<any[]>(
        `/questions/assignment/${id}`,
      );
      const questions: Question[] = qResponse.data.map((q) => {
        let frontendDetails: any = {};
        try {
          if (q.description && q.description.startsWith("{")) {
            frontendDetails = JSON.parse(q.description);
          }
        } catch (e) {}

        const details = frontendDetails.details || {};

        if (q.options && q.options.length > 0) {
          if (!details.mcqDetails) {
            details.mcqDetails = { options: [], correctOptionIndex: 0 };
          }
          details.mcqDetails.options = q.options.map(
            (opt: any) => opt.optionText,
          );
          details.mcqDetails.optionIds = q.options.map((opt: any) =>
            opt.id?.toString(),
          );
          const correctIdx = q.options.findIndex((opt: any) => opt.isCorrect);
          if (correctIdx >= 0) {
            details.mcqDetails.correctOptionIndex = correctIdx;
          }
        }

        return {
          id: q.id.toString(),
          title: q.title,
          type: frontendDetails.frontendType || "MCQ",
          prompt: frontendDetails.prompt || q.title,
          points: q.marks,
          order: q.displayOrder,
          ...details,
        };
      });

      return {
        id: dto.id.toString(),
        title: dto.title,
        description: dto.description || "",
        courseId: dto.courseId,
        courseTitle: dto.courseTitle,
        assignedBatchIds: dto.assignedBatchIds || [],
        assignedBatchNames: dto.assignedBatchNames || [],
        totalMarks: dto.maxMarks,
        durationMinutes: dto.timeLimitMinutes,
        dueDate: dto.dueDate ? new Date(dto.dueDate).toISOString() : "",
        createdAt: dto.createdAt
          ? new Date(dto.createdAt).toISOString()
          : new Date().toISOString(),
        status: mapAssignmentStatusToFrontend(dto.status),
        questions: questions,
        teacherId: dto.teacherId,
        teacherName: dto.teacherName,
        passingMarks: dto.passingMarks,
        maxAttempts:
          dto.maxAttempts === null || dto.maxAttempts === undefined
            ? "No limit"
            : String(dto.maxAttempts),
        autoSubmit: dto.autoSubmit !== undefined ? dto.autoSubmit : true,
        negativeMarking:
          dto.negativeMarking !== undefined ? dto.negativeMarking : false,
        showScoreImmediately:
          dto.showResultImmediately !== undefined
            ? dto.showResultImmediately
            : true,
        showDetailedAnswers:
          dto.showDetailedAnswers !== undefined
            ? dto.showDetailedAnswers
            : false,
        shuffleQuestions:
          dto.shuffleQuestions !== undefined ? dto.shuffleQuestions : true,
        shuffleOptions:
          dto.shuffleOptions !== undefined ? dto.shuffleOptions : true,
        allowLateSubmission:
          dto.allowLateSubmission !== undefined
            ? dto.allowLateSubmission
            : false,
        enableCertificates:
          dto.enableCertificates !== undefined ? dto.enableCertificates : false,
      };
    } catch (error) {
      console.warn(
        `[assignmentService] Fetching assignment ${id} from live backend failed, falling back to mock data:`,
        error,
      );
      const found = getStoredAssignments().find((a) => a.id === id);
      if (!found) throw error;
      return found;
    }
  },

  /**
   * Save (create/update) a new assignment to Spring Boot backend (and local store)
   */
  async saveAssignment(assignment: Assignment): Promise<Assignment> {
    localSaveAssignment(assignment);

    if (isMockMode()) {
      return assignment;
    }
    try {
      const isNew = !assignment.id || isNaN(parseInt(assignment.id));

      const payload = {
        title: assignment.title,
        description: assignment.description,
        instructions: "",
        courseId: assignment.courseId,
        teacherId: assignment.teacherId || 1,
        status: mapAssignmentStatusToBackend(assignment.status),
        maxMarks: assignment.totalMarks || 100,
        passingMarks:
          assignment.passingMarks !== undefined &&
          assignment.passingMarks !== null
            ? assignment.passingMarks
            : 40,
        timeLimitMinutes: assignment.durationMinutes || 0,
        batchIds: assignment.assignedBatchIds || [],
        dueDate: assignment.dueDate
          ? assignment.dueDate.replace("Z", "")
          : null,
        availableFrom: new Date().toISOString().replace("Z", ""),
        maxAttempts:
          assignment.maxAttempts === "No limit" || !assignment.maxAttempts
            ? null
            : Number(assignment.maxAttempts),
        autoSubmit:
          assignment.autoSubmit !== undefined ? assignment.autoSubmit : true,
        negativeMarking:
          assignment.negativeMarking !== undefined
            ? assignment.negativeMarking
            : false,
        showResultImmediately:
          assignment.showScoreImmediately !== undefined
            ? assignment.showScoreImmediately
            : true,
        showDetailedAnswers:
          assignment.showDetailedAnswers !== undefined
            ? assignment.showDetailedAnswers
            : false,
        shuffleQuestions:
          assignment.shuffleQuestions !== undefined
            ? assignment.shuffleQuestions
            : true,
        shuffleOptions:
          assignment.shuffleOptions !== undefined
            ? assignment.shuffleOptions
            : true,
        allowLateSubmission:
          assignment.allowLateSubmission !== undefined
            ? assignment.allowLateSubmission
            : false,
        enableCertificates:
          assignment.enableCertificates !== undefined
            ? assignment.enableCertificates
            : false,
      };

      let savedAssignmentDto;
      if (isNew) {
        const response = await apiClient.post<any>("/assignments", payload);
        savedAssignmentDto = response.data;
      } else {
        const response = await apiClient.put<any>(
          `/assignments/${assignment.id}`,
          payload,
        );
        savedAssignmentDto = response.data;
      }

      // Handle Questions
      if (assignment.questions) {
        for (const q of assignment.questions) {
          const qPayload = {
            assignmentId: savedAssignmentDto.id,
            title: q.prompt
              ? q.prompt.substring(0, Math.min(250, q.prompt.length))
              : q.title || "Question",
            description: JSON.stringify({
              frontendType: q.type,
              prompt: q.prompt,
              details: {
                mcqDetails: q.mcqDetails,
                codingDetails: q.codingDetails,
                fileUploadDetails: q.fileUploadDetails,
              },
            }),
            questionType: mapQuestionTypeToBackend(q.type),
            marks: q.points || 10,
            displayOrder: q.order || 0,
            required: true,
            negativeMarks: 0,
            options:
              q.mcqDetails?.options?.map((opt, idx) => ({
                optionText: opt,
                isCorrect: q.mcqDetails?.correctOptionIndex === idx,
                displayOrder: idx,
              })) || [],
          };

          const isQNew = !q.id || isNaN(parseInt(q.id));
          if (isQNew) {
            await apiClient.post("/questions", qPayload);
          } else {
            await apiClient.put(`/questions/${q.id}`, qPayload);
          }
        }
      }

      assignment.id = savedAssignmentDto.id.toString();
      return assignment;
    } catch (error) {
      console.warn(
        "[assignmentService] Saving assignment to live backend failed, saved to local store only:",
        error,
      );
      return assignment;
    }
  },

  /**
   * Fetch all student submissions from Spring Boot backend (or local storage)
   */
  async getSubmissions(): Promise<Submission[]> {
    if (isMockMode()) {
      return getStoredSubmissions();
    }
    try {
      const response = await apiClient.get<any[]>("/submissions");
      return response.data.map((dto) => ({
        id: dto.id.toString(),
        assignmentId: dto.assignmentId.toString(),
        assignmentTitle: dto.assignmentTitle,
        studentId: dto.studentId.toString(),
        studentName: dto.studentName,
        submittedAt: dto.submittedAt
          ? new Date(dto.submittedAt).toISOString()
          : new Date().toISOString(),
        startedAt: dto.startedAt
          ? new Date(dto.startedAt).toISOString()
          : undefined,
        answers: dto.answers
          ? dto.answers.map((ans: any) => {
              let codingSub = undefined;
              try {
                if (ans.answerText && ans.answerText.includes('"code":')) {
                  codingSub = JSON.parse(ans.answerText);
                }
              } catch (e) {}

              let parsedPrompt = undefined;
              let parsedDetails = undefined;
              let parsedFrontendType = undefined;
              try {
                if (ans.questionPrompt && ans.questionPrompt.startsWith("{")) {
                  const parsed = JSON.parse(ans.questionPrompt);
                  parsedPrompt = parsed.prompt;
                  parsedDetails = parsed.details;
                  parsedFrontendType = parsed.frontendType;
                }
              } catch (e) {}

              const optionsList = ans.options
                ? ans.options.map((o: any) => ({
                    id: o.id.toString(),
                    optionText: o.optionText,
                    isCorrect: o.isCorrect,
                  }))
                : undefined;

              let mcqSelectedIndex = undefined;
              if (optionsList && ans.selectedOptionId) {
                const selIdStr = ans.selectedOptionId.toString();
                const idx = optionsList.findIndex(
                  (o: any) => o.id === selIdStr,
                );
                if (idx !== -1) {
                  mcqSelectedIndex = idx;
                }
              }

              return {
                questionId: ans.questionId.toString(),
                questionType: mapQuestionTypeToFrontend(
                  ans.questionType,
                  !!codingSub,
                ),
                questionTitle: ans.questionTitle,
                questionPrompt: ans.questionPrompt,
                parsedPrompt: parsedPrompt,
                parsedDetails: parsedDetails,
                frontendType: parsedFrontendType,
                maxMarks: ans.maxMarks,
                options: optionsList,
                mcqSelectedIndex,
                pointsEarned: ans.obtainedMarks,
                teacherFeedback: ans.teacherFeedback,
                selectedOptionId: ans.selectedOptionId?.toString(),
                selectedOptionText: ans.selectedOptionText,
                essayText: ans.answerText,
                shortAnswerText: ans.answerText,
                codingSubmission: codingSub,
                fileUploadData: ans.uploadedFileUrl
                  ? {
                      fileName:
                        ans.uploadedFileUrl.split("/").pop() || "uploaded_file",
                      fileUrl: ans.uploadedFileUrl,
                    }
                  : undefined,
              };
            })
          : [],
        score: dto.obtainedMarks,
        status: mapSubmissionStatusToFrontend(dto.status),
        graderFeedback: "",
        percentage: dto.percentage,
        totalMarks: dto.totalMarks,
      }));
    } catch (error) {
      console.warn(
        "[assignmentService] Fetching submissions from live backend failed, falling back to mock data:",
        error,
      );
      return getStoredSubmissions();
    }
  },

  /**
   * Fetch submissions belonging to the authenticated student
   */
  async getStudentSubmissions(): Promise<Submission[]> {
    if (isMockMode()) {
      return getStoredSubmissions();
    }
    try {
      const response = await apiClient.get<any[]>("/submissions/student/me");
      return response.data.map((dto) => ({
        id: dto.id.toString(),
        assignmentId: dto.assignmentId.toString(),
        assignmentTitle: dto.assignmentTitle,
        studentId: dto.studentId.toString(),
        studentName: dto.studentName,
        submittedAt: dto.submittedAt
          ? new Date(dto.submittedAt).toISOString()
          : new Date().toISOString(),
        startedAt: dto.startedAt
          ? new Date(dto.startedAt).toISOString()
          : undefined,
        answers: dto.answers
          ? dto.answers.map((ans: any) => {
              let codingSub = undefined;
              try {
                if (ans.answerText && ans.answerText.includes('"code":')) {
                  codingSub = JSON.parse(ans.answerText);
                }
              } catch (e) {}

              let parsedPrompt = undefined;
              let parsedDetails = undefined;
              let parsedFrontendType = undefined;
              try {
                if (ans.questionPrompt && ans.questionPrompt.startsWith("{")) {
                  const parsed = JSON.parse(ans.questionPrompt);
                  parsedPrompt = parsed.prompt;
                  parsedDetails = parsed.details;
                  parsedFrontendType = parsed.frontendType;
                }
              } catch (e) {}

              const optionsList = ans.options
                ? ans.options.map((o: any) => ({
                    id: o.id.toString(),
                    optionText: o.optionText,
                    isCorrect: o.isCorrect,
                  }))
                : undefined;

              let mcqSelectedIndex = undefined;
              if (optionsList && ans.selectedOptionId) {
                const selIdStr = ans.selectedOptionId.toString();
                const idx = optionsList.findIndex(
                  (o: any) => o.id === selIdStr,
                );
                if (idx !== -1) {
                  mcqSelectedIndex = idx;
                }
              }

              return {
                questionId: ans.questionId.toString(),
                questionType: mapQuestionTypeToFrontend(
                  ans.questionType,
                  !!codingSub,
                ),
                questionTitle: ans.questionTitle,
                questionPrompt: ans.questionPrompt,
                parsedPrompt: parsedPrompt,
                parsedDetails: parsedDetails,
                frontendType: parsedFrontendType,
                maxMarks: ans.maxMarks,
                options: optionsList,
                mcqSelectedIndex,
                pointsEarned: ans.obtainedMarks,
                teacherFeedback: ans.teacherFeedback,
                selectedOptionId: ans.selectedOptionId?.toString(),
                selectedOptionText: ans.selectedOptionText,
                essayText: ans.answerText,
                shortAnswerText: ans.answerText,
                codingSubmission: codingSub,
                fileUploadData: ans.uploadedFileUrl
                  ? {
                      fileName:
                        ans.uploadedFileUrl.split("/").pop() || "uploaded_file",
                      fileUrl: ans.uploadedFileUrl,
                    }
                  : undefined,
              };
            })
          : [],
        score: dto.obtainedMarks,
        status: mapSubmissionStatusToFrontend(dto.status),
        graderFeedback: "",
        percentage: dto.percentage,
        totalMarks: dto.totalMarks,
      }));
    } catch (error) {
      console.warn(
        "[assignmentService] Fetching student submissions from live backend failed, falling back to mock data:",
        error,
      );
      return getStoredSubmissions();
    }
  },

  /**
   * Start a student attempt
   */
  async startAttempt(assignmentId: string, studentId: string): Promise<any> {
    const response = await apiClient.post<any>("/submissions/start", {
      assignmentId: parseInt(assignmentId),
      studentId: parseInt(studentId),
    });
    return response.data;
  },

  /**
   * Autosave draft
   */
  async saveDraft(submission: Submission): Promise<Submission> {
    const payload = {
      assignmentId: parseInt(submission.assignmentId),
      studentId: parseInt(submission.studentId),
      timeTakenMinutes: 0,
      isLateSubmission: false,
      answers: submission.answers.map((ans) => {
        let textVal: string | null = null;
        if (ans.essayText) textVal = ans.essayText;
        else if (ans.shortAnswerText) textVal = ans.shortAnswerText;
        else if (ans.codingSubmission)
          textVal = JSON.stringify(ans.codingSubmission);

        return {
          questionId: parseInt(ans.questionId),
          selectedOptionId: ans.selectedOptionId
            ? parseInt(ans.selectedOptionId as string)
            : undefined,
          answerText: textVal,
          uploadedFileUrl: ans.fileUploadData?.fileUrl || null,
        };
      }),
    };
    // Send a PUT request as requested
    const response = await apiClient.put<any>(
      `/submissions/save?id=${submission.id}`,
      payload,
    );
    submission.id = response.data.id?.toString() || submission.id;
    return submission;
  },

  /**
   * Save / Submit a student attempt to Spring Boot backend (and local store)
   */
  async submitAttempt(submission: Submission): Promise<Submission> {
    const payload = {
      assignmentId: parseInt(submission.assignmentId),
      studentId: parseInt(submission.studentId),
      timeTakenMinutes: 0,
      isLateSubmission: false,
      answers: submission.answers.map((ans) => {
        let textVal: string | null = null;
        if (ans.essayText) textVal = ans.essayText;
        else if (ans.shortAnswerText) textVal = ans.shortAnswerText;
        else if (ans.codingSubmission)
          textVal = JSON.stringify(ans.codingSubmission);

        return {
          questionId: parseInt(ans.questionId),
          selectedOptionId: ans.selectedOptionId
            ? parseInt(ans.selectedOptionId as string)
            : undefined,
          answerText: textVal,
          uploadedFileUrl: ans.fileUploadData?.fileUrl || null,
        };
      }),
    };

    const response = await apiClient.post<any>(
      `/submissions/submit?id=${submission.id}`,
      payload,
    );
    submission.id = response.data.id.toString();
    return submission;
  },

  /**
   * Grade a submission
   */
  async gradeSubmission(
    submissionId: string,
    submission: Submission,
  ): Promise<Submission> {
    if (isMockMode()) {
      localSaveSubmission(submission);
      return submission;
    }
    try {
      const payload = {
        status: mapSubmissionStatusToBackend(submission.status),
        obtainedMarks: submission.score || 0,
        percentage: 0,
        timeTakenMinutes: 0,
        answers: submission.answers.map((ans) => ({
          questionId: Number(ans.questionId),
          obtainedMarks: ans.pointsEarned || 0,
          teacherFeedback: ans.teacherFeedback || "",
        })),
      };

      const response = await apiClient.post<any>(
        `/submissions/${submissionId}/grade`,
        payload,
      );
      return submission; // In a real app we might want to return the updated response mapped to frontend format
    } catch (error) {
      console.warn("[assignmentService] Grading submission failed:", error);
      return submission;
    }
  },
};

export default assignmentService;
  