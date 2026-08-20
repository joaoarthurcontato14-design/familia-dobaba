const { createClient } = window.supabase;
const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.DOBABA_CONFIG || {};

const screens = {
  loading: document.getElementById("loading-screen"),
  login: document.getElementById("login-screen"),
  question: document.getElementById("question-screen"),
  waiting: document.getElementById("waiting-screen"),
  results: document.getElementById("results-screen"),
  finish: document.getElementById("finish-screen")
};

const els = {
  loginForm: document.getElementById("login-form"),
  name: document.getElementById("name"),
  day: document.getElementById("birth-day"),
  month: document.getElementById("birth-month"),
  consent: document.getElementById("consent"),
  loginError: document.getElementById("login-error"),
  counter: document.getElementById("question-counter"),
  progress: document.getElementById("progress-fill"),
  label: document.getElementById("question-label"),
  text: document.getElementById("question-text"),
  people: document.getElementById("people-grid"),
  next: document.getElementById("next-btn"),
  questionError: document.getElementById("question-error"),
  waitCount: document.getElementById("wait-count"),
  resultsList: document.getElementById("results-list"),
  termsModal: document.getElementById("terms-modal")
};

let supabaseClient = null;
let state = {
  sessionToken: null,
  participantId: null,
  participantName: null,
  questionOrder: [],
  currentIndex: 0,
  answers: {},
  participants: []
};
let pollTimer = null;

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function setupDates() {
  els.day.innerHTML = '<option value="" selected disabled>Dia</option>';
  for (let i = 1; i <= 31; i++) {
    els.day.insertAdjacentHTML("beforeend", `<option value="${i}">${String(i).padStart(2,"0")}</option>`);
  }
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  els.month.innerHTML = '<option value="" selected disabled>Mês</option>';
  months.forEach((m, i) => els.month.insertAdjacentHTML("beforeend", `<option value="${i+1}">${m}</option>`));
}

function cleanName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function friendlyError(error) {
  const msg = error?.message || "";
  if (msg.includes("Nome ou data")) return "Nome ou data de nascimento não conferem.";
  if (msg.includes("termos")) return "Você precisa aceitar os termos para participar.";
  if (msg.includes("resultados ainda")) return "Os resultados ainda não foram liberados.";
  return "Não foi possível concluir agora. Confira sua conexão e tente novamente.";
}

async function loadParticipants() {
  // A lista é retornada indiretamente pelo banco no primeiro login? Para não expor
  // dados antes do login, usamos a lista local apenas depois de uma sessão válida.
  // Os IDs são carregados por uma função simples criada abaixo no login.
}

async function login(name, day, month) {
  const { data, error } = await supabaseClient.rpc("dobaba_login", {
    p_name: name,
    p_day: Number(day),
    p_month: Number(month),
    p_consent: true
  });
  if (error) throw error;

  state.sessionToken = data.session_token;
  state.participantId = data.participant_id;
  state.participantName = data.participant_name;
  state.questionOrder = data.question_order;
  state.currentIndex = 0;
  state.answers = {};

  localStorage.setItem("dobaba_session", JSON.stringify({
    sessionToken: state.sessionToken,
    participantId: state.participantId,
    participantName: state.participantName,
    questionOrder: state.questionOrder
  }));

  await loadChoices();
}

async function loadChoices() {
  // Os nomes dos participantes podem ser obtidos pelo RPC de login sem criar
  // uma tabela pública. A função abaixo é uma consulta mínima e somente leitura.
  const { data, error } = await supabaseClient.rpc("dobaba_participants", { p_session_token: state.sessionToken });
  if (error) throw error;
  state.participants = data || [];
}

function renderQuestion() {
  const qid = state.questionOrder[state.currentIndex];
  const question = QUESTIONS[qid - 1];
  const selected = state.answers[qid];

  els.counter.textContent = `${state.currentIndex + 1} / 20`;
  els.label.textContent = `PERGUNTA ${String(state.currentIndex + 1).padStart(2, "0")}`;
  els.progress.style.width = `${((state.currentIndex + 1) / 20) * 100}%`;
  els.text.textContent = question;

  els.people.innerHTML = "";
  state.participants.forEach(person => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "person-option" + (selected === person.id ? " selected" : "");
    btn.textContent = person.name;
    btn.addEventListener("click", () => {
      state.answers[qid] = person.id;
      els.questionError.textContent = "";
      renderQuestion();
    });
    els.people.appendChild(btn);
  });

  els.next.disabled = !selected;
  els.next.innerHTML = state.currentIndex === 19
    ? 'Enviar minhas respostas <span>→</span>'
    : 'Confirmar resposta <span>→</span>';
}

async function submitAnswers() {
  els.next.disabled = true;
  els.questionError.textContent = "";

  const answers = state.questionOrder.map(qid => ({
    question_id: qid,
    voted_for_id: state.answers[qid]
  }));

  try {
    const { error } = await supabaseClient.rpc("dobaba_submit", {
      p_session_token: state.sessionToken,
      p_answers: answers
    });
    if (error) throw error;
    showScreen("waiting");
    await refreshStatus();
    startPolling();
  } catch (error) {
    console.error(error);
    els.questionError.textContent = friendlyError(error);
    els.next.disabled = false;
  }
}

async function refreshStatus() {
  if (!state.sessionToken) return;
  const { data, error } = await supabaseClient.rpc("dobaba_status", {
    p_session_token: state.sessionToken
  });
  if (error) {
    console.error(error);
    return;
  }

  els.waitCount.textContent = `${data.submitted} de ${data.total}`;
  if (data.all_submitted) {
    stopPolling();
    await showResults();
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(refreshStatus, 2500);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

async function showResults() {
  const { data, error } = await supabaseClient.rpc("dobaba_results", {
    p_session_token: state.sessionToken
  });
  if (error) {
    console.error(error);
    return;
  }

  els.resultsList.innerHTML = "";
  data.forEach((result, index) => {
    const card = document.createElement("article");
    card.className = "result-card";

    const options = [...(result.options || [])].sort((a,b) => Number(b.count) - Number(a.count) || a.name.localeCompare(b.name));
    const max = options.length ? Math.max(...options.map(o => Number(o.count))) : 0;

    card.innerHTML = `
      <div class="result-number">PERGUNTA ${String(index + 1).padStart(2, "0")}</div>
      <div class="result-question">${escapeHtml(result.question)}</div>
      <div class="result-options"></div>
    `;

    const container = card.querySelector(".result-options");
    options.forEach(option => {
      const row = document.createElement("div");
      row.className = "vote-row";
      const voters = option.voters || [];
      row.innerHTML = `
        <div class="vote-name">${escapeHtml(option.name)}</div>
        <div class="vote-count">${option.count} ${Number(option.count) === 1 ? "voto" : "votos"}</div>
        <div class="voters">
          ${voters.length
            ? voters.map(v => `<span class="voter">${escapeHtml(v)}</span>`).join("")
            : '<span class="no-votes">Ninguém votou nesta pessoa.</span>'}
        </div>
      `;
      container.appendChild(row);
    });

    els.resultsList.appendChild(card);
  });

  showScreen("results");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
}

function openTerms() {
  els.termsModal.classList.remove("hidden");
  els.termsModal.setAttribute("aria-hidden", "false");
}
function closeTerms() {
  els.termsModal.classList.add("hidden");
  els.termsModal.setAttribute("aria-hidden", "true");
}

const QUESTIONS = [
  "Quem é mais provável de trancar o curso?",
  "Quem é mais provável de ser preso por uma coisa completamente idiota?",
  "Quem é mais provável de gastar todo o dinheiro em uma noite?",
  "Quem é mais provável de escolher dinheiro em vez de amor?",
  "Quem é mais provável de causar discórdia no grupo?",
  "Quem é mais provável de largar tudo e viajar sem avisar ninguém?",
  "Quem é mais provável de começar uma fofoca sem querer?",
  "Quem é mais provável de falar uma verdade que ninguém queria ouvir?",
  "Quem é mais provável de mudar completamente de carreira?",
  "Quem é mais provável de ser cancelado na internet?",
  "Quem é mais engraçado?",
  "Quem é mais provável de ser cancelado?",
  "Quem é mais indeciso?",
  "Quem é mais mão de vaca?",
  "Quem é mais gastador?",
  "Quem é mais provável de entrar para um reality show?",
  "Quem é mais cabeça quente?",
  "Quem é mais tranquilo?",
  "Quem é mais provável de dar o pior conselho?",
  "Quem é mais provável de dar o melhor conselho?"
];

async function tryRestoreSession() {
  const raw = localStorage.getItem("dobaba_session");
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    if (!saved.sessionToken || !Array.isArray(saved.questionOrder) || saved.questionOrder.length !== 20) return false;
    state.sessionToken = saved.sessionToken;
    state.participantId = saved.participantId;
    state.participantName = saved.participantName;
    state.questionOrder = saved.questionOrder;
    const { data, error } = await supabaseClient.rpc("dobaba_status", { p_session_token: state.sessionToken });
    if (error || !data) return false;
    await loadChoices();
    if (data.all_submitted) {
      await showResults();
    } else if (data.me_submitted) {
      showScreen("waiting");
      startPolling();
    } else {
      showScreen("question");
      renderQuestion();
    }
    return true;
  } catch {
    return false;
  }
}

function clearLocalSession() {
  localStorage.removeItem("dobaba_session");
  state = { sessionToken:null, participantId:null, participantName:null, questionOrder:[], currentIndex:0, answers:{}, participants:[] };
}

async function boot() {
  setupDates();
  await sleep(1100);

  if (!SUPABASE_URL || SUPABASE_URL.includes("COLE_AQUI") || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("COLE_AQUI")) {
    showScreen("login");
    els.loginError.textContent = "O site ainda precisa ser conectado ao Supabase. Siga o guia do arquivo LEIA-ME.";
    return;
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const restored = await tryRestoreSession();
  if (!restored) {
    clearLocalSession();
    showScreen("login");
  }
}

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.loginError.textContent = "";

  if (!els.consent.checked) {
    els.loginError.textContent = "Você precisa aceitar os termos para participar.";
    return;
  }

  try {
    await login(cleanName(els.name.value), els.day.value, els.month.value);
    showScreen("question");
    renderQuestion();
  } catch (error) {
    console.error(error);
    els.loginError.textContent = friendlyError(error);
  }
});

els.next.addEventListener("click", () => {
  if (state.currentIndex === 19) {
    submitAnswers();
  } else {
    state.currentIndex += 1;
    renderQuestion();
  }
});

document.getElementById("terms-btn").addEventListener("click", openTerms);
document.getElementById("close-terms").addEventListener("click", closeTerms);
document.getElementById("accept-terms").addEventListener("click", () => {
  els.consent.checked = true;
  closeTerms();
});
document.querySelector(".modal-backdrop").addEventListener("click", closeTerms);

document.getElementById("finish-btn").addEventListener("click", () => {
  showScreen("finish");
});

boot();
