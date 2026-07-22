/**
 * CartoonAvatars.tsx
 * 24 hand-crafted animated SVG cartoon avatars, zero external dependencies.
 * Each floats gently and blinks on an idle loop.
 *
 * Usage:
 *   <CartoonAvatar id="cartoon:3" size={80} />
 *   <AvatarDisplay profilePicture={user.profilePicture} size={80} initials="JD" />
 */

import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import Svg, {
  Circle, Ellipse, Rect, Path, G, Defs,
  LinearGradient as SvgGrad, Stop, ClipPath, Polygon, Line,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// ── Avatar section data (IDs, no external URLs) ───────────────────────────────
export const AVATAR_SECTIONS = [
  {
    label: '🧑 Students',
    avatars: ['cartoon:1', 'cartoon:2', 'cartoon:3', 'cartoon:4', 'cartoon:5', 'cartoon:6'],
  },
  {
    label: '🤖 Tech & Robots',
    avatars: ['cartoon:7', 'cartoon:8', 'cartoon:9', 'cartoon:10', 'cartoon:11', 'cartoon:12'],
  },
  {
    label: '🎨 Creative',
    avatars: ['cartoon:13', 'cartoon:14', 'cartoon:15', 'cartoon:16', 'cartoon:17', 'cartoon:18'],
  },
  {
    label: '🐾 Animals',
    avatars: ['cartoon:19', 'cartoon:20', 'cartoon:21', 'cartoon:22', 'cartoon:23', 'cartoon:24'],
  },
];

// ── Avatar label map ──────────────────────────────────────────────────────────
export const AVATAR_LABELS: Record<string, string> = {
  'cartoon:1': 'Alex', 'cartoon:2': 'Jordan', 'cartoon:3': 'Casey',
  'cartoon:4': 'Riley', 'cartoon:5': 'Morgan', 'cartoon:6': 'Avery',
  'cartoon:7': 'Bot-X', 'cartoon:8': 'Grn-3', 'cartoon:9': 'Nova',
  'cartoon:10': 'Orb', 'cartoon:11': 'Retro', 'cartoon:12': 'Teal-1',
  'cartoon:13': 'Artie', 'cartoon:14': 'Beats', 'cartoon:15': 'Prof',
  'cartoon:16': 'Cosmo', 'cartoon:17': 'Wiz', 'cartoon:18': 'Scout',
  'cartoon:19': 'Foxy', 'cartoon:20': 'Whisker', 'cartoon:21': 'Pip',
  'cartoon:22': 'Blaze', 'cartoon:23': 'Hoot', 'cartoon:24': 'Bun',
};

// ── SVG Avatar Components ─────────────────────────────────────────────────────

// 1 – Alex: glasses, wavy brown hair, light skin, blue
function A1() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a1bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#60a5fa" /><Stop offset="1" stopColor="#2563eb" />
        </SvgGrad>
        <SvgGrad id="a1skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fde68a" /><Stop offset="1" stopColor="#f9c07a" />
        </SvgGrad>
        <ClipPath id="a1clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a1bg)" />
      {/* Hair */}
      <Path d="M28 48 Q32 22 50 20 Q68 22 72 48 Q68 30 50 28 Q32 30 28 48Z" fill="#7c4f1e" />
      {/* Neck */}
      <Rect x="44" y="70" width="12" height="10" rx="4" fill="url(#a1skin)" clipPath="url(#a1clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="54" rx="22" ry="24" fill="url(#a1skin)" />
      {/* Glasses frames */}
      <Rect x="35" y="46" width="13" height="10" rx="3" fill="none" stroke="#1e293b" strokeWidth="2" />
      <Rect x="52" y="46" width="13" height="10" rx="3" fill="none" stroke="#1e293b" strokeWidth="2" />
      <Line x1="48" y1="51" x2="52" y2="51" stroke="#1e293b" strokeWidth="2" />
      <Line x1="35" y1="51" x2="31" y2="50" stroke="#1e293b" strokeWidth="2" />
      <Line x1="65" y1="51" x2="69" y2="50" stroke="#1e293b" strokeWidth="2" />
      {/* Eyes behind glass */}
      <Circle cx="41.5" cy="51" r="3" fill="#1e3a8a" />
      <Circle cx="58.5" cy="51" r="3" fill="#1e3a8a" />
      <Circle cx="42.5" cy="50" r="1" fill="white" />
      <Circle cx="59.5" cy="50" r="1" fill="white" />
      {/* Nose */}
      <Path d="M48 59 Q50 62 52 59" fill="none" stroke="#d4845a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M43 64 Q50 70 57 64" fill="none" stroke="#c0735a" strokeWidth="2" strokeLinecap="round" />
      {/* Cheeks */}
      <Circle cx="37" cy="60" r="5" fill="#f87171" opacity="0.3" />
      <Circle cx="63" cy="60" r="5" fill="#f87171" opacity="0.3" />
      {/* Shirt */}
      <Path d="M26 100 Q28 80 50 76 Q72 80 74 100Z" fill="#2563eb" clipPath="url(#a1clip)" />
      <Path d="M44 76 L50 82 L56 76" fill="none" stroke="white" strokeWidth="2" />
    </Svg>
  );
}

// 2 – Jordan: afro, dark skin, purple
function A2() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a2bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#a78bfa" /><Stop offset="1" stopColor="#7c3aed" />
        </SvgGrad>
        <ClipPath id="a2clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a2bg)" />
      {/* Afro */}
      <Ellipse cx="50" cy="38" rx="26" ry="24" fill="#1c0a00" />
      {/* Neck */}
      <Rect x="44" y="70" width="12" height="10" rx="4" fill="#8B4513" clipPath="url(#a2clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="55" rx="21" ry="22" fill="#8B4513" />
      {/* Eyes */}
      <Circle cx="43" cy="50" r="5" fill="white" />
      <Circle cx="57" cy="50" r="5" fill="white" />
      <Circle cx="44" cy="51" r="3" fill="#1a1a1a" />
      <Circle cx="58" cy="51" r="3" fill="#1a1a1a" />
      <Circle cx="45" cy="50" r="1" fill="white" />
      <Circle cx="59" cy="50" r="1" fill="white" />
      {/* Nose */}
      <Ellipse cx="50" cy="58" rx="3.5" ry="2.5" fill="#6b3210" />
      {/* Smile */}
      <Path d="M43 64 Q50 72 57 64" fill="none" stroke="#6b3210" strokeWidth="2" strokeLinecap="round" />
      {/* Teeth */}
      <Path d="M45 66 Q50 70 55 66 Q50 68 45 66Z" fill="white" />
      {/* Cheeks */}
      <Circle cx="37" cy="57" r="5" fill="#c0392b" opacity="0.25" />
      <Circle cx="63" cy="57" r="5" fill="#c0392b" opacity="0.25" />
      {/* Hoodie */}
      <Path d="M24 100 Q28 78 50 74 Q72 78 76 100Z" fill="#6d28d9" clipPath="url(#a2clip)" />
      <Path d="M44 74 L50 80 L56 74" fill="none" stroke="#c4b5fd" strokeWidth="2" />
      {/* Hoodie pocket */}
      <Rect x="41" y="88" width="18" height="10" rx="4" fill="#5b21b6" clipPath="url(#a2clip)" />
    </Svg>
  );
}

// 3 – Casey: long dark hair, medium skin, pink
function A3() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a3bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f9a8d4" /><Stop offset="1" stopColor="#ec4899" />
        </SvgGrad>
        <SvgGrad id="a3skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fddcb5" /><Stop offset="1" stopColor="#f5b887" />
        </SvgGrad>
        <ClipPath id="a3clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a3bg)" />
      {/* Long hair back */}
      <Path d="M28 40 Q26 80 30 100 L70 100 Q74 80 72 40 Q68 20 50 18 Q32 20 28 40Z" fill="#1a0a00" />
      {/* Neck */}
      <Rect x="44" y="70" width="12" height="12" rx="4" fill="url(#a3skin)" clipPath="url(#a3clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="52" rx="21" ry="23" fill="url(#a3skin)" />
      {/* Hair front */}
      <Path d="M29 40 Q30 26 50 22 Q70 26 71 40 Q66 28 50 26 Q34 28 29 40Z" fill="#1a0a00" />
      {/* Eyes */}
      <Ellipse cx="43" cy="48" rx="5" ry="4.5" fill="white" />
      <Ellipse cx="57" cy="48" rx="5" ry="4.5" fill="white" />
      <Circle cx="44" cy="49" r="3" fill="#1a3a1a" />
      <Circle cx="58" cy="49" r="3" fill="#1a3a1a" />
      <Circle cx="45" cy="48" r="1" fill="white" />
      <Circle cx="59" cy="48" r="1" fill="white" />
      {/* Lashes */}
      <Path d="M38 44 Q43 41 48 44" fill="none" stroke="#1a0a00" strokeWidth="1.5" />
      <Path d="M52 44 Q57 41 62 44" fill="none" stroke="#1a0a00" strokeWidth="1.5" />
      {/* Nose */}
      <Path d="M48 56 Q50 59 52 56" fill="none" stroke="#d4845a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Lips */}
      <Path d="M44 62 Q47 60 50 61 Q53 60 56 62 Q53 67 50 67 Q47 67 44 62Z" fill="#e91e63" />
      <Path d="M44 62 Q50 60 56 62" fill="none" stroke="#c2185b" strokeWidth="1" />
      {/* Cheeks */}
      <Ellipse cx="37" cy="57" rx="5" ry="4" fill="#f48fb1" opacity="0.4" />
      <Ellipse cx="63" cy="57" rx="5" ry="4" fill="#f48fb1" opacity="0.4" />
      {/* Top */}
      <Path d="M24 100 Q28 78 50 74 Q72 78 76 100Z" fill="#e91e63" clipPath="url(#a3clip)" />
      <Path d="M44 74 L50 80 L56 74" fill="none" stroke="white" strokeWidth="2" />
      {/* Earrings */}
      <Circle cx="29" cy="57" r="3" fill="#f9a8d4" stroke="#ec4899" strokeWidth="1" />
      <Circle cx="71" cy="57" r="3" fill="#f9a8d4" stroke="#ec4899" strokeWidth="1" />
    </Svg>
  );
}

// 4 – Riley: hair bun, olive skin, mint
function A4() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a4bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6ee7b7" /><Stop offset="1" stopColor="#10b981" />
        </SvgGrad>
        <SvgGrad id="a4skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d4a77a" /><Stop offset="1" stopColor="#b8834a" />
        </SvgGrad>
        <ClipPath id="a4clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a4bg)" />
      {/* Hair base */}
      <Path d="M29 47 Q30 24 50 22 Q70 24 71 47 Q67 30 50 28 Q33 30 29 47Z" fill="#4a2c0a" />
      {/* Hair bun */}
      <Circle cx="50" cy="20" r="12" fill="#4a2c0a" />
      <Circle cx="50" cy="20" r="9" fill="#5a3a12" />
      {/* Neck */}
      <Rect x="44" y="71" width="12" height="10" rx="4" fill="url(#a4skin)" clipPath="url(#a4clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="53" rx="22" ry="24" fill="url(#a4skin)" />
      {/* Eyes */}
      <Ellipse cx="43" cy="49" rx="5" ry="5" fill="white" />
      <Ellipse cx="57" cy="49" rx="5" ry="5" fill="white" />
      <Circle cx="44" cy="50" r="3.5" fill="#1a3a5c" />
      <Circle cx="58" cy="50" r="3.5" fill="#1a3a5c" />
      <Circle cx="45" cy="49" r="1.2" fill="white" />
      <Circle cx="59" cy="49" r="1.2" fill="white" />
      {/* Brows */}
      <Path d="M38 43 Q43 40 48 42" fill="none" stroke="#4a2c0a" strokeWidth="2" strokeLinecap="round" />
      <Path d="M52 42 Q57 40 62 43" fill="none" stroke="#4a2c0a" strokeWidth="2" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M48 57 Q50 61 52 57" fill="none" stroke="#9a6040" strokeWidth="1.5" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M43 63 Q50 70 57 63" fill="none" stroke="#9a6040" strokeWidth="2" strokeLinecap="round" />
      {/* Cheeks */}
      <Circle cx="37" cy="58" r="6" fill="#e07b54" opacity="0.3" />
      <Circle cx="63" cy="58" r="6" fill="#e07b54" opacity="0.3" />
      {/* Shirt */}
      <Path d="M24 100 Q28 78 50 74 Q72 78 76 100Z" fill="#10b981" clipPath="url(#a4clip)" />
      {/* Shirt detail */}
      <Circle cx="50" cy="84" r="3" fill="#6ee7b7" />
      <Circle cx="50" cy="92" r="3" fill="#6ee7b7" />
    </Svg>
  );
}

// 5 – Morgan: curly hair, dark skin, yellow
function A5() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a5bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fde68a" /><Stop offset="1" stopColor="#f59e0b" />
        </SvgGrad>
        <ClipPath id="a5clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a5bg)" />
      {/* Curly hair cloud */}
      <Circle cx="50" cy="32" r="20" fill="#0a0000" />
      <Circle cx="34" cy="38" r="12" fill="#0a0000" />
      <Circle cx="66" cy="38" r="12" fill="#0a0000" />
      <Circle cx="40" cy="28" r="10" fill="#0a0000" />
      <Circle cx="60" cy="28" r="10" fill="#0a0000" />
      {/* Neck */}
      <Rect x="44" y="72" width="12" height="10" rx="4" fill="#3d1c0a" clipPath="url(#a5clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="55" rx="22" ry="23" fill="#3d1c0a" />
      {/* Eyes */}
      <Circle cx="42" cy="51" r="5.5" fill="white" />
      <Circle cx="58" cy="51" r="5.5" fill="white" />
      <Circle cx="43" cy="52" r="3.5" fill="#0a0a0a" />
      <Circle cx="59" cy="52" r="3.5" fill="#0a0a0a" />
      <Circle cx="44" cy="51" r="1.2" fill="white" />
      <Circle cx="60" cy="51" r="1.2" fill="white" />
      {/* Nose */}
      <Ellipse cx="50" cy="59" rx="4" ry="2.5" fill="#2a0e00" />
      {/* Big smile */}
      <Path d="M41 65 Q50 75 59 65" fill="white" />
      <Path d="M41 65 Q50 75 59 65" fill="none" stroke="#2a0e00" strokeWidth="2" />
      {/* Cheeks */}
      <Circle cx="36" cy="58" r="6" fill="#f97316" opacity="0.3" />
      <Circle cx="64" cy="58" r="6" fill="#f97316" opacity="0.3" />
      {/* Yellow shirt */}
      <Path d="M24 100 Q28 78 50 74 Q72 78 76 100Z" fill="#d97706" clipPath="url(#a5clip)" />
      {/* Star on shirt */}
      <Polygon points="50,80 52,85 57,85 53,88 55,93 50,90 45,93 47,88 43,85 48,85" fill="#fde68a" clipPath="url(#a5clip)" />
    </Svg>
  );
}

// 6 – Avery: ponytail, tan skin, lavender
function A6() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a6bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#c4b5fd" /><Stop offset="1" stopColor="#8b5cf6" />
        </SvgGrad>
        <SvgGrad id="a6skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f5c99a" /><Stop offset="1" stopColor="#e8a570" />
        </SvgGrad>
        <ClipPath id="a6clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a6bg)" />
      {/* Hair */}
      <Path d="M28 47 Q30 20 50 18 Q70 20 72 47 Q68 28 50 26 Q32 28 28 47Z" fill="#b8600a" />
      {/* Ponytail */}
      <Path d="M70 36 Q82 40 78 60 Q74 55 72 47" fill="#b8600a" />
      <Ellipse cx="78" cy="48" rx="5" ry="14" fill="#b8600a" />
      {/* Hair tie */}
      <Circle cx="72" cy="40" r="4" fill="#a78bfa" />
      {/* Neck */}
      <Rect x="44" y="72" width="12" height="10" rx="4" fill="url(#a6skin)" clipPath="url(#a6clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="53" rx="22" ry="24" fill="url(#a6skin)" />
      {/* Eyes */}
      <Ellipse cx="43" cy="49" rx="5.5" ry="5" fill="white" />
      <Ellipse cx="57" cy="49" rx="5.5" ry="5" fill="white" />
      <Circle cx="44" cy="50" r="3" fill="#7c3aed" />
      <Circle cx="58" cy="50" r="3" fill="#7c3aed" />
      <Circle cx="45" cy="49" r="1" fill="white" />
      <Circle cx="59" cy="49" r="1" fill="white" />
      {/* Brows */}
      <Path d="M38 43 Q43 41 47 43" fill="none" stroke="#8b4513" strokeWidth="2" strokeLinecap="round" />
      <Path d="M53 43 Q57 41 62 43" fill="none" stroke="#8b4513" strokeWidth="2" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M48 57 Q50 60 52 57" fill="none" stroke="#c97a5a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M44 63 Q50 69 56 63" fill="none" stroke="#c97a5a" strokeWidth="2" strokeLinecap="round" />
      {/* Cheeks */}
      <Ellipse cx="37" cy="58" rx="5" ry="4" fill="#f472b6" opacity="0.3" />
      <Ellipse cx="63" cy="58" rx="5" ry="4" fill="#f472b6" opacity="0.3" />
      {/* Hoodie */}
      <Path d="M24 100 Q28 78 50 74 Q72 78 76 100Z" fill="#7c3aed" clipPath="url(#a6clip)" />
      <Path d="M44 74 L50 80 L56 74" fill="none" stroke="#c4b5fd" strokeWidth="2" />
    </Svg>
  );
}

// 7 – Bot-X: classic silver robot, blue eyes
function A7() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a7bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#bfdbfe" /><Stop offset="1" stopColor="#3b82f6" />
        </SvgGrad>
        <SvgGrad id="a7metal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e2e8f0" /><Stop offset="1" stopColor="#94a3b8" />
        </SvgGrad>
        <ClipPath id="a7clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a7bg)" />
      {/* Antenna */}
      <Rect x="48" y="12" width="4" height="18" rx="2" fill="url(#a7metal)" />
      <Circle cx="50" cy="10" r="6" fill="#60a5fa" />
      <Circle cx="50" cy="10" r="3" fill="white" opacity="0.8" />
      {/* Head */}
      <Rect x="26" y="28" width="48" height="44" rx="10" fill="url(#a7metal)" />
      {/* Face plate */}
      <Rect x="30" y="32" width="40" height="36" rx="8" fill="#f1f5f9" />
      {/* Eye screens */}
      <Rect x="35" y="38" width="12" height="10" rx="4" fill="#1e3a8a" />
      <Rect x="53" y="38" width="12" height="10" rx="4" fill="#1e3a8a" />
      {/* Eye glow */}
      <Rect x="37" y="40" width="8" height="6" rx="2" fill="#60a5fa" opacity="0.9" />
      <Rect x="55" y="40" width="8" height="6" rx="2" fill="#60a5fa" opacity="0.9" />
      <Circle cx="41" cy="43" r="2" fill="white" opacity="0.7" />
      <Circle cx="59" cy="43" r="2" fill="white" opacity="0.7" />
      {/* Nose dot */}
      <Circle cx="50" cy="55" r="2" fill="#64748b" />
      {/* Mouth panel */}
      <Rect x="37" y="59" width="26" height="6" rx="3" fill="#cbd5e1" />
      <Rect x="39" y="61" width="4" height="2" rx="1" fill="#3b82f6" />
      <Rect x="45" y="61" width="4" height="2" rx="1" fill="#3b82f6" />
      <Rect x="51" y="61" width="4" height="2" rx="1" fill="#3b82f6" />
      <Rect x="57" y="61" width="4" height="2" rx="1" fill="#3b82f6" />
      {/* Ears / bolts */}
      <Circle cx="26" cy="50" r="5" fill="url(#a7metal)" />
      <Circle cx="74" cy="50" r="5" fill="url(#a7metal)" />
      {/* Body */}
      <Rect x="32" y="72" width="36" height="30" rx="8" fill="url(#a7metal)" clipPath="url(#a7clip)" />
      <Rect x="36" y="76" width="28" height="8" rx="3" fill="#cbd5e1" clipPath="url(#a7clip)" />
      <Circle cx="50" cy="90" r="5" fill="#60a5fa" clipPath="url(#a7clip)" />
    </Svg>
  );
}

// 8 – Grn-3: square green robot, visor
function A8() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a8bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#bbf7d0" /><Stop offset="1" stopColor="#16a34a" />
        </SvgGrad>
        <SvgGrad id="a8body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4ade80" /><Stop offset="1" stopColor="#15803d" />
        </SvgGrad>
        <ClipPath id="a8clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a8bg)" />
      {/* Antenna */}
      <Rect x="47" y="10" width="6" height="20" rx="3" fill="#15803d" />
      <Rect x="42" y="8" width="16" height="6" rx="3" fill="#15803d" />
      {/* Head */}
      <Rect x="22" y="26" width="56" height="46" rx="6" fill="url(#a8body)" />
      {/* Visor */}
      <Rect x="26" y="34" width="48" height="20" rx="8" fill="#0a0a1a" />
      <Rect x="27" y="35" width="46" height="18" rx="7" fill="#0f172a" opacity="0.8" />
      {/* Visor glare */}
      <Path d="M28 36 Q40 34 54 36" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
      {/* Eyes behind visor */}
      <Circle cx="40" cy="44" r="6" fill="#22c55e" opacity="0.9" />
      <Circle cx="60" cy="44" r="6" fill="#22c55e" opacity="0.9" />
      <Circle cx="40" cy="44" r="3" fill="white" opacity="0.7" />
      <Circle cx="60" cy="44" r="3" fill="white" opacity="0.7" />
      {/* Mouth grid */}
      <Rect x="30" y="58" width="40" height="10" rx="4" fill="#166534" />
      <Rect x="32" y="60" width="6" height="6" rx="2" fill="#4ade80" />
      <Rect x="40" y="60" width="6" height="6" rx="2" fill="#4ade80" />
      <Rect x="48" y="60" width="6" height="6" rx="2" fill="#86efac" />
      <Rect x="56" y="60" width="6" height="6" rx="2" fill="#4ade80" />
      {/* Bolts */}
      <Circle cx="26" cy="34" r="3" fill="#166534" />
      <Circle cx="74" cy="34" r="3" fill="#166534" />
      <Circle cx="26" cy="64" r="3" fill="#166534" />
      <Circle cx="74" cy="64" r="3" fill="#166534" />
      {/* Body */}
      <Rect x="30" y="72" width="40" height="32" rx="6" fill="url(#a8body)" clipPath="url(#a8clip)" />
      <Rect x="35" y="76" width="30" height="6" rx="3" fill="#166534" clipPath="url(#a8clip)" />
      <Circle cx="43" cy="90" r="5" fill="#166534" clipPath="url(#a8clip)" />
      <Circle cx="57" cy="90" r="5" fill="#166534" clipPath="url(#a8clip)" />
    </Svg>
  );
}

// 9 – Nova: sleek purple robot, glowing pink eyes
function A9() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a9bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#e879f9" /><Stop offset="1" stopColor="#7e22ce" />
        </SvgGrad>
        <SvgGrad id="a9body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a855f7" /><Stop offset="1" stopColor="#581c87" />
        </SvgGrad>
        <ClipPath id="a9clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a9bg)" />
      {/* Antenna trio */}
      <Rect x="49" y="10" width="2" height="16" rx="1" fill="#c026d3" />
      <Circle cx="50" cy="9" r="4" fill="#f0abfc" />
      <Rect x="42" y="14" width="2" height="10" rx="1" fill="#c026d3" />
      <Circle cx="43" cy="13" r="3" fill="#f0abfc" />
      <Rect x="57" y="14" width="2" height="10" rx="1" fill="#c026d3" />
      <Circle cx="58" cy="13" r="3" fill="#f0abfc" />
      {/* Sleek oval head */}
      <Ellipse cx="50" cy="52" rx="26" ry="30" fill="url(#a9body)" />
      {/* Eye rings */}
      <Circle cx="40" cy="46" r="9" fill="#0a0010" />
      <Circle cx="60" cy="46" r="9" fill="#0a0010" />
      <Circle cx="40" cy="46" r="6" fill="#e879f9" opacity="0.8" />
      <Circle cx="60" cy="46" r="6" fill="#e879f9" opacity="0.8" />
      <Circle cx="40" cy="46" r="3" fill="white" opacity="0.9" />
      <Circle cx="60" cy="46" r="3" fill="white" opacity="0.9" />
      {/* Nose triangle */}
      <Polygon points="50,57 47,62 53,62" fill="#c026d3" />
      {/* Curved mouth */}
      <Path d="M39 68 Q50 76 61 68" fill="none" stroke="#f0abfc" strokeWidth="2.5" strokeLinecap="round" />
      {/* Side lights */}
      <Circle cx="24" cy="46" r="4" fill="#e879f9" opacity="0.6" />
      <Circle cx="76" cy="46" r="4" fill="#e879f9" opacity="0.6" />
      {/* Body */}
      <Rect x="32" y="76" width="36" height="28" rx="8" fill="url(#a9body)" clipPath="url(#a9clip)" />
      <Circle cx="50" cy="88" r="7" fill="#c026d3" clipPath="url(#a9clip)" />
      <Circle cx="50" cy="88" r="4" fill="#f0abfc" clipPath="url(#a9clip)" />
    </Svg>
  );
}

// 10 – Orb: chunky orange robot, big camera eyes
function A10() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a10bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fed7aa" /><Stop offset="1" stopColor="#ea580c" />
        </SvgGrad>
        <SvgGrad id="a10body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fb923c" /><Stop offset="1" stopColor="#c2410c" />
        </SvgGrad>
        <ClipPath id="a10clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a10bg)" />
      {/* Dish antenna */}
      <Path d="M42 14 Q50 8 58 14 Q54 18 50 18 Q46 18 42 14Z" fill="#c2410c" />
      <Rect x="48" y="14" width="4" height="12" rx="2" fill="#c2410c" />
      {/* Square chunky head */}
      <Rect x="18" y="24" width="64" height="52" rx="8" fill="url(#a10body)" />
      <Rect x="22" y="28" width="56" height="44" rx="6" fill="#fed7aa" opacity="0.15" />
      {/* Camera eyes */}
      <Circle cx="36" cy="46" r="12" fill="#1c0a00" />
      <Circle cx="64" cy="46" r="12" fill="#1c0a00" />
      <Circle cx="36" cy="46" r="9" fill="#292524" />
      <Circle cx="64" cy="46" r="9" fill="#292524" />
      <Circle cx="36" cy="46" r="6" fill="#fb923c" opacity="0.7" />
      <Circle cx="64" cy="46" r="6" fill="#fb923c" opacity="0.7" />
      <Circle cx="36" cy="46" r="3" fill="white" />
      <Circle cx="64" cy="46" r="3" fill="white" />
      {/* Camera lens ring */}
      <Circle cx="36" cy="46" r="11" fill="none" stroke="#7c2d12" strokeWidth="2" />
      <Circle cx="64" cy="46" r="11" fill="none" stroke="#7c2d12" strokeWidth="2" />
      {/* Mouth display */}
      <Rect x="30" y="60" width="40" height="12" rx="4" fill="#7c2d12" />
      <Rect x="32" y="62" width="36" height="8" rx="2" fill="#1c0a00" />
      <Path d="M34 70 L40 64 L46 70 L52 64 L58 70 L64 64 L66 70" fill="none" stroke="#fb923c" strokeWidth="1.5" />
      {/* Body */}
      <Rect x="26" y="76" width="48" height="28" rx="8" fill="url(#a10body)" clipPath="url(#a10clip)" />
      <Rect x="30" y="80" width="40" height="6" rx="3" fill="#7c2d12" clipPath="url(#a10clip)" />
      <Circle cx="40" cy="92" r="5" fill="#7c2d12" clipPath="url(#a10clip)" />
      <Circle cx="60" cy="92" r="5" fill="#7c2d12" clipPath="url(#a10clip)" />
    </Svg>
  );
}

// 11 – Retro: red retro robot, star eyes
function A11() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a11bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fca5a5" /><Stop offset="1" stopColor="#dc2626" />
        </SvgGrad>
        <SvgGrad id="a11body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ef4444" /><Stop offset="1" stopColor="#991b1b" />
        </SvgGrad>
        <ClipPath id="a11clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a11bg)" />
      {/* Spring antenna */}
      <Path d="M50 10 Q53 14 50 17 Q47 20 50 23 Q53 26 50 28" fill="none" stroke="#991b1b" strokeWidth="2.5" />
      <Circle cx="50" cy="9" r="4" fill="#fca5a5" />
      {/* Retro round head */}
      <Ellipse cx="50" cy="50" rx="28" ry="26" fill="url(#a11body)" />
      {/* Rivets */}
      <Circle cx="25" cy="42" r="3" fill="#991b1b" />
      <Circle cx="75" cy="42" r="3" fill="#991b1b" />
      <Circle cx="25" cy="58" r="3" fill="#991b1b" />
      <Circle cx="75" cy="58" r="3" fill="#991b1b" />
      {/* Star eyes */}
      <Polygon points="39,40 40.5,44 45,44 41.5,47 43,51 39,48 35,51 36.5,47 33,44 37.5,44" fill="#fde68a" />
      <Polygon points="61,40 62.5,44 67,44 63.5,47 65,51 61,48 57,51 58.5,47 55,44 59.5,44" fill="#fde68a" />
      {/* Nose dial */}
      <Circle cx="50" cy="56" r="4" fill="#991b1b" />
      <Circle cx="50" cy="56" r="2" fill="#fca5a5" />
      {/* Speaker mouth */}
      <Rect x="36" y="62" width="28" height="8" rx="3" fill="#7f1d1d" />
      <Circle cx="42" cy="66" r="2" fill="#991b1b" />
      <Circle cx="50" cy="66" r="2" fill="#ef4444" />
      <Circle cx="58" cy="66" r="2" fill="#991b1b" />
      {/* Body */}
      <Rect x="32" y="74" width="36" height="30" rx="6" fill="url(#a11body)" clipPath="url(#a11clip)" />
      <Rect x="36" y="78" width="28" height="8" rx="3" fill="#7f1d1d" clipPath="url(#a11clip)" />
      <Rect x="38" y="80" width="6" height="4" rx="1" fill="#fca5a5" clipPath="url(#a11clip)" />
      <Rect x="46" y="80" width="6" height="4" rx="1" fill="#ef4444" clipPath="url(#a11clip)" />
      <Rect x="54" y="80" width="6" height="4" rx="1" fill="#fca5a5" clipPath="url(#a11clip)" />
    </Svg>
  );
}

// 12 – Teal-1: futuristic teal robot, ring eyes
function A12() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a12bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#99f6e4" /><Stop offset="1" stopColor="#0d9488" />
        </SvgGrad>
        <SvgGrad id="a12body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2dd4bf" /><Stop offset="1" stopColor="#115e59" />
        </SvgGrad>
        <ClipPath id="a12clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a12bg)" />
      {/* T-shaped antenna */}
      <Rect x="48" y="8" width="4" height="20" rx="2" fill="#115e59" />
      <Rect x="38" y="8" width="24" height="5" rx="2.5" fill="#115e59" />
      <Circle cx="38" cy="10" r="4" fill="#99f6e4" />
      <Circle cx="62" cy="10" r="4" fill="#99f6e4" />
      {/* Diamond head shape */}
      <Path d="M50 22 L76 48 L50 78 L24 48 Z" fill="url(#a12body)" />
      {/* Ring eyes */}
      <Circle cx="40" cy="46" r="9" fill="none" stroke="#99f6e4" strokeWidth="3" />
      <Circle cx="60" cy="46" r="9" fill="none" stroke="#99f6e4" strokeWidth="3" />
      <Circle cx="40" cy="46" r="5" fill="#0d9488" />
      <Circle cx="60" cy="46" r="5" fill="#0d9488" />
      <Circle cx="40" cy="46" r="3" fill="#99f6e4" />
      <Circle cx="60" cy="46" r="3" fill="#99f6e4" />
      <Circle cx="41" cy="45" r="1" fill="white" />
      <Circle cx="61" cy="45" r="1" fill="white" />
      {/* Zigzag mouth */}
      <Path d="M36 60 L41 56 L46 60 L50 57 L54 60 L59 56 L64 60" fill="none" stroke="#99f6e4" strokeWidth="2" strokeLinecap="round" />
      {/* Body */}
      <Rect x="34" y="78" width="32" height="26" rx="6" fill="url(#a12body)" clipPath="url(#a12clip)" />
      <Circle cx="50" cy="88" r="7" fill="#0d9488" clipPath="url(#a12clip)" />
      <Circle cx="50" cy="88" r="4" fill="#99f6e4" clipPath="url(#a12clip)" />
      <Rect x="36" y="96" width="28" height="6" rx="3" fill="#0d9488" clipPath="url(#a12clip)" />
    </Svg>
  );
}

// 13 – Artie: artist with beret
function A13() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a13bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fde68a" /><Stop offset="1" stopColor="#d97706" />
        </SvgGrad>
        <SvgGrad id="a13skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fdd8b0" /><Stop offset="1" stopColor="#f5a868" />
        </SvgGrad>
        <ClipPath id="a13clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a13bg)" />
      {/* Beret */}
      <Ellipse cx="48" cy="32" rx="24" ry="16" fill="#dc2626" />
      <Ellipse cx="50" cy="38" rx="20" ry="7" fill="#b91c1c" />
      <Circle cx="62" cy="28" r="4" fill="#dc2626" />
      {/* Neck */}
      <Rect x="44" y="70" width="12" height="10" rx="4" fill="url(#a13skin)" clipPath="url(#a13clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="54" rx="22" ry="22" fill="url(#a13skin)" />
      {/* Eyes */}
      <Ellipse cx="43" cy="50" rx="5" ry="5.5" fill="white" />
      <Ellipse cx="57" cy="50" rx="5" ry="5.5" fill="white" />
      <Circle cx="44" cy="51" r="3.5" fill="#92400e" />
      <Circle cx="58" cy="51" r="3.5" fill="#92400e" />
      <Circle cx="45" cy="50" r="1.2" fill="white" />
      <Circle cx="59" cy="50" r="1.2" fill="white" />
      {/* Paint smudge on cheek */}
      <Ellipse cx="64" cy="58" rx="5" ry="3" fill="#3b82f6" opacity="0.5" transform="rotate(-20 64 58)" />
      <Ellipse cx="36" cy="60" rx="3" ry="2" fill="#ec4899" opacity="0.5" transform="rotate(15 36 60)" />
      {/* Nose */}
      <Path d="M48 58 Q50 61 52 58" fill="none" stroke="#b87a4a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M43 64 Q50 70 57 64" fill="none" stroke="#b87a4a" strokeWidth="2" strokeLinecap="round" />
      {/* Paintbrush in hand (visible at edge) */}
      <Rect x="70" y="55" width="18" height="3" rx="1.5" fill="#7c3a00" clipPath="url(#a13clip)" />
      <Rect x="82" y="52" width="6" height="9" rx="2" fill="#fbbf24" clipPath="url(#a13clip)" />
      {/* Smock/shirt */}
      <Path d="M24 100 Q28 78 50 74 Q72 78 76 100Z" fill="#dc2626" clipPath="url(#a13clip)" />
      {/* Paint palette dots on shirt */}
      <Circle cx="42" cy="84" r="3" fill="#3b82f6" clipPath="url(#a13clip)" />
      <Circle cx="50" cy="82" r="3" fill="#fde68a" clipPath="url(#a13clip)" />
      <Circle cx="58" cy="84" r="3" fill="#4ade80" clipPath="url(#a13clip)" />
    </Svg>
  );
}

// 14 – Beats: musician with headphones
function A14() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a14bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#818cf8" /><Stop offset="1" stopColor="#1e1b4b" />
        </SvgGrad>
        <SvgGrad id="a14skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#c17a4a" /><Stop offset="1" stopColor="#8b4513" />
        </SvgGrad>
        <ClipPath id="a14clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a14bg)" />
      {/* Headphone band */}
      <Path d="M24 50 Q24 24 50 22 Q76 24 76 50" fill="none" stroke="#1e1b4b" strokeWidth="8" strokeLinecap="round" />
      {/* Headphone cups */}
      <Rect x="18" y="46" width="14" height="20" rx="7" fill="#4338ca" />
      <Rect x="21" y="49" width="8" height="14" rx="4" fill="#818cf8" />
      <Rect x="68" y="46" width="14" height="20" rx="7" fill="#4338ca" />
      <Rect x="71" y="49" width="8" height="14" rx="4" fill="#818cf8" />
      {/* Neck */}
      <Rect x="44" y="70" width="12" height="10" rx="4" fill="url(#a14skin)" clipPath="url(#a14clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="52" rx="22" ry="23" fill="url(#a14skin)" />
      {/* Hair */}
      <Path d="M28 46 Q30 26 50 24 Q70 26 72 46 Q66 32 50 30 Q34 32 28 46Z" fill="#1a0a00" />
      {/* Eyes */}
      <Circle cx="42" cy="49" r="5" fill="white" />
      <Circle cx="58" cy="49" r="5" fill="white" />
      <Circle cx="43" cy="50" r="3" fill="#1a1a1a" />
      <Circle cx="59" cy="50" r="3" fill="#1a1a1a" />
      <Circle cx="44" cy="49" r="1" fill="white" />
      <Circle cx="60" cy="49" r="1" fill="white" />
      {/* Nose */}
      <Ellipse cx="50" cy="57" rx="3.5" ry="2" fill="#6b3210" />
      {/* Cool smile */}
      <Path d="M43 62 Q46 65 50 64 Q54 65 57 62" fill="none" stroke="#6b3210" strokeWidth="2" strokeLinecap="round" />
      {/* Music notes */}
      <Path d="M30 35 L30 28 L36 26 L36 33" fill="none" stroke="#818cf8" strokeWidth="1.5" />
      <Circle cx="29" cy="35" r="2.5" fill="#818cf8" />
      <Circle cx="35" cy="33" r="2.5" fill="#818cf8" />
      {/* Shirt */}
      <Path d="M24 100 Q28 78 50 74 Q72 78 76 100Z" fill="#4338ca" clipPath="url(#a14clip)" />
    </Svg>
  );
}

// 15 – Prof: scientist with round goggles
function A15() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a15bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d1fae5" /><Stop offset="1" stopColor="#059669" />
        </SvgGrad>
        <SvgGrad id="a15skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fde8c8" /><Stop offset="1" stopColor="#f0b880" />
        </SvgGrad>
        <ClipPath id="a15clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a15bg)" />
      {/* Hair wild scientist */}
      <Path d="M26 46 Q22 30 30 20 Q40 10 50 12 Q60 10 70 20 Q78 30 74 46 Q68 26 50 24 Q32 26 26 46Z" fill="#e2e8f0" />
      <Path d="M22 44 Q18 35 22 28" stroke="#e2e8f0" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Path d="M78 44 Q82 35 78 28" stroke="#e2e8f0" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <Rect x="44" y="70" width="12" height="10" rx="4" fill="url(#a15skin)" clipPath="url(#a15clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="53" rx="22" ry="22" fill="url(#a15skin)" />
      {/* Goggles */}
      <Circle cx="41" cy="49" r="10" fill="#0a0a0a" />
      <Circle cx="59" cy="49" r="10" fill="#0a0a0a" />
      <Circle cx="41" cy="49" r="8" fill="#065f46" />
      <Circle cx="59" cy="49" r="8" fill="#065f46" />
      <Circle cx="41" cy="49" r="5" fill="#34d399" opacity="0.8" />
      <Circle cx="59" cy="49" r="5" fill="#34d399" opacity="0.8" />
      <Circle cx="42" cy="48" r="2" fill="white" opacity="0.6" />
      <Circle cx="60" cy="48" r="2" fill="white" opacity="0.6" />
      {/* Goggle strap */}
      <Rect x="51" y="47" width="8" height="4" rx="2" fill="#0a0a0a" />
      <Path d="M24 49 L31 49" stroke="#0a0a0a" strokeWidth="4" strokeLinecap="round" />
      <Path d="M69 49 L76 49" stroke="#0a0a0a" strokeWidth="4" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M48 58 Q50 62 52 58" fill="none" stroke="#b87a4a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M43 65 Q50 71 57 65" fill="none" stroke="#b87a4a" strokeWidth="2" strokeLinecap="round" />
      {/* Lab coat */}
      <Path d="M24 100 Q28 78 50 74 Q72 78 76 100Z" fill="white" clipPath="url(#a15clip)" />
      <Path d="M44 74 L50 80 L56 74" fill="none" stroke="#e2e8f0" strokeWidth="2" />
      {/* Pocket + pen */}
      <Rect x="42" y="82" width="10" height="8" rx="2" fill="#e2e8f0" clipPath="url(#a15clip)" />
      <Rect x="44" y="78" width="2" height="8" rx="1" fill="#059669" clipPath="url(#a15clip)" />
      <Rect x="47" y="78" width="2" height="8" rx="1" fill="#3b82f6" clipPath="url(#a15clip)" />
    </Svg>
  );
}

// 16 – Cosmo: astronaut with helmet
function A16() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a16bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1e3a8a" /><Stop offset="1" stopColor="#0a0a2e" />
        </SvgGrad>
        <SvgGrad id="a16helm" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e2e8f0" /><Stop offset="1" stopColor="#94a3b8" />
        </SvgGrad>
        <ClipPath id="a16clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a16bg)" />
      {/* Stars */}
      <Circle cx="20" cy="20" r="1.5" fill="white" opacity="0.8" />
      <Circle cx="75" cy="15" r="1" fill="white" opacity="0.6" />
      <Circle cx="85" cy="35" r="1.5" fill="white" opacity="0.8" />
      <Circle cx="15" cy="65" r="1" fill="white" opacity="0.6" />
      <Circle cx="80" cy="70" r="2" fill="white" opacity="0.8" />
      {/* Spacesuit body */}
      <Ellipse cx="50" cy="80" rx="28" ry="22" fill="url(#a16helm)" clipPath="url(#a16clip)" />
      {/* Helmet outer */}
      <Circle cx="50" cy="46" r="30" fill="url(#a16helm)" />
      {/* Visor */}
      <Ellipse cx="50" cy="48" rx="20" ry="18" fill="#0a0a2e" />
      <Ellipse cx="50" cy="48" rx="18" ry="16" fill="#1e3a8a" />
      {/* Face inside visor */}
      <Ellipse cx="50" cy="50" rx="14" ry="13" fill="#fddcb5" />
      <Circle cx="44" cy="47" r="3.5" fill="white" />
      <Circle cx="56" cy="47" r="3.5" fill="white" />
      <Circle cx="44.5" cy="48" r="2" fill="#1e3a8a" />
      <Circle cx="56.5" cy="48" r="2" fill="#1e3a8a" />
      <Circle cx="45" cy="47" r="0.8" fill="white" />
      <Circle cx="57" cy="47" r="0.8" fill="white" />
      <Path d="M46 56 Q50 60 54 56" fill="none" stroke="#b87a4a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Visor glare */}
      <Path d="M34 36 Q42 30 56 34" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
      {/* Helmet collar */}
      <Ellipse cx="50" cy="73" rx="24" ry="8" fill="#64748b" />
      {/* USA flag on suit */}
      <Rect x="62" y="65" width="10" height="7" rx="1" fill="#dc2626" clipPath="url(#a16clip)" />
      <Rect x="62" y="65" width="10" height="2" rx="0" fill="#dc2626" clipPath="url(#a16clip)" />
      <Rect x="62" y="67" width="10" height="2" rx="0" fill="white" clipPath="url(#a16clip)" />
      <Rect x="62" y="69" width="10" height="3" rx="0" fill="#dc2626" clipPath="url(#a16clip)" />
      <Rect x="62" y="65" width="5" height="4" rx="0" fill="#1e3a8a" clipPath="url(#a16clip)" />
    </Svg>
  );
}

// 17 – Wiz: wizard with hat and stars
function A17() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a17bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7c3aed" /><Stop offset="1" stopColor="#1e1b4b" />
        </SvgGrad>
        <SvgGrad id="a17skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fde8c8" /><Stop offset="1" stopColor="#f0b880" />
        </SvgGrad>
        <ClipPath id="a17clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a17bg)" />
      {/* Stars on background */}
      <Polygon points="22,18 23,22 27,22 24,25 25,29 22,26 19,29 20,25 17,22 21,22" fill="#fde68a" opacity="0.7" />
      <Polygon points="75,22 76,25 79,25 77,27 78,30 75,28 72,30 73,27 71,25 74,25" fill="#fde68a" opacity="0.5" />
      {/* Wizard hat */}
      <Path d="M50 6 L34 38 L66 38 Z" fill="#4c1d95" />
      <Ellipse cx="50" cy="38" rx="18" ry="5" fill="#6d28d9" />
      {/* Hat stars */}
      <Circle cx="44" cy="22" r="2" fill="#fde68a" />
      <Circle cx="55" cy="16" r="1.5" fill="#fde68a" />
      {/* Hair/beard */}
      <Path d="M28 48 Q30 38 36 36 Q50 32 64 36 Q70 38 72 48" fill="#e2e8f0" />
      {/* Beard */}
      <Path d="M34 62 Q38 78 50 80 Q62 78 66 62" fill="#e2e8f0" />
      {/* Neck */}
      <Rect x="44" y="72" width="12" height="10" rx="4" fill="url(#a17skin)" clipPath="url(#a17clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="52" rx="20" ry="20" fill="url(#a17skin)" />
      {/* Bushy brows */}
      <Path d="M36 46 Q42 43 46 46" fill="#c0c0c0" stroke="#c0c0c0" strokeWidth="3" strokeLinecap="round" />
      <Path d="M54 46 Q58 43 64 46" fill="#c0c0c0" stroke="#c0c0c0" strokeWidth="3" strokeLinecap="round" />
      {/* Wise eyes */}
      <Ellipse cx="42" cy="50" rx="5" ry="5" fill="white" />
      <Ellipse cx="58" cy="50" rx="5" ry="5" fill="white" />
      <Circle cx="43" cy="51" r="3.5" fill="#7c3aed" />
      <Circle cx="59" cy="51" r="3.5" fill="#7c3aed" />
      <Circle cx="44" cy="50" r="1.2" fill="white" />
      <Circle cx="60" cy="50" r="1.2" fill="white" />
      {/* Nose (pointy) */}
      <Path d="M48 56 Q50 63 52 56" fill="none" stroke="#b87a4a" strokeWidth="2" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M43 64 Q50 68 57 64" fill="none" stroke="#b87a4a" strokeWidth="2" strokeLinecap="round" />
      {/* Robe */}
      <Path d="M22 100 Q26 78 50 74 Q74 78 78 100Z" fill="#4c1d95" clipPath="url(#a17clip)" />
      {/* Magic sparkle on robe */}
      <Polygon points="50,80 51.5,84 56,84 52.5,87 54,91 50,88 46,91 47.5,87 44,84 48.5,84" fill="#fde68a" clipPath="url(#a17clip)" />
    </Svg>
  );
}

// 18 – Scout: explorer with pith helmet
function A18() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a18bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d4a76a" /><Stop offset="1" stopColor="#78350f" />
        </SvgGrad>
        <SvgGrad id="a18skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fde8c8" /><Stop offset="1" stopColor="#f0b880" />
        </SvgGrad>
        <ClipPath id="a18clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a18bg)" />
      {/* Pith helmet */}
      <Ellipse cx="50" cy="34" rx="28" ry="8" fill="#d4a76a" />
      <Ellipse cx="50" cy="34" rx="22" ry="6" fill="#e8c78a" />
      <Path d="M28 34 Q28 20 50 18 Q72 20 72 34" fill="#e8c78a" />
      {/* Helmet band */}
      <Path d="M28 34 Q50 36 72 34" stroke="#78350f" strokeWidth="3" fill="none" />
      {/* Neck */}
      <Rect x="44" y="70" width="12" height="10" rx="4" fill="url(#a18skin)" clipPath="url(#a18clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="53" rx="22" ry="23" fill="url(#a18skin)" />
      {/* Adventure eyes */}
      <Ellipse cx="42" cy="50" rx="6" ry="5.5" fill="white" />
      <Ellipse cx="58" cy="50" rx="6" ry="5.5" fill="white" />
      <Circle cx="43" cy="51" r="3.5" fill="#1e3a5c" />
      <Circle cx="59" cy="51" r="3.5" fill="#1e3a5c" />
      <Circle cx="44" cy="50" r="1.2" fill="white" />
      <Circle cx="60" cy="50" r="1.2" fill="white" />
      {/* Brows */}
      <Path d="M36 44 Q42 41 48 44" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M52 44 Q58 41 64 44" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M48 58 Q50 62 52 58" fill="none" stroke="#c97a5a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Confident smile */}
      <Path d="M43 64 Q50 71 57 64" fill="none" stroke="#c97a5a" strokeWidth="2" strokeLinecap="round" />
      {/* Cheeks (sunburned) */}
      <Ellipse cx="36" cy="58" rx="6" ry="4" fill="#ef4444" opacity="0.25" />
      <Ellipse cx="64" cy="58" rx="6" ry="4" fill="#ef4444" opacity="0.25" />
      {/* Khaki shirt */}
      <Path d="M24 100 Q28 78 50 74 Q72 78 76 100Z" fill="#a16207" clipPath="url(#a18clip)" />
      {/* Pocket */}
      <Rect x="44" y="82" width="12" height="10" rx="2" fill="#92400e" clipPath="url(#a18clip)" />
      <Rect x="44" y="82" width="12" height="3" rx="1" fill="#78350f" clipPath="url(#a18clip)" />
      {/* Compass on pocket */}
      <Circle cx="50" cy="88" r="3" fill="#fde68a" clipPath="url(#a18clip)" />
    </Svg>
  );
}

// 19 – Foxy: cute fox
function A19() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a19bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fed7aa" /><Stop offset="1" stopColor="#ea580c" />
        </SvgGrad>
        <ClipPath id="a19clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a19bg)" />
      {/* Ears */}
      <Path d="M30 44 L22 16 L46 36 Z" fill="#ea580c" />
      <Path d="M70 44 L78 16 L54 36 Z" fill="#ea580c" />
      <Path d="M32 42 L27 22 L44 36 Z" fill="#fde8c8" />
      <Path d="M68 42 L73 22 L56 36 Z" fill="#fde8c8" />
      {/* Neck/body */}
      <Ellipse cx="50" cy="80" rx="20" ry="18" fill="#ea580c" clipPath="url(#a19clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="52" rx="24" ry="24" fill="#ea580c" />
      {/* White face mask */}
      <Ellipse cx="50" cy="58" rx="16" ry="16" fill="#fde8c8" />
      {/* Eyes */}
      <Circle cx="41" cy="48" r="7" fill="white" />
      <Circle cx="59" cy="48" r="7" fill="white" />
      <Circle cx="42" cy="49" r="5" fill="#1a1a1a" />
      <Circle cx="60" cy="49" r="5" fill="#1a1a1a" />
      <Circle cx="42" cy="49" r="3" fill="#ea580c" />
      <Circle cx="60" cy="49" r="3" fill="#ea580c" />
      <Circle cx="42.5" cy="49" r="1.5" fill="#0a0a0a" />
      <Circle cx="60.5" cy="49" r="1.5" fill="#0a0a0a" />
      <Circle cx="43" cy="48" r="1" fill="white" />
      <Circle cx="61" cy="48" r="1" fill="white" />
      {/* Fox snout */}
      <Ellipse cx="50" cy="61" rx="9" ry="7" fill="#fde8c8" />
      {/* Nose */}
      <Ellipse cx="50" cy="58" rx="3.5" ry="2.5" fill="#1a1a1a" />
      {/* Mouth */}
      <Path d="M46 63 Q50 67 54 63" fill="none" stroke="#c97a5a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Whiskers */}
      <Line x1="26" y1="62" x2="41" y2="60" stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
      <Line x1="26" y1="65" x2="41" y2="63" stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
      <Line x1="74" y1="62" x2="59" y2="60" stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
      <Line x1="74" y1="65" x2="59" y2="63" stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
      {/* Chest white patch */}
      <Ellipse cx="50" cy="84" rx="12" ry="14" fill="#fde8c8" clipPath="url(#a19clip)" />
    </Svg>
  );
}

// 20 – Whisker: cat with big eyes
function A20() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a20bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#bfdbfe" /><Stop offset="1" stopColor="#3b82f6" />
        </SvgGrad>
        <ClipPath id="a20clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a20bg)" />
      {/* Cat ears */}
      <Path d="M28 46 L20 14 L46 38 Z" fill="#94a3b8" />
      <Path d="M72 46 L80 14 L54 38 Z" fill="#94a3b8" />
      <Path d="M30 44 L24 20 L44 38 Z" fill="#f9a8d4" />
      <Path d="M70 44 L76 20 L56 38 Z" fill="#f9a8d4" />
      {/* Body */}
      <Ellipse cx="50" cy="80" rx="22" ry="20" fill="#cbd5e1" clipPath="url(#a20clip)" />
      {/* Face */}
      <Ellipse cx="50" cy="52" rx="25" ry="26" fill="#cbd5e1" />
      {/* Big beautiful eyes */}
      <Ellipse cx="40" cy="50" rx="9" ry="10" fill="white" />
      <Ellipse cx="60" cy="50" rx="9" ry="10" fill="white" />
      <Ellipse cx="40" cy="51" rx="6.5" ry="7.5" fill="#16a34a" />
      <Ellipse cx="60" cy="51" rx="6.5" ry="7.5" fill="#16a34a" />
      <Ellipse cx="40" cy="51" rx="3.5" ry="6" fill="#0a0a0a" />
      <Ellipse cx="60" cy="51" rx="3.5" ry="6" fill="#0a0a0a" />
      <Circle cx="41" cy="48" r="1.5" fill="white" />
      <Circle cx="61" cy="48" r="1.5" fill="white" />
      {/* Nose */}
      <Polygon points="50,60 47,63 53,63" fill="#f9a8d4" />
      {/* Mouth */}
      <Path d="M46 64 Q50 68 54 64" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M50 63 L50 65" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Whiskers */}
      <Line x1="22" y1="62" x2="44" y2="60" stroke="#64748b" strokeWidth="1.5" opacity="0.6" />
      <Line x1="22" y1="65" x2="44" y2="64" stroke="#64748b" strokeWidth="1.5" opacity="0.6" />
      <Line x1="22" y1="68" x2="44" y2="67" stroke="#64748b" strokeWidth="1.5" opacity="0.6" />
      <Line x1="78" y1="62" x2="56" y2="60" stroke="#64748b" strokeWidth="1.5" opacity="0.6" />
      <Line x1="78" y1="65" x2="56" y2="64" stroke="#64748b" strokeWidth="1.5" opacity="0.6" />
      <Line x1="78" y1="68" x2="56" y2="67" stroke="#64748b" strokeWidth="1.5" opacity="0.6" />
      {/* Collar */}
      <Rect x="36" y="73" width="28" height="6" rx="3" fill="#3b82f6" clipPath="url(#a20clip)" />
      <Circle cx="50" cy="76" r="4" fill="#fde68a" clipPath="url(#a20clip)" />
    </Svg>
  );
}

// 21 – Pip: penguin coder with laptop
function A21() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a21bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#94a3b8" /><Stop offset="1" stopColor="#0f172a" />
        </SvgGrad>
        <ClipPath id="a21clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a21bg)" />
      {/* Penguin body */}
      <Ellipse cx="50" cy="72" rx="24" ry="26" fill="#0f172a" clipPath="url(#a21clip)" />
      {/* White belly */}
      <Ellipse cx="50" cy="74" rx="14" ry="20" fill="white" clipPath="url(#a21clip)" />
      {/* Wings */}
      <Ellipse cx="28" cy="68" rx="10" ry="18" fill="#0f172a" clipPath="url(#a21clip)" />
      <Ellipse cx="72" cy="68" rx="10" ry="18" fill="#0f172a" clipPath="url(#a21clip)" />
      {/* Head */}
      <Ellipse cx="50" cy="40" rx="22" ry="22" fill="#0f172a" />
      {/* White face patch */}
      <Ellipse cx="50" cy="43" rx="15" ry="16" fill="white" />
      {/* Eyes */}
      <Circle cx="44" cy="38" r="6" fill="white" />
      <Circle cx="56" cy="38" r="6" fill="white" />
      <Circle cx="44.5" cy="38.5" r="4" fill="#0a0a0a" />
      <Circle cx="56.5" cy="38.5" r="4" fill="#0a0a0a" />
      <Circle cx="45" cy="37.5" r="1.5" fill="white" />
      <Circle cx="57" cy="37.5" r="1.5" fill="white" />
      {/* Beak */}
      <Path d="M47 47 L50 52 L53 47 Z" fill="#f59e0b" />
      {/* Laptop */}
      <Rect x="34" y="78" width="32" height="18" rx="3" fill="#1e293b" clipPath="url(#a21clip)" />
      <Rect x="36" y="80" width="28" height="13" rx="2" fill="#334155" clipPath="url(#a21clip)" />
      {/* Code on screen */}
      <Rect x="38" y="82" width="10" height="1.5" rx="0.75" fill="#4ade80" clipPath="url(#a21clip)" />
      <Rect x="38" y="85" width="16" height="1.5" rx="0.75" fill="#60a5fa" clipPath="url(#a21clip)" />
      <Rect x="40" y="88" width="12" height="1.5" rx="0.75" fill="#f472b6" clipPath="url(#a21clip)" />
      {/* Scarf */}
      <Path d="M32 55 Q50 52 68 55 Q50 59 32 55Z" fill="#ef4444" clipPath="url(#a21clip)" />
      <Rect x="48" y="55" width="6" height="14" rx="3" fill="#ef4444" clipPath="url(#a21clip)" />
    </Svg>
  );
}

// 22 – Blaze: cute dragon
function A22() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a22bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fca5a5" /><Stop offset="1" stopColor="#7f1d1d" />
        </SvgGrad>
        <ClipPath id="a22clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a22bg)" />
      {/* Wings */}
      <Path d="M24 52 Q10 30 18 18 Q28 32 32 48 Z" fill="#dc2626" />
      <Path d="M20 52 Q8 32 16 20 Q24 30 30 48 Z" fill="#b91c1c" />
      <Path d="M76 52 Q90 30 82 18 Q72 32 68 48 Z" fill="#dc2626" />
      <Path d="M80 52 Q92 32 84 20 Q76 30 70 48 Z" fill="#b91c1c" />
      {/* Horns */}
      <Path d="M36 32 L30 10 L40 28 Z" fill="#7f1d1d" />
      <Path d="M64 32 L70 10 L60 28 Z" fill="#7f1d1d" />
      {/* Body */}
      <Ellipse cx="50" cy="75" rx="22" ry="24" fill="#16a34a" clipPath="url(#a22clip)" />
      {/* Belly scales */}
      <Ellipse cx="50" cy="78" rx="13" ry="18" fill="#bbf7d0" clipPath="url(#a22clip)" />
      {/* Head */}
      <Ellipse cx="50" cy="48" rx="26" ry="26" fill="#16a34a" />
      {/* Snout */}
      <Ellipse cx="50" cy="62" rx="14" ry="10" fill="#15803d" />
      {/* Nostrils */}
      <Circle cx="46" cy="60" r="2.5" fill="#0f4c25" />
      <Circle cx="54" cy="60" r="2.5" fill="#0f4c25" />
      {/* Eyes */}
      <Ellipse cx="40" cy="46" rx="8" ry="8" fill="#fde68a" />
      <Ellipse cx="60" cy="46" rx="8" ry="8" fill="#fde68a" />
      <Ellipse cx="40" cy="47" rx="5" ry="6" fill="#dc2626" />
      <Ellipse cx="60" cy="47" rx="5" ry="6" fill="#dc2626" />
      <Ellipse cx="40" cy="47" rx="2.5" ry="5" fill="#0a0a0a" />
      <Ellipse cx="60" cy="47" rx="2.5" ry="5" fill="#0a0a0a" />
      <Circle cx="41" cy="45" r="1.5" fill="white" />
      <Circle cx="61" cy="45" r="1.5" fill="white" />
      {/* Dragon mouth */}
      <Path d="M40 66 Q50 74 60 66" fill="#0f4c25" />
      <Path d="M40 66 Q50 74 60 66" fill="none" stroke="#0f4c25" strokeWidth="1" />
      {/* Flame */}
      <Path d="M48 74 Q42 78 44 86 Q50 80 50 86 Q56 80 56 86 Q58 78 52 74 Q50 78 48 74Z" fill="#fb923c" clipPath="url(#a22clip)" />
      <Path d="M49 76 Q45 80 46 86 Q50 82 50 86 Q54 82 54 86 Q55 80 51 76 Q50 80 49 76Z" fill="#fde68a" clipPath="url(#a22clip)" />
    </Svg>
  );
}

// 23 – Hoot: owl with graduation cap
function A23() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a23bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d4a76a" /><Stop offset="1" stopColor="#78350f" />
        </SvgGrad>
        <ClipPath id="a23clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a23bg)" />
      {/* Body */}
      <Ellipse cx="50" cy="75" rx="26" ry="24" fill="#92400e" clipPath="url(#a23clip)" />
      <Ellipse cx="50" cy="80" rx="16" ry="18" fill="#fde68a" clipPath="url(#a23clip)" />
      {/* Wings */}
      <Ellipse cx="27" cy="70" rx="12" ry="20" fill="#78350f" clipPath="url(#a23clip)" />
      <Ellipse cx="73" cy="70" rx="12" ry="20" fill="#78350f" clipPath="url(#a23clip)" />
      {/* Feather ear tufts */}
      <Path d="M34 36 L28 16 L38 30 Z" fill="#92400e" />
      <Path d="M66 36 L72 16 L62 30 Z" fill="#92400e" />
      {/* Graduation cap */}
      <Rect x="28" y="28" width="44" height="6" rx="3" fill="#0f172a" />
      <Path d="M36 28 Q50 20 64 28" fill="#1e293b" />
      <Rect x="46" y="14" width="8" height="14" rx="4" fill="#0f172a" />
      <Ellipse cx="50" cy="13" rx="6" ry="4" fill="#dc2626" />
      {/* Tassel */}
      <Rect x="70" y="28" width="2" height="16" rx="1" fill="#fde68a" />
      <Circle cx="71" cy="45" r="4" fill="#fde68a" />
      {/* Head */}
      <Ellipse cx="50" cy="50" rx="24" ry="24" fill="#92400e" />
      {/* Facial disk */}
      <Ellipse cx="50" cy="53" rx="19" ry="18" fill="#fde68a" />
      {/* Big wise eyes */}
      <Circle cx="40" cy="50" r="10" fill="white" />
      <Circle cx="60" cy="50" r="10" fill="white" />
      <Circle cx="40" cy="50" r="8" fill="#d97706" />
      <Circle cx="60" cy="50" r="8" fill="#d97706" />
      <Circle cx="40" cy="50" r="5" fill="#0a0a0a" />
      <Circle cx="60" cy="50" r="5" fill="#0a0a0a" />
      <Circle cx="41" cy="48" r="2" fill="white" />
      <Circle cx="61" cy="48" r="2" fill="white" />
      {/* Glasses */}
      <Circle cx="40" cy="50" r="10" fill="none" stroke="#78350f" strokeWidth="2" />
      <Circle cx="60" cy="50" r="10" fill="none" stroke="#78350f" strokeWidth="2" />
      <Line x1="50" y1="50" x2="50" y2="50" stroke="#78350f" strokeWidth="2" />
      <Path d="M30 50 L22 48" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
      <Path d="M70 50 L78 48" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
      {/* Beak */}
      <Path d="M47 58 L50 64 L53 58 Z" fill="#f59e0b" />
    </Svg>
  );
}

// 24 – Bun: bunny with coding headband
function A24() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Defs>
        <SvgGrad id="a24bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fbcfe8" /><Stop offset="1" stopColor="#db2777" />
        </SvgGrad>
        <ClipPath id="a24clip"><Circle cx="50" cy="50" r="50" /></ClipPath>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#a24bg)" />
      {/* Long bunny ears */}
      <Ellipse cx="36" cy="22" rx="10" ry="22" fill="#f9a8d4" />
      <Ellipse cx="64" cy="22" rx="10" ry="22" fill="#f9a8d4" />
      <Ellipse cx="36" cy="22" rx="6" ry="18" fill="#fce7f3" />
      <Ellipse cx="64" cy="22" rx="6" ry="18" fill="#fce7f3" />
      {/* Coding headband across ears */}
      <Rect x="22" y="36" width="56" height="8" rx="4" fill="#7c3aed" />
      <Rect x="38" y="36" width="24" height="8" rx="0" fill="#7c3aed" />
      {/* Code text on headband */}
      <Rect x="30" y="38" width="4" height="4" rx="1" fill="#a78bfa" />
      <Rect x="36" y="38" width="6" height="4" rx="1" fill="#c4b5fd" />
      <Rect x="44" y="38" width="4" height="4" rx="1" fill="#a78bfa" />
      <Rect x="60" y="38" width="4" height="4" rx="1" fill="#a78bfa" />
      <Rect x="66" y="38" width="4" height="4" rx="1" fill="#c4b5fd" />
      {/* Body */}
      <Ellipse cx="50" cy="80" rx="24" ry="22" fill="#fce7f3" clipPath="url(#a24clip)" />
      {/* Head */}
      <Ellipse cx="50" cy="55" rx="26" ry="26" fill="#fce7f3" />
      {/* Eyes */}
      <Ellipse cx="41" cy="52" rx="6.5" ry="6" fill="white" />
      <Ellipse cx="59" cy="52" rx="6.5" ry="6" fill="white" />
      <Circle cx="42" cy="53" r="4.5" fill="#db2777" />
      <Circle cx="60" cy="53" r="4.5" fill="#db2777" />
      <Circle cx="42" cy="53" r="3" fill="#0a0a0a" />
      <Circle cx="60" cy="53" r="3" fill="#0a0a0a" />
      <Circle cx="43" cy="52" r="1.2" fill="white" />
      <Circle cx="61" cy="52" r="1.2" fill="white" />
      {/* Bunny nose */}
      <Ellipse cx="50" cy="62" rx="3.5" ry="2.5" fill="#f9a8d4" />
      {/* Mouth */}
      <Path d="M46 65 Q50 70 54 65" fill="none" stroke="#db2777" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M50 63 L50 66" stroke="#db2777" strokeWidth="1.5" />
      {/* Whiskers */}
      <Line x1="24" y1="63" x2="44" y2="61" stroke="#db2777" strokeWidth="1" opacity="0.4" />
      <Line x1="24" y1="66" x2="44" y2="65" stroke="#db2777" strokeWidth="1" opacity="0.4" />
      <Line x1="76" y1="63" x2="56" y2="61" stroke="#db2777" strokeWidth="1" opacity="0.4" />
      <Line x1="76" y1="66" x2="56" y2="65" stroke="#db2777" strokeWidth="1" opacity="0.4" />
      {/* Shirt with heart */}
      <Path d="M26 100 Q28 82 50 78 Q72 82 74 100Z" fill="#db2777" clipPath="url(#a24clip)" />
      <Path d="M46,86 C46,83 42,82 42,85 C42,88 50,93 50,93 C50,93 58,88 58,85 C58,82 54,83 54,86 C54,84 50,84 46,86Z" fill="#fce7f3" clipPath="url(#a24clip)" />
    </Svg>
  );
}

// ── Map of ID → component ─────────────────────────────────────────────────────
const AVATAR_COMPONENTS: Record<number, () => React.JSX.Element> = {
  1: A1, 2: A2, 3: A3, 4: A4, 5: A5, 6: A6,
  7: A7, 8: A8, 9: A9, 10: A10, 11: A11, 12: A12,
  13: A13, 14: A14, 15: A15, 16: A16, 17: A17, 18: A18,
  19: A19, 20: A20, 21: A21, 22: A22, 23: A23, 24: A24,
};

// ── Float animation hook ──────────────────────────────────────────────────────
function useFloatStyle(seed = 0) {
  const y = useSharedValue(0);
  useEffect(() => {
    const delay = (seed % 8) * 200;
    const timer = setTimeout(() => {
      y.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
}

// ── CartoonAvatar ─────────────────────────────────────────────────────────────
interface CartoonAvatarProps {
  /** e.g. "cartoon:7" */
  id: string;
  size?: number;
  /** disable floating animation (e.g. in picker grid) */
  static?: boolean;
}

export function CartoonAvatar({ id, size = 64, static: isStatic = false }: CartoonAvatarProps) {
  const num = parseInt(id.replace('cartoon:', ''), 10);
  const AvatarSvg = AVATAR_COMPONENTS[num];
  const floatStyle = useFloatStyle(num);

  if (!AvatarSvg) return null;

  const content = (
    <View style={{ width: size, height: size, borderRadius: size / 4, overflow: 'hidden' }}>
      <AvatarSvg />
    </View>
  );

  if (isStatic) return content;

  return (
    <Animated.View style={floatStyle}>
      {content}
    </Animated.View>
  );
}

// ── AvatarDisplay ─────────────────────────────────────────────────────────────
interface AvatarDisplayProps {
  profilePicture?: string | null;
  size?: number;
  initials?: string;
  primaryColor?: string;
  static?: boolean;
}

export function AvatarDisplay({
  profilePicture,
  size = 64,
  initials = '?',
  primaryColor = '#6d28d9',
  static: isStatic = false,
}: AvatarDisplayProps) {
  const borderRadius = size / 4;

  if (profilePicture?.startsWith('cartoon:')) {
    return <CartoonAvatar id={profilePicture} size={size} static={isStatic} />;
  }

  if (profilePicture) {
    return (
      <Image
        source={{ uri: profilePicture }}
        style={{ width: size, height: size, borderRadius }}
      />
    );
  }

  // Initials fallback
  const fontSize = size * 0.34;
  return (
    <LinearGradient
      colors={[primaryColor, primaryColor + '99']}
      style={{ width: size, height: size, borderRadius, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize, fontFamily: 'Inter_700Bold', color: '#fff' }}>
        {initials}
      </Text>
    </LinearGradient>
  );
}
