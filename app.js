// ===========================
//   AI DEBATE COACH — app.js
// ===========================

// 🔑 Paste your Gemini API key here
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ---- STATE ----
let selectedTime = 10;   // minutes
let timeLeft = 0;        // seconds
let timerInterval = null;
let debateHistory = [];  // stores all messages
let topic = "";
let debateActive = false;

// ---- SETUP SCREEN ----

function selectTime(mins) {
  selectedTime = mins;
  document.querySelectorAll(".time-btn").forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
}

function startDebate() {
  topic = document.getElementById("topicSelect").value;
  if (!topic) { alert("Please select a topic!"); return; }

  // Switch screens
  document.getElementById("setupScreen").style.display = "none";
  document.getElementById("debateScreen").style.display = "block";

  // Set topic in header
  document.getElementById("debateTopic").textContent = "📌 " + topic;

  // Start timer
  timeLeft = selectedTime * 60;
  updateTimerDisplay();
  timerInterval = setInterval(tickTimer, 1000);

  debateActive = true;
  debateHistory = [];

  // AI opens the debate
  addMessage("ai", "Welcome! I'll be arguing against your position. You go first — make your opening argument!");
}

// ---- TIMER ----

function tickTimer() {
  timeLeft--;
  updateTimerDisplay();

  const timerEl = document.getElementById("timer");
  if (timeLeft <= 60) timerEl.className = "timer danger";
  else if (timeLeft <= 120) timerEl.className = "timer warning";

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    addMessage("ai", "⏰ Time's up! Let me review your performance...");
    setTimeout(() => finishDebate(), 1500);
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");
  document.getElementById("timer").textContent = `${m}:${s}`;
}

// ---- SEND ARGUMENT ----

async function sendArgument() {
  if (!debateActive) return;
  const input = document.getElementById("userInput").value.trim();
  if (!input) return;

  // Show user message
  addMessage("user", input);
  debateHistory.push({ role: "user", text: input });
  document.getElementById("userInput").value = "";

  // Disable button while waiting
  document.getElementById("sendBtn").disabled = true;
  showTyping();

  try {
    const aiReply = await getAICounter(input);
    hideTyping();
    addMessage("ai", aiReply);
    debateHistory.push({ role: "ai", text: aiReply });
  } catch (e) {
    hideTyping();
    // Mock response if no API key
    const mock = getMockCounter();
    addMessage("ai", mock);
    debateHistory.push({ role: "ai", text: mock });
  }

  document.getElementById("sendBtn").disabled = false;
}

// ---- AI COUNTER-ARGUMENT ----

async function getAICounter(userArg) {
  if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") throw new Error("No API key");

  const historyText = debateHistory
    .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.text}`)
    .join("\n");

  const prompt = `
You are debating against the user on this topic: "${topic}"
You are arguing the OPPOSITE side.

Debate so far:
${historyText}

User just said: "${userArg}"

Respond with a sharp, direct counter-argument in 2-3 sentences. Be challenging but fair.
`;

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

// ---- FINISH & REVIEW ----

async function finishDebate() {
  debateActive = false;
  clearInterval(timerInterval);

  document.getElementById("sendBtn").disabled = true;
  document.getElementById("finishBtn").disabled = true;

  try {
    const review = await getAIReview();
    showReview(review);
  } catch (e) {
    showReview(getMockReview());
  }
}

async function getAIReview() {
  if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") throw new Error("No API key");

  const historyText = debateHistory
    .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.text}`)
    .join("\n");

  const prompt = `
You are a debate coach reviewing this debate on: "${topic}"

Full debate transcript:
${historyText}

Give a review as JSON only (no extra text):
{
  "score": 7,
  "winner": "One sentence on who argued better and why",
  "strongest": "The user's strongest argument",
  "weakest": "The user's weakest argument",
  "improve": "Specific advice on how the user can improve"
}
`;

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const data = await res.json();
  const raw = data.candidates[0].content.parts[0].text;
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function showReview(review) {
  document.getElementById("debateScreen").style.display = "none";
  document.getElementById("reviewScreen").style.display = "block";

  document.getElementById("scoreNumber").textContent = review.score;
  document.getElementById("winnerText").textContent   = review.winner;
  document.getElementById("strongText").textContent   = review.strongest;
  document.getElementById("weakText").textContent     = review.weakest;
  document.getElementById("improveText").textContent  = review.improve;

  setTimeout(() => {
    document.getElementById("scoreBar").style.width = (review.score / 10 * 100) + "%";
  }, 200);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---- RESET ----

function resetApp() {
  document.getElementById("reviewScreen").style.display = "none";
  document.getElementById("setupScreen").style.display  = "block";
  document.getElementById("chatBox").innerHTML = "";
  document.getElementById("scoreBar").style.width = "0%";
  document.getElementById("timer").className = "timer";
  debateHistory = [];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---- CHAT UI HELPERS ----

function addMessage(role, text) {
  const box = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = `<div class="msg-label">${role === "user" ? "You" : "AI Coach"}</div>${text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function showTyping() {
  const box = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = "typing";
  div.id = "typingIndicator";
  div.textContent = "AI is thinking...";
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// ---- MOCK DATA (used when no API key) ----

function getMockCounter() {
  const counters = [
    "That's an interesting point, but you're ignoring the broader systemic effects. Research consistently shows the opposite trend when you look at long-term data.",
    "While you raise a valid concern, correlation doesn't imply causation here. The evidence actually supports a more nuanced view that contradicts your claim.",
    "Your argument relies on anecdotal evidence. When we look at peer-reviewed studies, we find that the reality is far more complex than you're suggesting."
  ];
  return counters[Math.floor(Math.random() * counters.length)];
}

function getMockReview() {
  return {
    score: 6,
    winner: "The AI argued more consistently, but the user showed improvement throughout the debate.",
    strongest: "Your opening argument was clear and well-structured with a solid main claim.",
    weakest: "Your responses lacked specific data and evidence to back up your claims.",
    improve: "Always back your claims with specific examples or statistics. Anticipate counterarguments and address them before the opponent does."
  };
}
