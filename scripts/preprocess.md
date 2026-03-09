# Preprocessing Script Documentation

## Purpose
This document outlines the preprocessing logic used in the Code nodes before passing data to the AI Agent.

## Complaint Intake Preprocessing

### 1. Data Validation Script
```javascript
// Location: complaint-intake workflow, before AI Agent
// Purpose: Validate and structure incoming form data

const complaint = $input.first().json;

// Required field validation
const requiredFields = ['fullName', 'email', 'description', 'facilityName'];
const missingFields = requiredFields.filter(field => !complaint[field]);

if (missingFields.length > 0) {
  throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
}

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(complaint.email)) {
  throw new Error('Invalid email format');
}

// Description length validation
if (complaint.description.length < 20) {
  throw new Error('Please provide a more detailed description (minimum 20 characters)');
}

// Structure data for AI processing
return {
  ...complaint,
  processedAt: new Date().toISOString(),
  aiContext: {
    requiresUrgent: complaint.severity === 'high',
    category: mapComplaintCategory(complaint.complaintType),
    language: detectLanguage(complaint.description)
  }
};

function mapComplaintCategory(type) {
  const categoryMap = {
    'misdiagnosis': 'clinical_error',
    'surgical': 'clinical_error',
    'medication': 'clinical_error',
    'records': 'administrative',
    'billing': 'administrative',
    'privacy': 'administrative',
    'consent': 'patient_rights',
    'dignity': 'patient_rights',
    'discrimination': 'patient_rights'
  };
  return categoryMap[type] || 'other';
}

function detectLanguage(text) {
  // Simple language detection logic
  // In production, use a proper language detection library
  const hasNonLatin = /[^\x00-\x7F]/.test(text);
  return hasNonLatin ? 'mixed' : 'english';
}