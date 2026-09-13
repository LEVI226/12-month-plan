import React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { useTheme } from '@/src/theme';

export type IconName =
  | 'sun'
  | 'target'
  | 'chart'
  | 'sliders'
  | 'check'
  | 'plus'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-right'
  | 'x'
  | 'trash'
  | 'share'
  | 'download'
  | 'lock'
  | 'leaf'
  | 'calendar'
  | 'pencil'
  | 'sparkle'
  | 'flame'
  | 'info'
  | 'shield'
  | 'book'
  | 'bell'
  | 'rotate';

interface Props {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color, strokeWidth = 1.8 }: Props) {
  const { colors } = useTheme();
  const c = color ?? colors.onSurface;
  const common = {
    stroke: c,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderShape(name, c, common)}
    </Svg>
  );
}

function renderShape(name: IconName, c: ColorValue, p: object) {
  switch (name) {
    case 'sun':
      return (
        <>
          <Circle cx={12} cy={12} r={4.2} {...p} />
          <Line x1={12} y1={1.5} x2={12} y2={4} {...p} />
          <Line x1={12} y1={20} x2={12} y2={22.5} {...p} />
          <Line x1={1.5} y1={12} x2={4} y2={12} {...p} />
          <Line x1={20} y1={12} x2={22.5} y2={12} {...p} />
          <Line x1={4.3} y1={4.3} x2={6} y2={6} {...p} />
          <Line x1={18} y1={18} x2={19.7} y2={19.7} {...p} />
          <Line x1={18} y1={6} x2={19.7} y2={4.3} {...p} />
          <Line x1={4.3} y1={19.7} x2={6} y2={18} {...p} />
        </>
      );
    case 'target':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Circle cx={12} cy={12} r={4.8} {...p} />
          <Circle cx={12} cy={12} r={1.4} fill={c} stroke={c} />
        </>
      );
    case 'chart':
      return (
        <>
          <Polyline points="3,16 9,10 13,13 20,5" {...p} />
          <Circle cx={20} cy={5} r={1.3} fill={c} stroke={c} />
        </>
      );
    case 'sliders':
      return (
        <>
          <Line x1={3} y1={8} x2={21} y2={8} {...p} />
          <Line x1={3} y1={16} x2={21} y2={16} {...p} />
          <Circle cx={9} cy={8} r={2.6} {...p} />
          <Circle cx={15} cy={16} r={2.6} {...p} />
        </>
      );
    case 'check':
      return <Polyline points="20,6.5 9.5,17 4,11.5" {...p} />;
    case 'plus':
      return (
        <>
          <Line x1={12} y1={5} x2={12} y2={19} {...p} />
          <Line x1={5} y1={12} x2={19} y2={12} {...p} />
        </>
      );
    case 'chevron-left':
      return <Polyline points="15,5 8,12 15,19" {...p} />;
    case 'chevron-right':
      return <Polyline points="9,5 16,12 9,19" {...p} />;
    case 'arrow-right':
      return (
        <>
          <Line x1={4} y1={12} x2={19} y2={12} {...p} />
          <Polyline points="13,6 19,12 13,18" {...p} />
        </>
      );
    case 'x':
      return (
        <>
          <Line x1={6} y1={6} x2={18} y2={18} {...p} />
          <Line x1={18} y1={6} x2={6} y2={18} {...p} />
        </>
      );
    case 'trash':
      return (
        <>
          <Line x1={4} y1={6.5} x2={20} y2={6.5} {...p} />
          <Path d="M9 6.5 V5 a1.5 1.5 0 0 1 1.5 -1.5 h3 A1.5 1.5 0 0 1 15 5 V6.5" {...p} />
          <Path d="M6.5 6.5 L7.5 19.5 A1.5 1.5 0 0 0 9 21 h6 a1.5 1.5 0 0 0 1.5 -1.5 L17.5 6.5" {...p} />
        </>
      );
    case 'share':
      return (
        <>
          <Circle cx={6} cy={12} r={2.4} {...p} />
          <Circle cx={17.5} cy={6} r={2.4} {...p} />
          <Circle cx={17.5} cy={18} r={2.4} {...p} />
          <Line x1={8} y1={10.9} x2={15.5} y2={7.1} {...p} />
          <Line x1={8} y1={13.1} x2={15.5} y2={16.9} {...p} />
        </>
      );
    case 'download':
      return (
        <>
          <Line x1={12} y1={3} x2={12} y2={15} {...p} />
          <Polyline points="7,10.5 12,15.5 17,10.5" {...p} />
          <Line x1={5} y1={20} x2={19} y2={20} {...p} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x={5} y={11} width={14} height={9.5} rx={2.5} {...p} />
          <Path d="M8 11 V8 a4 4 0 0 1 8 0 V11" {...p} />
          <Circle cx={12} cy={15.5} r={1.2} fill={c} stroke={c} />
        </>
      );
    case 'leaf':
      return (
        <>
          <Path d="M5 19 C5 10 11 5 19 5 C19 13 13 19 5 19 Z" {...p} />
          <Line x1={5} y1={19} x2={15} y2={9} {...p} />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x={4} y={5.5} width={16} height={15} rx={2.5} {...p} />
          <Line x1={4} y1={9.5} x2={20} y2={9.5} {...p} />
          <Line x1={8} y1={3} x2={8} y2={6.5} {...p} />
          <Line x1={16} y1={3} x2={16} y2={6.5} {...p} />
        </>
      );
    case 'pencil':
      return (
        <>
          <Path d="M4 20 L4 15.5 L15.5 4 L20 8.5 L8.5 20 Z" {...p} />
          <Line x1={13} y1={6.5} x2={17.5} y2={11} {...p} />
        </>
      );
    case 'sparkle':
      return (
        <Path
          d="M12 3 L13.6 9.4 L20 11 L13.6 12.6 L12 19 L10.4 12.6 L4 11 L10.4 9.4 Z"
          {...p}
        />
      );
    case 'flame':
      return (
        <Path
          d="M12 3 C13 7.5 17 9 15.5 14 A3.7 3.7 0 0 1 8.5 14 C7.8 11.5 9.5 10.5 10 8.5 C11 10.5 12 9 12 3 Z"
          {...p}
        />
      );
    case 'info':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Line x1={12} y1={11} x2={12} y2={16.5} {...p} />
          <Circle cx={12} cy={7.6} r={1.1} fill={c} stroke={c} />
        </>
      );
    case 'shield':
      return (
        <Path
          d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z"
          {...p}
        />
      );
    case 'book':
      return (
        <>
          <Path d="M4 5 C7.5 4 10 4 12 5.2 C14 4 16.5 4 20 5 V19 C16.5 18 14 18 12 19.2 C10 18 7.5 18 4 19 Z" {...p} />
          <Line x1={12} y1={5.2} x2={12} y2={19.2} {...p} />
        </>
      );
    case 'bell':
      return (
        <>
          <Path d="M6 16 C6 11 6.5 6.5 12 6.5 C17.5 6.5 18 11 18 16 Z" {...p} />
          <Line x1={4.5} y1={16} x2={19.5} y2={16} {...p} />
          <Path d="M10 19.5 a2 2 0 0 0 4 0" {...p} />
          <Line x1={12} y1={3.2} x2={12} y2={5} {...p} />
        </>
      );
    case 'rotate':
      return (
        <>
          <Path d="M4.5 12 A7.5 7.5 0 0 1 18.5 7.3" {...p} />
          <Polyline points="18.5,3.3 18.5,7.6 14.2,7.6" {...p} />
          <Path d="M19.5 12 A7.5 7.5 0 0 1 5.5 16.7" {...p} />
          <Polyline points="5.5,20.7 5.5,16.4 9.8,16.4" {...p} />
        </>
      );
    default:
      return null;
  }
}
