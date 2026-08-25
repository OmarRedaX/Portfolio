export interface CTA {
  label: string;
  href: string;
}

export interface HeroContent {
  name: string;
  title: string;
  tagline: string;
  valueProp: string;
  ctas: CTA[];
}

export interface LanguageProficiency {
  name: string;
  level: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  location: string;
  period: string;
}

export interface AboutContent {
  narrative: string[];
  education: EducationEntry;
  languages: LanguageProficiency[];
}

export interface TechStackCategory {
  name: string;
  items: string[];
}

export type ProjectFocus = "fullstack" | "backend" | "frontend";

export interface ProjectLinks {
  repo?: string;
  caseStudy?: string;
  core?: string;
  order?: string;
  analytics?: string;
  overview?: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  period: string;
  stack: string[];
  description: string;
  highlights?: string[];
  status?: string;
  links: ProjectLinks;
  featured: boolean;
  focus: ProjectFocus;
}

export interface ExperienceEntry {
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface ContactInfo {
  email: string;
  linkedin: string;
  github: string;
  location: string;
}

export interface ResumeSkillCategory {
  name: string;
  items: string[];
}

export interface ResumeContent {
  name: string;
  title: string;
  contact: ContactInfo;
  summary: string;
  skills: ResumeSkillCategory[];
  projects: Project[];
  experience: ExperienceEntry[];
  education: EducationEntry;
  languages: LanguageProficiency[];
}
