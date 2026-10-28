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
    throw new Error('EXPO_PUBLIC_API_URL is not configured. Check the mobile .env file.');
  }

  return apiUrl;
}

export function validateJobDescription(jobDescription: string) {
  const characterCount = jobDescription.trim().length;

  if (characterCount < MIN_JOB_DESCRIPTION_LENGTH) {
    throw new Error(`The job description must contain at least ${MIN_JOB_DESCRIPTION_LENGTH} characters.`);
  }

  if (characterCount > MAX_JOB_DESCRIPTION_LENGTH) {
    throw new Error(`The job description cannot exceed ${MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters.`);
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
    let message = `Analysis failed (${response.status})`;

    try {
      const errorBody = (await response.json()) as ErrorResponse;
      if (typeof errorBody.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // Keep the status-based message when the backend does not return JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as JobMatchResult;
}
