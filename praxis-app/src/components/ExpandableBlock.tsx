import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useTheme } from '@theme';
import type { WorkoutBlock } from '@core/types';
import { getExerciseById } from '@core/data/exercises';
import { EquipmentIcon } from './EquipmentIcon';
import { ExerciseSwapModal } from './modals/ExerciseSwapModal';
import { GestureRecognizer } from './interaction/GestureRecognizer';
import type { Exercise } from '@core/types/exercise';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableBlockProps {
  block: WorkoutBlock;
  planDayId: string;
  userEquipment: string[];
  swapExerciseInBlock: (
    planDayId: string,
    blockId: string,
    oldExerciseId: string,
    newExercise: Exercise
  ) => void;
  reorderAccessoryExercises: (
    planDayId: string,
    blockId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
  updateStrengthSet: (
    planDayId: string,
    blockId: string,
    setIndex: number,
    updates: Partial<{ targetReps?: number; targetRpe?: number; targetPercent1RM?: number }>
  ) => void;
  addStrengthSet: (planDayId: string, blockId: string) => void;
  removeStrengthSet: (planDayId: string, blockId: string, setIndex: number) => void;
}

interface SwapModalState {
  blockId: string;
  exerciseId: string;
  pattern: string;
}

export function ExpandableBlock({
  block,
  planDayId,
  userEquipment,
  swapExerciseInBlock,
  reorderAccessoryExercises,
  updateStrengthSet,
  addStrengthSet,
  removeStrengthSet,
}: ExpandableBlockProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState<SwapModalState | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface2,
        marginBottom: theme.spacing.md,
        borderRadius: 20,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.surface3,
      }}
    >
      {/* Header */}
      <TouchableOpacity onPress={toggle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.typography.sizes.h4,
              fontFamily: theme.typography.fonts.headingMedium,
            }}
          >
            {block.title}
          </Text>

          <Text style={{ color: theme.colors.primary }}>
            {expanded ? '▲' : '▼'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={{ marginTop: theme.spacing.md }}>
          {renderBlockDetails(
            block,
            theme,
            setShowSwapModal,
            planDayId,
            reorderAccessoryExercises,
            dragIndex,
            setDragIndex,
            hoverIndex,
            setHoverIndex,
            updateStrengthSet,
            addStrengthSet,
            removeStrengthSet
          )}
        </View>
      )}

      {/* Exercise Swap Modal */}
      {showSwapModal && (
        <ExerciseSwapModal
          visible={true}
          equipment={userEquipment}
          pattern={showSwapModal.pattern as any}
          onClose={() => setShowSwapModal(null)}
          onSelect={(exercise) => {
            swapExerciseInBlock(
              planDayId,
              showSwapModal.blockId,
              showSwapModal.exerciseId,
              exercise
            );
          }}
        />
      )}
    </View>
  );
}

function renderBlockDetails(
  block: WorkoutBlock,
  theme: ReturnType<typeof useTheme>,
  setShowSwapModal: (state: { blockId: string; exerciseId: string; pattern: string } | null) => void,
  planDayId: string,
  reorderAccessoryExercises: (
    planDayId: string,
    blockId: string,
    fromIndex: number,
    toIndex: number
  ) => void,
  dragIndex: number | null,
  setDragIndex: (index: number | null) => void,
  hoverIndex: number | null,
  setHoverIndex: (index: number | null) => void,
  updateStrengthSet: (
    planDayId: string,
    blockId: string,
    setIndex: number,
    updates: Partial<{ targetReps?: number; targetRpe?: number; targetPercent1RM?: number }>
  ) => void,
  addStrengthSet: (planDayId: string, blockId: string) => void,
  removeStrengthSet: (planDayId: string, blockId: string, setIndex: number) => void
) {
  switch (block.type) {
    case 'warmup':
      return block.warmupItems?.map((item, idx) => (
        <Text
          key={idx}
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fonts.body,
            marginBottom: 6,
          }}
        >
          • {item}
        </Text>
      ));

    case 'strength':
      const mainExercise = block.strengthMain?.exerciseId
        ? getExerciseById(block.strengthMain.exerciseId)
        : null;
      const exerciseName = mainExercise?.name ?? block.strengthMain?.exerciseId ?? 'Exercise';
      const strengthPattern = mainExercise?.pattern ?? 'squat';

      return (
        <View style={{ marginTop: theme.spacing.md }}>
          <TouchableOpacity
            onPress={() => {
              if (block.strengthMain?.exerciseId) {
                setShowSwapModal({
                  blockId: block.id,
                  exerciseId: block.strengthMain.exerciseId,
                  pattern: strengthPattern,
                });
              }
            }}
          >
            <Text
              style={{
                color: theme.colors.primaryLight,
                fontFamily: theme.typography.fonts.bodyMedium,
                marginBottom: 8,
              }}
            >
              {exerciseName}
            </Text>
          </TouchableOpacity>

          {mainExercise?.modality && (
            <View style={{ marginBottom: theme.spacing.md }}>
              <EquipmentIcon modality={mainExercise.modality} />
            </View>
          )}

          {block.strengthMain?.sets?.map((set, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                }}
              >
                Set {index + 1}
              </Text>

              {/* Reps Editor */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() =>
                    updateStrengthSet(planDayId, block.id, index, {
                      targetReps: Math.max(1, (set.targetReps ?? 8) - 1),
                    })
                  }
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: 22,
                      fontFamily: theme.typography.fonts.body,
                    }}
                  >
                    –
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    marginHorizontal: 12,
                    width: 32,
                    textAlign: 'center',
                  }}
                >
                  {set.targetReps ?? '?'}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    updateStrengthSet(planDayId, block.id, index, {
                      targetReps: (set.targetReps ?? 8) + 1,
                    })
                  }
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: 22,
                      fontFamily: theme.typography.fonts.body,
                    }}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>

              {/* RPE Editor */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() =>
                    updateStrengthSet(planDayId, block.id, index, {
                      targetRpe: Math.max(5, (set.targetRpe ?? 7) - 0.5),
                    })
                  }
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: 20,
                      fontFamily: theme.typography.fonts.body,
                    }}
                  >
                    –
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    marginHorizontal: 10,
                    width: 40,
                    textAlign: 'center',
                  }}
                >
                  RPE {set.targetRpe?.toFixed(1) ?? '—'}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    updateStrengthSet(planDayId, block.id, index, {
                      targetRpe: Math.min(10, (set.targetRpe ?? 7) + 0.5),
                    })
                  }
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: 20,
                      fontFamily: theme.typography.fonts.body,
                    }}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Remove Set */}
              <TouchableOpacity
                onPress={() => removeStrengthSet(planDayId, block.id, index)}
              >
                <Text
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.typography.fonts.body,
                    fontSize: theme.typography.sizes.bodySmall,
                  }}
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Set Button */}
          <TouchableOpacity
            onPress={() => addStrengthSet(planDayId, block.id)}
            style={{
              marginTop: 12,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.typography.fonts.bodyMedium,
              }}
            >
              + Add Set
            </Text>
          </TouchableOpacity>
        </View>
      );

    case 'accessory':
      return block.accessory?.map((acc, idx) => {
        const accExercise = acc.exerciseId
          ? getExerciseById(acc.exerciseId)
          : null;
        const accName = accExercise?.name ?? acc.exerciseId ?? 'Exercise';
        const accPattern = accExercise?.pattern ?? 'core';

        return (
          <GestureRecognizer
            key={acc.exerciseId ?? idx}
            index={idx}
            total={block.accessory?.length ?? 0}
            onStart={() => setDragIndex(idx)}
            onMove={(hoverPos) => {
              if (hoverPos !== hoverIndex) setHoverIndex(hoverPos);
            }}
            onEnd={() => {
              if (hoverIndex !== null && hoverIndex !== dragIndex) {
                reorderAccessoryExercises(planDayId, block.id, dragIndex!, hoverIndex);
              }
              setDragIndex(null);
              setHoverIndex(null);
            }}
          >
            <View
              style={{
                paddingVertical: 10,
                marginBottom: 10,
                opacity: dragIndex === idx ? 0.35 : 1,
                backgroundColor:
                  hoverIndex === idx ? theme.colors.surface3 : 'transparent',
                borderRadius: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (acc.exerciseId) {
                    setShowSwapModal({
                      blockId: block.id,
                      exerciseId: acc.exerciseId,
                      pattern: accPattern,
                    });
                  }
                }}
              >
                <Text
                  style={{
                    color: theme.colors.primaryLight,
                    fontFamily: theme.typography.fonts.bodyMedium,
                  }}
                >
                  {accName}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fonts.body,
                }}
              >
                {acc.sets?.[0]?.targetReps ?? '?'} reps × {acc.sets?.length ?? 0}{' '}
                sets
              </Text>
            </View>
          </GestureRecognizer>
        );
      });

    case 'conditioning':
      return (
        <View>
          {block.conditioning?.notes && (
            <Text
              style={{
                color: theme.colors.primaryLight,
                fontFamily: theme.typography.fonts.bodyMedium,
                marginBottom: 6,
              }}
            >
              {block.conditioning.notes}
            </Text>
          )}
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fonts.body,
            }}
          >
            {block.conditioning?.mode === 'interval'
              ? `${block.conditioning.rounds ?? '?'} rounds of ${
                  block.conditioning.workSeconds ?? '?'
                }s work / ${block.conditioning.restSeconds ?? '?'}s rest`
              : `Steady effort for ${block.estimatedDurationMinutes ?? '?'} min`}
          </Text>
        </View>
      );

    case 'cooldown':
      return block.cooldownItems?.map((item, idx) => (
        <Text
          key={idx}
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fonts.body,
            marginBottom: 6,
          }}
        >
          • {item}
        </Text>
      ));

    default:
      return (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fonts.body,
          }}
        >
          No details available.
        </Text>
      );
  }
}

