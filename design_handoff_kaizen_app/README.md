# Handoff: Kaizen App — Direção Matcha

## Overview

"Kaizen" is a project/task management web app (ClickUp-style) — workspace with projects, tasks, kanban/list/calendar views, notifications, team and settings. This package covers the "Direção Matcha" visual direction: a warm, muted matcha-green/olive palette with a soft cream background, rounded cards, and a Japanese-inspired wordmark ("改善" = kaizen).

## About the Design Files

The bundled file is a **design reference built in HTML** — a prototype showing intended look, layout, and content, not production code to copy directly. The task is to **recreate these HTML designs in the target codebase's existing environment** (React, Vue, native, etc.) using its established component patterns and libraries. If no environment exists yet, choose the framework best suited to the project and implement the designs there.

## Fidelity

**High-fidelity (hifi).** All 11 screens use final colors, typography, spacing, and copy. Recreate pixel-perfectly using the codebase's existing component library where one exists; otherwise use the design tokens below directly.

## Screens / Views

The file `Kaizen App - Direcao Matcha.dc.html` contains 11 screens, each in its own labeled section, all at a fixed canvas of **1440×900px** (desktop web app), sharing one wordmark (icon 改善 + "kaizen") and dark-green sidebar shell (except Login).

### 1. Login

- **Purpose**: Authenticate into the workspace.
- **Layout**: Centered 380px-wide column on the page background (#E8E5DB). Logo mark above a white card.
- **Components**: Logo (34px rounded-square icon #3D4D34 bg + "kaizen" wordmark), card (#FCFBF7, 1px border #E4DFCF, 18px radius, 32px/30px padding) with title "Entrar", subtitle, labeled email + password inputs (10px radius, 1px border #DDD7C9), primary button "Entrar" (pill, #5C7A52 bg, white text), and a "Cadastre-se" link line.

### 2. Dashboard (início)

- **Purpose**: Personal home / daily summary.
- **Layout**: Sidebar (248px) + main content (max-width 900px), padding 30px/34px, vertical stack with 22px gaps.
- **Components**: Greeting header "Olá, Felipe 👋" + subtitle; row of 3 stat cards (Concluídas/Em progresso/Atrasadas) each with icon chip + number + label; two side-by-side "Vencendo hoje" / "Atrasadas" mini-lists; a "Minhas tarefas" table-like list with status dot, task name, project name, due date (color-coded: red = overdue, default = muted).

### 3. Backlog (visão de lista)

- **Purpose**: Full task list for a project, grouped by section (Product Backlog, Sprint 12).
- **Layout**: Sidebar with project sub-nav (Lista/Kanban/Calendário). Header bar with project icon/name/description + view-switch pill tabs. Content: grouped rows, each row = checkbox circle, task name, tag chip, priority text, avatar circle.

### 4. Kanban

- **Purpose**: Board view of the same project.
- **Layout**: Sidebar + header (search bar w/ ⌘K hint, bell icon w/ red dot, user avatar+name, "Sair" button) + stat-card row (4 cards) + view tabs + 3 columns (Backlog/Em progresso/Concluído), each column 280px wide with card list (task name, tag chip, avatar).

### 5. Calendário

- **Purpose**: Month view of tasks by due date.
- **Layout**: Sidebar + header (month title + prev/next chevrons + view tabs). Main: 7-column CSS grid, day cells min-height 104px, 1px border, today highlighted with 2px green border + task chips inside.

### 6. Detalhe de tarefa (painel)

- **Purpose**: Task detail as a right-hand slide-over panel over the dimmed backlog view.
- **Layout**: Backlog view behind is blurred (1.5px) + dimmed (opacity .5) with a semi-transparent scrim (rgba(35,32,25,.28)) between sidebar and panel. Panel is 460px wide, white (#FCFBF7), left border, drop shadow.
- **Components**: Breadcrumb (project / TASK-142) + close button; title; 2-column meta grid (Status pill, Responsável avatar+name, Prazo, Prioridade, Etiqueta chip); Descrição paragraph; Subtarefas checklist (1/3 done, checked item strikethrough); Comentários thread (avatar + name + timestamp + text); sticky comment input + "Enviar" button at bottom.

### 7. Todos os projetos

- **Purpose**: Grid overview of all projects in the workspace.
- **Layout**: Sidebar (with "Projetos" nav item active) + header (title, count, "+ Novo projeto" button) + 3-column CSS grid of project cards.
- **Components**: Project card = icon emoji chip, name, status subtitle, description line, progress bar + percentage, avatar stack + "x/y tarefas" count. Last grid cell is a dashed "+ Criar novo projeto" placeholder card.

### 8. Configurações do workspace

- **Purpose**: Workspace general settings.
- **Layout**: Sidebar + secondary settings nav (210px: Geral/Membros/Integrações/Cobrança) + form column (max-width 620px).
- **Components**: Workspace avatar (56px rounded square) + "Alterar imagem" button; text inputs (Nome, URL, Fuso horário); toggle row ("Semana começa na segunda"); "Salvar alterações" button; "Zona de risco" danger section with red-outlined "Excluir workspace" button.

### 9. Membros da equipe

- **Purpose**: Manage workspace members (Configurações → Membros tab, active).
- **Layout**: Same settings shell as #8. Main content: header row (title, count, invite email input + "Convidar" button) + a bordered table (14px radius) with header row and member rows.
- **Components**: Row = avatar circle, name + email (stacked), role text (Owner/Admin/Membro, color-coded), status pill (Ativo = green, Pendente = amber), "•••" menu affordance.

### 10. Notificações

- **Purpose**: Full notification feed ("Avisos").
- **Layout**: Sidebar (Avisos nav active) + centered column (max-width 720px). Header: title + "Marcar tudo como lido" link. Content grouped by Hoje / Ontem / Essa semana.
- **Components**: Notification row = avatar or icon chip, message (bold names/task titles inline), optional quoted comment preview, unread red dot, relative timestamp. Unread items have a light card background (#F6F4EE).

### 11. Perfil do usuário

- **Purpose**: Personal account settings.
- **Layout**: Sidebar (user row highlighted) + centered column (max-width 640px).
- **Components**: Avatar (76px circle) + "Alterar foto" button; Nome/Cargo inputs side by side; E-mail input; "Preferências" section with 2 toggle rows (Notificações por e-mail = on, Tema escuro = off); action buttons "Salvar alterações" (primary) + "Alterar senha" (secondary/outline).

## Interactions & Behavior

- **Sidebar nav**: single active state per screen (solid #5C7A52 pill background, white text/icon); inactive items are #D8DFCF text on transparent.
- **View-switch pill tabs** (Lista/Kanban/Calendário): active = white pill w/ shadow inside a light-grey track (#F1EEE3); switching should route to the corresponding view for the same project, preserving project context.
- **Task detail panel**: opens as an overlay (slide-in from right) on top of whatever list/board view triggered it; clicking the ✕ or the scrim closes it back to the underlying view.
- **Toggles**: standard on/off switch, on = green track w/ knob right-aligned, off = grey track w/ knob left-aligned.
- **Checklist items** in task detail: checking a subtask should mark it done (strike-through text, filled green checkbox) and update the "x/y" counter.
- **Notifications**: unread rows show a red dot and (in the "Hoje" example) a highlighted background; "Marcar tudo como lido" should clear all dots/highlights.
- **Members table**: "•••" opens a menu (e.g., Alterar função, Remover); pending invites show a "Pendente" status until accepted.
- **Forms** (Login, Configurações, Perfil): standard client-side validation expected (required fields, email format) — not shown explicitly in the static mock.

## State Management

- Current user (name, initials, avatar color, role) — used in sidebar footer, header, profile.
- Current workspace (name, slug, icon/color, timezone, members list with roles/status).
- Projects list (name, icon, description, progress %, member avatars, task counts) — backs Dashboard, Todos os projetos, and project sub-nav.
- Current project + active view (Lista/Kanban/Calendário) — drives screens 3–6.
- Tasks (id, title, description, status, assignee, due date, priority, tags, subtasks, comments) — backs Dashboard lists, Backlog, Kanban, Calendar, Task detail.
- Notifications feed (type, actor, target, message, read/unread, timestamp), grouped by relative date.
- Toggle states for user/workspace preferences (email notifications, dark theme, week-start).

## Design Tokens

**Colors**

- Background (page): `#E8E5DB`
- Surface / card light: `#FCFBF7`
- Surface / card muted: `#F6F4EE`
- Sidebar dark green: `#3D4D34`
- Sidebar button hover/active bg: `#4B5D40`
- Primary green (buttons, active states): `#5C7A52`
- Deep green accent: `#5C7A52` / `#3D4D34`
- Light green chip bg: `#E3EBDE`
- Border (light): `#E4DFCF`
- Border (input): `#DDD7C9`
- Track / tab background: `#F1EEE3`
- Text primary: `#232019`
- Text secondary/muted: `#8f8873` / `#5c5548`
- Text faint: `#a39c8a`
- Sidebar text (inactive): `#D8DFCF` / `#C7D1BB`
- Red / overdue / danger: `#B8432E` (bg tint `#F1DAD5`)
- Amber / due-soon / pending: `#CA8A04` (bg tint `#F1E2CE`, text `#a05a2c`)
- Blue accent (project tag, in-progress): `#4B6FA0` / `#8CA8D6` (bg tint `#DCE6F1`)
- Pink accent (project/workspace tag): `#D77F8A` (bg tint `#F1DAD5`/avatar `#E3AEB0`)
- Purple accent (DevOps tag): `#7a3d84` (bg tint `#EBDEEF`)
- Avatar mint: `#A9C79A`

**Typography**

- Headings / wordmark: `Zen Maru Gothic`, weights 500/700
- Body / UI: `IBM Plex Sans`, weights 400/500/600
- Scale used: 24px (page titles) / 19–23px (section titles) / 20px (card titles) / 13–14.5px (body/labels) / 11–12.5px (meta/small) / 10–11px (chips/badges)

**Spacing / Shape**

- Screen canvas: 1440×900, 14px corner radius, `box-shadow: 0 20px 60px rgba(35,32,25,.18)`
- Sidebar width: 248px; settings sub-nav width: 210px; kanban column width: 280px; task panel width: 460px
- Card radius: 16px (stat/content cards), 12–14px (list rows, kanban cards, columns), 10px (inputs), 18–20px (buttons/pills, fully rounded)
- Card border: 1px solid `#E4DFCF`

**Shadows**

- Screen shadow: `0 20px 60px rgba(35,32,25,.18)`
- Card shadow (subtle): `0 8px 24px rgba(61,77,52,.06)`
- Panel shadow: `-8px 0 24px rgba(35,32,25,.1)`

## Assets

- No external image assets — all icons are inline SVG (feather/lucide-style, 2px stroke, `currentColor`), and avatars/logo are CSS shapes with initials/emoji. Google Fonts: `Zen Maru Gothic` and `IBM Plex Sans` (loaded via Google Fonts CDN in the file's `<head>`).

## Files

- `Kaizen App - Direcao Matcha.dc.html` — all 11 screens, self-contained (inline styles, Google Fonts link). Open directly in a browser to view; each screen is a labeled section in visual/reading order matching this document.
