import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

import type { Language } from '../app/language';
import { buildSystemPrompt } from './portfolio-context';

type EnvOverrides = {
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatRequestBody = {
  language?: Language;
  messages?: ChatMessage[];
};

type AIProvider = 'gemini' | 'openai';
type CvDownloadLanguage = 'EN' | 'ES';
type CvDownloadAction = {
  href: string;
  label: string;
  fileName: string;
  language: CvDownloadLanguage;
};

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_OPENAI_MODEL = 'gpt-5-mini';
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1200;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function getAIErrorPayload(error: unknown, provider: AIProvider) {
  if (!error || typeof error !== 'object') {
    return { status: 502, error: 'The AI service is unavailable right now' };
  }

  const status = 'status' in error && typeof error.status === 'number' ? error.status : 502;
  const rawCode = 'code' in error ? error.code : undefined;
  const code = typeof rawCode === 'string' ? rawCode : undefined;
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const normalizedMessage = message.toLowerCase();
  const providerLabel = provider === 'gemini' ? 'Gemini' : 'AI';

  if (
    code === 'invalid_api_key' ||
    status === 401 ||
    normalizedMessage.includes('invalid api key') ||
    normalizedMessage.includes('api key not valid')
  ) {
    return { status: 401, error: `Invalid ${providerLabel} API key`, code: 'invalid_api_key' };
  }

  if (
    code === 'insufficient_quota' ||
    status === 429 ||
    normalizedMessage.includes('insufficient_quota') ||
    normalizedMessage.includes('quota') ||
    normalizedMessage.includes('resource exhausted') ||
    normalizedMessage.includes('resource_exhausted') ||
    normalizedMessage.includes('rate limit')
  ) {
    return { status: 429, error: `${providerLabel} usage limit exceeded`, code: 'insufficient_quota' };
  }

  return { status, error: 'The AI service is unavailable right now', code };
}

function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== 'object') return false;
      const role = 'role' in message ? message.role : undefined;
      const content = 'content' in message ? message.content : undefined;
      return (role === 'user' || role === 'assistant') && typeof content === 'string';
    })
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_MESSAGES);
}

function resolveEnv(overrides?: EnvOverrides) {
  return {
    AI_PROVIDER: overrides?.AI_PROVIDER ?? process.env.AI_PROVIDER,
    GEMINI_API_KEY: overrides?.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY,
    GEMINI_MODEL: overrides?.GEMINI_MODEL ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
    OPENAI_API_KEY: overrides?.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
    OPENAI_MODEL: overrides?.OPENAI_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
  };
}

function resolveProvider(aiProvider: string | undefined, geminiApiKey?: string, openaiApiKey?: string) {
  if (aiProvider === 'gemini' || aiProvider === 'openai') {
    return aiProvider;
  }

  if (geminiApiKey) return 'gemini';
  if (openaiApiKey) return 'openai';
  return null;
}

function buildGeminiContents(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

function normalizeIntentText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function compactIntentText(text: string) {
  return normalizeIntentText(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectReplyLanguage(text: string, fallback: Language): Language {
  const normalizedText = compactIntentText(text);
  const tokens = normalizedText.split(' ').filter(Boolean);
  const rawText = text.toLowerCase();
  let spanishScore = /[¿¡ñáéíóúü]/i.test(rawText) ? 2 : 0;
  let englishScore = 0;

  const spanishSignals = new Set([
    'aca',
    'al',
    'como',
    'con',
    'contacto',
    'cual',
    'cuando',
    'curriculum',
    'de',
    'decime',
    'donde',
    'el',
    'en',
    'es',
    'espanol',
    'experiencia',
    'habla',
    'hablas',
    'herramientas',
    'idioma',
    'idiomas',
    'ingles',
    'la',
    'me',
    'mi',
    'para',
    'por',
    'que',
    'quien',
    'quiero',
    'sobre',
    'su',
    'tomas',
    'trabaja',
    'trabajas',
    'tu',
    'vos',
  ]);
  const englishSignals = new Set([
    'about',
    'are',
    'can',
    'contact',
    'cv',
    'design',
    'designer',
    'do',
    'download',
    'english',
    'experience',
    'for',
    'he',
    'his',
    'how',
    'is',
    'languages',
    'me',
    'resume',
    'skills',
    'spanish',
    'tell',
    'tools',
    'tomas',
    'what',
    'where',
    'who',
    'with',
    'work',
    'you',
  ]);

  for (const token of tokens) {
    if (spanishSignals.has(token)) spanishScore += 1;
    if (englishSignals.has(token)) englishScore += 1;
  }

  if (normalizedText.includes('que hace') || normalizedText.includes('quien es')) spanishScore += 2;
  if (normalizedText.includes('what does') || normalizedText.includes('tell me')) englishScore += 2;

  if (spanishScore > englishScore) return 'ES';
  if (englishScore > spanishScore) return 'EN';
  return fallback;
}

function detectCvLanguage(text: string): CvDownloadLanguage | null {
  const normalizedText = compactIntentText(text);

  if (
    /\b(ingles|english|inglish)\b/.test(normalizedText) ||
    normalizedText === 'en' ||
    normalizedText.includes(' cv en')
  ) {
    return 'EN';
  }

  if (
    /\b(espanol|spanish|castellano)\b/.test(normalizedText) ||
    normalizedText === 'es' ||
    normalizedText.includes(' cv es')
  ) {
    return 'ES';
  }

  return null;
}

function mentionsCv(text: string) {
  const normalizedText = compactIntentText(text);
  return (
    normalizedText.includes('cv') ||
    normalizedText.includes('curriculum') ||
    normalizedText.includes('resume')
  );
}

function wantsCvDownload(text: string) {
  const normalizedText = compactIntentText(text);
  const asksForDownload =
    normalizedText.includes('descarg') ||
    normalizedText.includes('bajar') ||
    normalizedText.includes('quiero') ||
    normalizedText.includes('necesito') ||
    normalizedText.includes('pasame') ||
    normalizedText.includes('pasar') ||
    normalizedText.includes('mandame') ||
    normalizedText.includes('comparti') ||
    normalizedText.includes('download') ||
    normalizedText.includes('share') ||
    normalizedText.includes('send') ||
    normalizedText.includes('get') ||
    normalizedText.includes('link');

  return mentionsCv(text) && asksForDownload;
}

function assistantAskedCvLanguage(messages: ChatMessage[]) {
  const reversedMessages = [...messages].reverse();
  const lastAssistantMessage = reversedMessages.find((message) => message.role === 'assistant');
  if (!lastAssistantMessage) return false;

  const normalizedText = compactIntentText(lastAssistantMessage.content);
  const askedLanguageChoice =
    (normalizedText.includes('idioma') ||
      normalizedText.includes('language') ||
      normalizedText.includes('version') ||
      normalizedText.includes('prefieres') ||
      normalizedText.includes('preferis') ||
      normalizedText.includes('queres') ||
      normalizedText.includes('quieres')) &&
    (normalizedText.includes('espanol') || normalizedText.includes('spanish')) &&
    (normalizedText.includes('ingles') || normalizedText.includes('english'));

  if (!askedLanguageChoice) return false;

  const lastUserBeforeQuestion = reversedMessages.find((message) => message.role === 'user');
  return Boolean(lastUserBeforeQuestion && (wantsCvDownload(lastUserBeforeQuestion.content) || mentionsCv(lastUserBeforeQuestion.content)));
}

function buildCvDownloadPayload(replyLanguage: Language, cvLanguage: CvDownloadLanguage) {
  const isSpanishReply = replyLanguage === 'ES';
  const isSpanishCv = cvLanguage === 'ES';
  const href = isSpanishCv ? 'Curriculum/CV_ES.pdf' : 'Curriculum/CV_EN.pdf';
  const label = isSpanishReply
    ? `Descargar CV en ${isSpanishCv ? 'español' : 'inglés'}`
    : `Download ${isSpanishCv ? 'Spanish' : 'English'} CV`;

  return {
    answer: isSpanishReply
      ? `Sí, tocá acá y se descarga el CV en ${isSpanishCv ? 'español' : 'inglés'}.`
      : `Yes, tap here to download the ${isSpanishCv ? 'Spanish' : 'English'} CV.`,
    download: {
      href,
      label,
      fileName: isSpanishCv ? 'CV_ES.pdf' : 'CV_EN.pdf',
      language: cvLanguage,
    } satisfies CvDownloadAction,
  };
}

function getCvDownloadPayload(messages: ChatMessage[], replyLanguage: Language) {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') return null;

  const cvLanguage = detectCvLanguage(lastMessage.content);
  const shouldHandleCv =
    wantsCvDownload(lastMessage.content) ||
    (Boolean(cvLanguage) && assistantAskedCvLanguage(messages.slice(0, -1)));

  if (!shouldHandleCv) return null;

  if (!cvLanguage) {
    return {
      answer:
        replyLanguage === 'ES'
          ? 'Sí, te lo paso. ¿Lo querés en español o en inglés?'
          : 'Sure, I can share it. Would you like the Spanish or English version?',
    };
  }

  return buildCvDownloadPayload(replyLanguage, cvLanguage);
}

async function generateGeminiAnswer(apiKey: string, model: string, language: Language, replyLanguage: Language, messages: ChatMessage[]) {
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: buildGeminiContents(messages),
    config: {
      systemInstruction: buildSystemPrompt(language, replyLanguage),
      maxOutputTokens: 280,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  });

  return response.text?.trim();
}

async function generateOpenAIAnswer(apiKey: string, model: string, language: Language, replyLanguage: Language, messages: ChatMessage[]) {
  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model,
    instructions: buildSystemPrompt(language, replyLanguage),
    input: messages,
    max_output_tokens: 280,
  });

  return response.output_text?.trim();
}

export async function handleChatRequest(request: Request, overrides?: EnvOverrides) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const siteLanguage: Language = body.language === 'ES' ? 'ES' : 'EN';
  const messages = normalizeMessages(body.messages);

  if (messages.length === 0) {
    return json({ error: 'At least one message is required' }, 400);
  }

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    return json({ error: 'The last message must come from the user' }, 400);
  }

  const replyLanguage = detectReplyLanguage(lastMessage.content, siteLanguage);
  const cvDownloadPayload = getCvDownloadPayload(messages, replyLanguage);
  if (cvDownloadPayload) {
    return json(cvDownloadPayload);
  }

  const { AI_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL, OPENAI_API_KEY, OPENAI_MODEL } = resolveEnv(overrides);
  const provider = resolveProvider(AI_PROVIDER, GEMINI_API_KEY, OPENAI_API_KEY);

  if (!provider) {
    return json({ error: 'Missing AI provider credentials' }, 500);
  }

  if (provider === 'gemini' && !GEMINI_API_KEY) {
    return json({ error: 'Missing GEMINI_API_KEY' }, 500);
  }

  if (provider === 'openai' && !OPENAI_API_KEY) {
    return json({ error: 'Missing OPENAI_API_KEY' }, 500);
  }

  try {
    const answer =
      provider === 'gemini'
        ? await generateGeminiAnswer(GEMINI_API_KEY!, GEMINI_MODEL, siteLanguage, replyLanguage, messages)
        : await generateOpenAIAnswer(OPENAI_API_KEY!, OPENAI_MODEL, siteLanguage, replyLanguage, messages);

    if (!answer) {
      return json({ error: 'Empty AI response' }, 502);
    }

    return json({
      answer,
      provider,
      model: provider === 'gemini' ? GEMINI_MODEL : OPENAI_MODEL,
    });
  } catch (error) {
    console.error('AI chat failed', error);
    const payload = getAIErrorPayload(error, provider);
    return json({ error: payload.error, code: payload.code }, payload.status);
  }
}
