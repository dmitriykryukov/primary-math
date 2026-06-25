// tests/unit/i18n.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { lang, t, setLang } from '$lib/i18n/index';

describe('i18n', () => {
  beforeEach(() => setLang('en'));

  it('returns English by default', () => {
    expect(t('login')).toBe('Log In');
  });

  it('switches to French', () => {
    setLang('fr');
    expect(t('login')).toBe('Se connecter');
  });

  it('falls back to key for missing string', () => {
    // @ts-expect-error testing fallback
    expect(t('nonexistent_key')).toBe('nonexistent_key');
  });
});
