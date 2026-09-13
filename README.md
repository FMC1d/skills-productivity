# Agentic Skills: Executive Productivity & Task Mastery

> Workplace acceleration skills for task tracking, context handoffs, meeting summarization, ruthless plan interviews, and continuous learning.

This repository is part of the **Open Agentic Skills Catalog**. It provides modular, self-contained, and security-hardened skills for autonomous agents (Claude Code, Cursor, Codex, OpenClaw, Gemini CLI, and Antigravity).

## Skills Included (13)

| Skill | Description |
|---|---|
| [`task-management`](skills/task-management) | Simple task management using a shared TASKS.md file. Reference this when the user asks about their tasks, wants to add/complete tasks, or needs help tracking commitments. |
| [`memory-management`](skills/memory-management) | Two-tier memory system that makes Claude a true workplace collaborator. Decodes shorthand, acronyms, nicknames, and internal language so Claude understands requests like a colleague would. CLAUDE.md for working memory, memory/ directory for the full knowledge base. |
| [`start`](skills/start) | Initialize the productivity system and open the dashboard. Use when setting up the plugin for the first time, bootstrapping working memory from your existing task list, or decoding the shorthand (nicknames, acronyms, project codenames) you use in your todos. |
| [`update`](skills/update) | Sync tasks and refresh memory from your current activity. Use when pulling new assignments from your project tracker into TASKS.md, triaging stale or overdue tasks, filling memory gaps for unknown people or projects, or running a comprehensive scan to catch todos buried in chat and email. |
| [`meeting-to-actions`](skills/meeting-to-actions) | Procesa transcripciones de reuniones y extrae informacion estructurada |
| [`inbox-cleaner`](skills/inbox-cleaner) | Clasifica emails no leidos por prioridad y limpia ruido en lote |
| [`grill-me`](skills/grill-me) | Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions grill me. |
| [`unlazy`](skills/unlazy) | Enforces completion discipline for substantial autonomous work by writing acceptance gates before execution, decomposing work with the Depth Tree, running approved checks, and re-verifying evidence before reporting. Use when Codex faces a long or multi-part task, work that has returned half-done, an exhaustive audit or build, parallel leaves or pipelines, or explicit triggers such as /unlazy, $unlazy, tree N, gates, and do not stop until it is done. |
| [`handoff`](skills/handoff) | Compacta la conversación actual en un documento de handoff para que otra sesión/agente continúe el trabajo. Lo deja en la carpeta local de handoffs, cristaliza el aprendizaje en el vault (LLM Wiki), y publica en Notion solo el resumen ejecutivo. Usar al cerrar una sesión de trabajo sustantiva, cuando el contexto se está agotando, cuando el usuario dice handoff, traspaso, deja esto documentado para la próxima sesión, o antes de traspasar trabajo a otro agente (Gemini, Sonnet, subagente). |
| [`friday-brief`](skills/friday-brief) | Delivers the Friday end-of-week pulse — revenue vs prior week, top sellers, wins and watches. Accepts optional lookback window of 7 or 14 days. |
| [`monday-brief`](skills/monday-brief) | Generates a one-page Monday morning briefing — cash, sales, pipeline, week ahead, top three to-dos. Accepts optional post destination and save-to arguments. |
| [`researcher`](skills/researcher) | Deep research on any topic using web search, multiple sources, and synthesis. Use when the user wants to research a topic, investigate a question, compare technologies, understand a concept deeply, find best practices, or needs a well-sourced analysis. Triggers on research, investigate, deep dive, compare, what are the best, pros and cons, how does X work. |
| [`busqueda-cientifica`](skills/busqueda-cientifica) | Buscar literatura cientifica, encontrar papers, revisar el estado del arte, conseguir el PDF de un articulo, o armar referencias APA 7 a partir de un DOI. Usar cuando el usuario pida buscar papers, revisar literatura, citar un articulo, verificar si algo es open access, o preguntar que dice la literatura sobre X. Aplica a trabajos de ingenieria civil bioquimica, informes de curso y el Proyecto de Titulo. |

## Installation & Usage

### 1. Claude Code
Clone or symlink the desired skill folder directly into your workspace `.claude/skills/` or global `~/.claude/skills/`:

```bash
# Example: install a specific skill into your current workspace
mkdir -p .claude/skills
cp -r skills/task-management .claude/skills/
```

### 2. Antigravity & Generic Agent Harnesses
Copy the skill into your `.agents/skills/` directory:

```bash
mkdir -p .agents/skills
cp -r skills/* .agents/skills/
```

### 3. Cursor & Windsurf
Reference the rule or skill inside your `.cursorrules` or `.windsurfrules`.

## Security & Privacy Guarantee

- **Zero Private Credentials**: All keys, webhooks, and secrets are parameterized as environment variables (`process.env.API_KEY`).
- **Zero PII**: Contains no private emails, phone numbers, or proprietary business tokens.
- **Open License**: Released under the [MIT License](LICENSE).
