import { Assignment, Submission, Question } from "../types";

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "asn-cyber-lab",
    title: "Penetration Testing & Perimeter Auditing Lab",
    description: "This hands-on lab tests your core knowledge of network scanning, protocol standards, data privacy controls, and secure perimeter deployment. Solve all multiple-choice questions, write compliant scripting engines, and detail executive architectures under the CIA Triad principles.",
    courseId: 1,
    courseTitle: "Cybersecurity Essentials",
    assignedBatchIds: [1],
    assignedBatchNames: ["batch-cyber-2024"],
     
    totalMarks: 100,
    durationMinutes: 45,
    dueDate: "July 24, 2026",
    createdAt: "July 01, 2026",
    status: "Published",
    teacherId: 3,
    questions: [
      {
        id: "q-cyber-1",
        type: "MCQ",
        title: "Default Protocol Security Ports",
        prompt: "During a network auditing session, you discover external connections entering a secured perimeter server. Which of the following standard ports is configured by default to enforce secure, encrypted HTTPS hypertext transmission, preventing eavesdropping and man-in-the-middle vector attacks?",
        points: 20,
        order: 1,
        mcqDetails: {
          options: [
            "Port 80 (HTTP plaintext, non-secure traffic)",
            "Port 443 (HTTPS secure, SSL/TLS encrypted traffic)",
            "Port 22 (SSH secure shell access point)",
            "Port 8080 (Alternative HTTP proxy or local development server)"
          ],
          correctOptionIndex: 1
        }
      },
      {
        id: "q-cyber-2",
        type: "Coding",
        title: "Log Auditing Access Parser",
        prompt: "Write a high-performance Python function named `count_unauthorized(logs: list)` that parses an array of system log lines. The function must scan each line and return the total integer count of lines containing the unauthorized client error response code: '401 Unauthorized'. Implement robust checking, ignoring casing variations.",
        points: 25,
        order: 2,
        codingDetails: {
          language: "python",
          starterCode: `def count_unauthorized(logs):\n    # TODO: Write your analysis logic below\n    count = 0\n    for line in logs:\n        if "401 unauthorized" in line.lower():\n            count += 1\n    return count`,
          testCases: [
            { id: "tc-1", input: "['INFO: User logged in', 'WARN: 401 Unauthorized user click', 'DEBUG: Port scanned']", expectedOutput: "1" },
            { id: "tc-2", input: "['401 Unauthorized access attempt', '401 unauthorized breach alert']", expectedOutput: "2", isHidden: true }
          ]
        }
      },
      {
        id: "q-cyber-3",
        type: "Essay",
        title: "SSO Security Trade-offs & Analysis",
        prompt: "An enterprise with 5,000 corporate devices is proposing to transition from standalone silo credentials to a centralized Cloud Single Sign-On (SSO) authentication system. Compose a detailed security risk assessment. Discuss the inherent balance between end-user accessibility speed and the risk of a 'Single Point of Failure' (SPOF) breach.",
        points: 25,
        order: 3
      },
      {
        id: "q-cyber-4",
        type: "ShortAnswer",
        title: "The CIA Security Triad",
        prompt: "The CIA Triad stands as the foundational pillar for planning security configurations. List the three security principles represented by this acronym and explain each with a one-sentence corporate operational definition.",
        points: 15,
        order: 4
      },
      {
        id: "q-cyber-5",
        type: "FileUpload",
        title: "Perimeter Network Topology Schema",
        prompt: "As part of the perimeter audit review, upload a network topology diagram representing a secure multi-tier infrastructure. The diagram must visually detail the placement of the Web Application Firewall (WAF), the Demilitarized Zone (DMZ), and private database subnets.",
        points: 15,
        order: 5,
        fileUploadDetails: {
          allowedExtensions: [".pdf", ".png", ".jpg", ".svg"],
          maxSizeMB: 5
        }
      }
    ]
  },
  {
    id: "asn-lead-case",
    title: "Conflict Resolution & Executive Negotiation Case Study",
    description: "An advanced assessment testing your communication frameworks, leadership models, and negotiation mechanisms. Address practical conflicts, outline action matrices, and draft situational feedback for enterprise engineering leaders.",
    courseId: 2,
    courseTitle: "Leadership Principles",
    assignedBatchIds: [1],
    assignedBatchNames: ["batch-ldr-2024"],
     
    totalMarks: 50,
    durationMinutes: 30,
    dueDate: "July 29, 2026",
    createdAt: "July 02, 2026",
    status: "Published",
    teacherId: 3,
    questions: [
      {
        id: "q-lead-1",
        type: "MCQ",
        title: "Servant Leadership Core Tenant",
        prompt: "Which leadership model centers its entire organizational philosophy on prioritizing the development, psychological safety, and growth of employees first as a primary strategic driver to achieve team trust and peak enterprise performance?",
        points: 10,
        order: 1,
        mcqDetails: {
          options: [
            "Autocratic Leadership Style",
            "Laissez-Faire Delegation Model",
            "Servant Leadership Philosophy",
            "Transactional Reward-Based Style"
          ],
          correctOptionIndex: 2
        }
      },
      {
        id: "q-lead-2",
        type: "ShortAnswer",
        title: "Situational vs. Transactional Management",
        prompt: "In your own words, outline the core operational difference between Situational Leadership (which adapts based on team skill maturity) and Transactional Leadership (which operates strictly on predefined command structures and penalty-reward incentives).",
        points: 15,
        order: 2
      },
      {
        id: "q-lead-3",
        type: "Essay",
        title: "Resolving Architecture Conflict Case Study",
        prompt: "Scenario: Two principal engineers on your team are in a bitter technical dispute over whether to adopt a microservices architecture or a monolith structure for the upcoming enterprise release. Both are refusing to compromise, the disagreement is stalling sprint velocity, and the critical quarterly deadline is in jeopardy. Draft an email response explaining your exact conflict resolution action plan as their direct engineering director.",
        points: 25,
        order: 3
      }
    ]
  },
  {
    id: "asn-gdpr-compliance",
    title: "EU GDPR Compliance & Audit Protocol",
    description: "Analyze the legal, compliance, and organizational parameters required under the EU General Data Protection Regulation. Master accountability, processing consent structures, and processing rights to satisfy data privacy compliance.",
    courseId: 3,
    courseTitle: "GDPR & Data Privacy",
    assignedBatchIds: [1],
    assignedBatchNames: ["batch-compliance-2024"],
     
    totalMarks: 50,
    durationMinutes: 0, // No Limit
    dueDate: "August 15, 2026",
    createdAt: "July 05, 2026",
    status: "Published",
    teacherId: 999,
    questions: [
      {
        id: "q-gdpr-1",
        type: "MCQ",
        title: "Administrative Fine Thresholds",
        prompt: "Under the guidelines of the European GDPR framework, what is the maximum administrative fine that can be levied against an enterprise for severe data protection violations, such as processing user metrics without valid consent?",
        points: 15,
        order: 1,
        mcqDetails: {
          options: [
            "Up to €10 Million or 2% of annual global turnover, whichever is lower",
            "Up to €20 Million or 4% of annual global turnover, whichever is higher",
            "Up to €500,000 flat penalty with mandatory system deactivation",
            "Fines are entirely at the discretion of individual municipal tribunals with no upper ceiling"
          ],
          correctOptionIndex: 1
        }
      },
      {
        id: "q-gdpr-2",
        type: "Essay",
        title: "The Legal Boundaries of The Right to be Forgotten",
        prompt: "Critically evaluate the operational and systemic boundaries of 'The Right to be Forgotten' (Article 17 of GDPR). Analyze the specific scenarios where an enterprise database must erase all personal identifier metrics versus situations where legal processing overrides erasure requests.",
        points: 35,
        order: 2
      }
    ]
  }
];

// Seed initial history of completed submissions
export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: "sub-lead-1",
    assignmentId: "asn-lead-case",
    assignmentTitle: "Conflict Resolution & Executive Negotiation Case Study",
    studentId: "student-123",
    studentName: "Student Learner",
    submittedAt: "July 03, 2026 at 02:45 PM",
    status: "Graded",
    score: 46, // 46 out of 50
    graderFeedback: "Excellent resolution framing. Your proposed leadership conflict plan is both structured and empathetic. The situational leadership distinction is accurately defined. Fantastic executive writing style!",
    gradedBy: "Dr. Evelyn Vance",
    gradedAt: "July 04, 2026",
    answers: [
      {
        questionId: "q-lead-1",
        questionType: "MCQ",
        mcqSelectedIndex: 2
      },
      {
        questionId: "q-lead-2",
        questionType: "ShortAnswer",
        shortAnswerText: "Situational leadership adapts dynamically to the capability and maturity of the team members, emphasizing mentoring and coaching. Transactional leadership, on the other hand, relies on static contracts, clear reward systems, and standard performance penalties to motivate compliance rather than growth."
      },
      {
        questionId: "q-lead-3",
        questionType: "Essay",
        essayText: "Subject: Collaborative Resolution on System Architecture\n\nHi Team,\n\nI understand both of you have strong, reasoned convictions regarding whether to adopt microservices or a monolith for our core enterprise backend. Our goal is a resilient system, but stalling sprints also directly threatens our launch.\n\nHere is our action plan:\n1. We will hold a 1-hour architecture round-table tomorrow morning.\n2. Each side will have 15 minutes to present a concrete trade-off matrix covering development speed, maintenance overhead, and scalability.\n3. If we cannot reach a consensus by the end of our session, we will align on a hybrid compromise: starting with a modular monolith which maps cleanly to future microservice extraction once traffic warrants. This mitigates our immediate deployment deadline risk while preserving long-term structural scalability.\n\nLet's collaborate and execute.\n\nWarm regards,\nEngineering Director"
      }
    ]
  }
];

// Helper functions for LocalStorage persistence
export const getStoredAssignments = (): Assignment[] => {
  const data = localStorage.getItem("educorp_assignments");
  if (!data) {
    localStorage.setItem("educorp_assignments", JSON.stringify(MOCK_ASSIGNMENTS));
    return MOCK_ASSIGNMENTS;
  }
  try {
    const parsed: Assignment[] = JSON.parse(data);
    // Migration check: Ensure existing stored assignments have teacherId
    let updated = false;
    const migrated = parsed.map((a) => {
      if (!a.teacherId) {
        updated = true;
        const initial = MOCK_ASSIGNMENTS.find((ma) => ma.id === a.id);
        return {
          ...a,
          teacherId: initial ? initial.teacherId : 3
        };
      }
      return a;
    });
    if (updated) {
      localStorage.setItem("educorp_assignments", JSON.stringify(migrated));
      return migrated;
    }
    return parsed;
  } catch (e) {
    return MOCK_ASSIGNMENTS;
  }
};

export const saveAssignment = (assignment: Assignment) => {
  const assignments = getStoredAssignments();
  const updated = assignments.filter((a) => a.id !== assignment.id);
  updated.push(assignment);
  localStorage.setItem("educorp_assignments", JSON.stringify(updated));
};

export const getStoredSubmissions = (): Submission[] => {
  const data = localStorage.getItem("educorp_student_submissions");
  if (!data) {
    localStorage.setItem("educorp_student_submissions", JSON.stringify(INITIAL_SUBMISSIONS));
    return INITIAL_SUBMISSIONS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_SUBMISSIONS;
  }
};

export const saveSubmission = (submission: Submission) => {
  const submissions = getStoredSubmissions();
  const updated = submissions.filter((s) => s.assignmentId !== submission.assignmentId);
  updated.push(submission);
  localStorage.setItem("educorp_student_submissions", JSON.stringify(updated));
};

export const getAssignmentStatusForStudent = (assignmentId: string): "Upcoming" | "Ongoing" | "Submitted" | "Graded" | "Overdue" => {
  const submissions = getStoredSubmissions();
  const sub = submissions.find((s) => s.assignmentId === assignmentId);
  if (sub) {
    return sub.status === "Submitted" ? "Submitted" : "Graded";
  }

  // If no submission, check default due date for overdue mock logic
  const assignments = getStoredAssignments();
  const assignment = assignments.find((a) => a.id === assignmentId);
  if (assignment) {
    if (assignment.id === "asn-cyber-lab") {
      // Let's keep it "Ongoing" or "Upcoming" for sandbox interaction
      return "Ongoing";
    }
    // Check if it is GDPR
    if (assignment.id === "asn-gdpr-compliance") {
      return "Upcoming";
    }
  }

  return "Upcoming";
};

