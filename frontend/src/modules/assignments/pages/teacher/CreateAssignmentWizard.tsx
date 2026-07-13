import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ClipboardList,
  Sliders,
  Eye,
  CheckCircle,
  Clock,
  BookOpen,
  Code,
  FileText,
  MessageSquare,
  CheckSquare,
  Upload,
  Sparkles,
  MoreHorizontal,
  Copy,
  Settings as SettingsIcon,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  Search,
  Grid,
  Bell,
  Smartphone,
  Monitor,
  Check,
  Layout,
  BookMarked
} from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import { assignmentService } from "../../api/assignmentService";
import { useAuthenticatedQuery } from "../../api/useAuthenticatedQuery";

// Local structures
type QuestionType = "MCQ" | "Coding" | "Essay" | "ShortAnswer" | "True/False" | "FileUpload";

interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  options?: string[];
  correctOptionIndex?: number;
  starterCode?: string;
  language?: string;
}

export const CreateAssignmentWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id: editAssignmentId } = useParams<{ id: string }>();
  const { showToast, currentUser } = useApp();
  const [step, setStep] = useState<number>(1);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Import from Excel States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importPreviewList, setImportPreviewList] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basic Info Details
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");

  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  useEffect(() => {
    if (editAssignmentId) {
      setIsLoadingEdit(true);
      assignmentService.getAssignmentById(editAssignmentId)
        .then(assignment => {
          setTitle(assignment.title || "");
          setDescription(assignment.description || "");
          setCourse(assignment.courseId?.toString() || "");
          if (assignment.assignedBatchIds && assignment.assignedBatchIds.length > 0) {
            setBatch(assignment.assignedBatchIds[0].toString());
          }
          setDuration(assignment.durationMinutes || 60);
          setPassingMarks(assignment.passingMarks !== undefined && assignment.passingMarks !== null ? assignment.passingMarks : 40);
          setMaxAttempts(assignment.maxAttempts !== undefined && assignment.maxAttempts !== null ? (assignment.maxAttempts === "0" ? "No limit" : assignment.maxAttempts) : "1");
          setTimeLimit(assignment.durationMinutes ? String(assignment.durationMinutes) : "No limit");
          setAutoSubmit(assignment.autoSubmit !== undefined ? assignment.autoSubmit : true);
          setNegativeMarking(assignment.negativeMarking !== undefined ? assignment.negativeMarking : false);
          setShowScoreImmediately(assignment.showScoreImmediately !== undefined ? assignment.showScoreImmediately : true);
          setShowDetailedAnswers(assignment.showDetailedAnswers !== undefined ? assignment.showDetailedAnswers : false);
          setShuffleQuestions(assignment.shuffleQuestions !== undefined ? assignment.shuffleQuestions : true);
          setShuffleOptions(assignment.shuffleOptions !== undefined ? assignment.shuffleOptions : true);
          setAllowLateSubmission(assignment.allowLateSubmission !== undefined ? assignment.allowLateSubmission : false);
          setEnableCertificates(assignment.enableCertificates !== undefined ? assignment.enableCertificates : false);
          
          if (assignment.questions) {
            const mapped = assignment.questions.map(q => {
              const res: Question = {
                id: q.id,
                type: q.type as QuestionType,
                prompt: q.prompt || q.title || "",
                points: q.points || 10,
                difficulty: "Intermediate"
              };
              if (res.type === "MCQ") {
                res.options = q.mcqDetails?.options || ["Option 1", "Option 2"];
                res.correctOptionIndex = q.mcqDetails?.correctOptionIndex ?? 0;
              }
              if (res.type === "Coding") {
                res.starterCode = q.codingDetails?.starterCode || "";
                res.language = q.codingDetails?.language || "javascript";
              }
              return res;
            });
            setQuestions(mapped);
          }
        })
        .finally(() => {
          setIsLoadingEdit(false);
        });
    }
  }, [editAssignmentId]);
  const [assignmentType, setAssignmentType] = useState<"Theory" | "Practical">("Theory");

  const { data: coursesData } = useAuthenticatedQuery<any[]>(
    () => assignmentService.getCourses(),
    []
  );

  const { data: batchesData } = useAuthenticatedQuery<any[]>(
    () => (course ? assignmentService.getBatchesForCourse(course) : Promise.resolve([])),
    [course]
  );

  // Set default course/batch when data loads
  useEffect(() => {
    if (coursesData && coursesData.length > 0 && !course) {
      setCourse(coursesData[0].id.toString());
    }
  }, [coursesData, course]);

  useEffect(() => {
    if (batchesData && batchesData.length > 0 && !batch) {
      setBatch(batchesData[0].id.toString());
    }
  }, [batchesData, batch]);
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [duration, setDuration] = useState<number>(60);
  const [passingMarks, setPassingMarks] = useState<number>(40);
  const [description, setDescription] = useState("");
  const [studentInstructions, setStudentInstructions] = useState("");

  // Step 2: Question Builder State
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q-1",
      type: "MCQ",
      prompt: "What is the primary difference between a 'Functional Interface' and a regular interface in Java 8?",
      points: 10,
      difficulty: "Intermediate",
      options: [
        "It can have multiple abstract methods.",
        "It must have exactly one abstract method.",
        "It cannot have default methods.",
        "It is used exclusively for UI design."
      ],
      correctOptionIndex: 1,
    }
  ]);

  const totalMarks = questions.reduce((sum, q) => sum + q.points, 0);
  const totalPoints = totalMarks;

  // Step 3: Attempts, Timing, Grading, Submission settings
  const [maxAttempts, setMaxAttempts] = useState<string>("1");
  const [timeLimit, setTimeLimit] = useState<string>("No limit");
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [showScoreImmediately, setShowScoreImmediately] = useState(true);
  const [showDetailedAnswers, setShowDetailedAnswers] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [enableCertificates, setEnableCertificates] = useState(false);

  // Quick Action triggers
  const handleAIAddQuestion = () => {
    const aiQuestion: Question = {
      id: `q-ai-${Date.now()}`,
      type: "MCQ",
      prompt: "Which cloud deployment model provides the highest level of resource isolation and security control?",
      points: 10,
      difficulty: "Advanced",
      options: [
        "Public Cloud",
        "Hybrid Cloud",
        "Private Cloud / On-Premise Sandbox",
        "Multi-Tenant Community Cloud"
      ],
      correctOptionIndex: 2
    };
    setQuestions([...questions, aiQuestion]);
    showToast("AI model generated an Advanced Cloud Question!", "success");
  };

  const downloadExcelTemplate = () => {
    const headers = [
      ["Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Marks"],
      ["What is the primary difference between a 'Functional Interface' and a regular interface in Java 8?", "It can have multiple abstract methods.", "It must have exactly one abstract method.", "It cannot have default methods.", "It is used exclusively for UI design.", "B", "10"],
      ["Which cloud deployment model provides the highest level of resource isolation and security control?", "Public Cloud", "Hybrid Cloud", "Private Cloud / On-Premise Sandbox", "Multi-Tenant Community Cloud", "C", "10"]
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MCQ Template");
    
    XLSX.writeFile(workbook, "mcq_import_template.xlsx");
    showToast("Excel template downloaded successfully!", "success");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          showToast("The uploaded file is empty or missing data rows.", "error");
          return;
        }

        // Parse headers
        const headers = (rows[0] as any[]).map(h => h?.toString().trim().toLowerCase());
        const expectedHeaders = ["question", "option a", "option b", "option c", "option d", "correct answer", "marks"];
        
        const headerIndices: Record<string, number> = {};
        expectedHeaders.forEach((eh) => {
          headerIndices[eh] = headers.indexOf(eh);
        });

        // Check if any expected header is missing
        const missingHeaders = expectedHeaders.filter((eh) => headerIndices[eh] === -1);
        if (missingHeaders.length > 0) {
          showToast(`Invalid template. Missing columns: ${missingHeaders.map(h => h.toUpperCase()).join(", ")}`, "error");
          return;
        }

        const parsedQuestions: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          // Skip completely empty rows
          if (!row || row.length === 0 || row.every((cell: any) => cell === undefined || cell === null || cell.toString().trim() === "")) {
            continue;
          }

          const rowNum = i + 1; // 1-based index for display in error list
          const rowErrors: string[] = [];

          const questionText = row[headerIndices["question"]]?.toString().trim();
          const optA = row[headerIndices["option a"]]?.toString().trim();
          const optB = row[headerIndices["option b"]]?.toString().trim();
          const optC = row[headerIndices["option c"]]?.toString().trim();
          const optD = row[headerIndices["option d"]]?.toString().trim();
          const correctAns = row[headerIndices["correct answer"]]?.toString().trim().toUpperCase();
          const marksRaw = row[headerIndices["marks"]];

          // 1. Question cannot be empty
          if (!questionText) {
            rowErrors.push("Question cannot be empty.");
          }

          // 2. Four options are required
          if (!optA || !optB || !optC || !optD) {
            rowErrors.push("Four options are required (Option A, B, C, D cannot be empty).");
          }

          // 3. Correct Answer must be A, B, C or D
          if (!correctAns || !["A", "B", "C", "D"].includes(correctAns)) {
            rowErrors.push("Correct Answer must be A, B, C or D.");
          }

          // 4. Marks must be numeric and greater than zero
          const marks = Number(marksRaw);
          if (marksRaw === undefined || marksRaw === null || isNaN(marks) || marks <= 0) {
            rowErrors.push("Marks must be a numeric value greater than zero.");
          }

          if (rowErrors.length > 0) {
            errors.push(`Row ${rowNum}: ${rowErrors.join(" | ")}`);
          } else {
            const letterToIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
            parsedQuestions.push({
              prompt: questionText,
              options: [optA, optB, optC, optD],
              correctOptionIndex: letterToIndex[correctAns!],
              points: marks,
              difficulty: "Intermediate", // Default difficulty
              rowNum
            });
          }
        }

        // Reset file input value so same file can be uploaded again
        e.target.value = "";

        if (errors.length > 0) {
          setImportErrors(errors);
          setImportPreviewList([]);
          setIsImportModalOpen(true);
        } else if (parsedQuestions.length === 0) {
          showToast("No valid rows found to import.", "info");
        } else {
          setImportErrors([]);
          setImportPreviewList(parsedQuestions);
          setIsImportModalOpen(true);
        }
      } catch (err) {
        console.error(err);
        showToast("Error parsing Excel file.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = () => {
    const newQuestions = importPreviewList.map((q, idx) => ({
      id: `q-imported-${Date.now()}-${idx}`,
      type: "MCQ" as QuestionType,
      prompt: q.prompt,
      points: q.points,
      difficulty: q.difficulty,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex
    }));

    setQuestions([...questions, ...newQuestions]);
    setIsImportModalOpen(false);
    setImportPreviewList([]);
    showToast(`Successfully imported ${newQuestions.length} MCQ question(s)!`, "success");
  };

  const addQuestionOfType = (type: QuestionType) => {
    let newQ: Question = {
      id: `q-${Date.now()}`,
      type,
      prompt: type === "Coding" ? "Write a function that parses a raw JSON stream safely." : `New ${type} question prompt...`,
      points: 10,
      difficulty: "Intermediate"
    };

    if (type === "MCQ") {
      newQ.options = ["Option A", "Option B", "Option C", "Option D"];
      newQ.correctOptionIndex = 0;
    } else if (type === "Coding") {
      newQ.starterCode = "export function solve(stream) {\n  // Write solution code here\n}";
      newQ.language = "javascript";
    }

    setQuestions([...questions, newQ]);
    showToast(`Added ${type} question template.`, "info");
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    showToast("Question removed", "info");
  };

  const updateQuestionPrompt = (id: string, prompt: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, prompt } : q)));
  };

  const updateQuestionPoints = (id: string, points: number) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, points } : q)));
  };

  const updateMCQOptionValue = (qId: string, optIdx: number, val: string) => {
    setQuestions(questions.map((q) => {
      if (q.id === qId && q.options) {
        const nextOpts = [...q.options];
        nextOpts[optIdx] = val;
        return { ...q, options: nextOpts };
      }
      return q;
    }));
  };

  const updateMCQCorrectIndex = (qId: string, idx: number) => {
    setQuestions(questions.map((q) => {
      if (q.id === qId) {
        return { ...q, correctOptionIndex: idx };
      }
      return q;
    }));
  };

  const cloneQuestion = (q: Question) => {
    const cloned = { ...q, id: `q-clone-${Date.now()}` };
    setQuestions([...questions, cloned]);
    showToast("Question cloned successfully", "success");
  };

  const handlePublish = async () => {
    if (passingMarks <= 0) {
      showToast("Passing Marks must be greater than zero.", "error");
      return;
    }
    if (passingMarks > totalPoints) {
      showToast(`Passing Marks cannot exceed the total marks of ${totalPoints}.`, "error");
      return;
    }

    const mappedQuestions: any[] = questions.map((q, idx) => {
      const mappedQ: any = {
        id: q.id,
        type: q.type === "True/False" ? "MCQ" : q.type,
        title: `${q.type} Question ${idx + 1}`,
        prompt: q.prompt,
        points: Number(q.points),
        order: idx + 1,
      };

      if (q.type === "MCQ" || q.type === "True/False") {
        mappedQ.mcqDetails = {
          options: q.options || ["True", "False"],
          correctOptionIndex: q.correctOptionIndex ?? 0
        };
      } else if (q.type === "Coding") {
        mappedQ.codingDetails = {
          starterCode: q.starterCode || "",
          language: q.language || "javascript",
          testCases: [
            { id: `tc-${q.id}-1`, input: "1", expectedOutput: "1" }
          ]
        };
      } else if (q.type === "FileUpload") {
        mappedQ.fileUploadDetails = {
          allowedExtensions: [".pdf", ".png", ".jpg", ".zip"],
          maxSizeMB: 10
        };
      }

      return mappedQ;
    });

    const selectedCourse = coursesData?.find((c: any) => c.id.toString() === course);
    const selectedBatch = batchesData?.find((b: any) => b.id.toString() === batch);

    const newAssignment: any = {
      id: editAssignmentId,
      title: title,
      description: description || "Assessment covering " + title,
      courseId: selectedCourse?.id || 1,
      courseTitle: selectedCourse?.title || "Unknown Course",
      assignedBatchIds: selectedBatch?.id ? [Number(selectedBatch.id)] : [],
      assignedBatchNames: selectedBatch?.name ? [selectedBatch.name] : [],
      totalMarks: totalPoints,
      durationMinutes: Number(duration),
      dueDate: "2026-10-24T00:00:00", // Backend expects ISO datetime
      status: "Published",
      questions: mappedQuestions,
      teacherId: currentUser?.id || 3,
      passingMarks: passingMarks,
      maxAttempts: maxAttempts,
      autoSubmit: autoSubmit,
      negativeMarking: negativeMarking,
      showScoreImmediately: showScoreImmediately,
      showDetailedAnswers: showDetailedAnswers,
      shuffleQuestions: shuffleQuestions,
      shuffleOptions: shuffleOptions,
      allowLateSubmission: allowLateSubmission,
      enableCertificates: enableCertificates,
    };

    await assignmentService.saveAssignment(newAssignment);
    showToast("Successfully published assignment capsule!", "success");
    navigate("/teacher/dashboard");
  };

  const handleSaveDraft = async () => {
    if (passingMarks <= 0) {
      showToast("Passing Marks must be greater than zero.", "error");
      return;
    }
    if (passingMarks > totalPoints) {
      showToast(`Passing Marks cannot exceed the total marks of ${totalPoints}.`, "error");
      return;
    }

    const mappedQuestions: any[] = questions.map((q, idx) => {
      const mappedQ: any = {
        id: q.id,
        type: q.type === "True/False" ? "MCQ" : q.type,
        title: `${q.type} Question ${idx + 1}`,
        prompt: q.prompt,
        points: Number(q.points),
        order: idx + 1,
      };

      if (q.type === "MCQ" || q.type === "True/False") {
        mappedQ.mcqDetails = {
          options: q.options || ["True", "False"],
          correctOptionIndex: q.correctOptionIndex ?? 0
        };
      } else if (q.type === "Coding") {
        mappedQ.codingDetails = {
          starterCode: q.starterCode || "",
          language: q.language || "javascript",
          testCases: [
            { id: `tc-${q.id}-1`, input: "1", expectedOutput: "1" }
          ]
        };
      } else if (q.type === "FileUpload") {
        mappedQ.fileUploadDetails = {
          allowedExtensions: [".pdf", ".png", ".jpg", ".zip"],
          maxSizeMB: 10
        };
      }

      return mappedQ;
    });

    const selectedCourse = coursesData?.find((c: any) => c.id.toString() === course);
    const selectedBatch = batchesData?.find((b: any) => b.id.toString() === batch);

    const newAssignment: any = {
      id: editAssignmentId,
      title: title,
      description: description || "Assessment covering " + title,
      courseId: selectedCourse?.id || 1,
      courseTitle: selectedCourse?.title || "Unknown Course",
      assignedBatchIds: selectedBatch?.id ? [Number(selectedBatch.id)] : [],
      assignedBatchNames: selectedBatch?.name ? [selectedBatch.name] : [],
      totalMarks: totalPoints,
      durationMinutes: Number(duration),
      dueDate: "2026-10-24T00:00:00", // Backend expects ISO datetime
      status: "Draft",
      questions: mappedQuestions,
      teacherId: currentUser?.id || 3,
      passingMarks: passingMarks,
      maxAttempts: maxAttempts,
      autoSubmit: autoSubmit,
      negativeMarking: negativeMarking,
      showScoreImmediately: showScoreImmediately,
      showDetailedAnswers: showDetailedAnswers,
      shuffleQuestions: shuffleQuestions,
      shuffleOptions: shuffleOptions,
      allowLateSubmission: allowLateSubmission,
      enableCertificates: enableCertificates,
    };

    await assignmentService.saveAssignment(newAssignment);
    showToast("Successfully saved assignment as Draft!", "success");
    navigate("/teacher/dashboard");
  };

  // Computations

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-12 font-sans" id="create-assignment-wizard-page">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-150/60 py-4 px-6 md:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#6C1D5F]/5 rounded-xl text-[#6C1D5F]">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#6C1D5F] tracking-widest bg-[#6C1D5F]/5 px-2 py-0.5 rounded-md">
                Xebia LMS Core
              </span>
              <span className="text-[10px] font-mono font-medium text-gray-400">/</span>
              <span className="text-[10px] font-mono font-medium text-gray-400">Assignments</span>
            </div>
            <h1 className="text-xl font-display font-extrabold text-[#1b1c1c] tracking-tight mt-0.5">
              {editAssignmentId ? "Edit Assignment" : "Create Assignment"}
            </h1>
          </div>
        </div>

        {/* User Info & Quick save */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleSaveDraft}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-sm font-semibold rounded-lg text-gray-600 cursor-pointer shadow-2xs transition-all"
          >
            <Save className="w-4 h-4 text-gray-400" />
            Save Draft
          </button>
          
          <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
            <div className="text-right hidden md:block">
              <h4 className="text-xs font-bold text-gray-900 leading-tight">Sarah Jenkins</h4>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Senior Instructor</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C1D5F] to-[#9e2e93] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              SJ
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-2xl border border-gray-150/60 p-6 shadow-2xs">
          <div className="flex items-center justify-between relative">
            {/* Background progress bars */}
            <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-gray-100 -z-0" />
            <div 
              className="absolute top-[18px] left-[10%] h-0.5 bg-[#6C1D5F] transition-all duration-300 -z-0" 
              style={{ width: `${(step - 1) * 26.6}%` }}
            />

            {[
              { num: 1, label: "Basic Info" },
              { num: 2, label: "Question Builder" },
              { num: 3, label: "Settings" },
              { num: 4, label: "Preview" },
            ].map((s) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  className="flex flex-col items-center gap-2 focus:outline-none relative z-10 shrink-0 cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border duration-300 ${
                      isActive
                        ? "bg-[#6C1D5F] text-white border-[#6C1D5F] shadow-sm shadow-[#6C1D5F]/25"
                        : isCompleted
                        ? "bg-[#6C1D5F] text-white border-[#6C1D5F]"
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-white" strokeWidth={3} /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold tracking-tight transition-colors duration-200 ${
                      isActive ? "text-[#6C1D5F] font-bold" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Workspace Grid */}
      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 md:px-8">
        
        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6" id="step-basic-info">
            <div className="bg-white rounded-2xl border border-gray-150/60 p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-display font-extrabold text-[#1b1c1c]">Assignment Details</h2>
                <p className="text-xs text-[#5A5A5A] mt-1">Define the core identity and parameters of your new learning assessment.</p>
              </div>

              {/* Assignment Title */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced System Architecture Case Study"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#1b1c1c] placeholder-gray-400 focus:outline-none focus:border-[#6C1D5F] focus:ring-4 focus:ring-[#6C1D5F]/5 transition-all"
                />
              </div>

              {/* Course & Batch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                    Course
                  </label>
                  <div className="relative">
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#1b1c1c] appearance-none focus:outline-none focus:border-[#6C1D5F] focus:ring-4 focus:ring-[#6C1D5F]/5 transition-all cursor-pointer"
                    >
                      {coursesData?.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                    Batch
                  </label>
                  <div className="relative">
                    <select
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#1b1c1c] appearance-none focus:outline-none focus:border-[#6C1D5F] focus:ring-4 focus:ring-[#6C1D5F]/5 transition-all cursor-pointer"
                    >
                      {batchesData?.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Type & Difficulty chips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                    Assignment Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAssignmentType("Theory")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        assignmentType === "Theory"
                          ? "bg-[#6C1D5F]/10 border-[#6C1D5F] text-[#6C1D5F]"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      Theory
                    </button>
                    <button
                      onClick={() => setAssignmentType("Practical")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        assignmentType === "Practical"
                          ? "bg-[#6C1D5F]/10 border-[#6C1D5F] text-[#6C1D5F]"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Code className="w-4 h-4" />
                      Practical
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                    Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    {(["Beginner", "Intermediate", "Advanced"] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`flex-1 py-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          difficulty === diff
                            ? "bg-[#6C1D5F]/10 border-[#6C1D5F] text-[#6C1D5F]"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Three inputs: Duration, Total Marks, Passing Marks */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                    Duration (Mins)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#1b1c1c] focus:outline-none focus:border-[#6C1D5F] transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                    Assignment Total
                  </label>
                  <input
                    type="number"
                    value={totalMarks}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#1b1c1c] focus:outline-none focus:border-[#6C1D5F] transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Markdown Textareas section */}
            <div className="bg-white rounded-2xl border border-gray-150/60 p-8 shadow-xs space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                    Assignment Description
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Markdown supported</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide a high-level overview of the assignment objectives..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#1b1c1c] placeholder-gray-400 focus:outline-none focus:border-[#6C1D5F] transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                    Student Instructions
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Markdown supported</span>
                </div>
                <textarea
                  value={studentInstructions}
                  onChange={(e) => setStudentInstructions(e.target.value)}
                  rows={4}
                  placeholder="What should the students know before starting? (e.g. Tools required, reference material)..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#1b1c1c] placeholder-gray-400 focus:outline-none focus:border-[#6C1D5F] transition-all"
                />
              </div>
            </div>

            {/* Pro Tip warning box */}
            <div className="bg-[#6C1D5F]/5 border border-[#6C1D5F]/10 rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-[#6C1D5F]/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#6C1D5F]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#6C1D5F]">Pro Tip: Defining Duration</h4>
                <p className="text-xs text-[#5A5A5A] leading-relaxed">
                  Ensure the duration is at least 15% more than the average completion time to account for technical setups. Marks are automatically recalculated when adding questions in the next step.
                </p>
              </div>
            </div>

            {/* Bottom Nav Actions Bar */}
            <div className="bg-white rounded-2xl border border-gray-150/60 p-4 flex items-center justify-between shadow-2xs">
              <button
                onClick={() => navigate("/teacher/dashboard")}
                className="px-5 py-2.5 text-xs font-semibold hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-150 cursor-pointer"
              >
                Discard Changes
              </button>
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Step 1 of 4: Basic Information
              </span>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                Continue to Question Builder
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Question Builder */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" id="step-question-builder">
            {/* Sidebar with Add Options */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-150/60 p-6 shadow-2xs h-fit space-y-6">
              <div>
                <h3 className="text-xs font-mono font-extrabold uppercase text-gray-400 tracking-wider">
                  Add Questions
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { type: "MCQ" as QuestionType, label: "Multiple Choice", icon: ClipboardList },
                  { type: "Coding" as QuestionType, label: "Coding Problem", icon: Code },
                  { type: "Essay" as QuestionType, label: "Essay Question", icon: FileText },
                  { type: "ShortAnswer" as QuestionType, label: "Short Answer", icon: MessageSquare },
                  { type: "True/False" as QuestionType, label: "True/False", icon: CheckSquare },
                  { type: "FileUpload" as QuestionType, label: "File Upload", icon: Upload },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => addQuestionOfType(item.type)}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-gray-150 rounded-xl text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <hr className="border-gray-100" />

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => showToast("Loaded questions library bank", "info")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-left text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                  Question Bank
                </button>
                <button
                  onClick={downloadExcelTemplate}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-[#6C1D5F]/30 hover:bg-[#6C1D5F]/5 text-[#6C1D5F] rounded-xl text-left text-xs font-bold transition-all cursor-pointer shadow-3xs"
                  id="btn-download-excel-template"
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-[#6C1D5F]" />
                  ⬇ Download Excel Template
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#6C1D5F]/10 border border-[#6C1D5F]/30 text-[#6C1D5F] hover:bg-[#6C1D5F]/15 rounded-xl text-left text-xs font-bold transition-all cursor-pointer shadow-3xs"
                  id="btn-import-excel"
                >
                  <Upload className="w-4 h-4 shrink-0 text-[#6C1D5F]" />
                  📄 Import from Excel
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelUpload}
                  accept=".xlsx"
                  className="hidden"
                />
              </div>
            </div>

            {/* Main Assignment Builder List */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-[#1b1c1c]">
                    Assignment Questions ({questions.length})
                  </h2>
                </div>
                <span className="px-3 py-1.5 bg-[#6C1D5F]/10 text-[#6C1D5F] font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider">
                  TOTAL POINTS: {totalPoints}
                </span>
              </div>

              {/* Questions Render Loop */}
              <div className="space-y-6">
                {questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-gray-150/80 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden"
                  >
                    {/* Header bar of Question card */}
                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5 cursor-grab">
                          <div className="flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                          </div>
                          <div className="flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                          </div>
                          <div className="flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                          </div>
                        </div>

                        <span className="text-xs font-mono font-extrabold text-[#6C1D5F]">Q{qIdx + 1}</span>
                        <span className="px-2.5 py-0.5 bg-[#6C1D5F]/10 text-[#6C1D5F] font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider">
                          {q.type === "MCQ" ? "Multiple Choice" : q.type}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400 font-mono">
                          Difficulty: {q.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cloneQuestion(q)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title="Clone Question"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question body */}
                    <div className="p-6 space-y-4">
                      <textarea
                        value={q.prompt}
                        onChange={(e) => updateQuestionPrompt(q.id, e.target.value)}
                        className="w-full bg-transparent font-display font-bold text-gray-950 placeholder-gray-400 border-none outline-none focus:ring-0 p-0 text-base"
                        placeholder="Write your question statement here..."
                        rows={2}
                      />

                      {/* Options Grid for MCQs */}
                      {q.type === "MCQ" && q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = q.correctOptionIndex === oIdx;
                            const optionLetters = ["A", "B", "C", "D"];

                            return (
                              <div
                                key={oIdx}
                                className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all ${
                                  isCorrect
                                    ? "bg-[#6C1D5F]/5 border-[#6C1D5F] text-[#6C1D5F] font-semibold"
                                    : "border-gray-200 text-gray-700 bg-white hover:border-gray-300"
                                }`}
                              >
                                <button
                                  onClick={() => updateMCQCorrectIndex(q.id, oIdx)}
                                  className={`w-6 h-6 rounded-full font-mono text-xs font-extrabold flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                                    isCorrect
                                      ? "bg-[#6C1D5F] text-white border-[#6C1D5F]"
                                      : "bg-white text-gray-400 border-gray-200"
                                  }`}
                                >
                                  {optionLetters[oIdx]}
                                </button>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateMCQOptionValue(q.id, oIdx, e.target.value)}
                                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs p-0 text-current"
                                />
                                {isCorrect && <Check className="w-4 h-4 text-[#6C1D5F] shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Coding details helper */}
                      {q.type === "Coding" && (
                        <div className="space-y-2 pt-2">
                          <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                            Starter Template (TypeScript/JS)
                          </label>
                          <textarea
                            value={q.starterCode || ""}
                            onChange={(e) => setQuestions(questions.map((item) => item.id === q.id ? { ...item, starterCode: e.target.value } : item))}
                            className="w-full p-4 bg-[#1e1e1e] text-[#01AC9F] rounded-xl font-mono text-xs focus:outline-none focus:ring-0"
                            rows={4}
                          />
                        </div>
                      )}
                    </div>

                    {/* Card footer details */}
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-400 font-bold">Points:</span>
                          <input
                            type="number"
                            value={q.points}
                            onChange={(e) => updateQuestionPoints(q.id, Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 border border-gray-200 bg-white text-center font-mono font-bold text-[#6C1D5F] rounded-md focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-400 font-bold">Shuffle Options:</span>
                          <span className="font-semibold text-gray-700">Yes</span>
                        </div>
                      </div>

                      <button
                        onClick={() => showToast("Opening question validation schema", "info")}
                        className="inline-flex items-center gap-1 hover:text-[#6C1D5F] font-bold cursor-pointer transition-colors"
                      >
                        <SettingsIcon className="w-3.5 h-3.5" />
                        Advanced Settings
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Your assignment is taking shape placeholder empty block */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 bg-white flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-display font-extrabold text-[#1b1c1c]">
                    Your assignment is taking shape
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm">
                    Select a question type from the left sidebar to continue building your assessment.
                  </p>
                </div>

                <button
                  onClick={handleAIAddQuestion}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-[#6C1D5F] rounded-xl cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#6C1D5F]" />
                  Generate with AI
                </button>
              </div>

              {/* Next/Back Footer */}
              <div className="bg-white rounded-2xl border border-gray-150/60 p-4 flex items-center justify-between shadow-2xs">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 text-xs font-semibold hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-150 cursor-pointer"
                >
                  Back
                </button>
                <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Draft Saved • {questions.length} Question{questions.length === 1 ? "" : "s"}
                </span>
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Settings */}
        {step === 3 && (
          <div className="space-y-6" id="step-settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Attempts & Timing */}
              <div className="bg-white rounded-2xl border border-gray-150/60 p-6 shadow-2xs space-y-5">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                  <div className="p-2 bg-[#6C1D5F]/5 rounded-xl text-[#6C1D5F]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1b1c1c]">Attempts & Timing</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Max Attempts Allowed</label>
                    <input
                      type="text"
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1b1c1c] focus:outline-none focus:border-[#6C1D5F] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Time Limit (Minutes)</label>
                    <input
                      type="text"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1b1c1c] focus:outline-none focus:border-[#6C1D5F] transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-gray-800">Auto-submit on timeout</h4>
                      <p className="text-[10px] text-gray-400">Automatically save progress when time runs out</p>
                    </div>
                    <button
                      onClick={() => setAutoSubmit(!autoSubmit)}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        autoSubmit ? "bg-[#6C1D5F]" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-xs ${
                          autoSubmit ? "left-5.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Grading */}
              <div className="bg-white rounded-2xl border border-gray-150/60 p-6 shadow-2xs space-y-5">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                  <div className="p-2 bg-[#6C1D5F]/5 rounded-xl text-[#6C1D5F]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1b1c1c]">Grading</h3>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-gray-800">Negative Marking</h4>
                      <p className="text-[10px] text-gray-400">Deduct points for incorrect answers</p>
                    </div>
                    <button
                      onClick={() => setNegativeMarking(!negativeMarking)}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        negativeMarking ? "bg-[#6C1D5F]" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-xs ${
                          negativeMarking ? "left-5.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-gray-800">Show Score Immediately</h4>
                      <p className="text-[10px] text-gray-400">Reveal results after final submission</p>
                    </div>
                    <button
                      onClick={() => setShowScoreImmediately(!showScoreImmediately)}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        showScoreImmediately ? "bg-[#6C1D5F]" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-xs ${
                          showScoreImmediately ? "left-5.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-gray-800">Show Detailed Answers</h4>
                      <p className="text-[10px] text-gray-400">Show correct answers and explanations</p>
                    </div>
                    <button
                      onClick={() => setShowDetailedAnswers(!showDetailedAnswers)}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        showDetailedAnswers ? "bg-[#6C1D5F]" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-xs ${
                          showDetailedAnswers ? "left-5.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Submission */}
              <div className="bg-white rounded-2xl border border-gray-150/60 p-6 shadow-2xs space-y-5">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                  <div className="p-2 bg-[#6C1D5F]/5 rounded-xl text-[#6C1D5F]">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1b1c1c]">Submission</h3>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-gray-800">Shuffle Questions</h4>
                      <p className="text-[10px] text-gray-400">Randomize order for every student</p>
                    </div>
                    <button
                      onClick={() => setShuffleQuestions(!shuffleQuestions)}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        shuffleQuestions ? "bg-[#6C1D5F]" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-xs ${
                          shuffleQuestions ? "left-5.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-gray-800">Shuffle Options</h4>
                      <p className="text-[10px] text-gray-400">Randomize MCQ options order</p>
                    </div>
                    <button
                      onClick={() => setShuffleOptions(!shuffleOptions)}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        shuffleOptions ? "bg-[#6C1D5F]" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-xs ${
                          shuffleOptions ? "left-5.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-gray-800">Allow Late Submission</h4>
                      <p className="text-[10px] text-gray-400">Permit work after deadline with penalty</p>
                    </div>
                    <button
                      onClick={() => setAllowLateSubmission(!allowLateSubmission)}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        allowLateSubmission ? "bg-[#6C1D5F]" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-xs ${
                          allowLateSubmission ? "left-5.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 4: Completion */}
              <div className="bg-white rounded-2xl border border-gray-150/60 p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#6C1D5F]/5 rounded-xl text-[#6C1D5F]">
                      <Save className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#1b1c1c]">Completion</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnableCertificates(!enableCertificates)}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                      enableCertificates ? "bg-[#6C1D5F]" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-xs ${
                        enableCertificates ? "left-5.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-600 block">Enable Certificates</span>
                  <p className="text-[10px] text-gray-400">Issue a digital certificate upon passing</p>
                </div>

                {/* Certificate placeholder graphic */}
                <div className="border border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-24 h-16 border border-gray-200 bg-white rounded-sm shadow-3xs relative flex flex-col items-center justify-center p-2">
                    <div className="w-16 h-0.5 bg-gray-100" />
                    <div className="w-10 h-0.5 bg-gray-100 mt-1" />
                    <div className="w-4 h-4 rounded-full border border-gray-200 bg-gray-50 absolute bottom-1.5" />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    Certificate template will be applied automatically
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 navigation bar */}
            <div className="bg-white rounded-2xl border border-gray-150/60 p-4 flex items-center justify-between shadow-2xs">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 text-xs font-semibold hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-150 cursor-pointer"
              >
                Back
              </button>
              <span className="text-xs text-gray-400 font-mono font-bold uppercase tracking-wider animate-pulse">
                Saving progress...
              </span>
              <button
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Preview */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in" id="step-preview">
            
            {/* Left Col: Assignment Preview */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-150/60 p-6 shadow-2xs space-y-6">
                
                {/* Device tabs */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#6C1D5F]/5 text-[#6C1D5F] rounded-xl">
                      <Eye className="w-5 h-5" />
                    </div>
                    <h2 className="text-base font-display font-extrabold text-[#1b1c1c]">Assignment Preview</h2>
                  </div>

                  <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200/50">
                    <button
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-1.5 rounded-lg inline-flex items-center gap-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                        previewDevice === "desktop"
                          ? "bg-white text-gray-800 shadow-3xs"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      Desktop
                    </button>
                    <button
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-1.5 rounded-lg inline-flex items-center gap-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                        previewDevice === "mobile"
                          ? "bg-white text-gray-800 shadow-3xs"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Mobile
                    </button>
                  </div>
                </div>

                {/* Simulated frame depending on desktop / mobile */}
                <div className={`transition-all duration-300 mx-auto ${
                  previewDevice === "mobile" 
                    ? "max-w-[360px] border-[8px] border-gray-900 rounded-[32px] p-6 shadow-xl bg-white" 
                    : "w-full bg-[#F7F8FC] rounded-2xl p-8 border border-gray-100"
                }`}>
                  
                  {/* Inside simulated content wrapper */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#6C1D5F]/15 text-[#6C1D5F] font-mono text-[9px] font-bold rounded-md uppercase tracking-wider">
                        NEW ASSIGNMENT
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-xs font-bold text-[#6C1D5F] font-mono">{duration} Minutes</span>
                    </div>

                    <div className="space-y-2">
                      <h1 className="text-2xl font-display font-extrabold text-[#1b1c1c] tracking-tight leading-tight">
                        {title}
                      </h1>
                      <p className="text-xs text-gray-500 leading-relaxed font-sans">
                        {description || "This assignment covers high-availability patterns, load balancing strategies, and disaster recovery planning for multi-region deployments."}
                      </p>
                    </div>

                    {/* Question Card in Preview */}
                    <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-3xs space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-gray-800">Question 1 of {questions.length}</span>
                        <span className="px-2 py-0.5 bg-gray-100 font-mono text-[10px] font-bold rounded-lg text-gray-600">
                          Score: {questions[0]?.points || 10} pts
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#1b1c1c] leading-relaxed">
                        {questions[0]?.prompt || "Analyze the following scenario: A financial services platform needs to maintain zero data loss across three geographical regions. Which architectural pattern provides the optimal RPO/RTO balance?"}
                      </p>

                      {/* Render radio options */}
                      <div className="space-y-2.5">
                        {questions[0]?.options ? (
                          questions[0].options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg text-xs ${
                                questions[0].correctOptionIndex === oIdx 
                                  ? "border-[#6C1D5F] bg-[#6C1D5F]/5 font-semibold text-[#6C1D5F]" 
                                  : "border-gray-100 text-gray-600"
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                questions[0].correctOptionIndex === oIdx 
                                  ? "border-[#6C1D5F] bg-white" 
                                  : "border-gray-200"
                              }`}>
                                {questions[0].correctOptionIndex === oIdx && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#6C1D5F]" />
                                )}
                              </div>
                              <span>{opt}</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2.5 border border-dashed border-gray-100 text-gray-400 text-xs text-center italic rounded-lg">
                            No options configured or text answer expected.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Technical details Grid below preview */}
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-150">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                          Assignment Info
                        </h4>
                        <div className="divide-y divide-gray-100 text-xs">
                          <div className="py-1.5 flex justify-between">
                            <span className="text-gray-400">Duration</span>
                            <span className="font-semibold text-gray-800">{duration} Minutes</span>
                          </div>
                          <div className="py-1.5 flex justify-between">
                            <span className="text-gray-400">Total Points</span>
                            <span className="font-semibold text-gray-800">{totalPoints} pts</span>
                          </div>
                          <div className="py-1.5 flex justify-between">
                            <span className="text-gray-400">Passing Score</span>
                            <span className="font-semibold text-gray-800">
                              {Math.round((passingMarks / totalMarks) * 100)}% ({passingMarks} pts)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                          Access & Privacy
                        </h4>
                        <div className="divide-y divide-gray-100 text-xs">
                          <div className="py-1.5 flex justify-between">
                            <span className="text-gray-400">Visibility</span>
                            <span className="font-semibold text-gray-800">Restricted</span>
                          </div>
                          <div className="py-1.5 flex justify-between">
                            <span className="text-gray-400">Proctoring</span>
                            <span className="font-semibold text-gray-800">AI-Monitored</span>
                          </div>
                          <div className="py-1.5 flex justify-between">
                            <span className="text-gray-400">Release Date</span>
                            <span className="font-semibold text-gray-800">Oct 24, 2026</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col Checklist & help */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Card 1: Final Checklist */}
              <div className="bg-white rounded-2xl border border-gray-150/60 p-6 shadow-2xs space-y-5">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1b1c1c]">Final Checklist</h3>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Details Complete", desc: "All mandatory fields in Step 1 are filled.", checked: true },
                    { label: `${questions.length} Questions Added`, desc: "Mix of MCQ and Code Challenges.", checked: questions.length > 0 },
                    { label: "Settings Validated", desc: "Proctoring and timer configured.", checked: true },
                  ].map((chk, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                        chk.checked 
                          ? "bg-[#01AC9F]/10 border-[#01AC9F] text-[#01AC9F]" 
                          : "border-gray-200 text-gray-300"
                      }`}>
                        {chk.checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-gray-800 leading-none">{chk.label}</h4>
                        <p className="text-[10px] text-gray-400 leading-tight">{chk.desc}</p>
                      </div>
                    </div>
                  ))}

                  {/* Red/Amber Warning element */}
                  <div className="flex gap-3 items-start pt-2 border-t border-gray-50">
                    <div className="w-5 h-5 rounded-full bg-[#FF6200]/10 border border-[#FF6200]/20 text-[#FF6200] flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-[#FF6200] leading-none">Awaiting Batch Assignment</h4>
                      <p className="text-[10px] text-gray-400 leading-tight">Course batches not yet linked.</p>
                      <button 
                        onClick={() => showToast("Linking batch details console...", "info")} 
                        className="text-[10px] font-bold text-[#6C1D5F] underline mt-1 block"
                      >
                        Link Batches Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Ready for publication */}
              <div className="bg-gray-100/50 rounded-2xl p-6 border border-gray-150 text-xs space-y-1.5">
                <h4 className="font-extrabold text-[#1b1c1c]">Ready for publication?</h4>
                <p className="text-gray-400 leading-relaxed">
                  "Once published, the structure of the assignment cannot be changed while active."
                </p>
              </div>

              {/* Card 3: Need help */}
              <div className="bg-[#6C1D5F]/5 rounded-2xl p-6 border border-[#6C1D5F]/10 text-xs flex gap-3 items-start">
                <HelpCircle className="w-5 h-5 text-[#6C1D5F] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#1b1c1c]">Need help?</h4>
                  <p className="text-gray-400 leading-normal">
                    Speak with our LMS architect to optimize your question patterns.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 Footer */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-150/60 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-2xs">
              <span className="text-xs font-mono font-medium text-gray-400">
                Draft saved 2 minutes ago
              </span>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 text-xs font-semibold hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-150 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-5 py-2.5 text-xs font-semibold hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-150 cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  onClick={handlePublish}
                  className="px-6 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-md shadow-[#6C1D5F]/15"
                >
                  Publish Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Excel Modal / Preview / Error Dialog */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" id="import-excel-modal">
            <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${importErrors.length > 0 ? 'bg-red-50 text-red-500' : 'bg-[#6C1D5F]/10 text-[#6C1D5F]'}`}>
                    {importErrors.length > 0 ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-display font-extrabold text-gray-900">
                      {importErrors.length > 0 ? "Excel Import Validation Errors" : "Confirm MCQ Import Preview"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {importErrors.length > 0 
                        ? `We found some issues in your Excel sheet. Please resolve them and re-upload.` 
                        : `Preview of parsed MCQ questions (${importPreviewList.length} items found). Confirm to add them to your wizard.`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {importErrors.length > 0 ? (
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-150 rounded-xl p-4 text-xs text-red-800 space-y-1">
                      <p className="font-bold">The following rows failed our validation checks:</p>
                      <p className="text-[11px] text-red-600">Please make sure questions are not empty, all 4 options are filled, correct answer is A, B, C or D, and marks are numeric and greater than zero.</p>
                    </div>
                    <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-[40vh] overflow-y-auto">
                      {importErrors.map((err, idx) => (
                        <div key={idx} className="p-3 bg-white text-xs text-red-600 font-mono flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-[50vh] overflow-y-auto shadow-3xs">
                      {importPreviewList.map((q, idx) => (
                        <div key={idx} className="p-5 bg-white space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-[#6C1D5F] font-bold">Row {q.rowNum} • Question {idx + 1}</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded-md font-bold text-gray-600">{q.points} Marks</span>
                          </div>
                          <p className="text-xs font-bold text-gray-900 leading-relaxed">{q.prompt}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt: string, oIdx: number) => {
                              const optionLabel = ["A", "B", "C", "D"][oIdx];
                              const isCorrect = q.correctOptionIndex === oIdx;
                              return (
                                <div 
                                  key={oIdx} 
                                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 transition-all ${
                                    isCorrect 
                                      ? "border-[#01AC9F]/40 bg-[#01AC9F]/5 text-[#01AC9F] font-semibold" 
                                      : "border-gray-100 bg-gray-50/30 text-gray-600"
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold ${
                                    isCorrect 
                                      ? "bg-[#01AC9F] text-white" 
                                      : "bg-gray-200 text-gray-500"
                                  }`}>
                                    {optionLabel}
                                  </span>
                                  <span className="truncate">{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                {importErrors.length > 0 ? (
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
                    id="btn-close-errors"
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setImportPreviewList([]);
                      }}
                      className="px-4 py-2 border border-gray-250 hover:bg-gray-50 text-gray-500 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      id="btn-cancel-import"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmImport}
                      className="px-5 py-2 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-[#6C1D5F]/15"
                      id="btn-confirm-import"
                    >
                      Confirm & Import
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
