import { PROVIDER_ICONS } from './provider-icons.js';

const paths = {
  compass: '<path d="m12 3 8 18-8-4-8 4Z"/><path d="M12 3v14m-8 4 8-9 8 9"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  external: '<path d="M14 4h6v6m-1-5-9 9"/><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20.5 13.5A9 9 0 0 1 10.5 3a9 9 0 1 0 10 10.5Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  star: '<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9Z"/>',
  sparkles: '<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/><path d="M21 2v4m-2-2h4"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M9 8v8m6-8v8"/>',
  sliders: '<path d="M4 7h5m4 0h7M4 17h9m4 0h3"/><circle cx="11" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
  key: '<circle cx="8" cy="9" r="4"/><path d="m11 12 8 8m-3-3 3-3m-6 0 3-3"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18"/>',
  book: '<path d="M12 6C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Zm0 0v15"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-8Z"/>',
  terminal: '<path d="m5 7 4 5-4 5m7 0h7"/><rect x="2" y="3" width="20" height="18" rx="3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
};
export function icon(name, className = '') {
  return `<svg class='icon ${className}' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.65' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>${paths[name] || paths.code}</svg>`;
}
const marks = {
  pixels: '<rect x="5" y="5" width="6" height="6" rx="1"/><rect x="13" y="5" width="6" height="6" rx="1"/><rect x="5" y="13" width="6" height="6" rx="1"/><rect x="13" y="13" width="6" height="6" rx="1"/>',
  bolt: '<path d="m14 2-10 12h7l-1 8 10-13h-7Z"/>',
  agent: '<path d="m12 3 9 5v8l-9 5-9-5V8Zm0 0v9m9-4-9 4-9-4m9 4v9" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  route: '<path d="M3 10h8l5-5m-5 5 5 5M3 15h4m9-13v5h5m-5 6v5h5" fill="none" stroke="currentColor" stroke-width="2.3"/>',
  speed: '<path d="M18 10a7 7 0 1 0-2 7v-5h-6" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M19 17h2v4h-2Z"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  hug: '<circle cx="12" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><path d="M9 13q3 4 6 0M3 14l4 5m14-5-4 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  mountain: '<path d="M3 19V5h4l5 7 5-7h4v14h-4v-8l-5 7-5-7v8Z"/>',
  cloud: '<path d="M5 18a4 4 0 0 1-1-7 6 6 0 0 1 12-2 4.5 4.5 0 1 1 2 9Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 21h18" stroke="currentColor" stroke-width="1.8"/>',
};
export function providerMark(provider) {
  const source = PROVIDER_ICONS[provider.id];
  const fallback = `<svg class='provider-mark-fallback' viewBox='0 0 24 24' fill='currentColor'>${marks[provider.mark] || marks.pixels}</svg>`;
  return `<span class='provider-mark mark-${provider.color}${source ? ' provider-mark-with-logo' : ''}' aria-hidden='true'>${fallback}${source ? `<img class='provider-logo' src='${source}' alt='' width='128' height='128' loading='lazy' decoding='async'>` : ''}</span>`;
}
