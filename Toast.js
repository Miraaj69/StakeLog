// Toast.js — Premium snackbar, replaces native Alert for non-critical messages
import React, { createContext, useContext, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated as RNAnimated,
  Pressable, Platform,
} from 'react-native';

var ToastContext = createContext(null);

var ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
var COLORS = {
  success: { bg: '#1A9E4A', text: '#fff' },
  error:   { bg: '#D93025', text: '#fff' },
  info:    { bg: '#0284C7', text: '#fff' },
  warning: { bg: '#E07B00', text: '#fff' },
};

export function ToastProvider({ children }) {
  var [toast, setToast] = useState(null);
  var anim = useRef(new RNAnimated.Value(0)).current;
  var timer = useRef(null);

  function show(message, type, duration) {
    if (!type) type = 'success';
    if (!duration) duration = 2800;
    if (timer.current) clearTimeout(timer.current);
    setToast({ message: message, type: type });
    RNAnimated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 250 }).start();
    timer.current = setTimeout(function() {
      RNAnimated.timing(anim, { toValue: 0, duration: 240, useNativeDriver: true }).start(function() {
        setToast(null);
      });
    }, duration);
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current);
    RNAnimated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(function() {
      setToast(null);
    });
  }

  var translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] });
  var opacity    = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  var scale      = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <ToastContext.Provider value={{ show: show, hide: hide }}>
      {children}
      {toast && (
        <RNAnimated.View
          style={[
            st.wrap,
            { transform: [{ translateY: translateY }, { scale: scale }], opacity: opacity },
          ]}
          pointerEvents="box-none"
        >
          <Pressable onPress={hide}>
            <View style={[st.card, { backgroundColor: COLORS[toast.type].bg }]}>
              <View style={st.iconWrap}>
                <Text style={st.icon}>{ICONS[toast.type]}</Text>
              </View>
              <Text style={[st.msg, { color: COLORS[toast.type].text }]} numberOfLines={2}>
                {toast.message}
              </Text>
            </View>
          </Pressable>
        </RNAnimated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  var ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

var st = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 100,
    left: 16, right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
    width: '100%',
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 14, color: '#fff', fontWeight: '900' },
  msg:  { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
