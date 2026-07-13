export interface Profile {
  id: string;
  name: string;
  title: string;
  bio: string;
  tagline: string;
  resume_url: string;
  avatar: string;
  is_visible: boolean;
  display_order: number;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  duration: string;
  description: string;
  is_visible: boolean;
  display_order: number;
}

export interface Skill {
  id: string;
  skill_name: string;
  category: 'Programming' | 'Frameworks' | 'Automation' | 'Database' | 'Tools' | 'Other';
  proficiency: number; // 0 - 100
  is_visible: boolean;
  display_order: number;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
  tech_stack: string[];
  metrics: string[];
  is_visible: boolean;
  display_order: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  is_visible: boolean;
  display_order: number;
}

export interface Contacts {
  id: string;
  email: string;
  linkedin: string;
  github: string;
  socials: Record<string, string>;
  is_visible: boolean;
  display_order: number;
}

export interface Settings {
  id: string;
  theme: string;
  maintenanceMode: boolean;
  accentColor: string;
  animationSpeed: number;
  warpSpeed: number;
  landingDuration: number;
  soundEnabled: boolean;
  backgroundMusicEnabled: boolean;
  reducedMotion: boolean;
  is_visible: boolean;
  display_order: number;
}

export interface CareerverseData {
  profile: Profile;
  education: Education[];
  skills: Skill[];
  experience: Experience[];
  achievements: Achievement[];
  contact: Contacts;
  settings: Settings;
}

export const mockProfile: Profile = {
  id: "mock-profile-1",
  name: "Aditi Mallick",
  title: "Software Engineer",
  tagline: "Engineering robust enterprise desktop architectures, high-performance backend systems, and automated pipelines.",
  bio: "Software Engineer specializing in enterprise software development, desktop applications, backend systems, PyWinAuto/Selenium automation, and modern web architectures. Experienced in WPF/MVVM design, .NET/ASP.NET Core architectures, database management, and process migration. Focused on building high-performance solutions that drive business efficiency and reduce operational costs.",
  resume_url: "#",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=300&h=300&q=80",
  is_visible: true,
  display_order: 1
};

export const mockEducation: Education[] = [
  {
    id: "mock-edu-1",
    degree: "Bachelor of Engineering in Information Science & Engineering",
    institution: "BMS Institute of Technology & Management",
    duration: "2020 - 2024",
    description: "Focused on core computer science subjects, including software engineering methodologies, database design, and object-oriented programming. Graduated in 2024.",
    is_visible: true,
    display_order: 1
  }
];

export const mockSkills: Skill[] = [
  // Programming
  { id: "s-1", skill_name: "C#", category: "Programming", proficiency: 95, is_visible: true, display_order: 1 },
  { id: "s-2", skill_name: "SQL", category: "Programming", proficiency: 90, is_visible: true, display_order: 2 },
  { id: "s-3", skill_name: "JavaScript", category: "Programming", proficiency: 88, is_visible: true, display_order: 3 },
  { id: "s-4", skill_name: "TypeScript", category: "Programming", proficiency: 90, is_visible: true, display_order: 4 },
  
  // Frameworks
  { id: "s-5", skill_name: ".NET", category: "Frameworks", proficiency: 90, is_visible: true, display_order: 5 },
  { id: "s-6", skill_name: "ASP.NET Core", category: "Frameworks", proficiency: 90, is_visible: true, display_order: 6 },
  { id: "s-7", skill_name: "React", category: "Frameworks", proficiency: 85, is_visible: true, display_order: 7 },
  { id: "s-8", skill_name: "WPF", category: "Frameworks", proficiency: 85, is_visible: true, display_order: 8 },
  { id: "s-9", skill_name: "MVVM", category: "Frameworks", proficiency: 85, is_visible: true, display_order: 9 },

  // Automation
  { id: "s-10", skill_name: "Selenium", category: "Automation", proficiency: 92, is_visible: true, display_order: 10 },
  { id: "s-11", skill_name: "UI Automation", category: "Automation", proficiency: 90, is_visible: true, display_order: 11 },
  { id: "s-12", skill_name: "PyWinAuto", category: "Automation", proficiency: 90, is_visible: true, display_order: 12 },
  { id: "s-13", skill_name: "PyAutoGUI", category: "Automation", proficiency: 88, is_visible: true, display_order: 13 },

  // Database
  { id: "s-14", skill_name: "SQL Server", category: "Database", proficiency: 90, is_visible: true, display_order: 14 },
  { id: "s-15", skill_name: "PostgreSQL", category: "Database", proficiency: 88, is_visible: true, display_order: 15 },

  // Tools
  { id: "s-16", skill_name: "Swagger", category: "Tools", proficiency: 85, is_visible: true, display_order: 16 },
  { id: "s-17", skill_name: "Git", category: "Tools", proficiency: 90, is_visible: true, display_order: 17 },

  // Other
  { id: "s-18", skill_name: "REST APIs", category: "Other", proficiency: 92, is_visible: true, display_order: 18 },
  { id: "s-19", skill_name: "JWT Authentication", category: "Other", proficiency: 90, is_visible: true, display_order: 19 },
  { id: "s-20", skill_name: "AI-assisted Development", category: "Other", proficiency: 95, is_visible: true, display_order: 20 }
];

export const mockExperience: Experience[] = [
  {
    id: "mock-exp-1",
    company: "Samsung Electro-Mechanics",
    role: "Software Engineer — Enterprise Desktop Automation",
    duration: "February 2024 - Present",
    description: "Designed and engineered an enterprise-level desktop automation platform using WPF and MVVM. Integrated custom Python automation modules using PyWinAuto, Selenium, and UI Automation to run test regressions and test workflows.",
    tech_stack: ["WPF", "MVVM", "C#", ".NET", "Python", "Selenium", "PyWinAuto", "UI Automation"],
    metrics: [
      "Successfully automated 96% of manual test cases, drastically increasing test regression reliability.",
      "Engineered automated workflow components used actively by ~100 QA and performance testers.",
      "Reduced legacy external automation tool licensing costs by 87% through in-house open-source tooling."
    ],
    is_visible: true,
    display_order: 1
  },
  {
    id: "mock-exp-2",
    company: "Samsung Electro-Mechanics",
    role: "Software Engineer — Image Lifecycle Management",
    duration: "February 2024 - Present",
    description: "Developed a background Windows Service and high-performance desktop client for real-time Image Lifecycle Management. Formulated automated transfer scripts and verification protocols.",
    tech_stack: ["C#", ".NET", "WPF", "Windows Service"],
    metrics: [
      "Engineered autonomous image transfers and categorization scripts across storage nodes.",
      "Reduced manual operations and manual file indexing errors by 70%."
    ],
    is_visible: true,
    display_order: 2
  },
  {
    id: "mock-exp-3",
    company: "Samsung Electro-Mechanics",
    role: "Software Engineer — Process Management Web Application",
    duration: "February 2024 - Present",
    description: "Designed and architected a web-based process management application to digitize spreadsheet workflows. Formulated structured controller-service-repository patterns, integrated JWT authentication, and mapped interactive status flowcharts.",
    tech_stack: ["React", "ASP.NET Core", "PostgreSQL", "REST APIs", "JWT", "Excel Migration"],
    metrics: [
      "Architected clean, validation-first REST APIs using a Controller-Service-Repository pattern.",
      "Migrated complex legacy Excel spreadsheet tracking systems into robust database structures.",
      "Built dynamic, interactive flowchart nodes to visualize active processes and tracking statuses."
    ],
    is_visible: true,
    display_order: 3
  }
];

export const mockAchievements: Achievement[] = [
  {
    id: "mock-ach-1",
    title: "Best Performer of the Quarter",
    description: "Awarded at Samsung Electro-Mechanics for outstanding execution, automation engineering, and process simplification achievements.",
    date: "2024",
    is_visible: true,
    display_order: 1
  },
  {
    id: "mock-ach-2",
    title: "GDG International Women's Day Speaker",
    description: "Invited speaker talking about software engineering, WPF architectures, desktop automation tools, and women in tech initiatives.",
    date: "2024",
    is_visible: true,
    display_order: 2
  },
  {
    id: "mock-ach-3",
    title: "German Language Certification (A1)",
    description: "Completed professional training and language certification representing proficiency in A1 level German.",
    date: "2023",
    is_visible: true,
    display_order: 3
  },
  {
    id: "mock-ach-4",
    title: "CSR Computer Literacy Volunteer",
    description: "Volunteered for Corporate Social Responsibility programs to teach computer basics and basic programming literacy to underrepresented youth.",
    date: "2023",
    is_visible: true,
    display_order: 4
  },
  {
    id: "mock-ach-5",
    title: "Learned Korean for Customer Communication",
    description: "Achieved functional proficiency in Korean to coordinate technical requirements and clarify engineering scopes with Korean stakeholders.",
    date: "2024",
    is_visible: true,
    display_order: 5
  }
];

export const mockContacts: Contacts = {
  id: "mock-contact-1",
  email: "aditi.mallick.dev@gmail.com",
  linkedin: "https://linkedin.com/in/aditi-mallick",
  github: "https://github.com/aditimallick",
  socials: {},
  is_visible: true,
  display_order: 1
};

export const mockSettings: Settings = {
  id: "default",
  theme: "space-dark",
  maintenanceMode: false,
  accentColor: "blue",
  animationSpeed: 1,
  warpSpeed: 1.5,
  landingDuration: 1.0,
  soundEnabled: true,
  backgroundMusicEnabled: false,
  reducedMotion: false,
  is_visible: true,
  display_order: 1
};

export const mockCareerverseData: CareerverseData = {
  profile: mockProfile,
  education: mockEducation,
  skills: mockSkills,
  experience: mockExperience,
  achievements: mockAchievements,
  contact: mockContacts,
  settings: mockSettings
};
