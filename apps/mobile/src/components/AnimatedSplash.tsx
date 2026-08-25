import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../lib/ThemeContext';

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
}

export function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  const { isDark: dark } = useTheme();
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const globeRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Phase 1: Fade in + scale up the logo
    const fadeIn = Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    // Phase 2: Rotate globe + fade in text
    const phase2 = Animated.parallel([
      Animated.timing(globeRotate, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]);

    // Phase 3: Hold briefly, then complete
    const hold = Animated.delay(400);

    const sequence = Animated.sequence([fadeIn, phase2, hold]);

    sequence.start(() => {
      setReady(true);
      onAnimationComplete();
    });
  }, []);

  const bg = dark ? '#0f172a' : '#f9fafb';
  const globeRotation = globeRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Globe */}
        <Animated.View
          style={{
            transform: [{ rotate: globeRotation }],
          }}
        >
          <View style={styles.globeOuter}>
            <View style={[styles.globeVertical, styles.globeVert1]} />
            <View style={[styles.globeVertical, styles.globeVert2]} />
            <View style={[styles.globeHorizontal, styles.globeHoriz1]} />
          </View>
        </Animated.View>

        {/* Connection dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, { top: 0, left: '25%' }]} />
          <View style={[styles.dot, { top: 0, right: '25%' }]} />
          <View style={[styles.dot, { top: -4, left: '50%' }]} />
          <View style={[styles.dot, { top: '45%', left: '10%' }]} />
          <View style={[styles.dot, { top: '45%', right: '10%' }]} />
        </View>

        {/* "E" text */}
        <Animated.Text
          style={[
            styles.letterE,
            {
              opacity: textOpacity,
              color: dark ? '#f1f5f9' : '#111827',
            },
          ]}
        >
          E
        </Animated.Text>
      </Animated.View>

      {/* App name */}
      <Animated.Text
        style={[
          styles.appName,
          {
            opacity: textOpacity,
            color: dark ? '#94a3b8' : '#6b7280',
          },
        ]}
      >
        Enlace
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  globeOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  globeVertical: {
    position: 'absolute',
    width: 50,
    height: 120,
    borderWidth: 2.5,
    borderColor: '#7c3aed',
    borderRadius: 25,
  },
  globeVert1: {
    left: 35,
    top: 0,
  },
  globeVert2: {
    left: 25,
    top: 0,
    width: 70,
    height: 120,
    borderRadius: 35,
  },
  globeHorizontal: {
    position: 'absolute',
    height: 24,
    width: 120,
    borderWidth: 2.5,
    borderColor: '#7c3aed',
    borderRadius: 12,
  },
  globeHoriz1: {
    top: 48,
    left: 0,
  },
  dotsContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    top: -20,
    left: -20,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a78bfa',
  },
  letterE: {
    fontSize: 64,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: 2,
  },
  appName: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
  },
});
