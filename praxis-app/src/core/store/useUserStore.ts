import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DistanceUnit,
  PRRecord,
  ReadinessEntry,
  StrengthNumbers,
  TrainingPreferences,
  UserProfile,
} from '@core/types';

export interface UserState {
  userProfile: UserProfile | null;
  preferences: TrainingPreferences;
  strengthNumbers: StrengthNumbers;
  distanceUnits: DistanceUnit;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean; // Added for onboarding compatibility
  currentReadiness: ReadinessEntry | null;
  readinessHistory: ReadinessEntry[];
  personalRecords: PRRecord[];
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (preferences: Partial<TrainingPreferences> | {
    goal?: string | null;
    experienceLevel?: string | null;
    timeAvailability?: string | number | null;
    trainingDaysPerWeek?: number | null;
    equipmentIds?: string[];
    [key: string]: any;
  }) => void;
  updateStrengthNumbers: (numbers: Partial<StrengthNumbers> | Record<string, number>) => void;
  setDistanceUnits: (unit: DistanceUnit) => void;
  setOnboardingCompleted: () => void; // Added for onboarding compatibility
  setHasCompletedOnboarding: (completed: boolean) => void; // Added for onboarding compatibility
  resetOnboarding: () => void; // Added for onboarding compatibility
  clearUserProfile: () => void;
  setAuthenticated: (authenticated: boolean) => void;
  setCurrentReadiness: (readiness: ReadinessEntry) => void;
  addReadinessEntry: (readiness: ReadinessEntry) => void;
  setReadinessHistory: (history: ReadinessEntry[]) => void;
  addPersonalRecord: (pr: PRRecord) => void;
  updatePersonalRecord: (id: string, updates: Partial<PRRecord>) => void;
  setPersonalRecords: (prs: PRRecord[]) => void;
  removePersonalRecord: (id: string) => void;
  hasProfile: () => boolean;
}

const defaultPreferences: TrainingPreferences = {
  goal: 'hybrid',
  experienceLevel: 'intermediate',
  trainingDaysPerWeek: 4,
  timeAvailability: 'standard',
  equipmentIds: [],
  adaptationMode: 'automatic',
  readinessScalingEnabled: true,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userProfile: null,
      preferences: defaultPreferences,
      strengthNumbers: {},
      distanceUnits: 'kilometers',
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      currentReadiness: null,
      readinessHistory: [],
      personalRecords: [],
      _hasHydrated: false,
      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

  setUserProfile: (profile) =>
    set({
      userProfile: profile,
      preferences: profile.preferences ?? defaultPreferences,
      strengthNumbers: profile.strengthNumbers ?? {},
      distanceUnits: profile.distanceUnits ?? 'kilometers',
    }),

  updateUserProfile: (updates) =>
    set((state) => {
      const mergedProfile = state.userProfile
        ? { ...state.userProfile, ...updates }
        : null;
      const mergedPreferences: TrainingPreferences = {
        ...state.preferences,
        ...(updates.preferences ?? {}),
      };

      return {
        userProfile: mergedProfile
          ? {
              ...mergedProfile,
              preferences: mergedPreferences,
              strengthNumbers: {
                ...state.strengthNumbers,
                ...mergedProfile.strengthNumbers,
              },
              updatedAt: new Date().toISOString(),
            }
          : null,
        preferences: mergedPreferences,
        strengthNumbers: {
          ...state.strengthNumbers,
          ...(updates.strengthNumbers ?? {}),
        },
        distanceUnits: updates.distanceUnits ?? state.distanceUnits,
      };
    }),

  updatePreferences: (preferences) =>
    set((state) => {
      console.log('[useUserStore] updatePreferences called with:', preferences);
      // Handle onboarding-style updates with field name mapping
      const mappedPrefs: Partial<TrainingPreferences> = {};
      
      if ('goal' in preferences && preferences.goal !== undefined) {
        mappedPrefs.goal = preferences.goal as TrainingPreferences['goal'];
        console.log('[useUserStore] Mapped goal:', mappedPrefs.goal);
      }
      if ('experienceLevel' in preferences && preferences.experienceLevel !== undefined) {
        mappedPrefs.experienceLevel = preferences.experienceLevel as TrainingPreferences['experienceLevel'];
        console.log('[useUserStore] Mapped experienceLevel:', mappedPrefs.experienceLevel);
      }
      if ('experience' in preferences && preferences.experience !== undefined) {
        mappedPrefs.experienceLevel = preferences.experience as TrainingPreferences['experienceLevel'];
        console.log('[useUserStore] Mapped experience -> experienceLevel:', mappedPrefs.experienceLevel);
      }
      if ('timeAvailability' in preferences && preferences.timeAvailability !== undefined && preferences.timeAvailability !== null) {
        const timeValue = preferences.timeAvailability;
        if (typeof timeValue === 'string') {
          mappedPrefs.timeAvailability = timeValue as TrainingPreferences['timeAvailability'];
        } else if (typeof timeValue === 'number') {
          // Convert number back to string if needed
          mappedPrefs.timeAvailability = timeValue === 1 ? 'short' : timeValue === 2 ? 'standard' : 'full';
        }
        console.log('[useUserStore] Mapped timeAvailability:', mappedPrefs.timeAvailability);
      }
      if ('trainingDaysPerWeek' in preferences && preferences.trainingDaysPerWeek !== undefined) {
        mappedPrefs.trainingDaysPerWeek = preferences.trainingDaysPerWeek as number;
        console.log('[useUserStore] Mapped trainingDaysPerWeek:', mappedPrefs.trainingDaysPerWeek);
      }
      if ('trainingDays' in preferences && preferences.trainingDays !== undefined) {
        mappedPrefs.trainingDaysPerWeek = preferences.trainingDays as number;
        console.log('[useUserStore] Mapped trainingDays -> trainingDaysPerWeek:', mappedPrefs.trainingDaysPerWeek);
      }
      if ('equipmentIds' in preferences && preferences.equipmentIds !== undefined) {
        mappedPrefs.equipmentIds = preferences.equipmentIds as string[];
        console.log('[useUserStore] Mapped equipmentIds:', mappedPrefs.equipmentIds);
      }
      if ('equipment' in preferences && preferences.equipment !== undefined) {
        mappedPrefs.equipmentIds = preferences.equipment as string[];
        console.log('[useUserStore] Mapped equipment -> equipmentIds:', mappedPrefs.equipmentIds);
      }
      
      // Direct TrainingPreferences fields
      if ('adaptationMode' in preferences) {
        mappedPrefs.adaptationMode = preferences.adaptationMode;
      }
      if ('readinessScalingEnabled' in preferences) {
        mappedPrefs.readinessScalingEnabled = preferences.readinessScalingEnabled;
      }

      const mergedPreferences: TrainingPreferences = {
        ...state.preferences,
        ...mappedPrefs,
      };

      console.log('[useUserStore] Final merged preferences:', {
        goal: mergedPreferences.goal,
        experienceLevel: mergedPreferences.experienceLevel,
        trainingDaysPerWeek: mergedPreferences.trainingDaysPerWeek,
        equipmentIds: mergedPreferences.equipmentIds,
        timeAvailability: mergedPreferences.timeAvailability,
      });

      return {
        preferences: mergedPreferences,
        userProfile: state.userProfile
          ? {
              ...state.userProfile,
              preferences: mergedPreferences,
              updatedAt: new Date().toISOString(),
            }
          : null,
      };
    }),

  updateStrengthNumbers: (numbers) =>
    set((state) => ({
      strengthNumbers: {
        ...state.strengthNumbers,
        ...numbers,
      },
      userProfile: state.userProfile
        ? {
            ...state.userProfile,
            strengthNumbers: {
              ...(state.userProfile.strengthNumbers ?? {}),
              ...numbers,
            },
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  setDistanceUnits: (unit) =>
    set((state) => ({
      distanceUnits: unit,
      userProfile: state.userProfile
        ? { ...state.userProfile, distanceUnits: unit, updatedAt: new Date().toISOString() }
        : null,
    })),

  setOnboardingCompleted: () => {
    console.log('[useUserStore] setOnboardingCompleted called');
    set({ hasCompletedOnboarding: true });
    console.log('[useUserStore] hasCompletedOnboarding set to true');
  },
  setHasCompletedOnboarding: (completed) => {
    console.log('[useUserStore] setHasCompletedOnboarding called with:', completed);
    set({ hasCompletedOnboarding: completed });
    console.log('[useUserStore] hasCompletedOnboarding set to:', completed);
  },

  resetOnboarding: () =>
    set({
      preferences: defaultPreferences,
      hasCompletedOnboarding: false,
      strengthNumbers: {},
    }),

  clearUserProfile: () =>
    set({
      userProfile: null,
      preferences: defaultPreferences,
      strengthNumbers: {},
      distanceUnits: 'kilometers',
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      currentReadiness: null,
      readinessHistory: [],
      personalRecords: [],
    }),

  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

  setCurrentReadiness: (readiness) => set({ currentReadiness: readiness }),

  addReadinessEntry: (readiness) =>
    set((state) => ({
      currentReadiness: readiness,
      readinessHistory: [...state.readinessHistory, readiness],
    })),

  setReadinessHistory: (history) => set({ readinessHistory: history }),

  addPersonalRecord: (pr) =>
    set((state) => ({ personalRecords: [...state.personalRecords, pr] })),

  updatePersonalRecord: (id, updates) =>
    set((state) => ({
      personalRecords: state.personalRecords.map((pr) =>
        pr.id === id ? { ...pr, ...updates } : pr
      ),
    })),

  setPersonalRecords: (prs) => set({ personalRecords: prs }),

  removePersonalRecord: (id) =>
    set((state) => ({
      personalRecords: state.personalRecords.filter((pr) => pr.id !== id),
    })),

  hasProfile: () => {
    const state = get();
    const result = (
      state.hasCompletedOnboarding === true &&
      !!state.preferences.goal &&
      !!state.preferences.experienceLevel &&
      !!state.preferences.trainingDaysPerWeek
    );
    console.log('[useUserStore] hasProfile() check:', {
      result,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      hasGoal: !!state.preferences.goal,
      goal: state.preferences.goal,
      hasExperienceLevel: !!state.preferences.experienceLevel,
      experienceLevel: state.preferences.experienceLevel,
      hasTrainingDaysPerWeek: !!state.preferences.trainingDaysPerWeek,
      trainingDaysPerWeek: state.preferences.trainingDaysPerWeek,
    });
    return result;
  },
    }),
    {
      name: 'project-athlete-user-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.setHasHydrated) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

export default useUserStore;
