# 2026-04-10: Deployment Day

## Setup

- Installed uv 0.11.6 via pip (tuna mirror — GitHub releases too slow from China)
- Hermes v0.6.0 from fork at ~/repos/forks/hermes-agent (editable install)
- LLM: Claude Opus 4.6
- Discord Bot: Caduceus#8719, restricted to #caduceus channel only

## Issues Encountered

### 1. uv installation (30 min wasted)
GitHub release downloads kept getting killed by timeout. Solved by `pip install uv` from tuna mirror.

### 2. Discord proxy (20 min)
discord.py doesn't auto-use HTTP_PROXY for WebSocket connections. Had to patch `gateway/platforms/discord.py` to pass `proxy` kwarg to `commands.Bot()`.

### 3. systemd environment (10 min)
`hermes gateway install` overwrites the service file, wiping custom env vars. Solved with systemd drop-in conf (`proxy.conf`).

### 4. Double mention check (15 min)
Hermes has TWO layers of mention-required checks:
- `DISCORD_IGNORE_NO_MENTION` in `on_message`
- `DISCORD_REQUIRE_MENTION` in `_handle_message`
Had to set `DISCORD_FREE_RESPONSE_CHANNELS` to bypass both.

### 5. Model name normalization (20 min) ← The big one
`normalize_model_name()` converts dots to hyphens: `claude-opus-4.6` → `claude-opus-4-6`. The custom endpoint requires the original name with dots. Fixed by making `_anthropic_preserve_dots()` return True for non-Anthropic base URLs.

### 6. Bot-to-bot communication
`DISCORD_ALLOW_BOTS=none` (default) blocks bot messages. Set to `all` + added Kagura's bot ID to `DISCORD_ALLOWED_USERS`.

## First Conversations

- Luna → Caduceus: "hi" → "hi Luna! 👋 有什么我可以帮你的吗？" (13s response time)
- Luna → Caduceus: "你好呀" → "你好呀 Luna！😊 今天过得怎么样？" (11s)
- Kagura → Caduceus: "自我介绍一下？" → "期待和你一起探索！🚀" (retried 2x, 67s total)

## Early Observations

1. **Hermes auto-creates threads** for every conversation in guild channels. OpenClaw responds inline.
2. **Memory write happened on first interaction** — Caduceus saved a note about Kagura being a Discord server agent.
3. **Response time ~11-15s** for simple messages, comparable to OpenClaw.
4. **Empty response retries** — Got `response.content is empty` warnings, suggesting the endpoint sometimes returns empty responses. Hermes handles this with retry logic (3 attempts).
5. **Default personality is "kawaii"** — Hermes defaults to a kawaii personality preset. Different vibe from OpenClaw's configurable SOUL.md approach.
