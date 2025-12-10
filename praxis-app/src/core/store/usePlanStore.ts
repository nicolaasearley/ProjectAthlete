import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutPlanDay } from '../types';
import dayjs from 'dayjs';

/**
 * Deduplicate plan by date: if multiple workouts exist for the same date,
 * keep only the most recent one (by createdAt timestamp)
 */
function deduplicatePlanByDate(plan: WorkoutPlanDay[]): WorkoutPlanDay[] {
  const dateMap = new Map<string, WorkoutPlanDay>();
  
  for (const day of plan) {
    const existing = dateMap.get(day.date);
    if (!existing) {
      dateMap.set(day.date, day);
    } else {
      // Keep the one with the most recent createdAt timestamp
      const existingTime = new Date(existing.createdAt).getTime();
      const newTime = new Date(day.createdAt).getTime();
      if (newTime > existingTime) {
        dateMap.set(day.date, day);
      }
    }
  }
  
  return Array.from(dateMap.values());
}

interface PlanState {
  plan: WorkoutPlanDay[];
  currentPlanDay: WorkoutPlanDay | null;
  selectedDate: string | null;
  _hasHydrated: boolean;
  setPlan: (plan: WorkoutPlanDay[]) => void;
  setPlanDays: (plan: WorkoutPlanDay[]) => void;
  addPlanDay: (day: WorkoutPlanDay) => void;
  updatePlanDay: (id: string, updates: Partial<WorkoutPlanDay>) => void;
  removePlanDay: (id: string) => void;
  clearPlan: () => void;
  getTodayPlan: () => WorkoutPlanDay | null;
  setCurrentPlanDay: (day: WorkoutPlanDay | null) => void;
  setCurrentPlanDayByDate: (date: string) => void;
  setSelectedDate: (date: string | null) => void;
  getPlanDayByDate: (date: string) => WorkoutPlanDay | null;
  getPlanDayById: (id: string) => WorkoutPlanDay | null;
  setHasHydrated: (hydrated: boolean) => void;
  swapExerciseInBlock: (
    planDayId: string,
    blockId: string,
    oldExerciseId: string,
    newExercise: { id: string; name: string; modality?: string }
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

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plan: [],
      currentPlanDay: null,
      selectedDate: null,
      _hasHydrated: false,
      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

      setPlan: (plan) => {
        // Deduplicate: if multiple workouts exist for the same date, keep only the most recent
        const deduplicated = deduplicatePlanByDate(plan);
        set({ plan: deduplicated, currentPlanDay: null });
      },
      setPlanDays: (plan) => {
        // Deduplicate: if multiple workouts exist for the same date, keep only the most recent
        const deduplicated = deduplicatePlanByDate(plan);
        set({ plan: deduplicated, currentPlanDay: null });
      },
      addPlanDay: (day) => set((state) => ({ plan: [...state.plan, day] })),
      updatePlanDay: (id, updates) =>
        set((state) => ({
          plan: state.plan.map((day) => (day.id === id ? { ...day, ...updates } : day)),
          currentPlanDay:
            state.currentPlanDay?.id === id
              ? { ...state.currentPlanDay, ...updates }
              : state.currentPlanDay,
        })),
      removePlanDay: (id) =>
        set((state) => ({
          plan: state.plan.filter((day) => day.id !== id),
          currentPlanDay: state.currentPlanDay?.id === id ? null : state.currentPlanDay,
        })),
      clearPlan: () => set({ plan: [], currentPlanDay: null, selectedDate: null }),
      getTodayPlan: () => {
        const today = dayjs().format('YYYY-MM-DD');
        const todayWorkouts = get().plan.filter((day) => day.date === today);
        
        if (todayWorkouts.length === 0) {
          return null;
        }
        
        // If multiple workouts exist for today, return the most recent one (by createdAt)
        // This ensures we always get the latest generated workout
        if (todayWorkouts.length > 1) {
          return todayWorkouts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
        }
        
        return todayWorkouts[0];
      },
      setCurrentPlanDay: (day) => set({ currentPlanDay: day }),
      setCurrentPlanDayByDate: (date) => {
        const day = get().getPlanDayByDate(date);
        set({ currentPlanDay: day, selectedDate: date });
      },
      setSelectedDate: (date) => set({ selectedDate: date }),
      getPlanDayByDate: (date) => {
        return get().plan.find((day) => day.date === date) || null;
      },
      getPlanDayById: (id) => {
        return get().plan.find((day) => day.id === id) || null;
      },
      swapExerciseInBlock: (planDayId, blockId, oldExerciseId, newExercise) =>
        set((state) => {
          const updated = state.plan.map((day) => {
            if (day.id !== planDayId) return day;

            const updatedBlocks = day.blocks.map((block) => {
              if (block.id !== blockId) return block;

              // Strength block
              if (
                block.type === 'strength' &&
                block.strengthMain?.exerciseId === oldExerciseId
              ) {
                return {
                  ...block,
                  strengthMain: {
                    ...block.strengthMain,
                    exerciseId: newExercise.id,
                    exerciseName: newExercise.name,
                    modality: newExercise.modality,
                  },
                };
              }

              // Accessory block
              if (block.type === 'accessory') {
                const newAcc = block.accessory?.map((acc) => {
                  if (acc.exerciseId !== oldExerciseId) return acc;

                  return {
                    ...acc,
                    exerciseId: newExercise.id,
                    exerciseName: newExercise.name,
                  };
                });

                return { ...block, accessory: newAcc };
              }

              return block;
            });

            return { ...day, blocks: updatedBlocks };
          });

          return { plan: updated };
        }),
      reorderAccessoryExercises: (planDayId, blockId, fromIndex, toIndex) =>
        set((state) => {
          const updated = state.plan.map((day) => {
            if (day.id !== planDayId) return day;

            const newBlocks = day.blocks.map((block) => {
              if (block.id !== blockId) return block;
              if (block.type !== 'accessory') return block;

              const newList = [...(block.accessory ?? [])];
              const moved = newList.splice(fromIndex, 1)[0];
              newList.splice(toIndex, 0, moved);

              return {
                ...block,
                accessory: newList,
              };
            });

            return { ...day, blocks: newBlocks };
          });

          return { plan: updated };
        }),
      updateStrengthSet: (planDayId, blockId, setIndex, updates) =>
        set((state) => {
          const updatedPlan = state.plan.map((day) => {
            if (day.id !== planDayId) return day;

            const newBlocks = day.blocks.map((block) => {
              if (block.id !== blockId || block.type !== 'strength') return block;

              const newSets = [...(block.strengthMain?.sets ?? [])];
              newSets[setIndex] = {
                ...newSets[setIndex],
                ...updates,
              };

              return {
                ...block,
                strengthMain: {
                  ...block.strengthMain!,
                  sets: newSets,
                },
              };
            });

            return { ...day, blocks: newBlocks };
          });

          return { plan: updatedPlan };
        }),
      addStrengthSet: (planDayId, blockId) =>
        set((state) => {
          const updated = state.plan.map((day) => {
            if (day.id !== planDayId) return day;

            const newBlocks = day.blocks.map((block) => {
              if (block.id !== blockId || block.type !== 'strength') return block;

              const lastSet =
                block.strengthMain?.sets?.[block.strengthMain.sets.length - 1];
              const newSet = lastSet ? { ...lastSet } : { targetReps: 8, targetRpe: 7 };

              return {
                ...block,
                strengthMain: {
                  ...block.strengthMain!,
                  sets: [...(block.strengthMain?.sets ?? []), newSet],
                },
              };
            });

            return { ...day, blocks: newBlocks };
          });

          return { plan: updated };
        }),
      removeStrengthSet: (planDayId, blockId, setIndex) =>
        set((state) => {
          const updated = state.plan.map((day) => {
            if (day.id !== planDayId) return day;

            const newBlocks = day.blocks.map((block) => {
              if (block.id !== blockId || block.type !== 'strength') return block;

              const newSets = (block.strengthMain?.sets ?? []).filter(
                (_, idx) => idx !== setIndex
              );

              return {
                ...block,
                strengthMain: {
                  ...block.strengthMain!,
                  sets: newSets,
                },
              };
            });

            return { ...day, blocks: newBlocks };
          });

          return { plan: updated };
        }),
    }),
    {
      name: 'project-athlete-plan-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.setHasHydrated) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

export default usePlanStore;
