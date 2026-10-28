export type ChatSource = {
  chunk_index: number;
  distance: number;
  text: string;
};

export type ChatResult = {
  conversation_id: string;
  answer: string;
  model: string;
  tools_used: string[];
  sources: ChatSource[];
};

type SendChatInput = {
  message: string;
  conversationId?: string;
  jobDescription?: string;
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

export async function sendChatMessage({
  message,
  conversationId,
  jobDescription,
}: SendChatInput): Promise<ChatResult> {
  const response = await fetch(`${getApiUrl()}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      job_description: jobDescription,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Chat request fail hui (${response.status})`;

    try {
      const errorBody = (await response.json()) as ErrorResponse;
      if (typeof errorBody.detail === 'string') {
        errorMessage = errorBody.detail;
      }
    } catch {
      // Backend ne JSON error nahi bheja, isliye status wala message dikhega.
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as ChatResult;
}
