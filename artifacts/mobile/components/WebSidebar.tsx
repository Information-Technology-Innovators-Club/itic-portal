import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { AvatarDisplay } from "@/components/CartoonAvatars";

const ROUTE_LABELS: Record<string, string> = {
  index: "Dashboard",
  members: "Members",
  leaderboard: "Leaderboard",
  events: "Events",
  announcements: "Announcements",
  leadership: "Leadership",
  scanner: "Attendance",
  profile: "My Profile",
  executive: "Management",
};

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 82;
const ANIM_DURATION = 220;

export function WebSidebar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colors = useColors();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const isPrivileged = user?.role === "executive" || user?.role === "admin";
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((name) => name[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "IT";

  // Animated width for the collapse/expand transition
  const widthAnim = useRef(new Animated.Value(SIDEBAR_WIDTH_EXPANDED)).current;
  // Animated fade for the text labels (fades out before width finishes collapsing)
  const labelOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
      duration: ANIM_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width isn't supported by native driver
    }).start();

    Animated.timing(labelOpacity, {
      toValue: collapsed ? 0 : 1,
      duration: collapsed ? 100 : 180,
      delay: collapsed ? 0 : 80, // labels fade in only after the sidebar has mostly expanded
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [collapsed]);

  const visibleRoutes = state.routes.filter((route) => {
    if (route.name === "members" && !isPrivileged) return false;
    if (
      (route.name === "scanner" || route.name === "executive") &&
      !isPrivileged
    )
      return false;
    const options = descriptors[route.key]
      .options as (typeof descriptors)[string]["options"] & { href?: unknown };
    return options.href !== null;
  });

  return (
    <Animated.View
      style={[
        styles.sidebar,
        {
          width: widthAnim,
          backgroundColor: colors.card,
          borderRightColor: colors.border,
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary, "#14532d"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.brand, collapsed && styles.brandCollapsed]}
      >
        <BrandLogo colors={colors} />
        {!collapsed && (
          <Animated.View style={{ flex: 1, opacity: labelOpacity }}>
            <Text style={styles.brandName} numberOfLines={1}>
              ITIC Portal
            </Text>
            <Text style={styles.brandSub} numberOfLines={1}>
              Chinhoyi University
            </Text>
          </Animated.View>
        )}
      </LinearGradient>

      <CollapseButton
        collapsed={collapsed}
        colors={colors}
        onPress={() => setCollapsed((value) => !value)}
      />

      <View style={[styles.nav, collapsed && styles.navCollapsed]}>
        {!collapsed && (
          <Animated.Text
            style={[
              styles.navLabel,
              { color: colors.mutedForeground, opacity: labelOpacity },
            ]}
          >
            WORKSPACE
          </Animated.Text>
        )}
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = state.routes[state.index]?.key === route.key;
          const label = ROUTE_LABELS[route.name] ?? options.title ?? route.name;
          const color = focused ? colors.primary : colors.mutedForeground;
          const icon = options.tabBarIcon?.({ focused, color, size: 20 });

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented)
              navigation.navigate(route.name);
          };

          return (
            <NavItem
              key={route.key}
              label={label}
              icon={icon}
              focused={focused}
              collapsed={collapsed}
              colors={colors}
              labelOpacity={labelOpacity}
              onPress={onPress}
            />
          );
        })}
      </View>

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border },
          collapsed && styles.footerCollapsed,
        ]}
      >
        <ProfileRow
          collapsed={collapsed}
          colors={colors}
          initials={initials}
          user={user}
          labelOpacity={labelOpacity}
          onPress={() => navigation.navigate("profile")}
        />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Brand logo — proper aspect-ratio fit, fade-in on load, graceful fallback
// if the image fails to load (falls back to initials/icon instead of a
// broken image box).
// ---------------------------------------------------------------------------
function BrandLogo({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleLoad = () => {
    setStatus("loaded");
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.brandIcon}>
      {status !== "error" && (
        <Animated.Image
          source={require("../assets/images/icon.png")}
          style={[styles.logoImage, { opacity: fadeAnim }]}
          resizeMode="contain"
          onLoad={handleLoad}
          onError={() => setStatus("error")}
          accessibilityLabel="ITIC logo"
        />
      )}

      {/* Fallback shown if the logo fails to load — avoids a broken-image icon */}
      {status === "error" && (
        <Ionicons name="school-outline" size={22} color={colors.primary} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Collapse toggle button — subtle rotate + scale feedback on hover/press
// ---------------------------------------------------------------------------
function CollapseButton({
  collapsed,
  colors,
  onPress,
}: {
  collapsed: boolean;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => animateTo(1.12)}
      onHoverOut={() => animateTo(1)}
      onPressIn={() => animateTo(0.9)}
      onPressOut={() => animateTo(1.12)}
      style={[
        styles.collapseButton,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={collapsed ? "chevron-forward" : "chevron-back"}
          size={15}
          color={colors.mutedForeground}
        />
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Nav item — hover background fade, active bar grows in, tooltip when collapsed
// ---------------------------------------------------------------------------
function NavItem({
  label,
  icon,
  focused,
  collapsed,
  colors,
  labelOpacity,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  focused: boolean;
  collapsed: boolean;
  colors: ReturnType<typeof useColors>;
  labelOpacity: Animated.Value;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverBg = useRef(new Animated.Value(0)).current;
  const activeBarHeight = useRef(new Animated.Value(focused ? 22 : 0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(activeBarHeight, {
      toValue: focused ? 22 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const handleHoverIn = () => {
    setHovered(true);
    Animated.timing(hoverBg, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();

    if (collapsed) {
      tooltipTimer.current = setTimeout(() => {
        setShowTooltip(true);
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }).start();
      }, 300); // small delay so tooltips don't flash while scanning past items
    }
  };

  const handleHoverOut = () => {
    setHovered(false);
    Animated.timing(hoverBg, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();

    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setShowTooltip(false);
    });
  };

  const backgroundColor = hoverBg.interpolate({
    inputRange: [0, 1],
    outputRange: [
      focused ? colors.primary + "14" : "transparent",
      focused ? colors.primary + "22" : colors.mutedForeground + "10",
    ],
  });

  return (
    <View style={{ position: "relative" }}>
      <Pressable
        onPress={onPress}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        style={[styles.navItem, collapsed && styles.navItemCollapsed]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor, borderRadius: 12 },
          ]}
        />

        <View
          style={[
            styles.navIcon,
            focused && { backgroundColor: colors.primary + "18" },
            hovered &&
              !focused && { backgroundColor: colors.mutedForeground + "14" },
          ]}
        >
          {icon}
        </View>

        {!collapsed && (
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.navText,
              {
                color: focused ? colors.foreground : colors.mutedForeground,
                opacity: labelOpacity,
              },
              focused && { fontFamily: "Inter_700Bold" },
            ]}
          >
            {label}
          </Animated.Text>
        )}

        <Animated.View
          style={[
            styles.activeBar,
            { backgroundColor: colors.primary, height: activeBarHeight },
          ]}
        />
      </Pressable>

      {/* Tooltip — only rendered when collapsed and hovered */}
      {collapsed && showTooltip && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tooltip,
            { backgroundColor: colors.foreground, opacity: tooltipOpacity },
          ]}
        >
          <Text style={[styles.tooltipText, { color: colors.card }]}>
            {label}
          </Text>
          <View
            style={[
              styles.tooltipArrow,
              { borderRightColor: colors.foreground },
            ]}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Profile row — subtle hover lift + tooltip when collapsed
// ---------------------------------------------------------------------------
function ProfileRow({
  collapsed,
  colors,
  initials,
  user,
  labelOpacity,
  onPress,
}: {
  collapsed: boolean;
  colors: ReturnType<typeof useColors>;
  initials: string;
  user: ReturnType<typeof useAuth>["user"];
  labelOpacity: Animated.Value;
  onPress: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverBg = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  const handleHoverIn = () => {
    Animated.timing(hoverBg, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
    if (collapsed) {
      setShowTooltip(true);
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleHoverOut = () => {
    Animated.timing(hoverBg, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setShowTooltip(false);
    });
  };

  const backgroundColor = hoverBg.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", colors.mutedForeground + "12"],
  });

  return (
    <View style={{ position: "relative" }}>
      <Pressable
        onPress={onPress}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        style={styles.profileRow}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor, borderRadius: 12 },
          ]}
        />
        <View style={[styles.avatar, { borderColor: colors.primary + "55" }]}>
          <AvatarDisplay
            profilePicture={user?.profilePicture}
            size={38}
            initials={initials}
            primaryColor={colors.primary}
            static
          />
        </View>
        {!collapsed && (
          <>
            <Animated.View style={{ flex: 1, opacity: labelOpacity }}>
              <Text
                style={[styles.profileName, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {user?.fullName ?? "ITIC Member"}
              </Text>
              <Text
                style={[styles.profileMeta, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {user?.memberId ?? "Member portal"}
              </Text>
            </Animated.View>
            <Ionicons
              name="settings-outline"
              size={17}
              color={colors.mutedForeground}
            />
          </>
        )}
      </Pressable>

      {collapsed && showTooltip && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.foreground,
              opacity: tooltipOpacity,
              bottom: 8,
              top: undefined,
            },
          ]}
        >
          <Text
            style={[styles.tooltipText, { color: colors.card }]}
            numberOfLines={1}
          >
            {user?.fullName ?? "My Profile"}
          </Text>
          <View
            style={[
              styles.tooltipArrow,
              { borderRightColor: colors.foreground },
            ]}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    borderRightWidth: 1,
    paddingVertical: 18,
    position: "relative",
    overflow: "hidden",
  },
  brand: {
    marginHorizontal: 14,
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandCollapsed: {
    marginHorizontal: 12,
    justifyContent: "center",
    padding: 12,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: { width: "100%", height: "100%" },
  brandName: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  brandSub: {
    color: "#dcfce7",
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    marginTop: 2,
  },
  nav: { flex: 1, paddingHorizontal: 10, paddingTop: 26, gap: 4 },
  navCollapsed: { paddingHorizontal: 10, paddingTop: 30 },
  navLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.1,
    marginLeft: 12,
    marginBottom: 7,
  },
  navItem: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 10,
    position: "relative",
    overflow: "hidden",
  },
  navItemCollapsed: { justifyContent: "center", paddingHorizontal: 0 },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  activeBar: { position: "absolute", right: 0, width: 3, borderRadius: 2 },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 14,
  },
  footerCollapsed: { paddingHorizontal: 12 },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  profileName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  profileMeta: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  collapseButton: {
    position: "absolute",
    top: 90,
    right: -13,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    position: "absolute",
    left: "100%",
    top: "50%",
    marginTop: -16,
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    zIndex: 10,
    // subtle shadow for depth
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tooltipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    whiteSpace: "nowrap" as any, // web-only, harmless on native
  },
  tooltipArrow: {
    position: "absolute",
    left: -5,
    top: "50%",
    marginTop: -5,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
});
