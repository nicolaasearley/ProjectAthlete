import React from 'react';
import { Text } from 'react-native';

interface EquipmentIconProps {
  modality?: string;
}

export function EquipmentIcon({ modality }: EquipmentIconProps) {
  const map: Record<string, string> = {
    barbell: '🏋️‍♂️',
    dumbbell: '💪',
    kettlebell: '🔔',
    machine: '🛠',
    cable: '🎣',
    bodyweight: '🤸‍♂️',
    sled: '🛷',
    cardio_machine: '🚴',
  };

  return <Text style={{ fontSize: 20 }}>{map[modality ?? ''] ?? '🏋️'}</Text>;
}

