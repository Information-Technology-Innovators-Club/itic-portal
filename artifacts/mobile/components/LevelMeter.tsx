import { styles } from "@/constants/styles";
import { useColors } from "@/hooks/useColors";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LEVELS } from "@/data/steps";

type Level = (typeof LEVELS)[number];
type Colors = ReturnType<typeof useColors>;

interface LevelMeterProps {
  value: Level | null;
  onSelect: (level: Level) => void;
  colors: Colors;
}

interface LevelNodeProps {
  level: Level;
  index: number;
  selected: boolean;
  passed: boolean;
  colors: Colors;
  onPress: (level: Level) => void;
}

const LevelNode = React.memo(function LevelNode({
  level,
  index,
  selected,
  passed,
  colors,
  onPress,
}: LevelNodeProps) {
  const handlePress = useCallback(() => onPress(level), [level, onPress]);
  const num = index + 1;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.levelNode}
      accessibilityRole="button"
      accessibilityLabel={`Level ${num}`}
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.levelCircle,
          {
            backgroundColor: selected
              ? colors.primary
              : passed
                ? `${colors.primary}22`
                : colors.muted,
            borderColor: selected
              ? colors.primary
              : passed
                ? `${colors.primary}55`
                : colors.border,
          },
        ]}
      >
        <Text
          style={[
            nodeStyles.numberText,
            { color: selected ? "#fff" : colors.mutedForeground },
          ]}
        >
          {num}
        </Text>
      </View>
      <Text
        style={[
          selected ? nodeStyles.labelSelected : nodeStyles.labelDefault,
          { color: selected ? colors.foreground : colors.mutedForeground },
        ]}
      >
        Lvl {num}
      </Text>
    </TouchableOpacity>
  );
});

/**
 * Academic level meter: connected numbered nodes with a progress line
 * between each, highlighting the currently selected level.
 */
export function LevelMeter({ value, onSelect, colors }: LevelMeterProps) {
  const selectedIndex = useMemo(
    () => (value ? LEVELS.indexOf(value) : -1),
    [value],
  );

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.levelRow}>
        {LEVELS.map((level, index) => {
          const selected = value === level;
          const passed = selectedIndex >= index;

          return (
            <React.Fragment key={level}>
              <LevelNode
                level={level}
                index={index}
                selected={selected}
                passed={passed}
                colors={colors}
                onPress={onSelect}
              />
              {index < LEVELS.length - 1 && (
                <View
                  key={`${level}-connector`}
                  style={[
                    styles.levelLine,
                    {
                      backgroundColor: passed ? colors.primary : colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const nodeStyles = StyleSheet.create({
  numberText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  labelDefault: {
    fontSize: 10.5,
    fontFamily: "Inter_500Medium",
  },
  labelSelected: {
    fontSize: 10.5,
    fontFamily: "Inter_700Bold",
  },
});
