# 🎯 Stake Log — React Native App

A production-ready betting tracker built with Expo + React Native.

---

## 🚀 Setup Instructions

### 1. Prerequisites
```bash
node -v        # 18+
npm -v         # 9+
npx expo --version  # Install if missing: npm i -g expo-cli
```

### 2. Create Expo project & copy files
```bash
npx create-expo-app StakeLog --template blank
cd StakeLog
```

Copy all provided files into the project maintaining the folder structure:
```
StakeLog/
├── App.js
├── app.json
├── babel.config.js
├── package.json
├── components/
│   ├── AddBetModal.js
│   ├── BetCard.js
│   ├── Chart.js
│   ├── Heatmap.js
│   ├── InputField.js
│   └── StatsCard.js
├── screens/
│   ├── HomeScreen.js
│   ├── BetsScreen.js
│   ├── StatsScreen.js
│   ├── BankrollScreen.js
│   └── SettingsScreen.js
├── hooks/
│   ├── useBets.js
│   └── useTheme.js
└── utils/
    ├── calculations.js
    ├── storage.js
    └── theme.js
```

### 3. Install dependencies
```bash
npm install

# Core
npx expo install expo-blur expo-haptics expo-linear-gradient expo-status-bar

# Storage
npx expo install @react-native-async-storage/async-storage

# Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack

# Navigation peers
npx expo install react-native-screens react-native-safe-area-context

# Gestures & Animations
npx expo install react-native-gesture-handler react-native-reanimated

# SVG Charts
npx expo install react-native-svg

# Icons
npx expo install @expo/vector-icons
```

### 4. Configure babel.config.js
Make sure it includes the reanimated plugin (already done in provided file):
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

### 5. Add placeholder icon (required by Expo)
```bash
# Create a simple placeholder - or use your own 1024x1024 PNG
cp node_modules/expo/AppEntry.js assets/icon.png  # just a placeholder
```
Or create `assets/` folder and add any PNG named `icon.png`.

### 6. Run the app
```bash
# Start dev server
npx expo start

# Scan QR with Expo Go app on your phone
# OR run on simulator:
npx expo start --ios      # Mac only
npx expo start --android  # Android emulator
```

---

## 📱 Features

| Feature | Status |
|---------|--------|
| Add/Edit/Delete bets | ✅ |
| Swipe right → Won | ✅ |
| Swipe left → Delete | ✅ |
| Step-based bet form | ✅ |
| Smart Insights | ✅ |
| P&L Chart (interactive) | ✅ |
| Monthly Heatmap | ✅ |
| Odds breakdown | ✅ |
| Tag analytics | ✅ |
| Achievements/Badges | ✅ |
| Bankroll tracker | ✅ |
| Suggested stake (2% rule) | ✅ |
| Bulk actions | ✅ |
| Undo last action | ✅ |
| Bet slip share | ✅ |
| Templates | ✅ |
| Search & filters | ✅ |
| Sort options | ✅ |
| PIN lock | ✅ |
| Hidden mode | ✅ |
| Multi-currency | ✅ |
| Light / Dark / AMOLED | ✅ |
| Auto theme (system) | ✅ |
| CSV / JSON export | ✅ |
| AsyncStorage persistence | ✅ |
| Haptic feedback | ✅ |
| Smooth animations | ✅ |
| Onboarding | ✅ |

---

## 🏗️ Architecture

```
hooks/
  useBets.js      → All bet CRUD, computed stats, persistence
  useTheme.js     → Theme context (light/dark/amoled/auto)

utils/
  calculations.js → Pure functions: calcPnL, formatMoney, stats
  storage.js      → AsyncStorage wrapper
  theme.js        → Color tokens, spacing, typography, shadows

components/
  BetCard.js      → Swipeable card with animations
  AddBetModal.js  → Step-based bottom sheet form
  Chart.js        → Interactive SVG line chart with tooltip
  Heatmap.js      → Monthly P&L calendar
  InputField.js   → M3-style labeled input
  StatsCard.js    → Animated stat tile

screens/
  HomeScreen.js   → Hero P&L dashboard + insights
  BetsScreen.js   → Filterable bet list + FAB
  StatsScreen.js  → Analytics with 6 sub-tabs
  BankrollScreen.js → Balance tracking + risk management
  SettingsScreen.js → Preferences, export, security
```

---

## 🎨 Design System

- **8pt grid** spacing system
- **Rounded cards** (20–24px radius)
- **Red brand** (`#E50914`) — Netflix-style
- **Green profit** / **Red loss** semantic colors
- **Haptic feedback** on all key actions
- **Spring animations** via Reanimated 3
- **Gesture handler** for swipe interactions

---

## 📦 Full Dependencies List

```json
{
  "expo": "~51.0.0",
  "expo-blur": "~13.0.2",
  "expo-haptics": "~13.0.1",
  "expo-linear-gradient": "~13.0.2",
  "expo-status-bar": "~1.12.1",
  "@react-native-async-storage/async-storage": "1.23.1",
  "@react-navigation/native": "^6.1.18",
  "@react-navigation/bottom-tabs": "^6.6.1",
  "@react-navigation/native-stack": "^6.11.0",
  "@expo/vector-icons": "^14.0.2",
  "react": "18.2.0",
  "react-native": "0.74.5",
  "react-native-gesture-handler": "~2.16.1",
  "react-native-reanimated": "~3.10.1",
  "react-native-safe-area-context": "4.10.5",
  "react-native-screens": "3.31.1",
  "react-native-svg": "15.2.0"
}
```

---

## ⚠️ Common Issues

**"Reanimated plugin not found"**
→ Make sure `babel.config.js` has `'react-native-reanimated/plugin'` as last plugin.
→ Clear cache: `npx expo start --clear`

**"GestureHandlerRootView missing"**
→ `App.js` already wraps everything in `<GestureHandlerRootView>`.

**Charts not rendering**
→ `react-native-svg` must be installed via `npx expo install`, not `npm install`.

**AsyncStorage warnings**
→ These are normal on Expo Go. Will be silent in production builds.
