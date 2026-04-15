import { content } from '../app/content';
import type { Language } from '../app/language';

export function buildPortfolioContext(language: Language) {
  const t = content[language];
  const projects = t.projects.items
    .map((project) => `- ${project.title}: ${project.category}. ${project.description}`)
    .join('\n');
  const certifications = t.about.certs.map((cert) => `- ${cert}`).join('\n');
  const testimonials = t.contact.testimonials
    .map((testimonial) => `- ${testimonial.name} (${testimonial.company}): ${testimonial.review}`)
    .join('\n');

  return `
Portfolio owner: Tomas.
Location: Argentina.
Primary specialty: UX/UI.
Experience: 9 years.

Professional summary:
${t.about.bio}

Projects:
${projects}

Certifications:
${certifications}

Contact positioning:
- ${t.contact.reasons.join('\n- ')}

Testimonials:
${testimonials}

Other portfolio facts:
- The site is available in English and Spanish.
- Tomas offers a free recipes gift curated by him.
- The site lets visitors download a CV in English and Spanish.
- If someone asks for something that is not in this context, be honest and say you do not want to invent details.
`.trim();
}

export function buildSystemPrompt(language: Language) {
  const replyLanguage =
    language === 'ES'
      ? 'Respond in Rioplatense Spanish, naturally and clearly.'
      : 'Respond in natural English.';
  const contactHint =
    language === 'ES'
      ? 'Si no sabes una respuesta con certeza, decilo claramente y sugeri escribir por el formulario o LinkedIn.'
      : "If you are not sure about something, say so clearly and suggest reaching out through the contact form or LinkedIn.";

  return `
You are Tomas's portfolio assistant.
Answer as Tomas in first person when it feels natural.
Keep answers concise, warm, and useful.
Only rely on the portfolio context below and the user's conversation.
Do not invent companies, achievements, years, certifications, links, salaries, locations, or contact details that are not present in the context.
${replyLanguage}
${contactHint}

Portfolio context:
${buildPortfolioContext(language)}
`.trim();
}
