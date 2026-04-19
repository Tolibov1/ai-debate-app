# AI Debate Coach

A static web app for practicing debates against a Gemini-powered AI opponent: choose a topic, set a time limit, exchange arguments in a chat, then receive a structured performance review with score and feedback.

## Tech stack

| Layer    | Choice                                      |
|----------|---------------------------------------------|
| Markup   | HTML5                                       |
| Styling  | CSS3 (variables, flexbox, animations)       |
| Logic    | Vanilla JavaScript (no frameworks)          |
| AI       | Google Gemini 2.0 Flash (`generateContent`) |
| Fonts    | Bebas Neue + DM Sans (Google Fonts)         |
| Hosting  | GitHub Pages (static files only)           |

## Run locally

1. Clone or download this repository.
2. Open `index.html` in your browser (double-click or File → Open), **or** serve the folder for stricter browser behavior:

   ```bash
   cd "/path/to/Dabate app"
   python3 -m http.server 8080
   ```

   Then visit `http://localhost:8080`.

## Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and create an API key.
2. In `js/app.js`, set the `API_KEY` constant at the top to your key.

If `API_KEY` is empty or left as `YOUR_API_KEY_HERE`, the app runs in **mock mode** with canned AI replies and a sample review so you can demo without a key.

## Deploy (GitHub Pages)

Push the repo to GitHub, enable **Pages** for the branch that contains `index.html` (often `main`), and set the source to the repository root (or `/docs` if you move files). The site is fully client-side; no server is required. Do **not** commit real API keys—prefer mock mode for public demos or inject keys via a private build step if you add one later.

## Credits

Built at the MLH Hackathon.

- GitHub: [Tolibov1/ai-debate-app](https://github.com/Tolibov1/ai-debate-app)
- Collaborator: otabek0302
