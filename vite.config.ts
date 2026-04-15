import type { IncomingMessage } from 'node:http'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

import { handleChatRequest } from './src/server/chat-handler'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function aiChatDevMiddleware(env: Record<string, string>) {
  return {
    name: 'ai-chat-dev-middleware',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/chat')) return next()

        try {
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (!value) continue
            headers.set(key, Array.isArray(value) ? value.join(', ') : value)
          }

          const body =
            req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req)
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers,
            body: body && body.length > 0 ? body : undefined,
          })
          const response = await handleChatRequest(request, {
            AI_PROVIDER: env.AI_PROVIDER,
            GEMINI_API_KEY: env.GEMINI_API_KEY,
            GEMINI_MODEL: env.GEMINI_MODEL,
            OPENAI_API_KEY: env.OPENAI_API_KEY,
            OPENAI_MODEL: env.OPENAI_MODEL,
          })

          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      figmaAssetResolver(),
      aiChatDevMiddleware(env),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
