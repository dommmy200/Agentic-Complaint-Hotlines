```markdown
# Hotline for Complaints with Agent  
**CSE 499 – Final Group Project**

## Project Proposed By
**Herick Guillen**

## Team Members
- Bloodshed Munyaradzi Chiondegwa  
- Diego Armando Vargas Diaz  
- Dominic Odeh Abah  
- Herick Guillen  

---

## Team Quotes
Each team member has added one of their favorite quotes as part of the project collaboration exercise.

- **Bloodshed Munyaradzi Chiondegwa**  
  > "Any sufficiently advanced technology is indistinguishable from magic." — Arthur C. Clarke  

- **Diego Armando Vargas Diaz**  
  > "Our part in this divine plan is to trust in God and seek divine helps, most notably the Atonement of His Beloved Son, our Savior and Redeemer Jesus Christ." — President Dallin H. Oaks  

- **Dominic Odeh Abah**  
  > "The more I learn, the more I realize how much I don't know." — Albert Einstein  

- **Herick Guillen**  
  > "Goals reflect the desires of our hearts and our vision of what we can accomplish. Through goals and plans, our hopes are transformed into action. Goal setting and planning are acts of faith." — *Preach My Gospel, Chapter 8*  

---

## Purpose
The purpose of this project is to build a web platform that allows users to submit complaints related to malpractice in health or administrative services. The system stores complaint data and interacts with an AI agent that analyzes submissions, gathers missing information through follow-ups, and generates structured summaries to support investigators.  

The platform is designed to streamline reporting while improving the quality, completeness, and usability of complaint data.

---

## 📋 Table of Contents
- Project Overview  
- System Architecture  
- Features  
- Tech Stack  
- Repository Structure  
- Setup & Installation  
- Workflow Pipelines  
- Frontend  
- Google Sheets Database  
- Environment Variables  
- Demo  
- Team  

---

## Project Overview
This system enables users to submit complaints regarding malpractice in health and administrative services. Complaints are:

- Submitted via a web form or Telegram bot  
- Processed by an AI agent (Google Gemini)  
- Stored in a Google Sheets database  
- Summarised daily and sent to investigators via email  

> ⚠️ This is a demo system built for academic purposes only.

---

## System Architecture

### Pipeline 1 — Web Intake
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

```

---

### Pipeline 2 — Telegram Intake
```

User (Telegram)
↓
Pipeline 2 — Telegram Bot Intake
↓
Multi-turn Conversation Agent
↓
Google Sheets (ComplaintsDB)
↓
Telegram Confirmation

```

---

### Pipeline 3 — Daily Summary
```

Schedule (Daily 08:00)
↓
Pipeline 3 — Executive Summary
↓
Google Sheets (ComplaintsDB)
↓
AI Agent (Executive Report)
↓
Gmail → Investigator + DailySummary Sheet

```

---

## Features

### Complaint Intake
- Web form with structured fields  
- Telegram bot alternative  
- Anonymous submission option  
- AI-driven follow-up questions  
- Multi-turn conversation memory (PostgreSQL-backed)  

### AI Processing
- Complaint validation and classification  
- Structured JSON outputs  
- Categories:
  - MEDICAL_CARE  
  - ADMINISTRATIVE_BILLING_INSURANCE  
  - STAFF_MISCONDUCT  
  - SECURITY_OR_CRIMINAL  
  - INFRASTRUCTURE_SERVICE_QUALITY  
  - OTHER  
- Priority levels: HIGH, MEDIUM, LOW  
- Reformulated complaints in formal language  
- Missing information detection  

### Admin Portal
- Secure authentication (bcrypt + JWT)  
- Session management (2-hour tokens)  
- Password reset via email  
- Protected dashboard routes  

### Investigator Support
- Daily executive summary reports  
- Structured complaint briefings  
- Key entity detection  
- Recommended next actions  

---

## Tech Stack

| Layer        | Technology |
|--------------|------------|
| Automation   | n8n (cloud-hosted) |
| AI / LLM     | Google Gemini 2.5 Flash |
| Database     | Google Sheets · Supabase (PostgreSQL) |
| Email        | Gmail OAuth2 · nodemailer |
| Messaging    | Telegram Bot API |
| Auth         | JWT · bcryptjs |
| Backend      | Node.js · Express.js |
| Frontend     | HTML5 · CSS · JavaScript |
| Hosting      | GitHub Pages |

---

## Repository Structure
```

/
├── README.md
├── index.html
├── offline.html
├── 404.html
├── 500.html
│
├── styles/
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
- n8n account  
- Google account (Sheets + Gmail API)  
- Google AI Studio API key  
- Supabase account  
- Telegram Bot Token (optional)  

### Clone Repository
```bash
git clone https://github.com/dommmy200/Agentic-Complaint-Hotlines.git
cd Agentic-Complaint-Hotlines
````

---

## Google Sheets Database

### ComplaintsDB Columns

* caseNumber
* fullName
* email
* phone
* incidentDate
* incidentTime
* healthFacility
* department
* complaintDetails
* anonymous
* followUp
* complaint_category
* priority_level
* reformulated_complaint
* investigative_summary
* investigator_observations
* recommended_next_action
* missing_information
* key_entities_detected
* submissionDate
* submissionTime
* status

### DailySummary Columns

* submissionDate
* summary

---

## Workflow Pipelines

### Pipeline 1 — Web Intake

```
Webhook → Extract Fields → AI Intake → Debugger → Switch
    TRUE  → Store → Classify → Email → Response (complete)
    FALSE → Response (follow-up question)
```

### Pipeline 2 — Telegram Intake

```
Telegram Trigger → Conversation Agent → Check Completion
    TRUE  → Transform → Store → Confirm
    FALSE → Continue Conversation
```

### Pipeline 3 — Executive Summary

```
Schedule → Fetch Data → Aggregate → AI Report → Email → Store Summary
```

---

## Frontend

### Flow

```
User submits form → AI processes → 
Incomplete → Ask follow-up →
Complete → Display success + case number
```

### Key Functions

| Function             | Purpose                |
| -------------------- | ---------------------- |
| generateCaseNumber() | Creates unique case ID |
| submitToWebhook()    | Sends data to backend  |
| handleResponse()     | Routes UI logic        |
| addMessage()         | Updates chat UI        |
| renderMessage()      | Renders message        |
| resetAndShowForm()   | Resets form            |

---

## Environment Variables

### Backend

* SUPABASE_URL
* SUPABASE_KEY
* JWT_SECRET
* EMAIL_USER
* EMAIL_PASS
* NODE_ENV
* PORT

> ⚠️ Never commit credentials to the repository.

---

## Demo

* **Frontend:** [https://dommmy200.github.io/Agentic-Complaint-Hotlines](https://dommmy200.github.io/Agentic-Complaint-Hotlines)
* **n8n Instance:** group2cse499.app.n8n.cloud
* **Telegram Bot:** Demo session access

### Sample Payload

```json
{
  "caseNumber": "SSCS-2603-00001",
  "fullName": "Test User",
  "email": "test@example.com",
  "anonymous": false,
  "incidentDate": "2026-03-28",
  "incidentTime": "10:00",
  "healthFacility": "Test Hospital",
  "department": "Billing",
  "description": "The hospital charged incorrectly for services not rendered.",
  "submissionDate": "2026-03-28",
  "submissionTime": "10:00",
  "followUp": "false",
  "phone": "",
  "personalId": ""
}
```

---

## Team

**Group 2 — CSE499 Capstone · Academic Year 2025/2026**

| Name                            | Role                                 |
| ------------------------------- | ------------------------------------ |
| Herick Guillen                  | Backend · n8n · AI Agents            |
| Dominic Odeh Abah               | Backend · n8n · AI Agents            |
| Diego Armando Vargas Diaz       | Frontend · Admin Dashboard           |
| Bloodshed Munyaradzi Chiondegwa | Frontend · Integration · API Mapping |

---

## ⚙️ Built With

* n8n
* Google Gemini
* Google Sheets
* Supabase
* GitHub Pages

```
```

