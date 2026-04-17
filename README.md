# ⚔️ AI Debate Coach

> AI-powered debate practice web app — built at MLH Hackathon

## What it does
Pick a debate topic, set a time limit, and go head-to-head with an AI in a real back-and-forth debate. When you're done (or time runs out), the AI gives you a full breakdown of your performance.

## How it works
1. 🎯 **Pick a topic** — from a dropdown of debate topics
2. ⏱️ **Set a time limit** — 1 / 5 / 10 / 15 minutes
3. 💬 **Debate** — you argue, AI counters, you reply, back and forth
4. 🏁 **Finish anytime** — click "Finish & Review" when ready
5. ⏰ **Or let time run out** — debate ends automatically
6. 📊 **Get your review**:
   - Overall score (1–10)
   - Your strongest point
   - Your weakest point
   - What to improve
   - Who won

## How to run
1. Clone this repo
2. Open `index.html` in your browser
3. Add your Gemini API key in `app.js`

```
git clone https://github.com/Tolibov1/ai-debate-app
cd ai-debate-app
open index.html
```

## Adding Gemini API
In `app.js`, replace:
```js
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
```
Get your free key at: https://aistudio.google.com/

## Project Structure
```
ai-debate-app/
├── index.html   ← main page
├── style.css    ← all styles
├── app.js       ← all logic + API call
├── SCOPE.md     ← project scope
└── README.md    ← this file
```

## Tech Stack
- HTML, CSS, JavaScript
- Gemini 2.0 Flash API
