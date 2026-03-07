// src/lib/subjects.ts
// Master list of all subjects in the EduAgent platform

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  category: "cs" | "math" | "science";
}

export const SUBJECTS: Subject[] = [
  {
    id: "dsa",
    name: "Data Structures and Algorithms",
    shortName: "DSA",
    description: "Arrays, Trees, Graphs, Sorting, Searching, Dynamic Programming",
    icon: "🌲",
    color: "#6366f1",
    gradient: "from-indigo-500 to-purple-600",
    category: "cs",
  },
  {
    id: "web-programming",
    name: "Web Programming",
    shortName: "Web Dev",
    description: "HTML, CSS, JavaScript, React, Node.js, REST APIs",
    icon: "🌐",
    color: "#0ea5e9",
    gradient: "from-sky-500 to-cyan-600",
    category: "cs",
  },
  {
    id: "dbms",
    name: "Database Management Systems",
    shortName: "DBMS",
    description: "SQL, Normalization, Transactions, ER Diagrams, Indexing",
    icon: "🗄️",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
    category: "cs",
  },
  {
    id: "os",
    name: "Operating Systems",
    shortName: "OS",
    description: "Processes, Scheduling, Memory Management, File Systems, Deadlocks",
    icon: "💻",
    color: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
    category: "cs",
  },
  {
    id: "cns",
    name: "Cryptography and Network Security",
    shortName: "CNS",
    description: "Encryption, RSA, AES, Digital Signatures, PKI, SSL/TLS",
    icon: "🔐",
    color: "#ef4444",
    gradient: "from-red-500 to-rose-600",
    category: "cs",
  },
  {
    id: "computer-networks",
    name: "Computer Networks",
    shortName: "CN",
    description: "OSI model, TCP/IP, Routing, Switching, HTTP, DNS",
    icon: "📡",
    color: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
    category: "cs",
  },
  {
    id: "daa",
    name: "Design and Analysis of Algorithms",
    shortName: "DAA",
    description: "Complexity, Divide & Conquer, Greedy, NP-Hard, approximation",
    icon: "📊",
    color: "#ec4899",
    gradient: "from-pink-500 to-rose-500",
    category: "cs",
  },
  {
    id: "prob-stats",
    name: "Probability and Statistics",
    shortName: "Prob & Stats",
    description: "Random variables, Distributions, Hypothesis testing, Regression",
    icon: "📈",
    color: "#14b8a6",
    gradient: "from-teal-500 to-cyan-600",
    category: "math",
  },
  {
    id: "python",
    name: "Python Programming",
    shortName: "Python",
    description: "Syntax, OOP, Libraries, Data Analysis, APIs, Automation",
    icon: "🐍",
    color: "#facc15",
    gradient: "from-yellow-400 to-amber-500",
    category: "cs",
  },
  {
    id: "java",
    name: "Java Programming",
    shortName: "Java",
    description: "Core Java, OOP, Collections, Multithreading, Spring basics",
    icon: "☕",
    color: "#f97316",
    gradient: "from-orange-500 to-red-500",
    category: "cs",
  },
  {
    id: "biology",
    name: "Biology",
    shortName: "Biology",
    description: "Cell biology, Genetics, Evolution, Ecology, Human physiology",
    icon: "🧬",
    color: "#22c55e",
    gradient: "from-green-500 to-emerald-600",
    category: "science",
  },
  {
    id: "physics",
    name: "Physics",
    shortName: "Physics",
    description: "Mechanics, Thermodynamics, Electromagnetism, Optics, Modern Physics",
    icon: "⚛️",
    color: "#3b82f6",
    gradient: "from-blue-500 to-indigo-600",
    category: "science",
  },
  {
    id: "calculus",
    name: "Calculus",
    shortName: "Calculus",
    description: "Limits, Derivatives, Integration, Multivariable Calculus, Series",
    icon: "∫",
    color: "#a855f7",
    gradient: "from-purple-500 to-violet-600",
    category: "math",
  },
  {
    id: "differential-calculus",
    name: "Differential Calculus",
    shortName: "Diff Calculus",
    description: "Differentiation rules, Chain rule, Implicit diff, Applications",
    icon: "Δ",
    color: "#06b6d4",
    gradient: "from-cyan-500 to-sky-600",
    category: "math",
  },
];

export function getSubjectById(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}
