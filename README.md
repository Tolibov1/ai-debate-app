# 🎯 AI Debate Coach

> An AI debate partner with 7 distinct personalities — powered by Google Gemini 2.5 Flash.
> Built solo at **MLH AI Hackfest 2026**.

---

## 🎬 Demo video

**[Watch 2-minute demo →](https://youtu.be/oJEFE2roPYo)**

---

## 💡 What it does

Pick a topic. Choose your AI opponent's personality across **7 difficulty levels**. Set a time limit. Debate live.

Unlike chatbots that lecture, this AI stays **strictly on topic** and responds in **2-3 sharp sentences** — matching the tone of your chosen difficulty:

| Level | Tier | Vibe |
|-------|------|------|
| 1-2 | **Beginner** | Polite, measured, offers gentle hints |
| 3-4 | **Competitive** | Neutral, direct, challenges logic plainly |
| 5-6 | **Aggressive** | Confident, starts with "Weak." or "Really?", attacks weakest points |
| **7** | **🔥 BEAST MODE** | Brutal, sarcastic, merciless |

When time runs out, Gemini generates a full performance review: score (1-10), your strongest point, your weakest point, feedback, argument-by-argument breakdown, and a verdict on who won.

---

## 🧠 Why Gemini?

This project is **built entirely around Gemini's capabilities** — not bolted on.

**1. System instructions for personality tiers**
Each difficulty level sends a different `systemInstruction` to Gemini — producing dramatically different conversational voices from the same model. Level 1 reads like a polite tutor. Level 7 reads like a combative skeptic.

**2. Structured JSON review generation**
After the debate, Gemini is prompted to return the performance review as structured JSON (score, strongest_point, weakest_point, feedback, verdict, argument_breakdown). The UI consumes the JSON and renders it as styled review cards.

**3. Multi-turn conversation with context**
Full debate history is passed back to Gemini on each turn so the AI can reference and counter your earlier arguments.

**4. Speed (Gemini 2.5 Flash)**
Flash responds in ~2 seconds, keeping the debate feeling real-time.

---

## 🛠️ Tech stack

| Layer    | Choice                                              |
|----------|-----------------------------------------------------|
| Markup   | HTML5                                               |
| Styling  | CSS3 (custom properties, glassmorphism, animations) |
| Logic    | Vanilla JavaScript (no frameworks)                  |
| AI       | **Google Gemini 2.5 Flash** (`generateContent`)     |
| Fonts    | Bebas Neue + DM Sans                                |

Zero dependencies. Fully client-side.

---

## 🚀 Run locally

1. Clone this repo
2. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
3. In `app.js` (line ~5), set `API_KEY` to your key
4. Open `index.html` in a browser, or serve: `python3 -m http.server 8080`

**Mock mode:** if no API key is set, the app runs with canned responses so you can preview the UI without a key.

---

## 🏆 Submitted to

**MLH AI Hackfest 2026** — April 17-19, 2026
Targeting prize: **Best Use of Gemini API**

---

## 👤 Author

**Behruz Tolibov** — [GitHub](https://github.com/Tolibov1)
