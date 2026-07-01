import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

export default function MatchSplashBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="matchBgBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8E0E38" />
          <Stop offset="35%" stopColor="#D01848" />
          <Stop offset="70%" stopColor="#FF3058" />
          <Stop offset="100%" stopColor="#FF5878" />
        </LinearGradient>
        <RadialGradient id="matchBgBurst" cx="50%" cy="38%" rx="85%" ry="55%">
          <Stop offset="0%" stopColor="#FFD040" stopOpacity="0.78" />
          <Stop offset="25%" stopColor="#FF7838" stopOpacity="0.65" />
          <Stop offset="50%" stopColor="#FF2868" stopOpacity="0.52" />
          <Stop offset="100%" stopColor="#E81848" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="matchBgTop" cx="50%" cy="0%" rx="120%" ry="45%">
          <Stop offset="0%" stopColor="#FF4878" stopOpacity="0.48" />
          <Stop offset="100%" stopColor="#FF4878" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="matchBgBottom" x1="50%" y1="100%" x2="50%" y2="55%">
          <Stop offset="0%" stopColor="#480818" stopOpacity="0.55" />
          <Stop offset="100%" stopColor="#480818" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      <Rect width={width} height={height} fill="url(#matchBgBase)" />
      <Rect width={width} height={height} fill="url(#matchBgBurst)" />
      <Rect width={width} height={height} fill="url(#matchBgTop)" />
      <Rect width={width} height={height} fill="url(#matchBgBottom)" />
    </Svg>
  );
}
