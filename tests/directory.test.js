import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS, FILTER_GROUPS } from '../src/data.js';
import { getResults, facetCount } from '../src/directory.js';
import { REFERRAL_LINKS } from '../src/config.js';

const state = overrides => ({ query: '', collection: 'all', sort: 'curated', filters: Object.fromEntries(FILTER_GROUPS.map(g => [g.key, []])), ...overrides });
test('search finds the imported providers and their documented models', () => {
  assert.deepEqual(getResults(PROVIDERS, state({ query: '  YZMAO  ' })).map(p => p.id), ['yzmao']);
  assert.deepEqual(getResults(PROVIDERS, state({ query: 'gpt-6-astra' })).map(p => p.id), ['emtf', 'agentrouter']);
  assert.equal(getResults(PROVIDERS, state({ query: '<script>missing</script>' })).length, 0);
});
test('filters combine with OR within a group and AND across groups', () => {
  const s = state(); s.filters.auth = ['API Key', 'Not documented']; s.filters.clients = ['Anthropic'];
  assert.deepEqual(getResults(PROVIDERS, s).map(p => p.id), ['codex-relay', 'freemodel', 'emtf', 'agentrouter', 'aerolink']);
  s.filters.auth = ['Not documented'];
  assert.deepEqual(getResults(PROVIDERS, s).map(p => p.id), ['emtf', 'aerolink']);
  s.filters.auth = ['API Key']; s.filters.clients = []; assert.equal(getResults(PROVIDERS, s).length, 5);
});
test('facet counts respect other groups and retain choices in the same group', () => {
  const s = state(); s.filters.auth = ['API Key']; s.filters.clients = ['OpenAI'];
  assert.equal(facetCount(PROVIDERS, s, 'auth', 'Not documented'), 2);
  assert.equal(facetCount(PROVIDERS, s, 'clients', 'Anthropic'), 3);
  assert.equal(facetCount(PROVIDERS, s, 'status', 'Offline'), 0);
});
test('collections display the selected source entries', () => {
  assert.deepEqual(getResults(PROVIDERS, state({ collection: 'disabled' })), []);
  assert.deepEqual(getResults(PROVIDERS, state({ collection: 'top' })).map(p => p.id), ['agentrouter']);
  assert.deepEqual(getResults(PROVIDERS, state({ collection: 'new' })).map(p => p.id), ['moyuu']);
  assert.deepEqual(getResults(PROVIDERS, state({ collection: 'recommended' })).map(p => p.id), ['emtf', 'agentrouter']);
});
test('all sort options work, and missing latency sorts last', () => {
  assert.deepEqual(getResults(PROVIDERS, state()).map(p => p.id), PROVIDERS.map(p => p.id));
  const alphabetical = getResults(PROVIDERS, state({ sort: 'name' }));
  assert.equal(alphabetical[0].id, 'aerolink'); assert.equal(alphabetical.at(-1).id, 'yzmao');
  assert.equal(getResults(PROVIDERS, state({ sort: 'newest' }))[0].id, 'moyuu');
  const sample = [null, 80, 20].map((latency, i) => ({ ...PROVIDERS[0], id: String(i), latency }));
  assert.deepEqual(getResults(sample, state({ sort: 'latency' })).map(p => p.latency), [20, 80, null]);
});
test('only the seven requested providers are included, with the supplied links and no invented endpoints', () => {
  assert.deepEqual(PROVIDERS.map(p => p.name), ['Codex-Relay', 'Yzmao', 'freemodel.in', 'EMTF AI', 'Moyuu', 'AgentRouter', 'Aerolink AI']);
  assert.deepEqual(REFERRAL_LINKS, {
    'codex-relay': 'https://shr.pn/TwMI', yzmao: 'https://shr.pn/XsEt', freemodel: 'https://shr.pn/E3JQ',
    emtf: 'https://shr.pn/c3as', moyuu: 'https://shr.pn/iwsy', agentrouter: 'https://shr.pn/liH4',
    aerolink: 'https://shr.pn/T76x',
  });
  assert.equal(Object.keys(REFERRAL_LINKS).length, PROVIDERS.length);
  PROVIDERS.forEach(p => {
    const link = new URL(REFERRAL_LINKS[p.id]);
    assert.equal(link.protocol, 'https:');
    assert.ok(!link.hostname.includes('example.com'));
    assert.equal(p.route, null);
    assert.equal(p.latency, null);
  });
});
