export async function callAIProxy({
  provider,
  system,
  messages,
}: {
  provider: string;
  system: string;
  messages: { role: string; content: string }[];
}) {
  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, system, messages }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI request failed');
  }
  return response.json();
}

export function extractText(responseData: any, provider: string): string {
  return responseData.response || '';
}
