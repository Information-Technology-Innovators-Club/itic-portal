import {
  WHEEL_ITEM_HEIGHT,
  WHEEL_HEIGHT,
  WHEEL_VISIBLE_ROWS,
  styles,
} from "@/constants/styles";
import { useColors } from "@/hooks/useColors";
import { useEffect } from "react";
import { useRef } from "react";
import { ScrollView, View, TouchableOpacity, Text } from "react-native";

export function daysInMonth(monthIndex: number, year: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// A single scrollable wheel column (used for day / month / year)
export function WheelColumn({
  data,
  selectedIndex,
  onChange,
  width,
  colors,
}: {
  data: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width: number;
  colors: ReturnType<typeof useColors>;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isDragging.current) {
      scrollRef.current?.scrollTo({
        y: selectedIndex * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex, data.length]);

  function commit(y: number) {
    const idx = Math.max(
      0,
      Math.min(data.length - 1, Math.round(y / WHEEL_ITEM_HEIGHT)),
    );
    if (idx !== selectedIndex) onChange(idx);
    else
      scrollRef.current?.scrollTo({
        y: idx * WHEEL_ITEM_HEIGHT,
        animated: true,
      });
  }

  return (
    <View style={{ width, height: WHEEL_HEIGHT }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          isDragging.current = true;
        }}
        onMomentumScrollEnd={(e) => {
          isDragging.current = false;
          commit(e.nativeEvent.contentOffset.y);
        }}
        contentContainerStyle={{
          paddingVertical:
            WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ROWS / 2),
        }}
      >
        {data.map((label, i) => {
          const distance = Math.abs(i - selectedIndex);
          const isCenter = distance === 0;
          return (
            <TouchableOpacity
              key={`${label}-${i}`}
              activeOpacity={0.6}
              style={styles.wheelItem}
              onPress={() => {
                scrollRef.current?.scrollTo({
                  y: i * WHEEL_ITEM_HEIGHT,
                  animated: true,
                });
                onChange(i);
              }}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.wheelItemText,
                  {
                    color: isCenter
                      ? colors.foreground
                      : colors.mutedForeground,
                    opacity: isCenter ? 1 : distance === 1 ? 0.55 : 0.28,
                    fontFamily: isCenter ? "Inter_700Bold" : "Inter_500Medium",
                    fontSize: isCenter ? 18 : 15,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
