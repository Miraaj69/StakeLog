// storage.js — versioned keys
import AsyncStorage from '@react-native-async-storage/async-storage';

const V = 'v1'; // bump this on breaking schema changes

export var KEYS = {
  // Versioned — bump V to migrate cleanly
  BETS:        'sl_bets_'      + V,
  BOOKIES:     'sl_bookies_'   + V,
  SPORTS:      'sl_sports_'    + V,
  TEMPLATES:   'sl_templates_' + V,
  // Not versioned — user prefs that survive updates
  BANKROLL:    'sl_bankroll',
  PIN:         'sl_pin',
  PIN_ENABLED: 'sl_pin_enabled',
  CURRENCY:    'sl_currency',
  THEME:       'sl_theme',
  ONBOARDED:   'sl_onboarded',
  HIDDEN_MODE: 'sl_hidden',
  APP_VERSION: 'sl_app_version',
};

export async function getItem(key, defaultValue) {
  if (defaultValue === undefined) defaultValue = null;
  try {
    var value = await AsyncStorage.getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value);
  } catch(e) {
    return defaultValue;
  }
}

export async function setItem(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch(e) {
    console.warn('Storage error:', e);
  }
}

export async function removeItem(key) {
  try { await AsyncStorage.removeItem(key); } catch(e) {}
}

// Run once on app start — handles future migrations
export async function migrateIfNeeded() {
  try {
    var stored = await getItem(KEYS.APP_VERSION, null);
    if (stored === V) return; // already current
    // Future: add migration logic here when V bumps to v2
    // e.g. rename old keys, transform data structure
    await setItem(KEYS.APP_VERSION, V);
  } catch(e) {}
}
