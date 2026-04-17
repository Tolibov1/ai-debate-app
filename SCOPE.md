# 📋 SCOPE.md — AI Debate Coach

## What We're Building
A web app where users practice debating against an AI. The user picks a topic and a time limit, then debates back-and-forth with the AI until time runs out or they decide to finish early. At the end, the AI gives a full review and breakdown.

---

## User Flow
1. User picks a **topic** from a dropdown
2. User picks a **time limit** (1 / 5 / 10 / 15 minutes)
3. User writes their **opening argument**
4. AI responds with a **counter-argument**
5. User can keep replying — **back-and-forth debate continues**
6. At any point the user can click **"Finish & Review"**
7. When time runs out — debate automatically ends
8. AI gives a **full review breakdown**:
   - Overall score (1–10)
   - Strongest point the user made
   - Weakest point
   - What to improve
   - Who "won" the debate

---

## Core Features
- Topic selector (dropdown)
- Time limit selector (1 / 5 / 10 / 15 min)
- Live countdown timer
- Chat-style debate interface (user ↔ AI back and forth)
- "Finish & Review" button (available anytime)
- Auto-finish when timer hits 0
- Final review card from AI

---

## Tech Stack
- HTML, CSS, JavaScript (no frameworks)
- Gemini API (Google AI)

---

## Out of Scope (for MVP)
- Voice input/output
- User accounts or history
- Multiple AI agents
- Backend/database

---

## Target Demo Time
2 minutes. Pick topic → pick timer → debate → finish → see review.
