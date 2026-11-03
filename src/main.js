import { inject } from '@vercel/analytics';
import { PROVIDERS, FILTER_GROUPS } from './data.js';
import { REFERRAL_LINKS } from './config.js';
import { COLLECTIONS, getResults, facetCount } from './directory.js';
import { icon, providerMark } from './icons.js';

inject();

const state = { query: '', collection: 'all', sort: 'curated', filters: Object.fromEntries(FILTER_GROUPS.map(g => [g.key, []])) };
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
motion.addEventListener('change', () => { if (motion.matches) document.getAnimations().forEach(animation => animation.cancel()); });
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const date = value => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const statusBadge = p => `<span class='status status-${p.status.toLowerCase()}'><span class='status-dot'></span>${p.status}</span>`;
const apiButton = p => `<a class='button api-button' href='${esc(REFERRAL_LINKS[p.id])}' target='_blank' rel='noopener noreferrer' data-get-api='${p.id}' aria-label='Get API for ${esc(p.name)} (opens in a new tab)'>Get API ${icon('external')}</a>`;
let previousFocus;
let toastTimeout;

// Capturing image events also handles icons inserted later into a details dialog.
document.addEventListener('load', event => {
  if (event.target.matches?.('.provider-logo')) event.target.closest('.provider-mark').classList.add('icon-loaded');
}, true);
document.addEventListener('error', event => {
  if (event.target.matches?.('.provider-logo')) {
    event.target.hidden = true;
    event.target.closest('.provider-mark').classList.add('icon-unavailable');
  }
}, true);

document.querySelector('#app').innerHTML = `
  <div class='app-shell'>
    <header class='header entrance'>
      <a class='brand' href='#discover' aria-label='ModelWing API home'><span class='brand-mark'><img class='brand-logo' src='/favicon.svg?v=butterfly' alt='' width='38' height='38'></span><span class='brand-copy'><strong>ModelWing API<span class='brand-period'>.</span></strong><small>Your next AI connection.</small></span></a>
      <div class='search-wrap'>${icon('search')}<input id='provider-search' type='search' placeholder='Search providers or models…' aria-label='Search providers or models' autocomplete='off'><kbd aria-hidden='true'>Ctrl K</kbd></div>
      <nav aria-label='Main navigation'><a class='nav-link active' href='#discover'>Discover</a><a class='nav-link' href='#guides'>Setup Guides ${icon('external')}</a></nav>
      <button class='icon-button theme-toggle' aria-label='Switch to dark theme' title='Switch theme'>${icon('moon')}</button>
    </header>
    <main id='main-content'>
      <section class='hero entrance' aria-labelledby='hero-title'>
        <div class='hero-copy'><h1 id='hero-title'>Find your next <span>API.</span></h1><p>Explore free and free-credit providers. Find the right fit before you commit.</p></div>
      </section>
      <div class='directory-layout' id='discover-view'>
        <aside class='sidebar entrance' aria-label='Provider filters'><div class='filter-heading'><h2>Filters</h2><button class='text-button reset-all'>Reset</button></div><div class='filter-groups' data-filter-container='desktop'></div><p class='filter-intro'>A few filters. A better fit.<br>Choose across groups to narrow your search.</p><a class='guide-callout' href='#guides'><span class='guide-icon'>${icon('code')}</span><strong>Your first API call?</strong><p>From API key to a working request.</p><span>Explore setup guides ${icon('arrow')}</span></a></aside>
        <section class='results-section' aria-label='Provider directory'>
          <div class='collections-bar entrance'><div class='tabs' role='tablist' aria-label='Provider collections'>${COLLECTIONS.map((c, i) => `<button id='tab-${c.id}' role='tab' aria-selected='${i === 0}' aria-controls='provider-panel' tabindex='${i === 0 ? 0 : -1}' class='tab ${i === 0 ? 'active' : ''}' data-collection='${c.id}'><span>${c.label}</span></button>`).join('')}<span class='tab-underline'></span></div><label class='sort-control'><span>Sort by</span><div class='select-wrap'><select id='sort-select' aria-label='Sort providers'><option value='curated'>Curated</option><option value='newest'>Newest First</option><option value='name'>Name A–Z</option></select>${icon('chevron')}</div></label></div>
          <div class='results-toolbar entrance'><h2 id='results-title'>All providers <span class='result-count'>${PROVIDERS.length}</span></h2><p id='results-caption'>Source: API Hub</p><button class='button mobile-filters'>${icon('sliders')} Filters <span class='mobile-filter-count'></span></button></div>
          <div class='active-filters' aria-label='Active filters'></div>
          <div id='provider-panel' role='tabpanel' aria-labelledby='tab-all' tabindex='0'><div class='provider-grid'></div></div>
          <div class='directory-note'>${icon('info')}<p>Descriptions, offers, and model lists copied from <a href='https://new-free-api-providers-2026.vercel.app/' target='_blank' rel='noopener noreferrer'>API Hub</a> on Nov 3, 2026. Offers and availability can change. Check the provider’s dashboard for current terms. “Not documented” means the source does not list that detail.</p></div>
        </section>
      </div>
      <section id='guides-view' class='guides-view' hidden aria-labelledby='guide-title'></section>
    </main>
    <footer><div><a class='footer-brand' href='#discover'>ModelWing API</a><span>Independent by design. Made for what comes next.</span></div><a href='#guides'>Your next idea starts with a connection. <span>Start building ${icon('arrow')}</span></a></footer>
  </div>
  <dialog class='details-dialog' aria-labelledby='modal-title' aria-describedby='modal-description'><div class='modal-content'></div></dialog>
  <dialog class='filter-dialog' aria-labelledby='mobile-filter-title'><div class='mobile-filter-header'><h2 id='mobile-filter-title'>${icon('sliders')} Filters</h2><button class='icon-button close-filters' aria-label='Close filters'>${icon('close')}</button></div><div class='mobile-filter-intro'><span>A few filters. A better fit.</span><button class='text-button reset-all'>Reset</button></div><div class='filter-groups' data-filter-container='mobile'></div><div class='mobile-filter-footer'><button class='button button-primary show-providers'>Show ${PROVIDERS.length} providers ${icon('arrow')}</button></div></dialog>
  <div class='toast' role='status' aria-live='polite'></div><span id='results-announcement' class='sr-only' role='status' aria-live='polite' aria-atomic='true'></span>`;

function filterMarkup(prefix) {
  return FILTER_GROUPS.map(group => `<fieldset class='filter-group'><legend>${group.label}</legend>${group.options.map((option, i) => `<label class='filter-option' for='${prefix}-${group.key}-${i}'><input type='checkbox' id='${prefix}-${group.key}-${i}' data-filter-key='${group.key}' value='${esc(option)}'><span class='check-box'>${icon('check')}</span><span class='filter-label'>${option === 'Live' ? `<span class='tiny-dot green'></span>` : ''}${option}</span><span class='facet-count' data-count-key='${group.key}' data-option='${esc(option)}'>0</span></label>`).join('')}</fieldset>`).join('');
}
document.querySelectorAll('[data-filter-container]').forEach(el => { el.innerHTML = filterMarkup(el.dataset.filterContainer); });

function cardMarkup(p, i) {
  return `<article class='provider-card ${p.badge === 'Featured' ? 'featured-card' : ''}' style='--card-index:${i}' data-provider='${p.id}' aria-labelledby='provider-${p.id}'>
    <div class='card-top'>${providerMark(p)}<div class='card-stamp'><time class='updated' datetime='${p.updated}' title='Date added in the source directory'>${date(p.updated)}</time>${p.badge ? `<span class='special-badge badge-featured'>${icon('star')}${esc(p.badge)}</span>` : ''}</div></div>
    <h3 class='card-title' id='provider-${p.id}'>${esc(p.name)}</h3>
    <div class='card-tags'>${p.tags.map((tag, index) => `<span class='${index === 0 ? 'category-tag' : 'descriptive-tag'}'>${esc(tag)}</span>`).join('')}</div>
    <p class='card-description'>${esc(p.description)}</p>
    <dl class='connection-summary'><div><dt>Authentication</dt><dd>${esc(p.auth)}</dd></div><div><dt>Client routes</dt><dd>${esc(p.clients.join(' + ') || 'Not documented')}</dd></div><div><dt>Models</dt><dd class='${p.models.length ? '' : 'undocumented'}'>${p.models.length ? `${p.models.length} documented models` : 'Not documented'}</dd></div></dl>
    <div class='card-status'>${statusBadge(p)}<span>${esc(p.type)}</span></div>
    <div class='card-actions'><button class='button details-button' data-details='${p.id}' aria-label='Details for ${esc(p.name)}'>Details ${icon('arrow', 'card-arrow')}</button><a class='button docs-button' href='${esc(p.docs)}' target='_blank' rel='noopener noreferrer' aria-label='Setup guides for ${esc(p.name)} (opens in a new tab)'>Docs ${icon('external')}</a>${apiButton(p)}</div>
  </article>`;
}

function animate(element, frames, options = {}) {
  if (!motion.matches && element) element.animate(frames, { duration: 230, fill: 'backwards', easing: 'cubic-bezier(.2,.8,.2,1)', ...options });
}

function updateResults(initial = false) {
  const results = getResults(PROVIDERS, state);
  const grid = document.querySelector('.provider-grid');
  grid.innerHTML = results.length ? results.map(cardMarkup).join('') : `<div class='empty-state'><span class='empty-icon'>${icon('search')}</span><h3>No connections found.</h3><p>Try another provider or model, or clear your filters to find a new starting point.</p><button class='button button-primary reset-all'>Clear search & filters ${icon('arrow')}</button></div>`;
  grid.querySelectorAll('.provider-card').forEach((card, i) => animate(card, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 380, delay: i * (initial ? 55 : 40) }));
  const collection = COLLECTIONS.find(c => c.id === state.collection);
  document.querySelector('#results-title').innerHTML = `${collection.label === 'All Providers' ? 'All providers' : collection.label} <span class='result-count'>${results.length}</span>`;
  animate(document.querySelector('.result-count'), [{ opacity: .3 }, { opacity: 1 }]);
  document.querySelector('#results-caption').textContent = state.query || Object.values(state.filters).some(v => v.length) ? `${results.length} of ${PROVIDERS.length} providers match your search.` : state.collection === 'disabled' ? 'Listed offline by source · verify with provider' : 'Source: API Hub';
  document.querySelector('#provider-panel').setAttribute('aria-labelledby', `tab-${state.collection}`);
  document.querySelector('#results-announcement').textContent = `${results.length} providers found. ${collection.label}. Sorted by ${document.querySelector('#sort-select').selectedOptions[0].textContent}.`;
  document.querySelectorAll('[data-filter-key]').forEach(input => { input.checked = state.filters[input.dataset.filterKey].includes(input.value); });
  document.querySelectorAll('[data-count-key]').forEach(count => {
    const next = facetCount(PROVIDERS, state, count.dataset.countKey, count.dataset.option);
    if (count.textContent !== String(next)) animate(count, [{ opacity: .2 }, { opacity: 1 }]);
    count.textContent = next;
  });
  const chips = Object.entries(state.filters).flatMap(([key, values]) => values.map(value => `<button class='filter-chip' data-remove-key='${key}' data-remove-value='${esc(value)}' aria-label='Remove ${esc(value)} filter'>${esc(value)} ${icon('close')}</button>`));
  if (state.query) chips.unshift(`<button class='filter-chip' data-clear-search aria-label='Clear search'>${icon('search')}${esc(state.query)} ${icon('close')}</button>`);
  const active = document.querySelector('.active-filters');
  active.innerHTML = chips.length ? chips.join('') + `<button class='text-button reset-all'>Clear all</button>` : '';
  active.querySelectorAll('.filter-chip').forEach(chip => animate(chip, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }]));
  const filterCount = Object.values(state.filters).flat().length;
  document.querySelector('.mobile-filter-count').textContent = filterCount || '';
  document.querySelector('.show-providers').innerHTML = `Show ${results.length} provider${results.length === 1 ? '' : 's'} ${icon('arrow')}`;
}

function moveUnderline(shouldAnimate = true) {
  const tab = document.querySelector('.tab.active');
  const underline = document.querySelector('.tab-underline');
  const left = tab.offsetLeft;
  const width = tab.offsetWidth;
  if (shouldAnimate && !motion.matches) {
    const oldLeft = parseFloat(underline.style.left) || 0;
    const oldWidth = parseFloat(underline.style.width) || width;
    animate(underline, [
      { left: `${oldLeft}px`, width: `${oldWidth}px` },
      { left: `${left + (left - oldLeft) * .025}px`, width: `${width}px`, offset: .76 },
      { left: `${left}px`, width: `${width}px` },
    ], { duration: 360 });
  }
  underline.style.left = `${left}px`;
  underline.style.width = `${width}px`;
}

function reset() {
  state.query = ''; state.collection = 'all'; state.sort = 'curated';
  FILTER_GROUPS.forEach(g => { state.filters[g.key] = []; });
  document.querySelector('#provider-search').value = '';
  document.querySelector('#sort-select').value = 'curated';
  setCollection('all');
}

function setCollection(id) {
  state.collection = id;
  document.querySelectorAll('[data-collection]').forEach(tab => {
    const active = tab.dataset.collection === id;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  moveUnderline(); updateResults();
}

document.querySelector('#provider-search').addEventListener('input', e => {
  state.query = e.target.value;
  if (location.hash === '#guides') location.hash = '#discover';
  updateResults();
});
document.querySelector('#sort-select').addEventListener('change', e => { state.sort = e.target.value; updateResults(); animate(e.target, [{ opacity: .4 }, { opacity: 1 }]); });
document.addEventListener('change', e => {
  if (!e.target.matches('[data-filter-key]')) return;
  const { filterKey } = e.target.dataset;
  const value = e.target.value;
  state.filters[filterKey] = e.target.checked ? [...state.filters[filterKey], value] : state.filters[filterKey].filter(v => v !== value);
  updateResults();
});
document.addEventListener('click', e => {
  const button = e.target.closest('button');
  if (!button) return;
  if (button.matches('.reset-all')) { reset(); if (!document.querySelector('.filter-dialog').open) document.querySelector('#provider-search').focus(); }
  if (button.dataset.collection) setCollection(button.dataset.collection);
  if (button.dataset.details) openDetails(button.dataset.details);
  if (button.matches('[data-remove-key]')) { state.filters[button.dataset.removeKey] = state.filters[button.dataset.removeKey].filter(v => v !== button.dataset.removeValue); updateResults(); document.querySelector('#provider-search').focus(); }
  if (button.matches('[data-clear-search]')) { state.query = ''; document.querySelector('#provider-search').value = ''; updateResults(); document.querySelector('#provider-search').focus(); }
  if (button.matches('.theme-toggle')) {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('atlas-theme', theme); } catch {}
    updateThemeButton();
  }
  if (button.matches('.mobile-filters')) openDialog(document.querySelector('.filter-dialog'));
  if (button.matches('.close-filters, .show-providers')) closeDialog(document.querySelector('.filter-dialog'));
  if (button.matches('.close-details')) closeDialog(document.querySelector('.details-dialog'));
  if (button.matches('[data-copy]')) copyRoute(button);
});

document.querySelector('.tabs').addEventListener('keydown', e => {
  const tabs = [...document.querySelectorAll('.tab')];
  const index = tabs.indexOf(document.activeElement);
  if (index < 0 || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].focus(); setCollection(tabs[next].dataset.collection); tabs[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: motion.matches ? 'instant' : 'smooth' });
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !document.querySelector('dialog[open]')) { e.preventDefault(); document.querySelector('#provider-search').focus(); }
});

function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const button = document.querySelector('.theme-toggle');
  button.innerHTML = icon(dark ? 'sun' : 'moon');
  button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  button.title = button.getAttribute('aria-label');
}

function openDialog(dialog) {
  previousFocus = document.activeElement;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  if (dialog.classList.contains('filter-dialog')) animate(dialog, [{ opacity: 0, transform: 'translateX(-35px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 250 });
  else animate(dialog, [{ opacity: 0, transform: 'scale(.96) translateY(8px)' }, { opacity: 1, transform: 'scale(1.005) translateY(0)', offset: .8 }, { opacity: 1, transform: 'scale(1) translateY(0)' }], { duration: 240 });
}
function closeDialog(dialog) { dialog.close(); }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', e => {
    const rect = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) closeDialog(dialog);
  });
  dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (previousFocus?.isConnected) previousFocus.focus(); });
});

function openDetails(id) {
  const p = PROVIDERS.find(provider => provider.id === id);
  document.querySelector('.modal-content').innerHTML = `
    <div class='modal-banner'><button class='icon-button close-details' aria-label='Close provider details' autofocus>${icon('close')}</button><div class='modal-logo'>${providerMark(p)}</div></div>
    <div class='modal-body'><div class='modal-identity'><h2 id='modal-title'>${esc(p.name)}</h2><div class='modal-meta'>${statusBadge(p)}<span>${esc(p.type)}</span><span>Added ${date(p.updated)}</span></div></div>
    <p class='modal-description' id='modal-description'>${esc(p.description)}</p>
    <p class='provider-offer'>${esc(p.offer)}</p>
    <p class='provider-overview'>${p.models.length ? esc(p.models.slice(0, 3).join(', ')) + (p.models.length > 3 ? ` and ${p.models.length - 3} more` : '') : 'Models not documented'} · ${p.clients.length ? esc(p.clients.join(' + ')) + ' client routes' : 'Client route not documented'}</p>
    <div class='modal-actions'>${apiButton(p)}<a class='button' href='${esc(p.docs)}' target='_blank' rel='noopener noreferrer'>${icon('book')}View Documentation ${icon('external')}</a></div>
    ${p.hasProviderDocs ? '' : `<p class='field-note'>Provider documentation is not listed. View our client setup guides instead.</p>`}
    ${p.notice ? `<p class='provider-notice'>${icon('info')}${esc(p.notice)} <a href='${esc(p.website)}' target='_blank' rel='noopener noreferrer'>Visit current website ${icon('external')}</a></p>` : ''}
    <details class='modal-technical'><summary>Models, metrics & connection details ${icon('chevron')}</summary>
    <section class='modal-section' aria-labelledby='models-heading'><div class='section-heading'><h3 id='models-heading'>${icon('grid')} Documented models</h3></div>${p.models.length ? `<div class='model-list'>${p.models.map(model => `<span>${icon('code')}${esc(model)}</span>`).join('')}</div>` : `<p class='field-note'>Models unknown — the provider does not publish its model IDs.</p>`}</section>
    <section class='modal-section' aria-labelledby='metrics-heading'><div class='section-heading'><h3 id='metrics-heading'>${icon('bolt')} Published API metrics</h3></div><div class='metrics-grid'><div><span>Req/Min</span><strong class='text-metric'>Not listed</strong></div><div><span>Latency</span><strong class='text-metric'>Not listed</strong></div><div><span>Uptime %</span><strong class='text-metric'>Not listed</strong></div></div></section>
    <section class='modal-section' aria-labelledby='connection-heading'><div class='section-heading'><h3 id='connection-heading'>${icon('sliders')} Connection details</h3></div><dl class='modal-connections'><div><dt>Client route</dt><dd>${esc(p.clients.join(' + ') || 'Not documented')}</dd></div><div><dt>API Category</dt><dd>${esc(p.categories.join(', '))}</dd></div><div><dt>Authentication</dt><dd>${esc(p.auth)}</dd></div><div><dt>Card required</dt><dd>${esc(p.cardRequired)}</dd></div><div><dt>Added</dt><dd>${p.updated}</dd></div><div><dt>Data format</dt><dd>${esc(p.dataFormat)}</dd></div><div><dt>Rate limit</dt><dd>${esc(p.rateLimit)}</dd></div></dl></section>
    <section class='modal-section' aria-labelledby='route-heading'><div class='section-heading'><h3 id='route-heading'>${icon('terminal')} API route</h3></div>${p.route ? `<div class='route-box'><code>${esc(p.route)}</code><button class='icon-button' data-copy='${p.id}' aria-label='Copy API route'>${icon('copy')}</button></div><p class='field-note'><span class='copy-feedback' role='status' aria-live='polite'></span>Confirm the endpoint in your provider dashboard.</p>` : `<p class='field-note'>Not documented. Copy the current base URL from the provider’s dashboard.</p>`}</section>
    </details><div class='modal-disclaimer'>${icon('info')}<p>Copied from <a href='${esc(p.source)}' target='_blank' rel='noopener noreferrer'>API Hub</a> on ${date(p.imported)}. Offers, status, and models reflect that listing. Check the provider’s dashboard for current terms.</p></div></div>`;
  openDialog(document.querySelector('.details-dialog'));
}

async function copyRoute(button) {
  const route = PROVIDERS.find(p => p.id === button.dataset.copy).route;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(route);
    else {
      const textarea = document.createElement('textarea'); textarea.value = route; textarea.style.cssText = 'position:fixed;opacity:0'; button.closest('dialog').append(textarea); textarea.select();
      const success = document.execCommand('copy'); textarea.remove(); if (!success) throw new Error('Copy unavailable');
    }
    button.innerHTML = icon('check'); button.setAttribute('aria-label', 'Copied API route');
    const feedback = button.closest('.modal-section').querySelector('.copy-feedback');
    feedback.textContent = 'Copied to clipboard. ';
    showToast(`${icon('checkCircle')} Copied API route`);
    setTimeout(() => { if (button.isConnected) { button.innerHTML = icon('copy'); button.setAttribute('aria-label', 'Copy API route'); feedback.textContent = ''; } }, 2000);
  } catch { button.closest('.modal-section').querySelector('.copy-feedback').textContent = 'Select and copy the route manually. '; showToast('Copy unavailable. Select and copy the route above.'); }
}
function showToast(content) {
  const toast = document.querySelector('.toast'); toast.innerHTML = content; toast.classList.add('visible');
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2600);
}

document.querySelector('#guides-view').innerHTML = `
  <div class='guide-heading'><div class='eyebrow'>FROM IDEA TO FIRST REQUEST</div><h2 id='guide-title'>Your first connection<span>.</span></h2><p>A small, practical guide to getting an API into your project.</p><a class='text-link' href='#discover'>${icon('arrow')} Back to providers</a></div>
  <div class='guide-steps'><article><span class='step-number'>01</span><h3>Find your fit</h3><p>Compare model needs, authentication, and SDK support. Use the provider documentation and dashboard to confirm the details listed in this directory.</p></article><article><span class='step-number'>02</span><h3>Check the dashboard</h3><p>Confirm pricing, free-credit eligibility, rate limits, and model availability. Create your account directly with the provider and generate your own API key.</p></article><article><span class='step-number'>03</span><h3>Keep your key private</h3><p>Store your key in a server-side environment variable. Make API calls from your backend. Never embed a private API key in browser code or commit it to a repository.</p></article><article><span class='step-number'>04</span><h3>Make a small request</h3><p>Start with the provider’s documented example, confirmed endpoint, and model identifier. Set a timeout, handle errors, and check usage in the dashboard.</p></article></div>
  <div class='guide-code'><div>${icon('terminal')} A server-side starting point <span class='technical-label'>ILLUSTRATIVE ONLY</span></div><pre><code># Replace each placeholder using the provider's official docs.
# Run from your backend or local terminal, never the browser.
curl https://api.example.com/provider/v1/chat/completions \\
  -H 'Authorization: Bearer YOUR_PRIVATE_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"model":"PROVIDER_MODEL_ID","messages":[{"role":"user","content":"Hello!"}]}'</code></pre><p>${icon('info')} This endpoint is a placeholder. Authentication and request formats vary by provider.</p></div>`;

function renderRoute() {
  const guides = location.hash === '#guides';
  document.querySelector('#discover-view').hidden = guides;
  document.querySelector('#guides-view').hidden = !guides;
  document.querySelector('.hero').hidden = guides;
  document.querySelectorAll('.nav-link').forEach(link => { const active = link.hash === (guides ? '#guides' : '#discover'); link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  document.title = guides ? 'Setup Guides — ModelWing API' : 'ModelWing API — Find your next API';
  if (!guides) requestAnimationFrame(() => moveUnderline(false));
}
window.addEventListener('hashchange', () => { renderRoute(); window.scrollTo({ top: 0, behavior: 'instant' }); });
new ResizeObserver(() => moveUnderline(false)).observe(document.querySelector('.tabs'));
updateThemeButton(); updateResults(true); renderRoute(); requestAnimationFrame(() => moveUnderline(false));
