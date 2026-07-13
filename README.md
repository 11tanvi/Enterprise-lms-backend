# 🎓 EduCorp LMS - Frontend Enterprise Portal

An enterprise-grade Learning Management System (LMS) administration and student catalog interface. Built to handle complex curriculum hierarchies, this frontend application delivers a highly responsive, type-safe, and beautifully branded user experience.

## 🚀 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite (for lightning-fast HMR and optimized builds)
- **Language:** TypeScript (Strict typing for robust enterprise data contracts)
- **Styling:** Tailwind CSS (Utility-first, responsive design)
- **State Management:** React Context API (`AppContext` for global UI and data state)
- **Icons:** Lucide React

## ✨ Key Features

- **Unified Workspace Architecture:** Seamlessly combines the Admin Management dashboard and the Student Course Catalog into a single, cohesive interface.
- **Dynamic Brand Theming:** Curriculum cards and UI elements dynamically adapt their color palettes (e.g., Tranquil Velvet, Emerald, CTA Orange) and icons based on the backend PostgreSQL database configurations.
- **Course Creation Wizard:** A complex, multi-step state machine allowing administrators to build detailed curriculums (Courses ➔ Modules ➔ Submodules ➔ Content Blocks) with a clean, intuitive UX.
- **Category Management:** Full CRUD capabilities with soft-delete toggle functionality, mapped perfectly to Jackson/Spring Boot backend serialization standards.
- **Optimized Performance:** Implements `useMemo` for heavy filtering/sorting operations and localized state handling to prevent unnecessary re-renders.

## 📂 Project Structure

\`\`\`text
src/
├── components/ # Reusable UI components (CourseCatalogView, Wizard steps, etc.)
├── context/ # Global state management (AppContext.tsx)
├── data/ # Initial dummy data and configurations
├── services/ # API integration layer (Axios/Fetch calls to Spring Boot)
├── types/ # Global TypeScript interfaces (types.ts)
├── App.tsx # Main application routing and layout wrapper
└── main.tsx # React DOM entry point
\`\`\`

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- The EduCorp Spring Boot Backend must be running (default port: `8080`)

### Installation

1. Clone the repository and navigate to the frontend directory:
   \`\`\`bash
   git clone <repository-url>
   cd educorp-lms-frontend
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up your environment variables:
   Create a `.env` file in the root directory and add your backend API URL (if different from default):
   \`\`\`env
   VITE_API_BASE_URL=http://localhost:8080/api
   \`\`\`

4. Start the Vite development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open your browser and navigate to `http://localhost:5173`.

## 🤝 API Contract Notes

This frontend is strictly typed to interface with the EduCorp Spring Boot backend.

- **Serialization Note:** Ensure the backend utilizes `@JsonProperty("isActive")` or maps the DTO boolean fields directly to `active` to prevent JavaBean reflection stripping during JSON serialization.

_Designed for performance, scalability, and modern enterprise learning._
