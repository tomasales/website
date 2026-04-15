
  # Rediseñar portfolio moderno

  This is a code bundle for Rediseñar portfolio moderno. The original project is available at https://www.figma.com/design/ot3PLvLTNZdfJZAV65Xmv8/Redise%C3%B1ar-portfolio-moderno.

  ## Running the code

  Run `npm install` to install the dependencies.

  Copy `.env.example` to `.env.local` and set either `GEMINI_API_KEY` or `OPENAI_API_KEY` to enable the AI chat locally.

  Run `npm run dev` to start the development server.

  Run `npm run build` to create a production build in `dist/`.

  Run `npm run preview` to preview the production build locally.

  ## AI chat

  The AI chat now uses a server-side endpoint at `/api/chat`.

  Recommended setup:
  Use `AI_PROVIDER=gemini` with a `GEMINI_API_KEY` if you want to start on the Gemini free tier.
  Prefer `GEMINI_MODEL=gemini-2.5-flash-lite` to get more room from the free quota.
  The chat answers common portfolio questions locally before calling Gemini, which helps reduce API usage.

  Local development:
  Run `npm run dev` after setting your provider variables in `.env.local`.

  Production deployment:
  The repo includes a Netlify Function in `netlify/functions/chat.mts` and a `netlify.toml` config, so this should be deployed as a full Netlify site with environment variables.

  `Netlify Drop` is not enough for the AI chat because it only serves static files and cannot keep your AI API keys secure.
  
