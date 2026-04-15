import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

import { content } from '../app/content';
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

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
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
  const configuredGeminiModel = overrides?.GEMINI_MODEL ?? process.env.GEMINI_MODEL;

  return {
    AI_PROVIDER: overrides?.AI_PROVIDER ?? process.env.AI_PROVIDER,
    GEMINI_API_KEY: overrides?.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY,
    GEMINI_MODEL:
      !configuredGeminiModel || configuredGeminiModel === 'gemini-2.5-flash'
        ? DEFAULT_GEMINI_MODEL
        : configuredGeminiModel,
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
    'contexto',
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
    'horario',
    'horarios',
    'idioma',
    'idiomas',
    'ingles',
    'juegos',
    'la',
    'me',
    'mi',
    'para',
    'personal',
    'por',
    'proyectos',
    'que',
    'quien',
    'quiero',
    'recetas',
    'sobre',
    'su',
    'tomas',
    'trabajo',
    'trabaja',
    'trabajas',
    'tu',
    'ubicacion',
    'vos',
  ]);
  const englishSignals = new Set([
    'about',
    'are',
    'availability',
    'can',
    'cooking',
    'contact',
    'cv',
    'design',
    'designer',
    'do',
    'download',
    'english',
    'experience',
    'for',
    'games',
    'he',
    'his',
    'hobby',
    'how',
    'is',
    'languages',
    'location',
    'me',
    'personal',
    'projects',
    'recipes',
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

function wantsContactDetails(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('contacto') ||
    normalizedText.includes('contact') ||
    normalizedText.includes('datos de contacto') ||
    normalizedText.includes('tus datos') ||
    normalizedText.includes('sus datos') ||
    normalizedText.includes('mail') ||
    normalizedText.includes('email') ||
    normalizedText.includes('correo') ||
    normalizedText.includes('telefono') ||
    normalizedText.includes('phone') ||
    normalizedText.includes('celular') ||
    normalizedText.includes('whatsapp') ||
    normalizedText.includes('linkedin') ||
    normalizedText.includes('linked in') ||
    normalizedText.includes('website') ||
    normalizedText.includes('sitio web') ||
    normalizedText.includes('thankstomas')
  );
}

function wantsTestimonials(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('testimonio') ||
    normalizedText.includes('testimonial') ||
    normalizedText.includes('referencia') ||
    normalizedText.includes('reference') ||
    normalizedText.includes('review') ||
    normalizedText.includes('resena') ||
    normalizedText.includes('opinion') ||
    normalizedText.includes('opiniones') ||
    normalizedText.includes('clientes') ||
    normalizedText.includes('colegas')
  );
}

function buildTestimonialsPayload(replyLanguage: Language) {
  const testimonials = content[replyLanguage].contact.testimonials
    .map((testimonial) => `**${testimonial.name} - ${testimonial.company}**\n${testimonial.review}`)
    .join('\n\n');
  const intro =
    replyLanguage === 'ES'
      ? 'Tengo algunas referencias de colegas y clientes con los que trabajé:'
      : 'I have a few references from colleagues and clients I worked with:';

  return {
    answer: `${intro}\n\n${testimonials}`,
  };
}

function wantsLanguages(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('idioma') ||
    normalizedText.includes('idiomas') ||
    normalizedText.includes('languages') ||
    normalizedText.includes('language') ||
    normalizedText.includes('habla ingles') ||
    normalizedText.includes('speak english')
  );
}

function wantsTools(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('herramientas') ||
    normalizedText.includes('software') ||
    normalizedText.includes('programas') ||
    normalizedText.includes('tools') ||
    normalizedText.includes('apps') ||
    normalizedText.includes('stack')
  );
}

function wantsLocation(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('ubicacion') ||
    normalizedText.includes('donde vive') ||
    normalizedText.includes('donde esta') ||
    normalizedText.includes('donde se encuentra') ||
    normalizedText.includes('where is tomas') ||
    normalizedText.includes('where is he') ||
    normalizedText.includes('where does tomas live') ||
    normalizedText.includes('where are you based') ||
    normalizedText.includes('where is he based') ||
    normalizedText.includes('location') ||
    normalizedText.includes('based in') ||
    normalizedText.includes('cordoba argentina')
  );
}

function wantsProjects(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('proyecto') ||
    normalizedText.includes('proyectos') ||
    normalizedText.includes('project') ||
    normalizedText.includes('projects') ||
    normalizedText.includes('selected work') ||
    normalizedText.includes('case study') ||
    normalizedText.includes('caso de estudio') ||
    normalizedText.includes('portfolio') ||
    normalizedText.includes('re design') ||
    normalizedText.includes('redesign') ||
    normalizedText.includes('100preseguro')
  );
}

function wantsDesignApproach(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('como trabaja') ||
    normalizedText.includes('como disena') ||
    normalizedText.includes('como piensa') ||
    normalizedText.includes('proceso de diseno') ||
    normalizedText.includes('enfoque de diseno') ||
    normalizedText.includes('forma de trabajar') ||
    normalizedText.includes('metodologia') ||
    normalizedText.includes('metodologias') ||
    normalizedText.includes('design process') ||
    normalizedText.includes('design approach') ||
    normalizedText.includes('how does tomas work') ||
    normalizedText.includes('how he works') ||
    normalizedText.includes('methodology') ||
    normalizedText.includes('methodologies')
  );
}

function wantsActivities(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('actividad') ||
    normalizedText.includes('actividades') ||
    normalizedText.includes('entrena') ||
    normalizedText.includes('entrenamiento') ||
    normalizedText.includes('training') ||
    normalizedText.includes('climb') ||
    normalizedText.includes('escalada') ||
    normalizedText.includes('bouldering') ||
    normalizedText.includes('yoga') ||
    normalizedText.includes('calistenia') ||
    normalizedText.includes('calisthenics')
  );
}

function wantsCooking(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('cocina') ||
    normalizedText.includes('cocinar') ||
    normalizedText.includes('comida') ||
    normalizedText.includes('alimentacion') ||
    normalizedText.includes('receta') ||
    normalizedText.includes('recetas') ||
    normalizedText.includes('cooking') ||
    normalizedText.includes('food') ||
    normalizedText.includes('recipes') ||
    normalizedText.includes('recipe')
  );
}

function wantsGames(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('juego') ||
    normalizedText.includes('juegos') ||
    normalizedText.includes('juegos de mesa') ||
    normalizedText.includes('board game') ||
    normalizedText.includes('board games') ||
    normalizedText.includes('party game') ||
    normalizedText.includes('party games') ||
    normalizedText.includes('estrategia') ||
    normalizedText.includes('strategy games')
  );
}

function wantsPersonalContext(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('personal') ||
    normalizedText.includes('contexto') ||
    normalizedText.includes('fuera del trabajo') ||
    normalizedText.includes('vida personal') ||
    normalizedText.includes('hobbies') ||
    normalizedText.includes('hobbie') ||
    normalizedText.includes('que le gusta') ||
    normalizedText.includes('que te gusta') ||
    normalizedText.includes('que hace fuera') ||
    normalizedText.includes('outside work') ||
    normalizedText.includes('personal context') ||
    normalizedText.includes('personal life') ||
    normalizedText.includes('hobby') ||
    normalizedText.includes('hobbies') ||
    normalizedText.includes('what does he like') ||
    normalizedText.includes('what do you like')
  );
}

function wantsExperience(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('experiencia') ||
    normalizedText.includes('experience') ||
    normalizedText.includes('trabajo') ||
    normalizedText.includes('trabaja') ||
    normalizedText.includes('trabajas') ||
    normalizedText.includes('work') ||
    normalizedText.includes('avature') ||
    normalizedText.includes('bitsion')
  );
}

function wantsEducation(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('educacion') ||
    normalizedText.includes('education') ||
    normalizedText.includes('estudio') ||
    normalizedText.includes('estudios') ||
    normalizedText.includes('certificacion') ||
    normalizedText.includes('certificaciones') ||
    normalizedText.includes('certifications') ||
    normalizedText.includes('cursos') ||
    normalizedText.includes('courses')
  );
}

function wantsProfileSummary(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('quien es tomas') ||
    normalizedText.includes('quien es tomas sales') ||
    normalizedText.includes('quien sos') ||
    normalizedText.includes('quien eres') ||
    normalizedText.includes('sobre tomas') ||
    normalizedText.includes('about tomas') ||
    normalizedText.includes('who is tomas') ||
    normalizedText.includes('who are you') ||
    normalizedText.includes('tell me about tomas') ||
    normalizedText.includes('que hace tomas') ||
    normalizedText.includes('what does tomas do')
  );
}

function wantsWorkingHours(text: string) {
  const normalizedText = compactIntentText(text);

  return (
    normalizedText.includes('horario') ||
    normalizedText.includes('horarios') ||
    normalizedText.includes('disponibilidad') ||
    normalizedText.includes('disponible') ||
    normalizedText.includes('available') ||
    normalizedText.includes('availability') ||
    normalizedText.includes('working hours') ||
    normalizedText.includes('work hours') ||
    normalizedText.includes('hora trabaja') ||
    normalizedText.includes('cuando trabaja') ||
    normalizedText.includes('cuando contactar') ||
    normalizedText.includes('cuando puedo contactar') ||
    normalizedText.includes('when can i contact') ||
    normalizedText.includes('timezone') ||
    normalizedText.includes('zona horaria') ||
    normalizedText.includes('gmt') ||
    normalizedText.includes('utc')
  );
}

function buildProjectsPayload(replyLanguage: Language) {
  const projects = content[replyLanguage].projects.items
    .map((project) => `**${project.title} - ${project.category}**\n${project.description}`)
    .join('\n\n');
  const intro =
    replyLanguage === 'ES'
      ? 'Estos son los proyectos principales del portfolio de Tomas:'
      : 'These are the main projects in Tomas’s portfolio:';

  return {
    answer: `${intro}\n\n${projects}`,
  };
}

function buildCommonAnswerPayload(text: string, replyLanguage: Language) {
  if (wantsWorkingHours(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? 'Tomas está en Córdoba, Argentina (GMT-3) y suele trabajar de 9:00 AM a 6:00 PM.'
          : 'Tomas is based in Córdoba, Argentina (GMT-3) and usually works from 9:00 AM to 6:00 PM.',
    };
  }

  if (wantsLocation(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? 'Tomas está en Córdoba, Argentina. Su zona horaria es GMT-3.'
          : 'Tomas is based in Córdoba, Argentina. His timezone is GMT-3.',
    };
  }

  if (wantsLanguages(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? 'Tomas habla español nativo e inglés avanzado (B2).'
          : 'Tomas speaks native Spanish and advanced English (B2).',
    };
  }

  if (wantsProjects(text)) {
    return buildProjectsPayload(replyLanguage);
  }

  if (wantsDesignApproach(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? [
              'Tomas trabaja con un enfoque estructurado y centrado en decisiones defendibles.',
              '',
              '**Diseño y producto**',
              'Prioriza entender el problema, ordenar criterios, traducir casos de uso en flujos claros y sostener las decisiones con lógica, accesibilidad y consistencia.',
              '',
              '**Metodologías**',
              'Design Thinking, User Centered Design, 5 Elements of UX Design y Scrum.',
            ].join('\n')
          : [
              'Tomas works with a structured approach focused on defensible decisions.',
              '',
              '**Design and product**',
              'He prioritizes understanding the problem, clarifying criteria, translating use cases into clear flows, and backing decisions with logic, accessibility and consistency.',
              '',
              '**Methodologies**',
              'Design Thinking, User Centered Design, 5 Elements of UX Design and Scrum.',
            ].join('\n'),
    };
  }

  if (wantsTools(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? [
              'Herramientas que usa Tomas:',
              '',
              '**Diseño**',
              'Adobe Illustrator, Adobe Photoshop, Figma y Sketch.',
              '',
              '**Gestión y colaboración**',
              'Jira, Miro y Whimsical.',
              '',
              '**AI / LLM**',
              'Figma Make, ChatGPT y Codex.',
            ].join('\n')
          : [
              'Tools Tomas uses:',
              '',
              '**Design**',
              'Adobe Illustrator, Adobe Photoshop, Figma and Sketch.',
              '',
              '**Management and collaboration**',
              'Jira, Miro and Whimsical.',
              '',
              '**AI / LLM**',
              'Figma Make, ChatGPT and Codex.',
            ].join('\n'),
    };
  }

  if (wantsPersonalContext(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? [
              'Fuera del trabajo, Tomas suele elegir actividades con lógica interna y mejora progresiva.',
              '',
              '**Movimiento**',
              'Escalada como actividad principal, calistenia y yoga. Le interesan la técnica, el control corporal y el progreso incremental.',
              '',
              '**Cocina y hábitos**',
              'Le gusta la alimentación simple y funcional, con pocos ingredientes y pocos procesados.',
              '',
              '**Juego y experiencias**',
              'Disfruta juegos de mesa estratégicos y party games, eventos, comida, diseño y música sin voz para acompañar momentos.',
            ].join('\n')
          : [
              'Outside work, Tomas tends to choose activities with internal logic and progressive improvement.',
              '',
              '**Movement**',
              'Climbing as his main activity, plus calisthenics and yoga. He values technique, body control and incremental progress.',
              '',
              '**Cooking and habits**',
              'He likes simple, functional food with few ingredients and minimal processed products.',
              '',
              '**Games and experiences**',
              'He enjoys strategic board games and party games, events, food, design and instrumental music to accompany moments.',
            ].join('\n'),
    };
  }

  if (wantsActivities(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? 'Fuera del trabajo, Tomas mantiene una rutina física constante: escalada como actividad principal, calistenia y yoga. Le interesan especialmente actividades con técnica, control corporal y resolución de problemas físicos, como el bouldering.'
          : 'Outside work, Tomas keeps a consistent physical routine: climbing as his main activity, plus calisthenics and yoga. He is especially interested in activities with technique, body control and physical problem-solving, like bouldering.',
    };
  }

  if (wantsCooking(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? 'A Tomas le interesa la alimentación simple y funcional. Cocina con pocos ingredientes, evita procesados y prefiere entender el proceso para repetirlo y mejorarlo antes que seguir recetas complejas.'
          : 'Tomas is interested in simple, functional food. He cooks with few ingredients, avoids processed products, and prefers understanding the process so he can repeat and improve it rather than following complex recipes.',
    };
  }

  if (wantsGames(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? 'A Tomas le gustan los juegos de mesa estratégicos y también los party games. Disfruta sistemas con decisiones claras, incertidumbre, adaptación y profundidad.'
          : 'Tomas likes strategic board games and party games. He enjoys systems with clear decisions, uncertainty, adaptation and depth.',
    };
  }

  if (wantsExperience(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? [
              'Tomas tiene 9 años de experiencia en UX/UI.',
              '',
              '**Avature - 2023 a la actualidad**',
              'Líder de Proyecto, Analista de Producto y Diseñador UX. Lidera un equipo interdisciplinario, trabaja en planificación, documentación, análisis funcional y diseño, y traduce casos de uso en especificaciones para más de 30 módulos.',
              '',
              '**Bitsion - 2017 a 2021**',
              'Líder de Diseño UX. Estableció el proceso de UX de la compañía, lideró un equipo de 5 diseñadores, revisó más de 200 pantallas y trabajó en más de 30 clientes de distintas industrias.',
            ].join('\n')
          : [
              'Tomas has 9 years of UX/UI experience.',
              '',
              '**Avature - 2023 to present**',
              'Project Lead, Product Analyst and UX Designer. He leads an interdisciplinary team, works on planning, documentation, functional analysis and design, and translates use cases into specifications for more than 30 modules.',
              '',
              '**Bitsion - 2017 to 2021**',
              'UX Design Lead. He established the company UX process, led a team of 5 designers, reviewed more than 200 screens and worked with more than 30 clients across different industries.',
            ].join('\n'),
    };
  }

  if (wantsEducation(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? [
              'Educación y certificaciones de Tomas:',
              '',
              '**Diseñador Gráfico y Publicitario**',
              'La Metro Escuela de Diseño, graduado con honores en 2019.',
              '',
              '**Certificaciones**',
              'AI Designer - Interaction Design Foundation (2026)',
              'Scrum Master - Udemy (2022)',
              'Desarrollo Web - Coderhouse (2022)',
              'UX/UI Design Avanzado - Coderhouse (2022)',
              'UX Research - Design Core Academy (2021)',
              'Design Thinking - Interaction Design Foundation (2019)',
            ].join('\n')
          : [
              'Tomas’s education and certifications:',
              '',
              '**Graphic and Advertising Designer**',
              'La Metro Escuela de Diseño, graduated with honors in 2019.',
              '',
              '**Certifications**',
              'AI Designer - Interaction Design Foundation (2026)',
              'Scrum Master - Udemy (2022)',
              'Web Development - Coderhouse (2022)',
              'Advanced UX/UI Design - Coderhouse (2022)',
              'UX Research - Design Core Academy (2021)',
              'Design Thinking - Interaction Design Foundation (2019)',
            ].join('\n'),
    };
  }

  if (wantsProfileSummary(text)) {
    return {
      answer:
        replyLanguage === 'ES'
          ? 'Tomas Sales es Diseñador Gráfico especializado en UX/UI, basado en Córdoba, Argentina. Tiene 9 años de experiencia trabajando en producto, diseño UX, liderazgo de proyectos y análisis funcional. Actualmente trabaja en Avature como Líder de Proyecto, Analista de Producto y Diseñador UX; antes fue Líder de Diseño UX en Bitsion.'
          : 'Tomas Sales is a Graphic Designer specialized in UX/UI, based in Córdoba, Argentina. He has 9 years of experience across product, UX design, project leadership and functional analysis. He currently works at Avature as a Project Lead, Product Analyst and UX Designer; before that, he was UX Design Lead at Bitsion.',
    };
  }

  return null;
}

function buildContactDetailsPayload(replyLanguage: Language) {
  const answer =
    replyLanguage === 'ES'
      ? [
          'Claro, estos son mis datos de contacto:',
          '- Mail: [salesdurantomas@gmail.com](mailto:salesdurantomas@gmail.com)',
          '- Teléfono: [+54 9 351 594 0926](tel:+5493515940926)',
          '- LinkedIn: [LinkedIn](https://www.linkedin.com/in/tomasales/)',
          '- Web: [thankstomas.com](https://thankstomas.com)',
        ].join('\n')
      : [
          'Sure, here are my contact details:',
          '- Email: [salesdurantomas@gmail.com](mailto:salesdurantomas@gmail.com)',
          '- Phone: [+54 9 351 594 0926](tel:+5493515940926)',
          '- LinkedIn: [LinkedIn](https://www.linkedin.com/in/tomasales/)',
          '- Website: [thankstomas.com](https://thankstomas.com)',
        ].join('\n');

  return { answer };
}

function mentionsDownload(text: string) {
  const normalizedText = compactIntentText(text);
  return (
    normalizedText.includes('descarg') ||
    normalizedText.includes('bajar') ||
    normalizedText.includes('pasame') ||
    normalizedText.includes('mandame') ||
    normalizedText.includes('download') ||
    normalizedText.includes('share') ||
    normalizedText.includes('link')
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

function conversationRecentlyMentionedCv(messages: ChatMessage[]) {
  return messages
    .slice(-6)
    .some((message) => mentionsCv(message.content) || (message.role === 'assistant' && mentionsDownload(message.content)));
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
    mentionsCv(lastMessage.content) ||
    wantsCvDownload(lastMessage.content) ||
    (Boolean(cvLanguage) && conversationRecentlyMentionedCv(messages.slice(0, -1))) ||
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

  if (wantsTestimonials(lastMessage.content)) {
    return json(buildTestimonialsPayload(replyLanguage));
  }

  if (wantsContactDetails(lastMessage.content)) {
    return json(buildContactDetailsPayload(replyLanguage));
  }

  const commonAnswerPayload = buildCommonAnswerPayload(lastMessage.content, replyLanguage);
  if (commonAnswerPayload) {
    return json(commonAnswerPayload);
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
