# 🏥 CSE499 — Health & Administrative Complaint Reporting System

Hotline for Complaints with Agent
CSE 499 – Final Group Project
Project Proposed By
Herick Guillen
Team Members
•	Bloodshed Munyaradzi Chiondegwa
•	Diego Armando Vargas Diaz
•	Dominic Odeh Abah
•	Herick Guillen
Team Quotes
Each team member has added one of their favorite quotes as part of the project collaboration exercise.
Bloodshed Munyaradzi Chiondegwa
"Any sufficiently advanced technology is indistinguishable from magic." — Arthur C. Clarke
Diego Armando Vargas Diaz
"Our part in this divine plan is to trust in God and seek divine helps, most notably the Atonement of His Beloved Son, our Savior and Redeemer Jesus Christ." — President Dallin H. Oaks
Dominic Odeh Abah
"The more I learn, the more I realize how much I don't know." — Albert Einstein
Herick Guillen
"Goals reflect the desires of our hearts and our vision of what we can accomplish. Through goals and plans, our hopes are transformed into action. Goal setting and planning are acts of faith." — Preach My Gospel, Chapter 8

Purpose
The purpose of this project is to build a web platform that allows users to submit complaints related to malpractice in health or administrative services. The system will store complaint information in a database and interact with an AI agent that can analyze the complaint, gather additional information if necessary, and generate summaries to help investigators review cases efficiently.
This platform aims to simplify the reporting process while improving the quality and organization of complaint data.

📋 Table of Contents
•	Project Overview
•	System Architecture
•	Features
•	Tech Stack
•	Repository Structure
•	Setup & Installation
•	Workflow Pipelines
•	Frontend
•	Google Sheets Database
•	Environment Variables
•	Demo
•	Team

Project Overview
This system allows members of the public to submit complaints related to malpractice in health and administrative services. Complaints are:
•	Received via a web form or Telegram bot
•	Processed by an AI agent (Google Gemini) that validates, classifies, and gathers additional information through follow-up questions
•	Stored in a Google Sheets database
•	Summarised daily and delivered to investigators via email
⚠️ This is a demo system built for academic purposes. It is not intended for production use.

System Architecture
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

Features
Complaint Intake
•	Web form with structured fields (facility, incident date, complaint type, severity, witnesses)
•	Telegram bot alternative channel for users without web access
•	Anonymous complaint option
•	AI-driven follow-up questions for incomplete submissions
•	Multi-turn conversation memory (Postgres-backed per case number)
AI Processing
•	Complaint validation and severity classification
•	Structured JSON output via Output Parser
•	Categorisation: MEDICAL_CARE, ADMINISTRATIVE_BILLING_INSURANCE, STAFF_MISCONDUCT, SECURITY_OR_CRIMINAL, INFRASTRUCTURE_SERVICE_QUALITY, OTHER
•	Priority levels: HIGH, MEDIUM, LOW
•	Reformulated complaint in formal institutional language
•	Missing information detection
Admin Portal
•	Admin registration and login with secure password hashing (bcrypt)
•	JWT-based session management (2-hour token, HttpOnly cookie)
•	Password reset via email link (nodemailer + 1-hour expiry token)
•	Protected admin dashboard routes via middleware authentication
Investigator Support
•	Daily executive HTML summary report via Gmail
•	Structured investigator briefing per complaint
•	Key entities detection (departments, staff roles, financial elements, safety risks)
•	Recommended next action per case

Tech Stack
Layer	Technology
Automation	n8n (cloud-hosted)
AI / LLM	Google Gemini 2.5 Flash
Database	Google Sheets (complaints) · Supabase/PostgreSQL (admin users & memory)
Email	Gmail via OAuth2 · nodemailer (password reset)
Messaging	Telegram Bot API
Auth	JSON Web Tokens (JWT) · bcryptjs
Backend	Node.js · Express.js
Frontend	HTML5 · CSS · Vanilla JavaScript
Hosting	GitHub Pages

Repository Structure
/
├── README.md
├── index.html                  # Main complaint submission page
├── offline.html                # Shown when the user is offline
├── 404.html                    # Not found error page
├── 500.html                    # Server error page
│
├── styles/                     # CSS stylesheets
├── scripts/                    # Client-side JavaScript
│   ├── extractor.js            # Regex field extraction from complaint description
│   ├── preprocess.js           # AI agent user prompt template builder
│   ├── debugger.js             # <case_data> detection and isComplete flag logic
│   └── telegram-to-json.js    # Strips markdown fences, extracts JSON from Telegram output
├── images/                     # Image assets
├── docs/                       # Project documentation
│   ├── architecture.md
│   ├── setup.md
│   └── api-reference.md
│
├── workflows/                  # n8n workflow JSON exports
│   ├── complaint-intake.json           # Webhook → AI intake → Sheets → Gmail
│   ├── investigator-pipeline.json      # Schedule → Aggregate → Executive report
│   ├── workflow-overview.json          # System overview
│   └── pipeline2-telegram-intake.json  # Telegram bot → AI intake → Sheets
│
└── admin/
    ├── login.html              # Admin sign-in page
    ├── register.html           # Admin account creation
    └── forgot.html             # Password reset request page
Backend (separate deployment)
├── server.js                   # Express app entry point
└── routes/
    └── auth.js                 # Register, login, logout, /me, forgot, reset
    middleware/
    └── auth.js                 # JWT requireAuth middleware

Setup & Installation
Prerequisites
•	n8n account (cloud or self-hosted)
•	Google account with Sheets and Gmail API access
•	Google AI Studio API key (aistudio.google.com)
•	Supabase account for PostgreSQL memory (supabase.com)
•	Telegram Bot Token (via @BotFather) — optional
1. Clone the Repository
git clone https://github.com/dommmy200/Agentic-Complaint-Hotlines.git
cd Agentic-Complaint-Hotlines
2. Set Up Google Sheets
Create a Google Sheet with two tabs:
Tab 1 — ComplaintsDB
Column	Description
caseNumber	Auto-generated by frontend
fullName	Complainant name
email	Contact email
phone	Contact phone
incidentDate	Date of incident
incidentTime	Time of incident
healthFacility	Facility name
department	Department or area
complaintDetails	Full complaint text
anonymous	true/false
followUp	true/false
complaint_category	AI classification
priority_level	HIGH / MEDIUM / LOW
reformulated_complaint	AI rewritten version
investigative_summary	AI summary
investigator_observations	AI observations
recommended_next_action	AI recommendation
missing_information	Fields flagged by AI
key_entities_detected	JSON object
submissionDate	YYYY-MM-DD
submissionTime	HH:MM:SS
status	pending_review / reviewed
Tab 2 — DailySummary
Column	Description
submissionDate	Date of summary
summary	HTML executive report
3. Set Up PostgreSQL Memory (Supabase)
Create a free project at supabase.com and run this SQL in the SQL editor:
CREATE TABLE IF NOT EXISTS n8n_chat_histories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    message JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_id ON n8n_chat_histories(session_id);
Copy the connection string from Settings → Database.
4. Import Workflows into n8n
1.	Open your n8n canvas
2.	Click Import → select each JSON file from workflows/
3.	Import in this order: 
o	complaint-intake.json
o	investigator-pipeline.json
o	pipeline2-telegram-intake.json
5. Configure Credentials in n8n
Credential	Where to Get
Google Gemini API	aistudio.google.com → Get API Key

Google Sheets OAuth2	n8n credential wizard → Google Sheets
Gmail OAuth2	n8n credential wizard → Gmail
PostgreSQL	Supabase → Settings → Database → Connection string
Telegram Bot	@BotFather → /newbot
6. Configure Frontend
In scripts/complaint.js, update the webhook URL:
// Replace with your n8n Production Webhook URL
const WEBHOOK_URL = 'https://your-n8n-instance.app.n8n.cloud/webhook/your-path';
7. Activate Workflows
In the n8n canvas for each workflow, click the Inactive toggle (top right) and confirm it turns green (Active).
8. Deploy Frontend
git add .
git commit -m "deploy frontend"
git push origin main
Then go to: GitHub repo → Settings → Pages → Source: main branch

Workflow Pipelines
Pipeline 1 — Web Form Intake
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
Pipeline 2 — Telegram Bot Intake
Telegram Trigger
    → Conversation Agent (multi-turn, Window Buffer Memory)
    → Check If Complete (detects COMPLETE_INFORMATION keyword)
        TRUE  → Telegram to JSON (extract + generate case number)
               → AI Classification Agent
               → Append ComplaintsDB
               → Send Telegram Confirmation
        FALSE → Send Telegram Response (continue conversation)
Pipeline 3 — Daily Executive Summary
Schedule Trigger (daily 08:00)
    → Get rows from ComplaintsDB (filter: yesterday's date)
    → Aggregate: consolidate all rows into dailySummary object
    → AI Executive Summary Agent (HTML report)
    → Gmail: send to investigator
    → Append DailySummary sheet

Frontend
The web form is located at index.html and connects to the n8n webhook via scripts/complaint.js.
Conversation Flow
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
Key Frontend Functions
Function	Purpose
generateCaseNumber()	Creates SSCS-YYMM-RANDOM — generated once, reused across follow-ups
submitToWebhook(data)	POST to n8n with case number and full payload (14 fields always sent)
handleResponse(response)	Routes to conversation UI or success card
addMessage(text, sender)	Appends message to conversation view
renderMessage(text, sender)	Renders only (no history push — prevents duplicates)
resetAndShowForm()	Clears state for new complaint submission

Google Sheets Database
The Google Sheet acts as the central database for this demo system.
Sheet ID: 1qyfoQffyW6-6D8kUJnbE4QBM2pK9Bw4QLls-Drl-PIY
Tab	Purpose
ComplaintsDB	All complaint records from web and Telegram
DailySummary	Daily AI-generated executive reports
________________________________________
Environment Variables
No .env file is required for the frontend. All sensitive credentials are stored in n8n Credentials (never in code).
The backend requires the following environment variables:
Variable	Description
SUPABASE_URL	Supabase project URL
SUPABASE_KEY	Supabase service role key
JWT_SECRET	Secret used to sign JWT tokens
EMAIL_USER	Gmail address used to send reset emails
EMAIL_PASS	Gmail app password
NODE_ENV	development or production
PORT	Port for the Express server (default: 3000)
⚠️ Never commit API keys or credentials to this repository.
________________________________________
Demo
•	Live Frontend: https://dommmy200.github.io/Agentic-Complaint-Hotlines
•	n8n Instance: group2cse499.app.n8n.cloud
•	Telegram Bot: Contact via demo session
Test Complaint Payload
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
________________________________________
Team
Group 2 — CSE499 Capstone · Academic Year 2025/2026
Name	Role
Herick Guillen (Team Lead)	Backend · n8n Workflow Automation · AI Agent Configuration
Dominic Odeh Abah	Backend · n8n Workflow Automation · AI Agent Configuration
Diego Armando Vargas Diaz	Frontend Development · Admin Dashboard
Bloodshed Munyaradzi Chiondegwa	Frontend Development · n8n Integration · API Field Mapping

Built with n8n · Google Gemini · Google Sheets · Supabase · GitHub Pages









