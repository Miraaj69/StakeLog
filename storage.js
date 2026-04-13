// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  BETS: 'sl_bets_v1',
  BOOKIES: 'sl_bookies',
  SPORTS: 'sl_sports',
  BANKROLL: 'sl_bankroll',
  PIN: 'sl_pin',
  PIN_ENABLED: 'sl_pin_enabled',
  CURRENCY: 'sl_currency',
  THEME: 'sl_theme',
  ONBOARDED: 'sl_onboarded',
  TEMPLATES: 'sl_templates',
  FONT_SIZE: 'sl_fontsize',
  HIDDEN_MODE: 'sl_hidden',
};

export async function getItem(key, defaultValue = null) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

export async function setItem(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

export async function removeItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export async function loadAllData() {
  const [bets, bookies, sports, bankroll, pin, pinEnabled, currency, theme, onboarded, templates] = await Promise.all([
    getItem(KEYS.BETS, []),
    getItem(KEYS.BOOKIES, null),
    getItem(KEYS.SPORTS, null),
    getItem(KEYS.BANKROLL, 0),
    getItem(KEYS.PIN, ''),
    getItem(KEYS.PIN_ENABLED, false),
    getItem(KEYS.CURRENCY, 'INR'),
    getItem(KEYS.THEME, 'light'),
    getItem(KEYS.ONBOARDED, false),
    getItem(KEYS.TEMPLATES, []),
  ]);
  return { bets, bookies, sports, bankroll, pin, pinEnabled, currency, theme, onboarded, templates };
}

export { KEYS };
