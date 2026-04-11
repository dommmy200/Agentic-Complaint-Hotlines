# 🏥 CSE499 — Health & Administrative Complaint Reporting System

> A demo-grade web platform for reporting malpractice complaints in health and administrative services, built as a capstone project for CSE499.

---
### Project Proposed By

Herick Guillen

### Team Members

- Bloodshed Munyaradzi Chiondegwa
- Diego Armando Vargas Diaz
- Dominic Odeh Abah
- Herick Guillen

---

## Team Quotes

Each team member has added one of their favorite quotes as part of the project collaboration exercise.

### Bloodshed Munyaradzi Chiondegwa

>

### Diego Armando Vargas Diaz

> “Our part in this divine plan is to trust in God and seek divine helps, most notably the Atonement of His Beloved Son, our Savior and Redeemer Jesus Christ.” - President Dallin H. Oaks

### Dominic Odeh Abah

> “The more I learn, the more I realize how much I don't know.” - Albert Einstein

### Herick Guillen

> "Goals reflect the desires of our hearts and our vision of what we can accomplish. Through goals and plans, our hopes are transformed into action. Goal setting and planning are acts of faith." -Preach My Gospel, Chapter 8

---

## Purpose

The purpose of this project is to build a web platform that allows users to submit complaints related to malpractice in health or administrative services. The system will store complaint information in a database and interact with an AI agent that can analyze the complaint, gather additional information if necessary, and generate summaries to help investigators review cases efficiently.

This platform aims to simplify the reporting process while improving the quality and organization of complaint data.
---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Setup & Installation](#setup--installation)
- [Workflow Pipelines](#workflow-pipelines)
- [Frontend](#frontend)
- [Google Sheets Database](#google-sheets-database)
- [Environment Variables](#environment-variables)
- [Demo](#demo)
- [Team](#team)

---

## Project Overview

This system allows members of the public to submit complaints related to malpractice in health and administrative services. Complaints are:

- Received via a **web form** or **Telegram bot**
- Processed by an **AI agent** (Google Gemini) that validates, classifies, and gathers additional information through follow-up questions
- Stored in a **Google Sheets database**
- Summarised daily and delivered to investigators via **email**

> ⚠️ This is a **demo system** built for academic purposes. It is not intended for production use.

---

## System Architecture

```
User (Web Form)
      ↓
Pipeline 1 — Web Intake
      ↓
AI Agent (Intake + Follow-ups)
      ↓
Google Sheets (ComplaintsDB)
      ↓
AI Agent (Classification)
      ↓
Gmail → Complainant Confirmation

──────────────────────────────

User (Telegram)
      ↓
Pipeline 2 — Telegram Bot Intake
      ↓
Multi-turn Conversation Agent
      ↓
Google Sheets (ComplaintsDB)
      ↓
Telegram Confirmation

──────────────────────────────

Schedule (Daily 08:00)
      ↓
Pipeline 3 — Executive Summary
      ↓
Google Sheets (ComplaintsDB) — read yesterday's rows
      ↓
AI Agent (Executive Report)
      ↓
Gmail → Investigator + DailySummary Sheet
```

---

## Features

### Complaint Intake
- Web form with structured fields (facility, incident date, complaint type, severity, witnesses)
- Telegram bot alternative channel for users without web access
- Anonymous complaint option
- AI-driven follow-up questions for incomplete submissions
- Multi-turn conversation memory (Postgres-backed per case number)

### AI Processing
- Complaint validation and severity classification
- Structured JSON output via Output Parser
- Categorisation: `MEDICAL_CARE`, `ADMINISTRATIVE_BILLING_INSURANCE`, `STAFF_MISCONDUCT`, `SECURITY_OR_CRIMINAL`, `INFRASTRUCTURE_SERVICE_QUALITY`, `OTHER`
- Priority levels: `HIGH`, `MEDIUM`, `LOW`
- Reformulated complaint in formal institutional language
- Missing information detection

### Investigator Support
- Daily executive HTML summary report via Gmail
- Structured investigator briefing per complaint
- Key entities detection (departments, staff roles, financial elements, safety risks)
- Recommended next action per case

### Frontend
- Responsive web form
- Real-time AI conversation UI
- Case number tracking across follow-up submissions
- Success card on complaint completion

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Automation** | n8n (cloud-hosted) |
| **AI / LLM** | Google Gemini 2.5 Flash |
| **Database** | Google Sheets |
| **Memory** | PostgreSQL (Supabase) |
| **Email** | Gmail via OAuth2 |
| **Messaging** | Telegram Bot API |
| **Frontend** | HTML, CSS, Vanilla JavaScript |
| **Hosting** | GitHub Pages |

---

## Repository Structure

```
cse499-complaint-system/
│
├── README.md
│
├── workflows/
│   ├── pipeline1-web-intake.json         # Webhook → AI intake → Sheets → Gmail
│   ├── pipeline2-telegram-intake.json    # Telegram bot → AI intake → Sheets
│   ├── pipeline3-daily-summary.json      # Schedule → Aggregate → Executive report
│   └── shared-classification-agent.json # Reusable classification agent config
│
├── scripts/
│   ├── extractor.js          # Regex field extraction from complaint description (To be implemented)
│   ├── preprocess.js         # AI agent user prompt template builder
│   ├── debugger.js           # <case_data> detection and isComplete flag logic (To be implemented)
│   ├── telegram-to-json.js   # Strips markdown fences, extracts JSON from Telegram output (To be implemented)
│   ├── admin.js              # Validations
│   ├── complaint.js          # Regex extraction, Form logic, webhook calls, conversation UI
│   ├── dashboard.js          # Authenticators
│   ├── error.js              # Error handler
│
├── index.html           # Main complaint form page
├── styles/
│   └── complaint.css    # Stylesheet
│   └── admin.css
│   └── dashboard.css
│   └── error.css
│   
├── docs/
│    ├── workflow-overview.json       #   
│
└── images/
    └──  citizen.webp          # And more images...
```

---

## Setup & Installation

### Prerequisites

- [n8n account](https://n8n.io) (cloud or self-hosted)
- Google account with Sheets and Gmail API access
- Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com))
- Supabase account for PostgreSQL memory ([supabase.com](https://supabase.com))
- Telegram Bot Token (via [@BotFather](https://t.me/BotFather)) — optional

---

### 1. Clone the Repository

```bash
git clone https://github.com/group2cse499/complaint-system.git
cd complaint-system
```

---

### 2. Set Up Google Sheets

Create a Google Sheet with two tabs:

**Tab 1 — ComplaintsDB**

| Column | Description |
|---|---|
| `caseNumber` | Auto-generated by frontend |
| `fullName` | Complainant name |
| `email` | Contact email |
| `phone` | Contact phone |
| `incidentDate` | Date of incident |
| `incidentTime` | Time of incident |
| `healthFacility` | Facility name |
| `department` | Department or area |
| `complaintDetails` | Full complaint text |
| `anonymous` | true/false |
| `followUp` | true/false |
| `complaint_category` | AI classification |
| `priority_level` | HIGH / MEDIUM / LOW |
| `reformulated_complaint` | AI rewritten version |
| `investigative_summary` | AI summary |
| `investigator_observations` | AI observations |
| `recommended_next_action` | AI recommendation |
| `missing_information` | Fields flagged by AI |
| `key_entities_detected` | JSON object |
| `submissionDate` | YYYY-MM-DD |
| `submissionTime` | HH:MM:SS |
| `status` | pending_review / reviewed |

**Tab 2 — DailySummary**

| Column | Description |
|---|---|
| `submissionDate` | Date of summary |
| `summary` | HTML executive report |

---

### 3. Set Up PostgreSQL Memory (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Run this SQL in the Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS n8n_chat_histories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    message JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_id ON n8n_chat_histories(session_id);
```

3. Copy the connection string from **Settings → Database**

---

### 4. Import Workflows into n8n

1. Open your n8n canvas
2. Click **Import** → select each JSON file from `workflows/`
3. Import in this order:
   - `pipeline1-web-intake.json`
   - `pipeline2-telegram-intake.json`
   - `pipeline3-daily-summary.json`

---

### 5. Configure Credentials in n8n

| Credential | Where to Get |
|---|---|
| **Google Gemini API** | [aistudio.google.com](https://aistudio.google.com) → Get API Key |
| **Google Sheets OAuth2** | n8n credential wizard → Google Sheets |
| **Gmail OAuth2** | n8n credential wizard → Gmail |
| **PostgreSQL** | Supabase → Settings → Database → Connection string |
| **Telegram Bot** | [@BotFather](https://t.me/BotFather) → /newbot |

---

### 6. Configure Frontend

In `frontend/scripts/complaint2.js`, update:

```javascript
// Replace with your n8n Production Webhook URL
const WEBHOOK_URL = 'https://your-n8n-instance.app.n8n.cloud/webhook/your-path';
```

---

### 7. Activate Workflows

In the n8n canvas for each workflow:
1. Click the **Inactive** toggle (top right)
2. Confirm it turns green (**Active**)

---

### 8. Deploy Frontend

Push to GitHub and enable GitHub Pages:

```bash
git add .
git commit -m "deploy frontend"
git push origin main
```

Then go to: **GitHub repo → Settings → Pages → Source: main branch**

---

## Workflow Pipelines

### Pipeline 1 — Web Form Intake

```
Webhook (POST)
    → Code: Extract fields from description
    → AI Agent: Validate + Classify + Follow-up (Gemini + Postgres Memory)
    → Debugger: Detect <case_data> → set isComplete
    → Switch: isComplete?
        TRUE  → Append ComplaintsDB
               → AI Classification Agent
               → Gmail confirmation to complainant
               → Webhook Response: { status: "complete" }
        FALSE → Webhook Response: { status: "incomplete", aiQuestion: "..." }
```

### Pipeline 2 — Telegram Bot Intake

```
Telegram Trigger
    → Conversation Agent (multi-turn, Window Buffer Memory)
    → Check If Complete (detects COMPLETE_INFORMATION keyword)
        TRUE  → Telegram to JSON (extract + generate case number)
               → AI Classification Agent
               → Append ComplaintsDB
               → Send Telegram Confirmation
        FALSE → Send Telegram Response (continue conversation)
```

### Pipeline 3 — Daily Executive Summary

```
Schedule Trigger (daily 08:00)
    → Get rows from ComplaintsDB (filter: yesterday's date)
    → Aggregate: consolidate all rows into dailySummary object
    → AI Executive Summary Agent (HTML report)
    → Gmail: send to investigator
    → Append DailySummary sheet
```

---

## Frontend

The web form is located at `frontend/index2.html` and connects to the n8n webhook via `complaint2.js`.

### Conversation Flow

```
User fills form → Submit
        ↓
Webhook fires → AI processes
        ↓
Response: incomplete → Show AI question in conversation UI
        ↓
User answers → Re-fire webhook (same caseNumber)
        ↓
Repeat until AI produces <case_data> block
        ↓
Response: complete → Show success card with case number
```

### Key Frontend Functions

| Function | Purpose |
|---|---|
| `generateCaseNumber()` | Creates `SSCS{YYMMDD}-{RAND}` — generated once, reused |
| `submitToWebhook(data)` | POST to n8n with case number and payload |
| `handleResponse(response)` | Routes to conversation UI or success card |
| `addMessage(text, sender)` | Appends message to conversation view |
| `renderMessage(text, sender)` | Renders only (no history push — prevents duplicates) |
| `resetAndShowForm()` | Clears state for new complaint submission |

---

## Google Sheets Database

The Google Sheet acts as the central database for this demo system.

**Sheet ID:** `1qyfoQffyW6-6D8kUJnbE4QBM2pK9Bw4QLls-Drl-PIY`

| Tab | Purpose |
|---|---|
| `ComplaintsDB` | All complaint records from web and Telegram |
| `DailySummary` | Daily AI-generated executive reports |

---

## Environment Variables

No `.env` file is required for the frontend. All sensitive credentials are stored in **n8n Credentials** (never in code).

For local development, the only value to update is the webhook URL in `complaint2.js`.

> ⚠️ Never commit API keys or credentials to this repository.

---

## Demo

- **Live Frontend:** [https://dommmy200.github.io](https://dommmy200.github.io)
- **n8n Instance:** group2cse499.app.n8n.cloud
- **Telegram Bot:** Contact via demo session

### Test Complaint Payload

```json
{
  "caseNumber": "SSCS260328-0001",
  "fullName": "Test User",
  "email": "test@example.com",
  "description": "• Incident Date: 2025-12-13\n• Facility: Test Hospital\n• Complaint Type: billing\n• Reported Severity: medium\nThe hospital charged incorrectly for services not rendered.",
  "isFollowUp": false,
  "timestamp": "2026-03-28T10:00:00.000Z"
}
```

---

## Team

**Group 2 — CSE499 Capstone**

| Name | Role |
|---|---|
| Abah Dominic Odeh | Frontend, n8n Workflow, AI Configuration |
| *(add teammates)* | *(add roles)* |

**Supervisor:** *(add supervisor name)*
**Institution:** *(add institution name)*
**Academic Year:** 2025/2026

---

## License

This project is submitted as an academic capstone demo. All rights reserved by the authors and institution.

---

*Built with n8n · Google Gemini · Google Sheets · Supabase · GitHub Pages*
