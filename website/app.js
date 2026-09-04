const state = { papers: [], compact: false };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const statusLabel = (status) => ({ exact: 'exact source', 'reviewed-marker': 'boundary reviewed', 'needs-review': 'boundary review' }[status] || status);
const statusClass = (status) => status === 'exact' ? '' : 'review';
const sourceUrl = (path) => `/source/${path.split('/').map(encodeURIComponent).join('/')}`;

function optionValues(values, label) {
  return [`<option value="">All ${label}</option>`, ...values.map((value) => `<option value="${value}">${value}</option>`)].join('');
}

function renderStats() {
  const years = new Set(state.papers.map((paper) => paper.exam_year));
  const subjects = new Set(state.papers.map((paper) => paper.subject));
  $('#stats').innerHTML = [[state.papers.length, 'paper records'], [years.size, 'exam years'], [subjects.size, 'subjects']].map(([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
}

function filters() {
  const values = { year: $('#year-filter').value, subject: $('#subject-filter').value, medium: $('#medium-filter').value, status: $('#status-filter').value, search: $('#search').value.trim().toLowerCase() };
  return state.papers.filter((paper) => {
    const haystack = `${paper.exam_year} ${paper.subject} ${paper.paper} ${paper.medium}`.toLowerCase();
    return (!values.year || String(paper.exam_year) === values.year) && (!values.subject || paper.subject === values.subject) && (!values.medium || paper.medium.includes(values.medium)) && (!values.status || paper.boundary_status === values.status) && (!values.search || haystack.includes(values.search));
  });
}

function renderCards() {
  const papers = filters();
  $('#results-count').textContent = papers.length;
  $('#paper-grid').classList.toggle('compact', state.compact);
  $('#paper-grid').innerHTML = papers.map((paper) => `<article class="paper-card">
    <div class="paper-card-top"><span class="paper-year">${escapeHtml(paper.exam_year)}</span><span class="badge ${statusClass(paper.boundary_status)}">${escapeHtml(statusLabel(paper.boundary_status))}</span></div>
    <h2 class="paper-subject">${escapeHtml(paper.subject)}</h2><div class="paper-paper">${escapeHtml(paper.paper === 'main' ? 'Main paper' : paper.paper.replace('-', ' '))}</div>
    <div class="card-foot"><div class="card-meta">${escapeHtml(paper.medium)}<br>${paper.source_count} source${paper.source_count === 1 ? '' : 's'}</div><button class="open-paper" data-paper="${escapeHtml(paper.id)}" type="button">View record →</button></div>
  </article>`).join('');
  $('#empty-state').hidden = papers.length !== 0;
  document.querySelectorAll('.open-paper').forEach((button) => button.addEventListener('click', () => openPaper(button.dataset.paper)));
}

function openPaper(id) {
  const paper = state.papers.find((item) => item.id === id);
  if (!paper) return;
  const sources = paper.sources.map((source) => `<li><a href="${sourceUrl(source.pdf)}" target="_blank" rel="noreferrer">${escapeHtml(source.pdf)}</a><br><strong>${source.pages.length ? `pages ${source.pages[0]}–${source.pages[source.pages.length - 1]}` : 'page boundary needs review'}</strong></li>`).join('');
  $('#dialog-content').innerHTML = `<div class="dialog-kicker">NORMALIZED PAPER RECORD · ${escapeHtml(paper.id)}</div><h2 class="dialog-title">${escapeHtml(paper.title)}</h2><div class="dialog-summary"><div><span>Medium</span><strong>${escapeHtml(paper.medium)}</strong></div><div><span>Boundary</span><strong>${escapeHtml(statusLabel(paper.boundary_status))}</strong></div><div><span>Sources</span><strong>${paper.source_count}</strong></div></div><h3>Evidence trail</h3><ul class="source-list">${sources}</ul><div class="dialog-actions"><a href="/${paper.markdown}" target="_blank" rel="noreferrer">Open Markdown ↗</a><a class="secondary" href="${sourceUrl(paper.sources[0].pdf)}" target="_blank" rel="noreferrer">Open source PDF ↗</a></div>`;
  $('#paper-dialog').showModal();
}

async function boot() {
  const response = await fetch('/data/papers.json');
  const payload = await response.json();
  state.papers = payload.papers;
  renderStats();
  const years = [...new Set(state.papers.map((paper) => paper.exam_year))].sort((a, b) => a - b);
  const subjects = [...new Set(state.papers.map((paper) => paper.subject))].sort();
  const mediums = [...new Set(state.papers.flatMap((paper) => paper.medium.split(' + ')))].sort();
  $('#year-filter').innerHTML = optionValues(years, 'years'); $('#subject-filter').innerHTML = optionValues(subjects, 'subjects'); $('#medium-filter').innerHTML = optionValues(mediums, 'media');
  ['#year-filter', '#subject-filter', '#medium-filter', '#status-filter'].forEach((selector) => $(selector).addEventListener('change', renderCards));
  $('#search').addEventListener('input', renderCards); $('#reset').addEventListener('click', () => { ['#year-filter', '#subject-filter', '#medium-filter', '#status-filter'].forEach((selector) => { $(selector).value = ''; }); $('#search').value = ''; renderCards(); });
  $('#view-toggle').addEventListener('click', () => { state.compact = !state.compact; $('#view-toggle').textContent = state.compact ? 'Comfortable view' : 'Compact view'; renderCards(); });
  $('#dialog-close').addEventListener('click', () => $('#paper-dialog').close()); window.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement !== $('#search')) { event.preventDefault(); $('#search').focus(); } });
  renderCards();
}
boot().catch(() => { $('#results-count').textContent = 'Catalog unavailable'; });
