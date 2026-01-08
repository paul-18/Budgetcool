const KEY = "sharedPot";

init();
registerSW();

/* ---------- PERIOD ---------- */
function currentPeriod() {
  const d = new Date();
  const half = d.getDate() <= 15 ? "B1" : "B2";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${half}`;
}

/* ---------- INIT ---------- */
function init() {
  let data = load();
  if (data.period !== currentPeriod()) {
    data = freshData();
    save(data);
  }
  render();
}

function freshData() {
  return {
    period: currentPeriod(),
    pot: {
      totalAdded: 0,
      contributions: { You: 0, Partner: 0 }
    },
    expenses: []
  };
}

/* ---------- STORAGE ---------- */
function load() {
  return JSON.parse(localStorage.getItem(KEY)) || freshData();
}
function save(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

/* ---------- ACTIONS ---------- */
function addMoney() {
  const data = load();
  const amt = Number(addAmount.value);
  const who = addBy.value;

  data.pot.totalAdded += amt;
  data.pot.contributions[who] += amt;

  save(data);
  render();
}

function addExpense() {
  const data = load();
  data.expenses.push({
    id: Date.now(),
    description: desc.value,
    amount: Number(amount.value),
    category: category.value,
    date: new Date().toISOString().slice(0,10)
  });
  save(data);
  render();
}

/* ---------- RENDER ---------- */
function render() {
  const d = load();

  const spent = d.expenses.reduce((s,e)=>s+e.amount,0);
  const remaining = d.pot.totalAdded - spent;
  const avg = d.expenses.length ? (spent / d.expenses.length).toFixed(2) : 0;

  const pct = x => d.pot.totalAdded ? ((x/d.pot.totalAdded)*100).toFixed(1) : 0;

  const byCat = {};
  d.expenses.forEach(e => {
    byCat[e.category] = (byCat[e.category]||0) + e.amount;
  });

  stats.innerHTML = `
    <h2>Insights</h2>
    <p><strong>Pot Balance:</strong> $${remaining.toFixed(2)}</p>
    <p><strong>Total Added:</strong> $${d.pot.totalAdded}</p>
    <p><strong>Total Spent:</strong> $${spent} (${pct(spent)}%)</p>

    <h3>Contributions</h3>
    <p>You: $${d.pot.contributions.You} (${pct(d.pot.contributions.You)}%)</p>
    <p>Partner: $${d.pot.contributions.Partner} (${pct(d.pot.contributions.Partner)}%)</p>

    <h3>Spending Breakdown</h3>
    ${Object.entries(byCat).map(([k,v]) =>
      `<p>${k}: $${v} (${pct(v)}%)</p>`
    ).join("")}

    <h3>Stats</h3>
    <p>Expenses: ${d.expenses.length}</p>
    <p>Average Expense: $${avg}</p>
  `;

  expenseList.innerHTML = d.expenses.map(e =>
    `<li>${e.description} — $${e.amount} (${e.category})</li>`
  ).join("");
}

/* ---------- PWA ---------- */
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}
