import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMilla } from '../../context/MillaContext';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../../theme/tokens';

export interface MillaPickerOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
}

interface MillaPickerProps {
  value: string;
  options: MillaPickerOption[];
  onChange: (value: string) => void;
  title: string;
  ariaLabel: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  iconName?: 'book-outline' | 'volume-high-outline' | 'search-outline';
  compact?: boolean;
  fullWidth?: boolean;
  previewingValue?: string | null;
  onPreviewOption?: (value: string) => void;
  onClosePicker?: () => void;
}

export function MillaPicker({
  value,
  options,
  onChange,
  title,
  ariaLabel,
  searchable = false,
  searchPlaceholder = 'ابحث بالاسم أو الرقم...',
  iconName,
  compact = false,
  fullWidth = false,
  previewingValue = null,
  onPreviewOption,
  onClosePicker,
}: MillaPickerProps) {
  const { state, theme } = useMilla();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const isRtl = (state?.language ?? 'ar') === 'ar';
  const selectedOption = options.find((o) => o.value === value) ?? options[0];

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const hay = `${opt.value} ${opt.label} ${opt.description ?? ''} ${opt.keywords ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const handleClose = () => {
    setOpen(false);
    setQuery('');
    onClosePicker?.();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={ariaLabel}
        style={[
          styles.trigger,
          compact ? styles.triggerCompact : styles.triggerRegular,
          fullWidth ? styles.fullWidth : null,
          {
            flexDirection: isRtl ? 'row-reverse' : 'row',
            borderColor: theme.border,
            backgroundColor: theme.background,
          },
        ]}
      >
        <View
          style={[
            styles.triggerInner,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          {iconName ? <Ionicons name={iconName} size={16} color={theme.primary} /> : null}
          <Text
            style={[
              styles.triggerText,
              compact ? styles.triggerTextCompact : styles.triggerTextRegular,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
            numberOfLines={1}
          >
            {selectedOption?.label ?? ''}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={theme.mutedForeground} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => undefined}
          >
            {/* Header */}
            <View
              style={[
                styles.sheetHeader,
                {
                  borderBottomColor: theme.border,
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                },
              ]}
            >
              <Text style={[styles.sheetTitle, { color: theme.foreground }]}>{title}</Text>
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
                style={[
                  styles.closeBtn,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
              >
                <Ionicons name="close" size={20} color={theme.foreground} />
              </Pressable>
            </View>

            {/* Search */}
            {searchable || options.length > 8 ? (
              <View style={[styles.searchBoxWrap, { borderBottomColor: theme.border }]}>
                <View
                  style={[
                    styles.searchInputWrap,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                >
                  <Ionicons name="search" size={16} color={theme.mutedForeground} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={theme.mutedForeground}
                    style={[
                      styles.searchInput,
                      { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            {/* Options List */}
            {filteredOptions.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
                لا توجد نتائج مطابقة لبحثك.
              </Text>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.value}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const selected = item.value === value;
                  return (
                    <Pressable
                      onPress={() => {
                        onChange(item.value);
                        handleClose();
                      }}
                      style={[
                        styles.optionRow,
                        {
                          flexDirection: isRtl ? 'row-reverse' : 'row',
                          borderColor: selected ? theme.primary : 'transparent',
                          backgroundColor: selected ? theme.secondary : theme.background,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.optionTextWrap,
                          { alignItems: isRtl ? 'flex-end' : 'flex-start' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            {
                              color: selected ? theme.primary : theme.foreground,
                              fontWeight: selected ? '700' : '600',
                              textAlign: isRtl ? 'right' : 'left',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {item.description ? (
                          <Text
                            style={[
                              styles.optionDesc,
                              {
                                color: theme.mutedForeground,
                                textAlign: isRtl ? 'right' : 'left',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[styles.optionActions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        {onPreviewOption ? (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              onPreviewOption(item.value);
                            }}
                            style={[
                              styles.previewBtn,
                              {
                                flexDirection: isRtl ? 'row-reverse' : 'row',
                                backgroundColor:
                                  previewingValue === item.value ? theme.primary : theme.card,
                                borderColor:
                                  previewingValue === item.value ? theme.primary : theme.border,
                              },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`استماع إلى ${item.label}`}
                          >
                            <Ionicons
                              name={previewingValue === item.value ? 'stop' : 'play'}
                              size={13}
                              color={
                                previewingValue === item.value
                                  ? theme.primaryForeground
                                  : theme.primary
                              }
                            />
                            <Text
                              style={[
                                styles.previewBtnText,
                                {
                                  color:
                                    previewingValue === item.value
                                      ? theme.primaryForeground
                                      : theme.foreground,
                                },
                              ]}
                            >
                              {previewingValue === item.value ? 'إيقاف' : 'استماع'}
                            </Text>
                          </Pressable>
                        ) : null}
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: RADII.control,
    borderWidth: 1,
  },
  triggerCompact: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 12,
  },
  triggerRegular: {
    minHeight: 48,
    paddingHorizontal: 14,
  },
  fullWidth: {
    width: '100%',
  },
  triggerInner: {
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  triggerText: { flexShrink: 1 },
  triggerTextCompact: { fontSize: 12, fontWeight: '600' },
  triggerTextRegular: { fontSize: 14, fontWeight: '600' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBoxWrap: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrap: {
    minHeight: 46,
    alignItems: 'center',
    gap: 8,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  listContent: { padding: 12, gap: 6 },
  optionRow: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionTextWrap: { flex: 1 },
  optionLabel: { fontSize: 14 },
  optionDesc: { fontSize: 12, marginTop: 2 },
  optionActions: { alignItems: 'center', gap: 8 },
  previewBtn: {
    minHeight: 34,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  previewBtnText: { fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', paddingVertical: 32, fontSize: 14 },
});
