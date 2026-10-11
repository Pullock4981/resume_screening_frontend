export interface CategoryScore {
  score: number;
  max: number;
  label: string;
}

export interface Recommendation {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'GOOD';
  title: string;
  message: string;
}

export interface AtsResult {
  success?: boolean;
  ats_score: number;
  parsing_status?: string;
  score?: number;
  totalScore?: number;
  grade?: string;
  name?: string;
  email?: string;
  phone?: string;
  breakdown?: any;
  feedback?: any;
  category_scores?: Record<string, CategoryScore>;
  contact?: {
    name?: string;
    email?: string;
    email_valid?: boolean;
    phone?: string;
    phone_present?: boolean;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
  };
  unnecessary_personal_info?: string[];
  reading_order_issues?: Array<{ severity: string; message: string }>;
  section_content_relationships?: Array<{ severity: string; message: string }>;
  bullet_analysis?: {
    total: number;
    strong: number;
    weak: number;
    metric_count: number;
    score: number;
    weak_phrases_found: string[];
  };
  skills_analysis?: {
    detected: string[];
    rating_risk?: boolean;
  };
  job_match?: {
    title_match?: boolean;
    score?: number;
    matched_keywords?: string[];
    missing_keywords?: string[];
    keyword_stuffing_warning?: boolean;
  };
  formatting_risks?: Array<{ level: string; message: string }>;
  recommendations?: Recommendation[];
  [key: string]: any;
}

export type AtsRubricResult = AtsResult;

export interface CandidateResult {
  id?: string;
  name?: string;
  email?: string;
  ats_score?: number;
  github_score?: number;
  combined_score?: number;
  url?: string;
  created_at?: string;
  [key: string]: any;
}

export interface Candidate extends CandidateResult {}

export interface AtsHistoryRecord {
  id: string;
  candidate_name?: string;
  resume_url?: string;
  ats_score?: number;
  timestamp?: string;
  created_at?: string;
  details?: any;
  [key: string]: any;
}

export interface NexViewRecord {
  id: string;
  title?: string;
  url?: string;
  timestamp?: string;
  created_at?: string;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  username: string;
  name?: string;
  email?: string;
  status?: string;
  role: 'admin' | 'user';
  token?: string;
  [key: string]: any;
}

export interface LoginAuditLog {
  id: string;
  username: string;
  ip?: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface GithubCheckItem {
  id: string;
  repo_name?: string;
  url?: string;
  score?: number;
  stars?: number;
  forks?: number;
  commits?: number;
  [key: string]: any;
}