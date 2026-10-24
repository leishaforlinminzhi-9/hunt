// The password lock page: the unlocked screen is sealed with the (cleaned-up) password, so the page holds neither the password nor the words behind it.
import DATA from "./lock-data.js";
import { open as unseal } from "./vault.js";
import { norm } from "./norm.js";

const app = document.getElementById("app");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const KEY = "lock:" + DATA.id;
const P = new URLSearchParams(location.search);
if (P.has("reset")) { try { localStorage.removeItem(KEY); } catch {} }
let tries = 0;

function showLocked() {
  app.innerHTML = `
    <h1 class="title">${esc(DATA.title)}</h1><p class="sub">${esc(DATA.sub)}</p>
    <div class="lock" id="lock">🔒</div>
    <div class="paper"><small>${esc(DATA.ui.hintLabel)}</small><b>${esc(DATA.hint)}</b></div>
    <form id="form" autocomplete="off">
      <input id="pw" type="text" placeholder="${esc(DATA.placeholder)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="${esc(DATA.placeholder)}">
      <button type="submit">${esc(DATA.button)}</button>
    </form>
    <p class="msg" id="msg" aria-live="polite"></p><p class="tries" id="tries"></p>`;
  const input = document.getElementById("pw");
  document.getElementById("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = norm(input.value);
    if (!key) return;
    const payload = await unseal(DATA.sealed, key);
    if (payload) { try { localStorage.setItem(KEY, key); } catch {} return showOpen(payload, true); }
    tries++;
    const lock = document.getElementById("lock");
    lock.classList.remove("shake"); void lock.offsetWidth; lock.classList.add("shake");
    document.getElementById("msg").textContent = DATA.teases[(tries - 1) % DATA.teases.length];
    document.getElementById("tries").textContent = DATA.ui.tries.replace("{n}", tries);
    input.select();
  });
}

function showOpen(p, fresh) {
  app.innerHTML = `
    <h1 class="title">${esc(DATA.title)}</h1>
    <div class="lock ${fresh ? "open" : ""}">🔓</div>
    <p class="big">${esc(p.big)}</p>${p.script ? `<p class="script">${esc(p.script)}</p>` : ""}
    <div class="lines">${(p.lines || []).map((l) => `<p>${esc(l)}</p>`).join("")}</div>
    ${fresh ? '<div class="hearts" id="hearts"></div>' : ""}`;
  if (fresh) {
    const box = document.getElementById("hearts");
    for (let i = 0; i < 18; i++) {
      const h = document.createElement("i");
      h.textContent = ["💗", "💖", "❤️", "💕"][i % 4];
      h.style.left = `${Math.random() * 92}%`; h.style.animationDelay = `${Math.random() * 1.2}s`; h.style.fontSize = `${20 + Math.random() * 20}px`;
      box.appendChild(h);
    }
    setTimeout(() => box.remove(), 5000);
  }
}

(async () => {
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  if (saved) { const p = await unseal(DATA.sealed, saved); if (p) return showOpen(p, false); }
  showLocked();
})();
window.__lock = { get tries() { return tries; } };
