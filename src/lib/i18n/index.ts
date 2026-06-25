// src/lib/i18n/index.ts
import { writable, get } from 'svelte/store';
import { en, type I18nKeys } from './en';
import { fr } from './fr';
import type { Lang } from '$lib/types';

const strings = { en, fr };

export const lang = writable<Lang>('en');

export function t(key: I18nKeys, l?: Lang): string {
  return strings[l ?? get(lang)][key] ?? key;
}

export function setLang(l: Lang) {
  lang.set(l);
}
