# AutoBoard.ai — Enterprise IT Orchestrator (Hire to Retire)

Automate employee onboarding and offboarding with AI. From provisioning accounts to revoking access — one command, end to end.

![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-MCP-blue)
![Built with Nitrostack](https://img.shields.io/badge/Built%20with-Nitrostack-6f42c1)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

AutoBoard.ai is an MCP (Model Context Protocol) server that turns any MCP-compatible AI assistant (Claude, Cursor, and more) into a full-fledged HR & IT orchestration agent.  
Built with Nitrostack, it exposes a rich set of tools, resources, prompts, and interactive widgets that let AI assistants autonomously manage the complete employee lifecycle.

---

## Table of Contents

- [Overview](#overview)
- [What is MCP?](#what-is-mcp)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Onboarding Workflow](#onboarding-workflow)
  - [Offboarding Workflow](#offboarding-workflow)
- [Tools Reference](#tools-reference)
  - [Onboarding Tools](#onboarding-tools)
  - [Offboarding Tools](#offboarding-tools)
- [Resources](#resources)
- [Prompts](#prompts)
- [Widgets](#widgets)
- [Security](#security)
- [Live Demo](#live-demo)
- [Connect to an MCP Client](#connect-to-an-mcp-client)
- [Project Structure](#project-structure)
- [License](#license)

---

## Overview

Onboarding a new hire often means manually creating email accounts, adding users to Slack/GitHub/Jira and other systems, assigning training modules, and sending welcome emails — a tedious, error-prone, multi-step process.

Offboarding is even riskier: missed revocations can leave orphaned access, create security vulnerabilities, and increase SaaS spend.

AutoBoard.ai solves both by giving AI assistants a complete lifecycle orchestration toolkit.

With a single natural-language command, the AI can:

- **Onboard**: Fetch role requirements → create employee profile → provision accounts → assign training → send welcome email.
- **Offboard**: Discover active platform accounts → revoke access → reassign tickets → mark employee inactive.

Every action is logged, every step is tracked, and destructive operations require explicit confirmation.

---

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard that lets AI assistants securely connect to external tools, data sources, and services.

Instead of being limited to static training data, AI models can call MCP servers to fetch live information and perform real actions.

This project is an MCP server built with Nitrostack.  
Learn more: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)

---

## Features

- 🧠 **AI-Native Workflows** — Multi-step process orchestration from a single prompt.
- 🎛️ **10+ MCP Tools** — Role lookups, employee creation, account provisioning, training assignment, revocation, reassignment, and more.
- 🖥️ **Interactive Widgets** — Real-time onboarding/offboarding widgets rendered in chat via Nitrostack Widget SDK.
- 📋 **Incremental Draft Pattern** — `initiateOnboarding` / `updateOnboardingDraft` and `initiateOffboarding` / `updateOffboardingDraft`.
- 🔐 **Confirmation Guard** — Destructive operations require explicit confirmation.
- 📝 **Full Audit Logging** — Timestamped audit trail for compliance and review.
- 🔄 **Execution Tracking** — Step-by-step status and error visibility.
- 📧 **Email Integration** — Welcome emails via Nodemailer / Resend.
- 🏗️ **Modular Architecture** — Clear separation of onboarding, offboarding, and system capabilities.
- 🩺 **Health Monitoring** — Memory usage, uptime, and process metadata.
- 📂 **MCP Resources** — Employees, roles, tickets, audit logs, and execution logs.
- 💬 **Prompt Templates** — Guided orchestration prompts for onboarding and offboarding.

---

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│ MCP Client (Claude, Cursor, etc.)                        │
└────────────────────┬─────────────────────────────────────┘
                     │ MCP Protocol (HTTP SSE / STDIO)
                     ▼
┌──────────────────────────────────────────────────────────┐
│ AutoBoard.ai MCP Server                                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐v │
│  │ Onboarding   │  │ Offboarding  │  │ System Module  │  │
│  │ Module       │  │ Module       │  │ (Health Check) │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────────┘  │
│         │                 │                              │
│         └──────────┬──────┘                              │
│                    ▼                                     │
│        ┌──────────────────────────────┐                  │
│        │ Services Layer               │                  │
│        │ onboardingWorkflow.ts        │                  │
│        │ offboardingWorkflow.ts       │                  │
│        └──────────────────────────────┘                  │
│                    ▼                                     │
│        ┌──────────────────────────────┐                  │
│        │ Shared Utilities             │                  │
│        │ DB · Audit · Execution ·     │                  │
│        │ Permission checks            │                  │
│        └──────────────────────────────┘                  │
│                    ▼                                     │
│        ┌──────────────────────────────┐                  │
│        │ JSON Data Store              │                  │
│        │ employees · roles · tickets  │                  │
│        │ audit · execution            │                  │
│        └──────────────────────────────┘                  │
└──────────────────────────────────────────────────────────┘
                     │ Nitrostack Widget SDK
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Next.js Widget App (src/widgets)                         │
│  • OnboardingWidget                                      │
│  • OffboardingWidget                                     │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.3 |
| MCP Framework | `@nitrostack/core` |
| Validation | Zod 3.22 |
| Email | Nodemailer 9 / Resend 6 |
| Widgets | Next.js 14 / React 18 / `@nitrostack/widgets` |
| CLI | `@nitrostack/cli` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MCP-compatible client (Claude Desktop, Cursor, etc.)

### Installation

```bash
git clone https://github.com/Phyboc/AutoBoard.ai.git
cd AutoBoard.ai
npm install
```

### Configuration

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key for Resend email service (welcome emails) |

### Development

```bash
npm run dev
```

Runs the server in development mode using Nitrostack CLI with STDIO transport.

### Production Build & Start

```bash
npm run build
npm run start:prod
```

Starts production server with dual transport: STDIO + HTTP SSE.

### Widgets Development

```bash
npm run widget dev
```

Runs the Next.js widget app on port `3001`.

---

## Usage

AutoBoard.ai is designed for natural-language interaction through an MCP-compatible AI assistant.  
The assistant interprets the request and executes the right tools autonomously.

### Onboarding Workflow

1. **Mention a new hire**
   > “We have a new hire starting Monday — Sarah Connor as a Senior Backend Developer.”

   AI calls `initiateOnboarding` and renders a draft progress card.

2. **Provide missing details**
   > “Her email is sarah.connor@company.com. She starts August 15th.”

   AI calls `updateOnboardingDraft`; widget updates live.

3. **Execute**
   > “Go ahead and onboard her.”

   AI calls `onboardEmployee`, which:
   - fetches role requirements
   - creates employee profile
   - provisions accounts (Google Workspace, Slack, GitHub, Jira, AWS Console, Datadog)
   - assigns training
   - sends welcome email

### Offboarding Workflow

1. **Mention employee exit**
   > “Sarah Connor is leaving. Start offboarding.”

   AI calls `initiateOffboarding`.

2. **Specify reassignment**
   > “Her tickets should go to Alex Rivera (alex.rivera@company.com).”

   AI calls `updateOffboardingDraft`.

3. **Execute**
   > “Proceed with the offboarding.”

   AI calls `offboardEmployee`, which:
   - gets all platform access
   - revokes accounts (with confirmation)
   - reassigns tickets
   - marks employee inactive

---

## Tools Reference

### Onboarding Tools

| Tool | Description | Key Parameters |
|---|---|---|
| `initiateOnboarding` | Draft tool; call immediately when onboarding is mentioned. | `employeeName?`, `employeeEmail?`, `employeeRole?`, `startDate?` |
| `updateOnboardingDraft` | Incremental onboarding draft updates. | `employeeName`, `employeeEmail?`, `employeeRole?`, `startDate?` |
| `onboardEmployee` | End-to-end onboarding workflow. | `name`, `email`, `role`, `startDate` |
| `fetchRoleRequirements` | Fetch required software/training/channels for role. | `role` |
| `createEmployee` | Create employee profile. | `name`, `email`, `role`, `startDate` |
| `provisionAccount` | Provision account on a platform. | `platform`, `email` |
| `assignTraining` | Assign training modules. | `email`, `modules[]` |
| `assignTask` | Assign ticket/task. | `email`, `title` |
| `sendWelcomeEmail` | Send welcome email. | `email` |

### Offboarding Tools

| Tool | Description | Key Parameters |
|---|---|---|
| `initiateOffboarding` | Draft tool for offboarding start. | `employeeEmail?`, `reassignEmail?` |
| `updateOffboardingDraft` | Incremental offboarding draft updates. | `employeeEmail`, `reassignEmail?`, `revokedSystems[]?`, `ticketCount?` |
| `offboardEmployee` | End-to-end offboarding workflow. | `email`, `reassignEmail`, `confirm?` |
| `getUserAccess` | Get all platforms user can access. | `email` |
| `revokeAccount` | Revoke platform account (confirmation required). | `platform`, `email`, `confirm?` |
| `reassignTickets` | Reassign user tickets (confirmation required). | `oldEmail`, `newEmail`, `confirm?` |
| `markEmployeeInactive` | Mark employee inactive (confirmation required). | `email`, `confirm?` |
| `addTask` | Add a task with optional priority. | `employeeEmail`, `description`, `priority?` |

---

## Resources

| Resource URI | Description |
|---|---|
| `employee-lifecycle://employees` | Employee records: profile, account, training data |
| `employee-lifecycle://roles` | Role definitions with software/training/channel requirements |
| `employee-lifecycle://tickets` | Ticket assignments |
| `employee-lifecycle://audit` | Security and lifecycle audit logs |
| `employee-lifecycle://execution` | Workflow execution tracking logs |
| `employee-lifecycle://instructions` | Interactive orchestration instructions for the AI |

---

## Prompts

| Prompt | Description | Arguments |
|---|---|---|
| `onboard_employee` | Autonomous onboarding with progress tracking | `employee_name`, `employee_email`, `employee_role`, `start_date` |
| `offboard_employee` | Autonomous offboarding with live updates | `employee_email`, `reassign_email` |
| `onboarding_help` | Help with onboarding workflow | `employee_name?` |
| `offboarding_help` | Help with offboarding workflow | `employee_name?` |

---

## Widgets

AutoBoard.ai includes two interactive React widgets:

- **OnboardingWidget** (`/onboarding`)  
  Checklist + status badges + progress summary.

- **OffboardingWidget** (`/offboarding`)  
  Revoked systems view + ticket reassignment + completion status.

Built with Next.js 14 and Nitrostack Widget SDK.

---

## Security

- **Confirmation Guard**  
  Destructive operations (`revokeAccount`, `reassignTickets`, `markEmployeeInactive`) require `confirm: true`.

- **Role Awareness**  
  Execution context includes user role (defaults to `HR admin`).

- **Audit Trail**  
  Every action is logged with timestamp, actor, action, target, and status.

- **Environment Safety**  
  Secrets are stored in environment variables and never hardcoded.

---

## Live Demo

🚀 MCP endpoint:  
`https://autoboardai-6a6483dc-brigadiers-amrita-university-coimbatore.app.nitrocloud.ai`

---

## Connect to an MCP Client

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "autoboardai": {
      "url": "https://autoboardai-6a6483dc-brigadiers-amrita-university-coimbatore.app.nitrocloud.ai"
    }
  }
}
```

Restart your MCP client to load server tools/resources/prompts.

---

## Project Structure

```text
AutoBoard.ai/
├── src/
│   ├── index.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── employee-lifecycle/
│   │   ├── onboarding/
│   │   ├── offboarding/
│   │   └── system/
│   ├── services/
│   │   ├── onboardingWorkflow.ts
│   │   └── offboardingWorkflow.ts
│   ├── tools/
│   │   ├── onboarding/
│   │   └── offboarding/
│   ├── shared/
│   ├── utils/
│   ├── resources/
│   └── widgets/
├── package.json
├── tsconfig.json
└── README.md
```

---

## License

MIT © 2026 — Govind Nair, Samanyu Nair, Shreyas N, Sivasubramani K J

Built with ❤️ using the Model Context Protocol on Nitrostack.
