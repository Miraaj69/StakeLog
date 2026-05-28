// Toast.js — M3 Expressive snackbar · Tonal surface · Spring enter/exit
import React, { createContext, useContext, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated as RNAnimated,
  Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ToastContext = createContext(null);

const CFG = {
  success: { bg: '#00BF6F', border: 'rgba(0,191,111,0.4)', text: '#fff', icon: '✓' },
  error:   { bg: '#FF4444', border: 'rgba(255,68,68,0.4)',  text: '#fff', icon: '✕' },
  info:    { bg: '#5B8DEF', border: 'rgba(91,141,239,0.4)', text: '#fff', icon: 'ℹ' },
  warning: { bg: '#FFB347', border: 'rgba(255,179,71,0.4)', text: '#fff', icon: '⚠' },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const anim   = useRef(new RNAnimated.Value(0)).current;
  const timer  = useRef(null);
  const insets = useSafeAreaInsets();

  const show = (message, type = 'info', duration = 2800) => {
    clearTimeout(timer.current);
    setToast({ message, type });

    RNAnimated.spring(anim, {
      toValue:  1,
      damping:  22,
      stiffness: 320,
      useNativeDriver: true,
    }).start();

    timer.current = setTimeout(() => {
      RNAnimated.timing(anim, {
        toValue:  0,
        duration: 240,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, duration);
  };

  const dismiss = () => {
    clearTimeout(timer.current);
    RNAnimated.timing(anim, {
      toValue: 0, duration: 200, useNativeDriver: true,
    }).start(() => setToast(null));
  };

  const translateY = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [80, 0],
  });
  const opacity = anim.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [0, 1,   1],
  });

  const cfg = toast ? (CFG[toast.type] || CFG.info) : CFG.info;

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {toast && (
        <RNAnimated.View style={[
          ts.wrap,
          {
            bottom:          insets.bottom + 100,
            backgroundColor: cfg.bg,
            borderColor:     cfg.border,
            transform:       [{ translateY }],
            opacity,
          },
        ]}>
          <Pressable onPress={dismiss} style={ts.inner}>
            <View style={ts.iconWrap}>
              <Text style={[ts.icon, { color: cfg.text }]}>{cfg.icon}</Text>
            </View>
            <Text style={[ts.msg, { color: cfg.text }]} numberOfLines={2}>
              {toast.message}
            </Text>
            <Text style={[ts.dismiss, { color: cfg.text }]}>✕</Text>
          </Pressable>
        </RNAnimated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const ts = StyleSheet.create({
  wrap:  { position: 'absolute', left: 16, right: 16,
           borderRadius: 20, borderWidth: 1,
           shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
           shadowOpacity: 0.2, shadowRadius: 14, elevation: 10,
           zIndex: 9999 },
  inner: { flexDirection: 'row', alignItems: 'center',
           padding: 14, gap: 10 },
  iconWrap: { width: 30, height: 30, borderRadius: 15,
              backgroundColor: 'rgba(255,255,255,0.22)',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:    { fontSize: 14, fontWeight: '900' },
  msg:     { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  dismiss: { fontSize: 16, opacity: 0.7, fontWeight: '300' },
});
