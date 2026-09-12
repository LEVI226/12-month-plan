import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';

export const MOOD_LABELS = ['Difficile', 'Mitigé', 'Correct', 'Bien', 'Rayonnant'];

const MOUTHS = [
  'M8 16 Q12 12.5 16 16', // 1 frown
  'M8 15.5 Q12 13.5 16 15.5', // 2 slight frown
  'M8 15 H16', // 3 flat
  'M8 14.5 Q12 16.5 16 14.5', // 4 slight smile
  'M8 14 Q12 17 16 14', // 5 smile
];

function Face({ level, color }: { level: number; color: string }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={10} r={1} fill={color} />
      <Circle cx={15} cy={10} r={1} fill={color} />
      <Path
        d={MOUTHS[level - 1]}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

interface Props {
  value?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function MoodSelector({ value, onChange, disabled }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View>
      <View style={s.row}>
        {[1, 2, 3, 4, 5].map((lvl) => {
          const active = value === lvl;
          const color = active ? colors.brandPrimary : colors.muted;
          return (
            <Pressable
              key={lvl}
              testID={`mood-${lvl}`}
              disabled={disabled}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(lvl);
              }}
              style={[
                s.face,
                {
                  backgroundColor: active ? colors.brandTertiary : colors.surface,
                  borderColor: active ? colors.brandPrimary : colors.border,
                  opacity: disabled && !active ? 0.5 : 1,
                },
              ]}
            >
              <Face level={lvl} color={color} />
            </Pressable>
          );
        })}
      </View>
      <Txt variant="small" center color={colors.muted} style={{ marginTop: spacing.sm, minHeight: 19 }}>
        {value ? MOOD_LABELS[value - 1] : 'Comment vous sentez-vous ?'}
      </Txt>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  face: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
