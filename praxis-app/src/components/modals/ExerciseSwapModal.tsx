import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@theme';
import { EXERCISES } from '@core/data/exercises';
import type { Exercise, MovementPattern } from '@core/types/exercise';

interface ExerciseSwapModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  pattern: MovementPattern;
  equipment: string[];
}

export function ExerciseSwapModal({
  visible,
  onClose,
  onSelect,
  pattern,
  equipment,
}: ExerciseSwapModalProps) {
  const theme = useTheme();

  const candidates = EXERCISES.filter((e) => {
    const matchesPattern = e.pattern === pattern;
    const matchesEquipment = e.equipmentIds.some((id) => equipment.includes(id));
    return matchesPattern && matchesEquipment;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface2,
            borderRadius: 20,
            padding: 20,
            maxHeight: '80%',
          }}
        >
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.typography.sizes.h3,
              fontFamily: theme.typography.fonts.headingMedium,
              marginBottom: 12,
            }}
          >
            Replace Exercise
          </Text>

          <ScrollView>
            {candidates.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                onPress={() => {
                  onSelect(ex);
                  onClose();
                }}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.surface3,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.bodyMedium,
                  }}
                >
                  {ex.name}
                </Text>
                <Text
                  style={{
                    color: theme.colors.textMuted,
                    fontSize: theme.typography.sizes.bodySmall,
                    fontFamily: theme.typography.fonts.body,
                  }}
                >
                  {ex.modality}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 15 }}>
            <Text
              style={{
                color: theme.colors.primary,
                textAlign: 'center',
                fontFamily: theme.typography.fonts.bodyMedium,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

