# Preprocessing Script Documentation

Scripts for the n8n **Code** nodes. Paste each into the relevant Code node editor.

---

## Section 1 — Pipeline 1: Validate & Structure Incoming Payload

**Node:** `Code — Validate & Structure`
**Position:** After Webhook, before AI Agent

```javascript
// ── Validate & structure incoming complaint payload ────────────────
// Receives multipart/form-data from the complaint form.
// All file uploads (evidenceFiles) are handled by n8n separately.

const raw = $input.first().json;

// Required field check
const required = ['incidentDate', 'healthFacility', 'complaintDetails'];
const missing  = required.filter(f => !raw[f] || raw[f].toString().trim() === '');
if (missing.length > 0) {
  throw new Error('Missing required fields: ' + missing.join(', '));
}

// complaintDetails minimum length
if (raw.complaintDetails.trim().length < 30) {
  throw new Error('Complaint details too short (minimum 30 characters).');
}

// Email format validation (only if email was provided)
if (raw.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) {
  throw new Error('Invalid email format: ' + raw.email);
}

// Incident date must not be in the future
const incidentDate = new Date(raw.incidentDate);
if (incidentDate > new Date()) {
  throw new Error('Incident date cannot be in the future.');
}

// Pre-map issueType to broader category (used as a hint in the AI prompt)
const categoryMap = {
  'clinical-care':  'health', 'medical-staff': 'health',
  'patient-safety': 'health', 'medications':   'health',
  'billing':        'administrative', 'scheduling':  'administrative',
  'admin-staff':    'administrative', 'facility':    'administrative'
};
const preCategory = categoryMap[raw.issueType] || 'unknown';

return [{
  json: {
    ...raw,
    preCategory,
    processedAt: new Date().toISOString()
  }
}];
```

---

## Section 2 — Pipeline 2: Aggregate & Filter Last 24 Hours

**Node:** `Code — Aggregate & Filter Last 24h`
**Position:** After Google Sheets Read, before AI Agent

```javascript
// ── Filter complaints from last 24 hours and build aggregate stats ──

const rows    = $input.all().map(item => item.json);
const cutoff  = new Date(Date.now() - 24 * 60 * 60 * 1000);
const recent  = rows.filter(r =>
  r.submissionDateTime && new Date(r.submissionDateTime) >= cutoff
);

if (recent.length === 0) {
  // Signal the workflow to stop gracefully — no email needed
  return [{ json: { noComplaints: true, generatedAt: new Date().toISOString() } }];
}

// ── Aggregate counts ────────────────────────────────────────────────
const byCategory  = {};
const byFacility  = {};
const byPriority  = {};
const byIssueType = {};

recent.forEach(function(r) {
  const cat  = r.aiCategory     || 'unclassified';
  const fac  = r.healthFacility || 'Unknown';
  const pri  = r.priority       || 'medium';
  const type = r.issueType      || 'unspecified';

  byCategory[cat]   = (byCategory[cat]   || 0) + 1;
  byFacility[fac]   = (byFacility[fac]   || 0) + 1;
  byPriority[pri]   = (byPriority[pri]   || 0) + 1;
  byIssueType[type] = (byIssueType[type] || 0) + 1;
});

// ── Sample high-priority cases for AI context ───────────────────────
const highPriority = recent.filter(r => r.priority === 'high').slice(0, 5);
const others       = recent.filter(r => r.priority !== 'high').slice(0, 3);
const samples      = highPriority.concat(others).map(r => ({
  caseNumber:    r.caseNumber,
  facility:      r.healthFacility,
  category:      r.aiCategory,
  priority:      r.priority,
  aiSummary:     r.aiSummary,
  missingFields: r.missingFields
}));

return [{
  json: {
    totalComplaints:   recent.length,
    period:            'Last 24 hours — ' + new Date().toISOString(),
    byCategory,
    byFacility,
    byPriority,
    byIssueType,
    highPriorityCount: byPriority['high'] || 0,
    caseNumbers:       recent.map(r => r.caseNumber),
    sampleCases:       samples,
    noComplaints:      false
  }
}];
```

---

## Section 3 — AI Agent System Prompts

### Pipeline 1 — Complaint Intake System Prompt

Paste this into the **System Message** field of the AI Agent node in Pipeline 1.

```
You are a healthcare complaint intake assistant for a government oversight platform.

You will receive a complaint submission. Perform EXACTLY these four tasks:

1. REFORMULATE: Rewrite the complaint in clear, formal English. Preserve all meaning.
   If the original is already clear, keep it as-is.

2. CLASSIFY: Determine whether this is a 'health' or 'administrative' complaint.
   - Health: clinical care, medical staff conduct, patient safety, medications.
   - Administrative: billing, scheduling, wait times, staff conduct, facility management.
   - If the submitter specified issueType, use that as a strong hint.

3. DETECT GAPS: Identify any missing critical information that would hinder investigation.
   Examples: no specific department, vague harm description, no staff name when conduct
   is alleged. Return an empty array [] if the complaint is complete.

4. SCORE PRIORITY: Assign 'low', 'medium', or 'high'.
   - high:   Imminent patient harm, ongoing abuse, medication errors, patient safety risk.
   - medium: Billing disputes, delayed care, staff misconduct.
   - low:    Facility maintenance, general dissatisfaction, minor admin issues.

Respond ONLY with a valid JSON object. No markdown, no code fences, no extra text.

{
  "reformulated": "<clean formal rewrite>",
  "category": "health" | "administrative",
  "missingFields": ["<field1>", "<field2>"],
  "priority": "low" | "medium" | "high",
  "aiSummary": "<2-3 sentence summary for investigators>"
}
```

### Pipeline 2 — Daily Summary System Prompt

Paste this into the **System Message** field of the AI Agent node in Pipeline 2.

```
You are an investigations supervisor for a government health complaint oversight platform.

You will receive aggregated complaint statistics for the past 24 hours as JSON.

Write a professional executive summary email body (plain text, no HTML).

Include ALL of the following sections:

1. DAILY OVERVIEW
   - Total complaints received
   - Breakdown by category (health vs administrative)
   - Breakdown by priority (high / medium / low)
   - High-priority count highlighted prominently

2. TOP FACILITIES BY VOLUME
   - List facilities with complaint counts

3. ISSUE TYPE BREAKDOWN
   - List issue types with counts

4. CASE HIGHLIGHTS (from sampleCases)
   - For each high-priority case: case number, facility, one-sentence summary
   - Flag any cases with missingFields that need investigator follow-up

5. RECOMMENDED ACTIONS
   - 2-3 specific, actionable recommendations based on today's patterns

Tone: Professional, factual, concise. Maximum 500 words.
Do NOT include any JSON in the output — write readable prose with clear section headers.
```

---

## Section 4 — Google Sheets Column Schema

Create a sheet named **Complaints** with these column headers in Row 1
(exact spelling, case-sensitive):

| Column | Source | Notes |
|--------|--------|-------|
| `caseNumber` | Frontend | Auto-generated `SSCS-YYMM-XXXXX` |
| `submissionDateTime` | Frontend | ISO 8601 timestamp |
| `anonymous` | Frontend | `yes` / `no` |
| `fullName` | Frontend | Empty if anonymous |
| `personalId` | Frontend | ID or patient number |
| `phone` | Frontend | Phone number |
| `email` | Frontend | Empty if anonymous |
| `followUp` | Frontend | `yes` / `no` |
| `incidentDate` | Frontend | `YYYY-MM-DD` |
| `incidentTime` | Frontend | `HH:MM` or empty |
| `healthFacility` | Frontend | Required |
| `department` | Frontend | Optional |
| `issueType` | Frontend | Optional pre-selection |
| `staffInvolved` | Frontend | Optional |
| `complaintDetails` | Frontend | Original submission text |
| `reformulated` | AI Agent | Cleaned formal rewrite |
| `aiCategory` | AI Agent | `health` / `administrative` |
| `missingFields` | AI Agent | Comma-separated list |
| `priority` | AI Agent | `low` / `medium` / `high` |
| `aiSummary` | AI Agent | 2-3 sentence investigator brief |
| `status` | System | `New` → `Reviewed` |
| `processedAt` | System | ISO 8601 timestamp |