/**
 * AI Debate Coach — Gemini integration + mock mode for demos without a key.
 * Replace the value below with your key from Google AI Studio: https://aistudio.google.com/apikey
 */
const API_KEY = "YOUR_API_KEY_HERE";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

/** App state */
let selectedTopic = "";
let selectedMinutes = 10;
let selectedDifficulty = 3;
let timeLeftSeconds = 0;
let timerInterval = null;
/** @type {{ role: "user" | "ai", content: string }[]} */
let debateHistory = [];

/** Prevents duplicate finish when timer and button overlap. */
let debateActive = false;

const MOCK_AI_REPLY =
  "Really? You asserted that without a single source. Try again when you have evidence, not vibes.";

const MOCK_REVIEW = {
  score: 7,
  strongest_point: "You cited concrete examples and kept arguments tied to the resolution.",
  weakest_point: "Transitions between claims sometimes skipped addressing the opponent's strongest objection.",
  feedback:
    "Anchor each claim with one piece of evidence. You repeated the same idea without answering the counter.",
  verdict: "Slight edge to the user on examples.",
  verdict_why:
    "You won because your examples were concrete and the AI mostly repeated objections without pinning down errors in your reasoning.",
  winner: "user",
  argument_breakdown: [
    {
      argument: "First user message in the debate.",
      score: 6,
      line: "Readable, but thin on proof.",
    },
    {
      argument: "Follow-up response.",
      score: 8,
      line: "Stronger structure and a clear example.",
    },
  ],
};

// --- DOM refs (set on DOMContentLoaded) ---
let setupScreen;
let debateScreen;
let reviewScreen;
let customTopicInput;
let topicCardButtons;
let startBtn;
let timeButtons;
let difficultyButtons;
let difficultyLabelEl;
let timerEl;
let debateTopicLabel;
let chatWindow;
let argumentInput;
let sendBtn;
let finishBtn;
let scoreValueEl;
let scoreBarEl;
let strongestPointEl;
let weakestPointEl;
let feedbackTextEl;
let reviewInnerEl;
let verdictBlock;
let verdictWinnerLine;
let verdictWhyEl;
let argumentBreakdownList;
let tryAgainBtn;

/** Mock only when no key or placeholder — never treat a real key as mock. */
function isMockMode() {
  const k = String(API_KEY ?? "").trim();
  return !k || k === "YOUR_API_KEY_HERE";
}

/** Shared POST to Gemini; parses first candidate text or throws. */
async function geminiGenerateContent(requestBody) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const cand = data?.candidates?.[0];
  const text = cand?.content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text) {
    const block = data?.promptFeedback?.blockReason;
    throw new Error(
      block ? `Model blocked the request (${block}).` : "Empty response from model."
    );
  }
  return text;
}

/** 1–2 Beginner, 3–4 Competitive, 5–6 Aggressive, 7 Beast */
function getDifficultyLabel(level) {
  const n = Math.min(7, Math.max(1, Number(level) || 3));
  if (n <= 2) return "Beginner";
  if (n <= 4) return "Competitive";
  if (n <= 6) return "Aggressive";
  return "BEAST MODE 🔥";
}

function getDifficultyTier(level) {
  const n = Math.min(7, Math.max(1, Number(level) || 3));
  if (n <= 2) return "beginner";
  if (n <= 4) return "competitive";
  if (n <= 6) return "aggressive";
  return "beast";
}

function buildDebateSystemInstruction() {
  const topic = selectedTopic;
  const tier = getDifficultyTier(selectedDifficulty);
  const common = [
    `You are the user's debate opponent. Topic: "${topic}".`,
    "Maximum 2–3 short sentences total. Never sound like a teacher, coach, or essay. No long explanations.",
    "Hit the weakest part of the user's latest message.",
  ];

  if (tier === "beginner") {
    return [
      ...common,
      `Difficulty level ${selectedDifficulty} (Beginner): Be polite and measured. Take a slower, gentler tone. You may give one small hint about what would strengthen their case. No sarcasm or insults.`,
      'Open with something mild like "Fair point," or "Help me see," not "Weak."',
    ].join(" ");
  }

  if (tier === "competitive") {
    return [
      ...common,
      `Difficulty ${selectedDifficulty} (Competitive): Neutral, direct, no hints, no hand-holding.`,
      "Challenge the logic or evidence plainly. Short emotional opener allowed (one word or two), but stay professional.",
    ].join(" ");
  }

  if (tier === "aggressive") {
    return [
      ...common,
      `Difficulty ${selectedDifficulty} (Aggressive): Confident and slightly aggressive.`,
      'Start with a short emotional reaction such as: "Weak." "Really?" "That\'s it?" "Come on." Then attack the weakest point.',
      "Example style: Weak. You just repeated the same point twice. Where's your evidence?",
    ].join(" ");
  }

  return [
    ...common,
    `Difficulty 7 (BEAST MODE): Brutal, sarcastic, merciless. Find flaws instantly.`,
    'Open with a vicious one- or two-word reaction. Still cap at 2–3 sentences total.',
    "Never polite. Never explanatory. Example: Really? That argument falls apart the second someone asks for proof.",
  ].join(" ");
}

/**
 * Multi-turn debate: sends full thread as user/model turns so replies follow the actual exchange.
 * `debateHistory` must end with the latest user message (AI reply not yet appended).
 */
async function callGeminiDebate() {
  if (isMockMode()) {
    await delay(600);
    return MOCK_AI_REPLY;
  }

  const systemText = buildDebateSystemInstruction();

  const contents = debateHistory.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  return geminiGenerateContent({
    systemInstruction: { parts: [{ text: systemText }] },
    contents,
  });
}

/** Single-turn prompt (e.g. final JSON review). */
async function callGemini(prompt) {
  if (isMockMode()) {
    await delay(600);
    if (prompt.includes("Return ONLY valid JSON")) {
      return JSON.stringify(MOCK_REVIEW);
    }
    return MOCK_AI_REPLY;
  }

  return geminiGenerateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatTranscript() {
  return debateHistory
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n\n");
}

function showTypingIndicator() {
  removeTypingIndicator();
  const wrap = document.createElement("div");
  wrap.className = "msg msg--ai msg--typing";
  wrap.id = "ai-typing-indicator";
  wrap.setAttribute("role", "status");
  wrap.innerHTML =
    '<span class="msg-role">AI</span><div class="typing-line">AI is thinking<span class="typing-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></div>';
  chatWindow.appendChild(wrap);
  scrollChatToBottom();
}

function removeTypingIndicator() {
  document.getElementById("ai-typing-indicator")?.remove();
}

/** Validates setup, starts timer, shows debate screen. */
function startDebate() {
  const custom = (customTopicInput.value || "").trim();
  const picked = document.querySelector(".topic-card--selected");
  const fromCard = picked ? (picked.dataset.topic || "").trim() : "";
  selectedTopic = custom || fromCard;
  if (!selectedTopic) {
    customTopicInput.focus();
    return;
  }

  debateHistory = [];
  timeLeftSeconds = selectedMinutes * 60;
  chatWindow.innerHTML = "";
  debateActive = true;

  setupScreen.hidden = true;
  debateScreen.hidden = false;
  reviewScreen.hidden = true;

  const diffName = getDifficultyLabel(selectedDifficulty);
  debateTopicLabel.textContent = `Topic: ${selectedTopic} · ${diffName}`;
  updateTimerDisplay();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);

  argumentInput.disabled = false;
  sendBtn.disabled = false;
  finishBtn.disabled = false;
  argumentInput.focus();
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeftSeconds / 60);
  const s = timeLeftSeconds % 60;
  const label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  timerEl.textContent = label;
  timerEl.classList.toggle("timer--warning", timeLeftSeconds > 0 && timeLeftSeconds < 60);
}

/** Counts down every second; at 0 calls finishDebate(). */
function updateTimer() {
  if (timeLeftSeconds <= 0) return;
  timeLeftSeconds -= 1;
  updateTimerDisplay();
  if (timeLeftSeconds === 0) {
    finishDebate();
  }
}

function scrollChatToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMessage(role, content) {
  const wrap = document.createElement("div");
  wrap.className = `msg msg--${role === "user" ? "user" : "ai"}`;
  const roleEl = document.createElement("span");
  roleEl.className = "msg-role";
  roleEl.textContent = role === "user" ? "You" : "AI";
  const textEl = document.createElement("div");
  textEl.textContent = content;
  wrap.appendChild(roleEl);
  wrap.appendChild(textEl);
  chatWindow.appendChild(wrap);
  scrollChatToBottom();
}

/** Sends user argument, calls Gemini, displays AI reply. */
async function sendMessage() {
  const text = argumentInput.value.trim();
  if (!text) return;

  debateHistory.push({ role: "user", content: text });
  appendMessage("user", text);
  argumentInput.value = "";

  argumentInput.disabled = true;
  sendBtn.disabled = true;
  const prevSendLabel = sendBtn.textContent;
  sendBtn.textContent = "Thinking...";

  showTypingIndicator();

  try {
    const reply = await callGeminiDebate();
    removeTypingIndicator();
    debateHistory.push({ role: "ai", content: reply });
    appendMessage("ai", reply);
  } catch (err) {
    removeTypingIndicator();
    const msg = err instanceof Error ? err.message : "Request failed.";
    appendMessage("ai", `Sorry — something went wrong. ${msg}`);
  } finally {
    sendBtn.textContent = prevSendLabel;
    argumentInput.disabled = false;
    sendBtn.disabled = false;
    argumentInput.focus();
    scrollChatToBottom();
  }
}

function stripJsonFences(raw) {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "");
    const last = t.lastIndexOf("```");
    if (last !== -1) t = t.slice(0, last);
  }
  return t.trim();
}

/** At most `max` sentences (split on . ! ?). */
function limitSentences(text, max) {
  const s = String(text || "").trim();
  if (!s) return "—";
  if (max <= 1) {
    const one = s.match(/^[^.!?]+[.!?]?/);
    return ((one ? one[0] : s) || s).trim();
  }
  const parts = s.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [s];
  const out = parts.slice(0, max).join(" ").trim();
  return out || s;
}

function normalizeWinner(parsed) {
  const w = String(parsed.winner || "")
    .trim()
    .toLowerCase();
  if (w === "user" || w === "human" || w === "you") return "user";
  if (w === "ai" || w === "assistant" || w === "model" || w === "opponent") return "ai";
  const v = String(parsed.verdict || "").toLowerCase();
  if (/\byou win\b|user wins|human wins|victory.*you/i.test(v)) return "user";
  if (/\bai wins\b|opponent wins|model wins/i.test(v)) return "ai";
  const sc = Number(parsed.score);
  if (Number.isFinite(sc)) return sc >= 6 ? "user" : "ai";
  return "user";
}

/** Sends transcript to Gemini and returns parsed review object. */
async function getReview() {
  const transcript = formatTranscript() || "(no messages)";
  const userArgs = debateHistory.filter((m) => m.role === "user").map((m) => m.content);
  const prompt = [
    "You are a debate coach giving a fair performance review. Address the user directly using 'you' and 'your' throughout all feedback.",
    `Topic: ${selectedTopic}`,
    `Difficulty level was: ${selectedDifficulty} (${getDifficultyLabel(selectedDifficulty)}).`,
    `Full debate transcript: ${transcript}`,
    "Return ONLY valid JSON with this exact shape:",
    "{",
    '  "score": <number 1-10 overall>,',
    '  "strongest_point": "<string: address user directly with you/your>",',
    '  "weakest_point": "<string: address user directly with you/your>",',
    '  "feedback": "<string: at most 2 sentences, address user directly with you/your>",',
    '  "verdict": "<string: one short line summary>",',
    '  "verdict_why": "<string: exactly one sentence explaining why user or ai won - address user directly with you/your when describing user performance>",',
    '  "winner": "<string exactly user or ai - who won the debate>",',
    '  "argument_breakdown": [',
    '    { "argument": "<exact or paraphrased user argument>", "score": <1-10>, "line": "<one line of feedback for that argument - address user directly with you/your>" }',
    "  ]",
    "}",
    `There were ${userArgs.length} user messages. argument_breakdown must have one object per user argument, in order.`,
    "Keep each feedback line to one sentence.",
    "verdict_why must be a single sentence and name the main reason that side won.",
    "IMPORTANT: Write all feedback fields (strongest_point, weakest_point, feedback, verdict_why, argument_breakdown lines) in second-person voice addressing the user directly as 'you'/'your', NOT 'the user'/'the user's'.",
  ].join("\n");

  const raw = await callGemini(prompt);
  let parsed;
  try {
    parsed = JSON.parse(stripJsonFences(raw));
  } catch {
    throw new Error("Could not parse review JSON.");
  }

  const score = Number(parsed.score);
  if (!Number.isFinite(score) || score < 1 || score > 10) {
    parsed.score = Math.min(10, Math.max(1, Math.round(score) || 5));
  } else {
    parsed.score = Math.round(score);
  }

  if (!Array.isArray(parsed.argument_breakdown)) {
    parsed.argument_breakdown = [];
  }
  parsed.winner = normalizeWinner(parsed);
  return parsed;
}

function argumentTierMeta(score) {
  const n = Math.min(10, Math.max(1, Math.round(Number(score) || 5)));
  if (n >= 8) return { tier: "high", icon: "✅", badge: "argument-score-badge--high" };
  if (n >= 5) return { tier: "mid", icon: "⚠️", badge: "argument-score-badge--mid" };
  return { tier: "low", icon: "❌", badge: "argument-score-badge--low" };
}

function renderArgumentBreakdown(items) {
  argumentBreakdownList.innerHTML = "";
  if (!items || !items.length) {
    const p = document.createElement("p");
    p.className = "review-card-body";
    p.textContent = "No user arguments in this round.";
    argumentBreakdownList.appendChild(p);
    return;
  }
  items.forEach((row, i) => {
    const n = Math.min(10, Math.max(1, Math.round(Number(row.score) || 5)));
    const { tier, icon, badge } = argumentTierMeta(n);
    const el = document.createElement("div");
    el.className = `argument-row argument-row--${tier} argument-row--flip-in`;
    el.style.animationDelay = `${0.1 * i}s`;

    const head = document.createElement("div");
    head.className = "argument-row-head";

    const ic = document.createElement("span");
    ic.className = "argument-row-icon";
    ic.setAttribute("aria-hidden", "true");
    ic.textContent = icon;

    const quote = document.createElement("p");
    quote.className = "argument-row-quote";
    quote.textContent = `"${String(row.argument || "—").trim()}"`;

    const badgeEl = document.createElement("span");
    badgeEl.className = `argument-score-badge ${badge}`;
    badgeEl.textContent = `${n}/10`;

    head.appendChild(ic);
    head.appendChild(quote);
    head.appendChild(badgeEl);

    const fb = document.createElement("p");
    fb.className = "argument-row-feedback";
    fb.textContent = String(row.line || "—").trim();

    el.appendChild(head);
    el.appendChild(fb);
    argumentBreakdownList.appendChild(el);
  });
}

function deriveVerdictWhy(data, win) {
  const w = String(data.verdict_why || data.verdict_reason || "").trim();
  if (w) return limitSentences(w, 1);
  const v = String(data.verdict || "").trim();
  if (v) return limitSentences(v, 1);
  return win === "user"
    ? "You edged ahead on clarity and responsiveness in this round."
    : "The AI held the line on your claims and exposed gaps in evidence.";
}

function runScoreAnimations(finalScore) {
  const fs = Math.min(10, Math.max(1, Math.round(Number(finalScore) || 1)));
  scoreValueEl.textContent = "0";
  scoreBarEl.style.width = "0%";
  scoreBarEl.classList.remove("score-bar--animated");
  void scoreBarEl.offsetWidth;
  scoreBarEl.classList.add("score-bar--animated");

  const start = performance.now();
  const dur = 950;
  function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - (1 - t) * (1 - t);
    const val = Math.max(0, Math.round(fs * eased));
    scoreValueEl.textContent = String(val);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      scoreValueEl.textContent = String(fs);
    }
  }
  requestAnimationFrame(tick);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scoreBarEl.style.width = `${(fs / 10) * 100}%`;
    });
  });
}

function resetReviewAnimationState() {
  reviewInnerEl.classList.remove("review-anim-active");
  verdictBlock.classList.remove("verdict-winner--pulse");
  void reviewInnerEl.offsetWidth;
}

/** Animates score bar and fills review cards. */
function displayReview(data) {
  resetReviewAnimationState();

  strongestPointEl.textContent = data.strongest_point ?? "—";
  weakestPointEl.textContent = data.weakest_point ?? "—";
  feedbackTextEl.textContent = limitSentences(data.feedback, 2);

  const win = normalizeWinner(data);
  verdictBlock.classList.toggle("verdict-winner--user", win === "user");
  verdictBlock.classList.toggle("verdict-winner--ai", win === "ai");
  verdictWinnerLine.textContent = win === "user" ? "🏆 YOU WIN" : "🤖 AI WINS";
  verdictWhyEl.textContent = deriveVerdictWhy(data, win);

  renderArgumentBreakdown(data.argument_breakdown);
  runScoreAnimations(data.score);

  requestAnimationFrame(() => {
    reviewInnerEl.classList.add("review-anim-active");
    verdictBlock.classList.add("verdict-winner--pulse");
    window.setTimeout(() => {
      verdictBlock.classList.remove("verdict-winner--pulse");
    }, 1200);
  });
}

/** Stops timer, fetches review, shows review screen. */
async function finishDebate() {
  if (!debateActive) return;
  debateActive = false;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  argumentInput.disabled = true;
  sendBtn.disabled = true;
  finishBtn.disabled = true;
  const prevFinish = finishBtn.textContent;
  finishBtn.textContent = "Generating review...";

  try {
    const data = await getReview();
    setupScreen.hidden = true;
    debateScreen.hidden = true;
    reviewScreen.hidden = false;
    displayReview(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Review failed.";
    setupScreen.hidden = true;
    debateScreen.hidden = true;
    reviewScreen.hidden = false;
    displayReview({
      score: 1,
      strongest_point: "—",
      weakest_point: "—",
      feedback: msg,
      verdict: "—",
      verdict_why: "Review could not be generated — check your connection or API key.",
      winner: "ai",
      argument_breakdown: [],
    });
  } finally {
    finishBtn.textContent = prevFinish;
  }
}

/** Resets state and returns to setup screen. */
function tryAgain() {
  debateActive = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  debateHistory = [];
  timeLeftSeconds = 0;
  selectedTopic = "";
  customTopicInput.value = "";
  topicCardButtons.forEach((b) => b.classList.remove("topic-card--selected"));

  selectedDifficulty = 3;
  syncDifficultyButtons();

  scoreValueEl.textContent = "—";
  scoreBarEl.style.width = "0%";
  strongestPointEl.textContent = "—";
  weakestPointEl.textContent = "—";
  feedbackTextEl.textContent = "—";
  verdictWhyEl.textContent = "";
  argumentBreakdownList.innerHTML = "";
  verdictWinnerLine.textContent = "🏆 YOU WIN";
  verdictBlock.classList.add("verdict-winner--user");
  verdictBlock.classList.remove("verdict-winner--ai");
  verdictBlock.classList.remove("verdict-winner--pulse");
  reviewInnerEl.classList.remove("review-anim-active");
  scoreBarEl.style.width = "0%";

  chatWindow.innerHTML = "";
  argumentInput.value = "";

  reviewScreen.hidden = true;
  debateScreen.hidden = true;
  setupScreen.hidden = false;

  argumentInput.disabled = false;
  sendBtn.disabled = false;
  finishBtn.disabled = false;
}

function syncTimeButtons() {
  timeButtons.forEach((btn) => {
    const mins = Number(btn.dataset.minutes);
    const on = mins === selectedMinutes;
    btn.classList.toggle("time-btn--selected", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function syncDifficultyButtons() {
  difficultyLabelEl.textContent = getDifficultyLabel(selectedDifficulty);
  difficultyButtons.forEach((btn) => {
    const lv = Number(btn.dataset.level);
    const on = lv === selectedDifficulty;
    btn.classList.toggle("difficulty-btn--selected", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupScreen = document.getElementById("setup-screen");
  debateScreen = document.getElementById("debate-screen");
  reviewScreen = document.getElementById("review-screen");
  customTopicInput = document.getElementById("custom-topic");
  topicCardButtons = document.querySelectorAll(".topic-card");
  startBtn = document.getElementById("start-debate-btn");
  timeButtons = document.querySelectorAll(".time-btn");
  difficultyButtons = document.querySelectorAll(".difficulty-btn");
  difficultyLabelEl = document.getElementById("difficulty-label");
  timerEl = document.getElementById("timer");
  debateTopicLabel = document.getElementById("debate-topic-label");
  chatWindow = document.getElementById("chat-window");
  argumentInput = document.getElementById("argument-input");
  sendBtn = document.getElementById("send-btn");
  finishBtn = document.getElementById("finish-btn");
  scoreValueEl = document.getElementById("score-value");
  scoreBarEl = document.getElementById("score-bar");
  strongestPointEl = document.getElementById("strongest-point");
  weakestPointEl = document.getElementById("weakest-point");
  feedbackTextEl = document.getElementById("feedback-text");
  reviewInnerEl = document.getElementById("review-inner");
  verdictBlock = document.getElementById("verdict-block");
  verdictWinnerLine = document.getElementById("verdict-winner-line");
  verdictWhyEl = document.getElementById("verdict-why");
  argumentBreakdownList = document.getElementById("argument-breakdown-list");
  tryAgainBtn = document.getElementById("try-again-btn");

  syncTimeButtons();
  syncDifficultyButtons();

  topicCardButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      topicCardButtons.forEach((b) => b.classList.remove("topic-card--selected"));
      btn.classList.add("topic-card--selected");
    });
  });

  timeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMinutes = Number(btn.dataset.minutes) || 10;
      syncTimeButtons();
    });
  });

  difficultyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedDifficulty = Number(btn.dataset.level) || 3;
      syncDifficultyButtons();
    });
  });

  startBtn.addEventListener("click", startDebate);
  sendBtn.addEventListener("click", sendMessage);
  argumentInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  finishBtn.addEventListener("click", finishDebate);
  tryAgainBtn.addEventListener("click", tryAgain);
});
