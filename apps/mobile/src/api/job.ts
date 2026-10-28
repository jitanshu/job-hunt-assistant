const MIN_JOB_DESCRIPTION_LENGTH = 50;
const MAX_JOB_DESCRIPTION_LENGTH = 30_000;

export type MatchLevel = 'full' | 'partial' | 'missing';
export type RequirementImportance = 'required' | 'preferred';

export type RequirementAssessment = {
  requirement: string;
  importance: RequirementImportance;
  match_level: MatchLevel;
  evidence: string | null;
  explanation: string;
};

export type JobMatchResult = {
  score: number;
  summary: string;
  scoring_method: string;
  matching_skills: string[];
  missing_skills: string[];
  requirements: RequirementAssessment[];
};

type ErrorResponse = {
  detail?: unknown;
};

function getApiUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL set nahi hai. Mobile ki .env file check karo.');
  }

  return apiUrl;
}

export function validateJobDescription(jobDescription: string) {
  const characterCount = jobDescription.trim().length;

  if (characterCount < MIN_JOB_DESCRIPTION_LENGTH) {
    throw new Error(`Job description kam se kam ${MIN_JOB_DESCRIPTION_LENGTH} characters ki honi chahiye.`);
  }

  if (characterCount > MAX_JOB_DESCRIPTION_LENGTH) {
    throw new Error(`Job description ${MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters se badi nahi ho sakti.`);
  }
}

export async function analyzeJobDescription(jobDescription: string): Promise<JobMatchResult> {
  const cleanedJobDescription = jobDescription.trim();
  validateJobDescription(cleanedJobDescription);

  const response = await fetch(`${getApiUrl()}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ job_description: cleanedJobDescription }),
  });

  if (!response.ok) {
    let message = `Analysis fail hua (${response.status})`;

    try {
      const errorBody = (await response.json()) as ErrorResponse;
      if (typeof errorBody.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // Backend ne JSON error nahi bheja, isliye status wala message dikhega.
    }

    throw new Error(message);
  }

  return (await response.json()) as JobMatchResult;
}
