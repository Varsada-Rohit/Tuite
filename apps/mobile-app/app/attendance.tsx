import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { AttendanceStatus } from '@tuite/shared-types';
import { neutralColors, semanticColors, defaultBrandColors, spacingNumeric } from '@tuite/design-tokens';

// ─── Types ──────────────────────────────────────────────
interface Batch {
  id: string;
  name: string;
}

interface StudentEntry {
  id: string;
  fullName: string;
  status: AttendanceStatus;
}

// ─── Mock API helpers (replace with real API client) ────
const API_BASE = 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

// ─── Status helpers ─────────────────────────────────────
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'P',
  ABSENT: 'A',
  LATE: 'L',
};

const STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string }> = {
  PRESENT: { bg: semanticColors.successLight, text: semanticColors.successDark },
  ABSENT: { bg: semanticColors.errorLight, text: semanticColors.errorDark },
  LATE: { bg: semanticColors.warningLight, text: semanticColors.warningDark },
};

const NEXT_STATUS: Record<AttendanceStatus, AttendanceStatus> = {
  PRESENT: AttendanceStatus.ABSENT,
  ABSENT: AttendanceStatus.LATE,
  LATE: AttendanceStatus.PRESENT,
};

// ─── Component ──────────────────────────────────────────
export default function AttendanceScreen() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [date] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    apiFetch<Batch[]>('/api/v1/batches')
      .then((data) => {
        const active = data.filter((b: any) => b.isActive);
        setBatches(active);
        if (active.length > 0) setSelectedBatch(active[0].id);
      })
      .catch(() => Alert.alert('Error', 'Failed to load batches'));
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!selectedBatch) return;
    setIsLoading(true);
    try {
      // Get students enrolled in this batch
      const allStudents = await apiFetch<any[]>('/api/v1/students');
      const enrolled = allStudents.filter((s: any) =>
        s.batches?.some((b: any) => b.id === selectedBatch) && s.isActive,
      );

      // Check if attendance already exists for today
      try {
        const existing = await apiFetch<any[]>(
          `/api/v1/attendance?batchId=${selectedBatch}&date=${date}`,
        );
        const statusMap = new Map(
          existing.map((e: any) => [e.studentId, e.status as AttendanceStatus]),
        );
        setStudents(
          enrolled.map((s: any) => ({
            id: s.id,
            fullName: s.fullName,
            status: statusMap.get(s.id) || AttendanceStatus.PRESENT,
          })),
        );
      } catch {
        setStudents(
          enrolled.map((s: any) => ({
            id: s.id,
            fullName: s.fullName,
            status: AttendanceStatus.PRESENT,
          })),
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBatch, date]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const toggleStatus = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, status: NEXT_STATUS[s.status] } : s,
      ),
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: AttendanceStatus.PRESENT })));
  };

  const submitAttendance = async () => {
    if (!selectedBatch || students.length === 0) return;
    setIsSaving(true);
    try {
      await apiFetch('/api/v1/attendance', {
        method: 'POST',
        body: JSON.stringify({
          batchId: selectedBatch,
          date,
          entries: students.map((s) => ({ studentId: s.id, status: s.status })),
        }),
      });
      Alert.alert('Success', 'Attendance saved successfully!');
    } catch {
      Alert.alert('Error', 'Failed to save attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const counts = {
    present: students.filter((s) => s.status === AttendanceStatus.PRESENT).length,
    absent: students.filter((s) => s.status === AttendanceStatus.ABSENT).length,
    late: students.filter((s) => s.status === AttendanceStatus.LATE).length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Mark Attendance' }} />

      {/* Date header */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>📅 {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
      </View>

      {/* Batch selector */}
      <View style={styles.batchScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={batches}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingHorizontal: spacingNumeric.md }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedBatch(item.id)}
              style={[
                styles.batchChip,
                selectedBatch === item.id && styles.batchChipActive,
              ]}
            >
              <Text
                style={[
                  styles.batchChipText,
                  selectedBatch === item.id && styles.batchChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Summary bar */}
      {students.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={[styles.summaryItem, { backgroundColor: semanticColors.successLight }]}>
            <Text style={[styles.summaryCount, { color: semanticColors.success }]}>{counts.present}</Text>
            <Text style={[styles.summaryLabel, { color: semanticColors.successDark }]}>Present</Text>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: semanticColors.errorLight }]}>
            <Text style={[styles.summaryCount, { color: semanticColors.error }]}>{counts.absent}</Text>
            <Text style={[styles.summaryLabel, { color: semanticColors.errorDark }]}>Absent</Text>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: semanticColors.warningLight }]}>
            <Text style={[styles.summaryCount, { color: semanticColors.warning }]}>{counts.late}</Text>
            <Text style={[styles.summaryLabel, { color: semanticColors.warningDark }]}>Late</Text>
          </View>
        </View>
      )}

      {/* Student list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={defaultBrandColors.primary} />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            students.length > 0 ? (
              <TouchableOpacity style={styles.markAllButton} onPress={markAllPresent}>
                <Text style={styles.markAllText}>✓ Mark All Present</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                No students enrolled in this batch yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const colors = STATUS_COLORS[item.status];
            return (
              <TouchableOpacity
                style={styles.studentRow}
                onPress={() => toggleStatus(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.studentName}>{item.fullName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.statusText, { color: colors.text }]}>
                    {STATUS_LABELS[item.status]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Submit button */}
      {students.length > 0 && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
            onPress={submitAttendance}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Submit Attendance ({students.length} students)</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: neutralColors.gray50 },
  dateHeader: {
    paddingHorizontal: spacingNumeric.lg,
    paddingVertical: spacingNumeric.md,
    backgroundColor: neutralColors.white,
    borderBottomWidth: 1,
    borderBottomColor: neutralColors.gray200,
  },
  dateText: { fontSize: 14, color: neutralColors.gray600, fontWeight: '500' },
  batchScroll: { paddingVertical: spacingNumeric.md },
  batchChip: {
    paddingHorizontal: spacingNumeric.lg,
    paddingVertical: spacingNumeric.sm,
    borderRadius: 20,
    backgroundColor: neutralColors.gray100,
    marginRight: spacingNumeric.sm,
  },
  batchChipActive: { backgroundColor: defaultBrandColors.primary },
  batchChipText: { fontSize: 13, fontWeight: '500', color: neutralColors.gray600 },
  batchChipTextActive: { color: neutralColors.white },
  summaryBar: {
    flexDirection: 'row',
    paddingHorizontal: spacingNumeric.lg,
    gap: spacingNumeric.sm,
    marginBottom: spacingNumeric.sm,
  },
  summaryItem: {
    flex: 1,
    paddingVertical: spacingNumeric.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryCount: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacingNumeric.xl },
  emptyText: { color: neutralColors.gray400, fontSize: 14, textAlign: 'center' },
  markAllButton: {
    marginHorizontal: spacingNumeric.lg,
    marginBottom: spacingNumeric.md,
    padding: spacingNumeric.sm,
    borderRadius: 8,
    backgroundColor: semanticColors.successLight,
    alignItems: 'center',
  },
  markAllText: { color: semanticColors.successDark, fontWeight: '600', fontSize: 13 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacingNumeric.lg,
    paddingVertical: 14,
    backgroundColor: neutralColors.white,
    borderBottomWidth: 1,
    borderBottomColor: neutralColors.gray100,
  },
  studentName: { fontSize: 15, fontWeight: '500', color: neutralColors.gray900, flex: 1 },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: { fontSize: 16, fontWeight: '700' },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacingNumeric.lg,
    backgroundColor: neutralColors.white,
    borderTopWidth: 1,
    borderTopColor: neutralColors.gray200,
  },
  submitButton: {
    backgroundColor: defaultBrandColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: neutralColors.white, fontSize: 16, fontWeight: '600' },
});
