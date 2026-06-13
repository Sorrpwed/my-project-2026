const API_BASE = "http://127.0.0.1:8000";
const STORAGE_KEY = "zhipu_chat_history";
const WELCOME_TEXT = "你好，我是智谱 AI。在下方输入消息，点击发送开始对话。";

const messagesEl = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const btnSend = document.getElementById("btnSend");
const btnClear = document.getElementById("btnClear");
const msgCountEl = document.getElementById("msgCount");
const toastEl = document.getElementById("toast");
const confirmModal = document.getElementById("confirmModal");
const btnCancel = document.getElementById("btnCancel");
const btnConfirm = document.getElementById("btnConfirm");
const particlesCanvas = document.getElementById("particles");

let toastTimer = null;

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function showToast(message, type = "error") {
  toastEl.textContent = message;
  toastEl.className = `toast ${type}`;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3000);
}

function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function updateMsgCount() {
  const count = getHistory().length;
  msgCountEl.textContent = `${count} 条`;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function autoResizeInput() {
  userInput.style.height = "auto";
  userInput.style.height = `${Math.min(userInput.scrollHeight, 120)}px`;
}

function createTypingDots() {
  const wrap = document.createElement("span");
  wrap.className = "typing-dots";
  for (let i = 0; i < 3; i++) {
    wrap.appendChild(document.createElement("span"));
  }
  return wrap;
}

function createMessageEl(role, text, extraClass = "", timestamp = Date.now(), isLoading = false) {
  const div = document.createElement("div");
  div.className = `msg msg-${role} ${extraClass}`.trim();

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "user" ? "你" : "AI";

  const body = document.createElement("div");
  body.className = "msg-body";

  const roleRow = document.createElement("div");
  roleRow.className = "msg-role";

  const label = document.createElement("span");
  label.textContent = role === "user" ? "你" : "AI";

  const timeSpan = document.createElement("span");
  timeSpan.className = "msg-time";
  timeSpan.textContent = formatTime(timestamp);

  roleRow.append(label, timeSpan);

  const content = document.createElement("p");
  content.className = "msg-text";

  if (isLoading) {
    content.appendChild(createTypingDots());
  } else {
    content.textContent = text;
  }

  body.append(roleRow, content);
  div.append(avatar, body);
  return { div, content };
}

function appendMessage(role, text, extraClass = "", timestamp = Date.now(), animate = true, isLoading = false) {
  const { div, content } = createMessageEl(role, text, extraClass, timestamp, isLoading);
  if (!animate) div.style.animation = "none";
  messagesEl.appendChild(div);
  scrollToBottom();
  return content;
}

function showWelcome() {
  appendMessage("ai", WELCOME_TEXT, "", Date.now(), false);
}

function renderHistory() {
  messagesEl.replaceChildren();
  const history = getHistory();

  if (history.length === 0) {
    showWelcome();
  } else {
    history.forEach((item, i) => {
      const { div } = createMessageEl(item.role, item.text, "", item.time || Date.now());
      div.style.animationDelay = `${i * 0.04}s`;
      messagesEl.appendChild(div);
    });
    scrollToBottom();
  }
  updateMsgCount();
}

function addToHistory(role, text) {
  const history = getHistory();
  history.push({ role, text, time: Date.now() });
  saveHistory(history);
  updateMsgCount();
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  messagesEl.replaceChildren();
  showWelcome();
  updateMsgCount();
  showToast("对话已清空", "success");
}

function openConfirmModal() {
  confirmModal.hidden = false;
  btnConfirm.focus();
}

function closeConfirmModal() {
  confirmModal.hidden = true;
}

async function sendMessage(message) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `请求失败 (${res.status})`);
  }
  return data.reply;
}

function initParticles() {
  const ctx = particlesCanvas.getContext("2d");
  let w = 0;
  let h = 0;
  const dots = [];
  const COUNT = 48;

  function resize() {
    w = particlesCanvas.width = window.innerWidth;
    h = particlesCanvas.height = window.innerHeight;
  }

  function seed() {
    dots.length = 0;
    for (let i = 0; i < COUNT; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > w) d.vx *= -1;
      if (d.y < 0 || d.y > h) d.vy *= -1;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 212, 255, 0.45)";
      ctx.fill();
    }

    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${0.12 * (1 - dist / 100)})`;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  seed();
  draw();
  window.addEventListener("resize", () => {
    resize();
    seed();
  });
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text || btnSend.disabled) return;

  if (getHistory().length === 0) {
    messagesEl.replaceChildren();
  }

  appendMessage("user", text);
  addToHistory("user", text);
  userInput.value = "";
  autoResizeInput();
  btnSend.disabled = true;

  const loadingEl = appendMessage("ai", "", "msg-loading", Date.now(), true, true);

  try {
    const reply = await sendMessage(text);
    loadingEl.replaceChildren();
    loadingEl.textContent = reply;
    loadingEl.closest(".msg").classList.remove("msg-loading");
    addToHistory("ai", reply);
  } catch (err) {
    loadingEl.closest(".msg")?.remove();
    const h = getHistory();
    if (h.length > 0 && h[h.length - 1].role === "user" && h[h.length - 1].text === text) {
      h.pop();
      saveHistory(h);
      updateMsgCount();
    }
    showToast(err.message || "发送失败，请确认后端已启动");
  } finally {
    btnSend.disabled = false;
    userInput.focus();
  }
});

btnClear.addEventListener("click", () => {
  if (getHistory().length === 0) {
    showToast("当前没有对话记录", "success");
    return;
  }
  openConfirmModal();
});

btnCancel.addEventListener("click", closeConfirmModal);
btnConfirm.addEventListener("click", () => {
  closeConfirmModal();
  clearHistory();
});

confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) closeConfirmModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !confirmModal.hidden) closeConfirmModal();
});

userInput.addEventListener("input", autoResizeInput);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

initParticles();
renderHistory();
autoResizeInput();
