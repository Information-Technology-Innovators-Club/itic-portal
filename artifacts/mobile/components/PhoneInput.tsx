import { styles } from "@/constants/styles";
import { Country, COUNTRIES } from "@/data/steps";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Text,
} from "react-native";

export function PhoneInput({
  country,
  localNumber,
  onCountryChange,
  onNumberChange,
  colors,
  error,
}: {
  country: Country;
  localNumber: string;
  onCountryChange: (c: Country) => void;
  onNumberChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
  error?: string | null;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const digits = localNumber.replace(/\D/g, "");
  const valid =
    digits.length >= country.minDigits && digits.length <= country.maxDigits;

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        Phone Number *
      </Text>
      <View
        style={[
          styles.phoneRow,
          {
            borderColor: error
              ? "#ef4444"
              : valid && digits.length > 0
                ? "#22c55e"
                : colors.border,
            backgroundColor: colors.muted,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          style={styles.countryBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.flagText}>{country.flag}</Text>
          <Text style={[styles.dialText, { color: colors.foreground }]}>
            {country.dial}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
        <View
          style={[styles.phoneDivider, { backgroundColor: colors.border }]}
        />
        <TextInput
          value={localNumber}
          onChangeText={(v) => onNumberChange(v.replace(/[^\d\s]/g, ""))}
          placeholder="77 123 4567"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="phone-pad"
          style={[styles.phoneInput, { color: colors.foreground }]}
        />
        {digits.length > 0 && (
          <Ionicons
            name={valid ? "checkmark-circle" : "alert-circle"}
            size={18}
            color={valid ? "#22c55e" : "#ef4444"}
            style={{ marginRight: 10 }}
          />
        )}
      </View>
      {error && <Text style={styles.errText}>{error}</Text>}

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select country
            </Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(c) => c.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => {
                    onCountryChange(item);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.flagText}>{item.flag}</Text>
                  <Text
                    style={[styles.countryName, { color: colors.foreground }]}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.mutedForeground }}>
                    {item.dial}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
