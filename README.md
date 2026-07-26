+ # AutoBoard.ai — Enterprise IT Orchestrator (Hire to Retire)
+ 
+ > **Automate employee onboarding and offboarding with AI. From provisioning accounts to revoking access — one command, end to end.**
+ 
+ ![Model Context Protocol](https://img.shields.io/badge/Model%20Context%20Protocol-MCP-blue)
+ ![Built with Nitrostack](https://img.shields.io/badge/Built%20with-Nitrostack-0A66FF)
+ ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)
+ ![License](https://img.shields.io/badge/license-MIT-green)
+ 
+ **AutoBoard.ai** is an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that turns any MCP-compatible AI assistant (Claude, Cursor, and more) into a full-fledged HR & IT orchestration agent. Built with [Nitrostack](https://nitrostack.ai), it exposes a rich set of tools, resources, prompts, and interactive widgets that let AI assistants autonomously manage the complete employee lifecycle.
+ 
+ ---
+ 
+ ## Table of Contents
+ 
+ - [Overview](#overview)
+ - [What is MCP?](#what-is-mcp)
+ - [Features](#features)
+ - [Architecture](#architecture)
+ - [Tech Stack](#tech-stack)
+ - [Getting Started](#getting-started)
+ - [Usage](#usage)
+   - [Onboarding Workflow](#onboarding-workflow)
+   - [Offboarding Workflow](#offboarding-workflow)
+ - [Tools Reference](#tools-reference)
+ - [Resources](#resources)
+ - [Prompts](#prompts)
+ - [Widgets](#widgets)
+ - [Security](#security)
+ - [Live Demo](#live-demo)
+ - [Connect to an MCP Client](#connect-to-an-mcp-client)
+ - [Project Structure](#project-structure)
+ - [License](#license)
+ 
+ ---
+ 
+ ## Overview
+ 
+ Onboarding a new hire today means manually creating email accounts, adding people to Slack, GitHub, Jira, and a dozen other tools, assigning training modules, and sending welcome emails — a tedious, error-prone, multi-step process. Offboarding is even worse: when an employee leaves, missed revocations create security vulnerabilities and waste subscription spend.
+ 
+ **AutoBoard.ai eliminates both problems** by giving AI assistants a complete toolkit for full lifecycle state management. With a single natural-language command, the AI can:
+ 
+ - **Onboard:** Fetch role requirements → create employee profile → provision accounts across all required platforms → assign training → send a welcome email.
+ - **Offboard:** Discover all active platform accounts → revoke access one by one → reassign outstanding tickets → mark the employee as inactive.
+ 
+ Every action is logged, every step is tracked, and every destructive operation requires explicit user confirmation.
+ 
+ ---
+ 
+ ## What is MCP?
+ 
+ The **Model Context Protocol (MCP)** is an open standard that lets AI assistants securely connect to external tools, data sources, and services. Instead of being limited to what it was trained on, an AI model can call MCP servers to fetch live data, run actions, and integrate with real systems.
+ 
+ This project is an MCP server built with [Nitrostack](https://nitrostack.ai). Learn more at [modelcontextprotocol.io](https://modelcontextprotocol.io).
+ 
+ ---
+ 
+ ## Features
+ 
+ - 🧠 **AI-Native Workflows** — The LLM autonomously orchestrates multi-step processes from a single natural-language prompt.
+ - 🎛️ **10+ MCP Tools** — Exposes structured tools for role lookups, employee creation, account provisioning, training assignment, access revocation, ticket reassignment, and more.
+ - 🖥️ **Interactive Widgets** — Real-time React widgets (onboarding progress, offboarding status) render inside the AI chat via Nitrostack's widget SDK.
+ - 📋 **Incremental Draft Pattern** — Tools like `initiateOnboarding` / `updateOnboardingDraft` let the AI render a progress card immediately and fill in details as the conversation proceeds.
+ - 🔐 **Confirmation Guard** — Destructive operations (revoke accounts, reassign tickets, mark inactive) require explicit user confirmation before executing.
+ - 📝 **Full Audit Logging** — Every action is timestamped and persisted to an audit trail for compliance and review.
+ - 🔄 **Execution Tracking** — Step-by-step workflow execution is recorded with status (success/failed) and error details.
+ - 📧 **Email Integration** — Welcome emails sent via Nodemailer/Resend.
+ - 🏗️ **Modular Architecture** — Onboarding, offboarding, and system modules are cleanly separated with NestJS-style decorators.
+ - 🩺 **Health Monitoring** — Built-in system health check tracks memory usage, uptime, and process info.
+ - 📂 **MCP Resources** — Exposes employee records, role definitions, ticket assignments, audit logs, and execution logs as readable resources.
+ - 💬 **Prompt Templates** — Curated prompts (`onboard_employee`, `offboard_employee`) guide the LLM through autonomous orchestration with live progress updates.
+ 
+ ---
+ 
+ ## Architecture
+ 
+ ```
+ ┌──────────────────────────────────────────────────────────┐
+ │                  MCP Client (Claude, Cursor...)            │
+ └────────────────────┬─────────────────────────────────────┘
+                      │ MCP Protocol (HTTP SSE / STDIO)
+                      ▼
+ ┌──────────────────────────────────────────────────────────┐
+ │                   AutoBoard.ai MCP Server                  │
+ │                                                           │
+ │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │
+ │  │ Onboarding  │  │ Offboarding│  │     System        │   │
+ │  │  Module     │  │  Module    │  │     Module        │   │
+ │  │             │  │            │  │                   │   │
+ │  │ • Tools     │  │ • Tools    │  │ • Health Check    │   │
+ │  │ • Resources │  │ • Resources│  └──────────────────┘   │
+ │  │ • Prompts   │  │ • Prompts  │                         │
+ │  └──────┬──────┘  └──────┬─────┘                         │
+ │         │                │                                │
+ │         ▼                ▼                                │
+ │  ┌────────────────────────────────────────────────────┐  │
+ │  │              Services Layer                         │  │
+ │  │  onboardingWorkflow.ts   offboardingWorkflow.ts     │  │
+ │  └────────────────────────────────────────────────────┘  │
+ │         │                │                                │
+ │         ▼                ▼                                │
+ │  ┌────────────────────────────────────────────────────┐  │
+ │  │  Shared Utilities                                   │  │
+ │  │  DB · Audit Logger · Execution Tracker · Permissions│  │
+ │  └────────────────────────────────────────────────────┘  │
+ │                                                           │
+ │  ┌────────────────────────────────────────────────────┐  │
+ │  │  JSON Data Store (src/resources/)                   │  │
+ │  │  employees.json · roles.json · tickets.json         │  │
+ │  │  audit.json · execution.json                        │  │
+ │  └────────────────────────────────────────────────────┘  │
+ └──────────────────────────────────────────────────────────┘
+                      │ Nitrostack Widget SDK
+                      ▼
+ ┌──────────────────────────────────────────────────────────┐
+ │           Next.js Widget App (src/widgets/)               │
+ │  ┌──────────────────┐   ┌────────────────────────┐      │
+ │  │ OnboardingWidget  │   │  OffboardingWidget     │      │
+ │  │ (Checklist +      │   │  (Revoked Systems +    │      │
+ │  │  Status Badge)    │   │   Ticket Reassignment) │      │
+ │  └──────────────────┘   └────────────────────────┘      │
+ └──────────────────────────────────────────────────────────┘
+ ```
+ 
+ ---
+ 
+ ## Tech Stack
+ 
+ | Category | Technology |
+ |----------|-----------|
+ | **Runtime** | Node.js 18+ |
+ | **Language** | TypeScript 5.3 |
+ | **MCP Framework** | [Nitrostack Core](https://nitrostack.ai) (`@nitrostack/core`) |
+ | **Input Validation** | Zod 3.22 |
+ | **Email** | Nodemailer 9 / Resend 6 |
+ | **Widgets** | Next.js 14 / React 18 (`@nitrostack/widgets`) |
+ | **CLI** | Nitrostack CLI (`@nitrostack/cli`) |
+ 
+ ---
+ 
+ ## Getting Started
+ 
+ ### Prerequisites
+ 
+ - Node.js 18+ 
+ - An MCP-compatible client (Claude Desktop, Cursor, etc.)
+ - npm
+ 
+ ### Installation
+ 
+ ```bash
+ git clone https://github.com/Phyboc/AutoBoard.ai.git
+ cd AutoBoard.ai
+ npm install
+ ```
+ 
+ ### Configuration
+ 
+ Copy the example environment file and add your own values:
+ 
+ ```bash
+ cp .env.example .env
+ ```
+ 
+ Required environment variables:
+ 
+ | Variable | Description |
+ |----------|-------------|
+ | `RESEND_API_KEY` | API key for Resend email service (for sending welcome emails) |
+ 
+ ### Development
+ 
+ ```bash
+ npm run dev
+ ```
+ 
+ Runs the server in development mode using Nitrostack CLI with STDIO transport.
+ 
+ ### Production Build & Start
+ 
+ ```bash
+ npm run build
+ npm run start:prod
+ ```
+ 
+ The production server starts with dual transport: STDIO and HTTP SSE.
+ 
+ ### Widgets Development
+ 
+ ```bash
+ npm run widget dev
+ ```
+ 
+ Runs the Next.js widget app on port 3001 for developing the onboarding and offboarding UI components.
+ 
+ ---
+ 
+ ## Usage
+ 
+ AutoBoard.ai is designed to be used through natural-language conversation with an MCP-compatible AI assistant. The AI interprets your request and autonomously executes the appropriate tools.
+ 
+ ### Onboarding Workflow
+ 
+ **Step 1 — Mention a new hire:**
+ > "We have a new hire starting Monday — Sarah Connor as a Senior Backend Developer."
+ 
+ The AI immediately calls `initiateOnboarding` to render a draft progress card.
+ 
+ **Step 2 — Provide missing details:**
+ > "Her email is sarah.connor@company.com. She starts August 15th."
+ 
+ The AI calls `updateOnboardingDraft` to fill in the details, and the widget updates in real time.
+ 
+ **Step 3 — Watch it complete:**
+ > "Go ahead and onboard her."
+ 
+ The AI calls `onboardEmployee`, which autonomously:
+ 1. Fetches role requirements for Senior Backend Developer
+ 2. Creates the employee profile
+ 3. Provisions accounts (Google Workspace, Slack, GitHub, Jira, AWS Console, Datadog)
+ 4. Assigns training (Security Training, Backend Architecture Review)
+ 5. Sends a welcome email
+ 
+ ### Offboarding Workflow
+ 
+ **Step 1 — Mention an employee leaving:**
+ > "Sarah Connor is leaving. Can you start the offboarding process?"
+ 
+ The AI immediately calls `initiateOffboarding` to render the offboarding draft card.
+ 
+ **Step 2 — Specify reassignment:**
+ > "Her tickets should go to Alex Rivera (alex.rivera@company.com)."
+ 
+ The AI calls `updateOffboardingDraft` with the reassign email.
+ 
+ **Step 3 — Execute:**
+ > "Proceed with the offboarding."
+ 
+ The AI calls `offboardEmployee`, which autonomously:
+ 1. Gets all platforms Sarah has access to
+ 2. Revokes each account (with confirmation)
+ 3. Reassigns her tickets to Alex Rivera
+ 4. Marks Sarah as inactive
+ 
+ ---
+ 
+ ## Tools Reference
+ 
+ ### Onboarding Tools
+ 
+ | Tool | Description | Key Parameters |
+ |------|-------------|----------------|
+ | `initiateOnboarding` | **Draft tool** — Call immediately when onboarding is mentioned. Renders a progress widget with placeholders. | `employeeName?`, `employeeEmail?`, `employeeRole?`, `startDate?` |
+ | `updateOnboardingDraft` | **Incremental update** — Updates the onboarding widget as new details arrive. | `employeeName`, `employeeEmail?`, `employeeRole?`, `startDate?` |
+ | `onboardEmployee` | **Full workflow** — End-to-end onboarding: create profile → provision accounts → assign training → send welcome email. | `name`, `email`, `role`, `startDate` |
+ | `fetchRoleRequirements` | Fetches the software, training, and channels required for a given role. | `role` |
+ | `createEmployee` | Creates a new employee profile in the system. | `name`, `email`, `role`, `startDate` |
+ | `provisionAccount` | Provisions a user account on a given platform. | `platform`, `email` |
+ | `assignTraining` | Assigns training modules to an employee. | `email`, `modules[]` |
+ | `assignTask` | Assigns a new task/ticket to an employee. | `email`, `title` |
+ | `sendWelcomeEmail` | Sends a welcome email with onboarding instructions. | `email` |
+ 
+ ### Offboarding Tools
+ 
+ | Tool | Description | Key Parameters |
+ |------|-------------|----------------|
+ | `initiateOffboarding` | **Draft tool** — Call immediately when offboarding is mentioned. Renders a draft card with pending systems. | `employeeEmail?`, `reassignEmail?` |
+ | `updateOffboardingDraft` | **Incremental update** — Updates the offboarding widget as revocation progress is made. | `employeeEmail`, `reassignEmail?`, `revokedSystems[]?`, `ticketCount?` |
+ | `offboardEmployee` | **Full workflow** — End-to-end offboarding: get access → revoke accounts → reassign tickets → mark inactive. | `email`, `reassignEmail`, `confirm?` |
+ | `getUserAccess` | Gets the list of platforms a user has access to. | `email` |
+ | `revokeAccount` | Revokes a user account on a given platform. Requires confirmation. | `platform`, `email`, `confirm?` |
+ | `reassignTickets` | Reassigns tickets from one employee to another. Requires confirmation. | `oldEmail`, `newEmail`, `confirm?` |
+ | `markEmployeeInactive` | Marks an employee as inactive. Requires confirmation. | `email`, `confirm?` |
+ | `addTask` | Assigns a new task to an employee with optional priority. | `employeeEmail`, `description`, `priority?` |
+ 
+ ---
+ 
+ ## Resources
+ 
+ The server exposes the following MCP resources that AI assistants can read:
+ 
+ | Resource URI | Description |
+ |--------------|-------------|
+ | `employee-lifecycle://employees` | All employee records with profile, account, and training data |
+ | `employee-lifecycle://roles` | Role definitions with required software, training, and channels |
+ | `employee-lifecycle://tickets` | Ticket assignments by employee |
+ | `employee-lifecycle://audit` | Security and lifecycle audit event logs |
+ | `employee-lifecycle://execution` | Workflow execution tracking records |
+ | `employee-lifecycle://instructions` | Interactive agent instructions guiding the LLM through workflow patterns |
+ 
+ ---
+ 
+ ## Prompts
+ 
+ Pre-built prompt templates that guide the AI through autonomous orchestration:
+ 
+ | Prompt | Description | Arguments |
+ |--------|-------------|-----------|
+ | `onboard_employee` | Autonomous onboarding orchestration with live progress tracking | `employee_name`, `employee_email`, `employee_role`, `start_date` |
+ | `offboard_employee` | Autonomous offboarding orchestration with live updates | `employee_email`, `reassign_email` |
+ | `onboarding_help` | Get help with employee onboarding workflow | `employee_name?` |
+ | `offboarding_help` | Get help with employee offboarding workflow | `employee_name?` |
+ 
+ ---
+ 
+ ## Widgets
+ 
+ AutoBoard.ai includes two interactive React widgets that render inside the AI chat interface:
+ 
+ - **OnboardingWidget** (`/onboarding`) — Displays a checklist with status badges, expandable details, and a progress summary as the onboarding workflow progresses.
+ - **OffboardingWidget** (`/offboarding`) — Shows revoked system status with strikethrough effects, ticket reassignment details, and completion status.
+ 
+ Built with Next.js 14 and the [Nitrostack Widget SDK](https://nitrostack.ai/docs/widgets).
+ 
+ ---
+ 
+ ## Security
+ 
+ - **Confirmation Guard** — All destructive operations (`revokeAccount`, `reassignTickets`, `markEmployeeInactive`) require the user to explicitly set `confirm: true`. The guard displays the user's role and describes the action before execution.
+ - **Role Awareness** — Operation context includes the requesting user's role (defaults to "HR admin" for convenience).
+ - **Audit Trail** — Every action is logged with timestamp, actor, action type, affected system, and status.
+ - **Environment Safety** — Secrets (API keys) are stored in environment variables only, never in code.
+ 
+ ---
+ 
+ ## Live Demo
+ 
+ 🚀 **Live MCP endpoint:** [https://autoboardai-6a6483dc-brigadiers-amrita-university-coimbatore.app.nitrocloud.ai](https://autoboardai-6a6483dc-brigadiers-amrita-university-coimbatore.app.nitrocloud.ai)
+ 
+ Point your MCP client at the endpoint above to try it instantly. Prefer a hosted setup? Deploy your own in minutes on [Nitrostack](https://nitrostack.ai).
+ 
+ ---
+ 
+ ## Connect to an MCP Client
+ 
+ Add this server to your MCP client configuration. A typical entry looks like:
+ 
+ ```json
+ {
+   "mcpServers": {
+     "autoboardai": {
+       "url": "https://autoboardai-6a6483dc-brigadiers-amrita-university-coimbatore.app.nitrocloud.ai"
+     }
+   }
+ }
+ ```
+ 
+ Restart your client and the tools from this MCP server will be available to your AI assistant.
+ 
+ ---
+ 
+ ## Project Structure
+ 
+ ```
+ AutoBoard.ai/
+ ├── src/
+ │   ├── index.ts                        # Main entry point, bootstraps the MCP server
+ │   ├── app.module.ts                   # Root application module (NestJS-style)
+ │   ├── modules/
+ │   │   ├── employee-lifecycle/         # Composite lifecycle module
+ │   │   │   ├── employee-lifecycle.tools.ts
+ │   │   │   ├── employee-lifecycle.resources.ts
+ │   │   │   ├── employee-lifecycle.prompts.ts
+ │   │   │   └── employee-lifecycle.instruct.ts
+ │   │   ├── onboarding/                 # Onboarding feature module
+ │   │   │   ├── onboarding.module.ts
+ │   │   │   ├── onboarding.tools.ts
+ │   │   │   ├── onboarding.resources.ts
+ │   │   │   ├── onboarding.prompts.ts
+ │   │   │   └── tools/                  # Individual tool implementations
+ │   │   │       ├── createEmployee.ts
+ │   │   │       ├── fetchRoleRequirements.ts
+ │   │   │       ├── provisionAccount.ts
+ │   │   │       ├── assignTraining.ts
+ │   │   │       ├── assignTask.ts
+ │   │   │       └── sendWelcomeEmail.ts
+ │   │   ├── offboarding/                # Offboarding feature module
+ │   │   │   ├── offboarding.module.ts
+ │   │   │   ├── offboarding.tools.ts
+ │   │   │   ├── offboarding.resources.ts
+ │   │   │   ├── offboarding.prompts.ts
+ │   │   │   └── tools/                  # Individual tool implementations
+ │   │   │       ├── getUserAccess.ts
+ │   │   │       ├── revokeAccount.ts
+ │   │   │       ├── reassignTickets.ts
+ │   │   │       └── markEmployeeInactive.ts
+ │   │   └── system/                     # System observability module
+ │   │       ├── system.module.ts
+ │   │       └── system.health.ts
+ │   ├── services/                       # Workflow orchestration
+ │   │   ├── onboardingWorkflow.ts
+ │   │   └── offboardingWorkflow.ts
+ │   ├── tools/                          # High-level tool definitions
+ │   │   ├── onboarding/
+ │   │   │   ├── initiateOnboarding.ts
+ │   │   │   ├── updateOnboardingDraft.ts
+ │   │   │   ├── createEmployee.ts
+ │   │   │   ├── fetchRoleRequirements.ts
+ │   │   │   ├── provisionAccount.ts
+ │   │   │   ├── assignTraining.ts
+ │   │   │   ├── assignTask.ts
+ │   │   │   └── sendWelcomeEmail.ts
+ │   │   ├── offboarding/
+ │   │   │   ├── initiateOffboarding.ts
+ │   │   │   ├── updateOffboardingDraft.ts
+ │   │   │   ├── addTask.ts
+ │   │   │   ├── getUserAccess.ts
+ │   │   │   ├── revokeAccount.ts
+ │   │   │   ├── reassignTickets.ts
+ │   │   │   └── markEmployeeInactive.ts
+ │   │   └── utils.ts
+ │   ├── shared/                         # Shared guards and utilities
+ │   │   ├── guards/
+ │   │   │   └── admin.guard.ts
+ │   │   └── utils/
+ │   │       ├── db.ts
+ │   │       └── resource-path.ts
+ │   ├── utils/                          # Core utilities
+ │   │   ├── db.ts                        # File-based JSON database
+ │   │   ├── auditLogger.ts               # Audit trail logging
+ │   │   ├── employeeLookup.ts            # Employee search helpers
+ │   │   ├── executionTracker.ts          # Workflow execution tracking
+ │   │   └── permissionCheck.ts           # Confirmation guard logic
+ │   ├── resources/                       # JSON data store
+ │   │   ├── employees.json
+ │   │   ├── roles.json
+ │   │   ├── tickets.json
+ │   │   ├── audit.json
+ │   │   ├── execution.json
+ │   │   └── auditResource.ts
+ │   └── widgets/                         # Next.js widget app
+ │       ├── package.json
+ │       ├── tsconfig.json
+ │       ├── next.config.js
+ │       ├── widget-manifest.json
+ │       └── app/
+ │           ├── layout.tsx
+ │           ├── onboarding/page.tsx      # Onboarding progress widget
+ │           └── offboarding/page.tsx     # Offboarding status widget
+ ├── package.json
+ ├── tsconfig.json
+ └── README.md
+ ```
+ 
+ ---
+ 
+ ## License
+ 
+ MIT © 2026 — Govind Nair, Samanyu Nair, Shreyas N, Sivasubramani K J
+ 
+ ---
+ 
+ Built with ❤️ using the Model Context Protocol on [Nitrostack](https://nitrostack.ai). Share your MCP app on [r/mcptothemoon](https://www.reddit.com/r/mcptothemoon/).
+
