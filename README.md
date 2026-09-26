<div align="center">

# ARKA

**Every AI model, in one conversation.**

</div>

---

Arka is a Persian-first AI chat platform. Sign in, connect your own API key (or
use the built-in providers), and chat with GPT, Claude, Gemini, DeepSeek, Grok
and any OpenAI-compatible endpoint — in one interface.

## Features

| | |
|---|---|
| **Multi-provider** | OpenAI, Anthropic, Google, DeepSeek, Grok, OpenRouter, Groq, and any OpenAI-compatible endpoint |
| **Switch models mid-chat** | Change model without losing the thread |
| **BYOK** | Your own keys, encrypted with AES-256-GCM, decrypted server-side only |
| **Automatic key failover** | On a quota or rate-limit error the next key takes over instantly |
| **Live streaming** | Word-by-word answers, with the model's reasoning shown separately |
| **HTML & SVG preview** | Run generated markup right in the chat |
| **Attachment detection** | Reads each model's real limits from the provider API |
| **Support tickets** | Users open and track tickets; admins reply and close |
| **Admin panel** | Stats, users, providers, keys, broadcasts, ticket inbox |

## Stack

- **Next.js 15** (App Router), **React 19**, **TypeScript** (strict)
- **Tailwind CSS 4** with **vibefarsi** components
- **Prisma** on **PostgreSQL**
- **SSE** streaming across four dialects: `chat_completions`, `anthropic_messages`, `responses`, `google_generate`

## Setup

```bash
pnpm install
cp .env.example .env      # fill in the values
npx prisma generate
npx prisma db push
pnpm dev
```

Runs at <http://localhost:3000>.

**Environment:** `DATABASE_URL`, `SESSION_SECRET`, `BYOK_ENCRYPTION_KEY`,
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL`,
`ADMIN_PASSWORD`.

## Commands

```bash
pnpm dev                  # dev server
pnpm build                # production build
pnpm lint                 # eslint
npx tsc --noEmit          # type check
bash scripts/arka-cli.sh  # admin CLI (server only)
```

## License

**Closed source and proprietary.** All rights reserved by **AliRezaC-xrol**. No
license is granted to copy, redistribute, modify or publish this software. See
[LICENSE](./LICENSE) for details.

The UI is built with **vibefarsi** components.
