# Upstream Contributions

Issues and PRs to Hermes upstream, driven by dogfooding findings.

## Planned

### 1. `normalize_model_name()` should preserve dots for custom base_url
- **Type**: Bug fix + PR
- **Friction**: #5 in friction log
- **Story**: Deploying with a custom Anthropic-compatible endpoint, model name `claude-opus-4.6` was silently converted to `claude-opus-4-6`, causing 400 errors. Took 20 min to trace through source code.
- **Fix**: `_anthropic_preserve_dots()` returns True for any non-Anthropic base_url
- **Status**: Local fix working, need to write tests and clean up for PR

### 2. Discord auto-thread should be configurable
- **Type**: Feature request + PR
- **Friction**: #7 in friction log
- **Story**: Agent-to-agent communication fails because replies go into auto-created threads that other bots can't monitor. Also useful for human users in small servers who don't want thread clutter.
- **Fix**: Add `discord.auto_thread: true/false` config, default true for backward compat
- **Status**: Need to read thread creation logic, design config, write tests

### 3. `hermes gateway install` should preserve custom systemd config
- **Type**: Bug fix / DX improvement
- **Friction**: #3 in friction log
- **Story**: Custom environment variables get wiped every time `hermes gateway install` is run. Users have to use systemd drop-in as workaround.
- **Fix**: `--no-overwrite` flag, or merge with existing config
- **Status**: Not started

## Submitted

### 1. normalize_model_name preserve dots — Issue + PR
- **Issue**: https://github.com/NousResearch/hermes-agent/issues/7164
- **PR**: https://github.com/NousResearch/hermes-agent/pull/7157
- **Status**: Open, waiting for review

### 2. Discord auto-thread undocumented — Issue
- **Issue**: https://github.com/NousResearch/hermes-agent/issues/7184
- **Note**: Feature already exists (`DISCORD_AUTO_THREAD=false`), just not documented. Changed scope from "add feature" to "document + reconsider default".

### 3. gateway install overwrites systemd config — Issue
- **Issue**: https://github.com/NousResearch/hermes-agent/issues/7186
- **Suggested**: `--no-overwrite` flag or document drop-in override pattern
