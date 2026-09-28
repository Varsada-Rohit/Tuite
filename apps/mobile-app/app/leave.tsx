import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { LeaveStatus } from '@tuite/shared-types';
import { neutralColors, semanticColors, defaultBrandColors, spacingNumeric } from '@tuite/design-tokens';

// ─── Types ──────────────────────────────────────────────
interface Batch { id: string; name: string; }
interface LeaveItem {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  batchName: string;
  createdAt: string;
}

const API_BASE = 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error('Request failed');
  if (res.status === 204) return undefined as T;
  return res.json();
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: semanticColors.warningLight, text: semanticColors.warningDark },
  APPROVED: { bg: semanticColors.successLight, text: semanticColors.successDark },
  REJECTED: { bg: semanticColors.errorLight, text: semanticColors.errorDark },
};

export default function LeaveScreen() {
  const [tab, setTab] = useState<'apply' | 'history'>('apply');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Placeholder studentId — in production, derive from auth context
  const studentId = '';

  useEffect(() => {
    apiFetch<Batch[]>('/api/v1/batches')
      .then((data) => {
        const active = data.filter((b: any) => b.isActive);
        setBatches(active);
        if (active.length > 0) setSelectedBatch(active[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'history' && studentId) {
      setIsLoading(true);
      apiFetch<LeaveItem[]>(`/api/v1/leaves/student/${studentId}`)
        .then(setLeaves)
        .catch(() => Alert.alert('Error', 'Failed to load leave history'))
        .finally(() => setIsLoading(false));
    }
  }, [tab, studentId]);

  const handleSubmit = async () => {
    if (!selectedBatch || !startDate || !endDate || !reason.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }
    if (!studentId) {
      Alert.alert('Error', 'Student ID not available. Please log in.');
      return;
    }

    setIsSaving(true);
    try {
      await apiFetch('/api/v1/leaves', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          batchId: selectedBatch,
          startDate,
          endDate,
          reason: reason.trim(),
        }),
      });
      Alert.alert('Success', 'Leave application submitted!');
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch {
      Alert.alert('Error', 'Failed to submit leave application.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Leave Management' }} />

      {/* Tab selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'apply' && styles.tabActive]}
          onPress={() => setTab('apply')}
        >
          <Text style={[styles.tabText, tab === 'apply' && styles.tabTextActive]}>Apply Leave</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {tab === 'apply' ? (
        <View style={styles.formContainer}>
          {/* Batch selector */}
          <Text style={styles.label}>Batch</Text>
          <View style={styles.chipRow}>
            {batches.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.chip, selectedBatch === b.id && styles.chipActive]}
                onPress={() => setSelectedBatch(b.id)}
              >
                <Text style={[styles.chipText, selectedBatch === b.id && styles.chipTextActive]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date fields */}
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Start Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={neutralColors.gray400}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>End Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={neutralColors.gray400}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          {/* Reason */}
          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe reason for leave..."
            placeholderTextColor={neutralColors.gray400}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Submit Application</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* History Tab */
        isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={defaultBrandColors.primary} />
          </View>
        ) : (
          <FlatList
            data={leaves}
            keyExtractor={(l) => l.id}
            contentContainerStyle={{ padding: spacingNumeric.lg }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No leave applications yet.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.PENDING;
              return (
                <View style={styles.leaveCard}>
                  <View style={styles.leaveCardHeader}>
                    <Text style={styles.leaveDate}>
                      {formatDate(item.startDate)} — {formatDate(item.endDate)}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.leaveBatch}>{item.batchName}</Text>
                  <Text style={styles.leaveReason} numberOfLines={2}>{item.reason}</Text>
                </View>
              );
            }}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: neutralColors.gray50 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: neutralColors.white,
    borderBottomWidth: 1,
    borderBottomColor: neutralColors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: defaultBrandColors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: neutralColors.gray500 },
  tabTextActive: { color: defaultBrandColors.primary, fontWeight: '600' },
  formContainer: { padding: spacingNumeric.lg },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: neutralColors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacingNumeric.xs,
    marginTop: spacingNumeric.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacingNumeric.sm },
  chip: {
    paddingHorizontal: spacingNumeric.md,
    paddingVertical: spacingNumeric.sm,
    borderRadius: 20,
    backgroundColor: neutralColors.gray100,
  },
  chipActive: { backgroundColor: defaultBrandColors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: neutralColors.gray600 },
  chipTextActive: { color: neutralColors.white },
  row: { flexDirection: 'row', gap: spacingNumeric.md },
  half: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: neutralColors.gray200,
    borderRadius: 10,
    paddingHorizontal: spacingNumeric.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: neutralColors.gray900,
    backgroundColor: neutralColors.white,
  },
  textArea: { height: 100 },
  submitBtn: {
    marginTop: spacingNumeric.xl,
    backgroundColor: defaultBrandColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: neutralColors.white, fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacingNumeric.xl },
  emptyText: { color: neutralColors.gray400, fontSize: 14, textAlign: 'center' },
  leaveCard: {
    backgroundColor: neutralColors.white,
    borderRadius: 12,
    padding: spacingNumeric.lg,
    marginBottom: spacingNumeric.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  leaveCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaveDate: { fontSize: 15, fontWeight: '600', color: neutralColors.gray900 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  leaveBatch: { fontSize: 12, color: neutralColors.gray500, marginTop: 4 },
  leaveReason: { fontSize: 13, color: neutralColors.gray600, marginTop: 6 },
});
