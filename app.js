const KEY = "moneyPots";

init();
registerSW();

/* ---------- PERIOD ---------- */
function currentPeriod() {
  const d = new Date();
  const half = d.getDate() <= 15 ? "B1" : "B2";
  return `${d.getFullYear()}-${d.getMonth()+1}-${half}`;
}

/* ---------- INIT ---------- */
function init() {
  let data = load();
  if (!data || data.period !== currentPeriod()) {
    data = fresh();
    save(data);
  }
  render();
}

function fresh() {
  const pot = createPot("Main Pot");
  return {
    period: currentPeriod(),
    activePotId: pot.id,
    pots: [pot]
  };
}

function createPot(name) {
  return {
    id: crypto.randomUUID(),
    name,
    pot: {
      totalAdded: 0,
      contributions: { You: 0, Partner: 0 }
    },
    expenses: []
  };
}

/* ---------- STORAGE ---------- */
function load() {
  return JSON.parse(localStorage.getItem(KEY));
}
function save(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

/* ---------- HELPERS ---------- */
function activePot(data) {
  return data.pots.find(p => p.id === data.activePotId);
}

/* ---------- ACTIONS ---------- */
function addMoney() {
  const data = load();
  const pot = activePot(data);
  const amt = Number(addAmount.value);
  const who = addBy.value;

  if (!amt) return;

  pot.pot.totalAdded += amt;
  pot.pot.contributions[who] += amt;

  save(data);
  render();
}

function addExpense() {
  const data = load();
  const pot = activePot(data);
  const amt = Number(amount.value);

  if (!amt) return;

  pot.expenses.push({
    id: Date.now(),
    description: desc.value,
    amount: amt,
    category: category.value,
    date: new Date().toISOString().slice(0,10)
  });

  save(data);
  render();
}

function addPot() {
  const name = prompt("Pot name?");
  if (!name) return;

  const data = load();
  const pot = createPot(name);
  data.pots.push(pot);
  data.activePotId = pot.id;

  save(data);
  render();
}

/* ---------- RENDER ---------- */
function render() {
  const d = load();
  const pot = activePot(d);

  pots.innerHTML = d.pots.map(p =>
    `<div class="pot ${p.id===d.activePotId?'active':''}"
      onclick="selectPot('${p.id}')">${p.name}</div>`
  ).join("") +
  `<div class="pot add-pot" onclick="addPot()">＋</div>`;

  const spent = pot.expenses.reduce((s,e)=>s+e.amount,0);
  const remaining = pot.pot.totalAdded - spent;
  const pct = x => pot.pot.totalAdded ? ((x/pot.pot.totalAdded)*100).toFixed(1) : 0;

  const byCat = {};
  pot.expenses.forEach(e => {
    byCat[e.category] = (byCat[e.category]||0) + e.amount;
  });

  stats.innerHTML = `
    <h2>${pot.name} Insights</h2>
    <p><strong>Balance:</strong> $${remaining.toFixed(2)}</p>
    <p>Spent: $${spent} (${pct(spent)}%)</p>

    <h3>Contributions</h3>
    <p>You: $${pot.pot.contributions.You} (${pct(pot.pot.contributions.You)}%)</p>
    <p>Partner: $${pot.pot.contributions.Partner} (${pct(pot.pot.contributions.Partner)}%)</p>

    <h3>Categories</h3>
    ${Object.entries(byCat).map(([k,v]) =>
      `<p>${k}: $${v} (${pct(v)}%)</p>`
    ).join("")}
  `;

  expenseList.innerHTML = pot.expenses.map(e =>
    `<li>${e.description} — $${e.amount} (${e.category})</li>`
  ).join("");
}

function selectPot(id) {
  const d = load();
  d.activePotId = id;
  save(d);
  render();
}

/* ---------- PWA ---------- */
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}

