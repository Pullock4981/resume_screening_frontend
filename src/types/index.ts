export interface RequirementResult {
  name: string;
  status: 'Strong' | 'Moderate' | 'Missing';
  reason: string;
}

export interface CandidateResult {
  name: string;
  email: string;
  phone: string;
  resumeLink: string;
  matchScore: number;
  atsScore: number;
  finalScore: number;
  category: string;
  criticalFlag: boolean;
  feedback: string;
  atsDetails: {
    atsScore: number;
    isParseable: boolean;
    warnings: string[];
    checklist?: Array<{ name: string; passed: boolean; detail: string }>;
    details?: {
      hasEmail: boolean;
      hasPhone: boolean;
      hasLinkedInOrWeb: boolean;
      sectionHeadersFound: string[];
      wordCount: number;
    };
  };
  matchingResults: {
    mustHaveResults: RequirementResult[];
    niceToHaveResults: RequirementResult[];
    criticalMissing: string[];
  };
}

export interface ScreeningData {
  spreadsheetId: string;
  total: number;
  results: CandidateResult[];
  extractedRequirements: {
    mustHave: string[];
    niceToHave: string[];
  };
}
