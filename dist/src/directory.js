export const COLLECTIONS = [
  { id: 'all', label: 'All Providers', icon: 'grid' },
  { id: 'top', label: 'Top Picks', icon: 'star' },
  { id: 'new', label: 'New API', icon: 'sparkles' },
  { id: 'recommended', label: 'Recommended', icon: 'checkCircle' },
  { id: 'disabled', label: 'Disabled', icon: 'pause' },
];

export function inCollection(provider, collection) {
  if (collection === 'top') return Boolean(provider.badge);
  if (collection === 'new') return provider.isNew;
  if (collection === 'recommended') return provider.recommended;
  if (collection === 'disabled') return provider.status === 'Offline';
  return true;
}

export function matches(provider, state, ignoreGroup) {
  if (!inCollection(provider, state.collection)) return false;
  const query = state.query.trim().toLowerCase();
  const searchable = [provider.name, provider.description, ...provider.categories, ...provider.tags, ...provider.models].join(' ').toLowerCase();
  if (query && !searchable.includes(query)) return false;
  return Object.entries(state.filters).every(([key, selected]) => {
    if (key === ignoreGroup || !selected.length) return true;
    const value = provider[key];
    return selected.some(option => Array.isArray(value) ? value.includes(option) : value === option);
  });
}

export function getResults(providers, state) {
  const results = providers.filter(provider => matches(provider, state));
  if (state.sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name));
  if (state.sort === 'newest') results.sort((a, b) => b.updated.localeCompare(a.updated));
  if (state.sort === 'latency') results.sort((a, b) => (a.latency ?? Infinity) - (b.latency ?? Infinity));
  return results;
}

export function facetCount(providers, state, key, option) {
  return providers.filter(provider => {
    const value = provider[key];
    return matches(provider, state, key) && (Array.isArray(value) ? value.includes(option) : value === option);
  }).length;
}
