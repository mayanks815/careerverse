'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CareerverseData, mockCareerverseData } from '@/lib/mockData';
import { isFirebaseConfigured } from '@/lib/firebase';
import * as ProfileRepository from '@/lib/repositories/profile';
import * as EducationRepository from '@/lib/repositories/education';
import * as SkillsRepository from '@/lib/repositories/skills';
import * as ExperienceRepository from '@/lib/repositories/experience';
import * as AchievementsRepository from '@/lib/repositories/achievements';
import * as ContactsRepository from '@/lib/repositories/contacts';
import * as SettingsRepository from '@/lib/repositories/settings';

interface ContentContextProps {
  data: CareerverseData;
  isLoading: boolean;
  refresh: () => Promise<void>;
  error: string | null;
}

const ContentContext = createContext<ContentContextProps | undefined>(undefined);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CareerverseData>(mockCareerverseData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track whether auto-seed has already been attempted this session
  const seedAttempted = useRef(false);

  // Silent auto-seed: runs once if Firebase is connected and ALL collections are empty
  const autoSeedIfEmpty = useCallback(async () => {
    if (!isFirebaseConfigured || seedAttempted.current) return;
    
    // Set seedAttempted to true immediately to prevent double/multiple executions
    seedAttempted.current = true;
    console.info('[ContentProvider] All Firestore collections empty — auto-seeding from mockData...');

    try {
      await ProfileRepository.create({ ...mockCareerverseData.profile });

      for (let i = 0; i < mockCareerverseData.education.length; i++) {
        const { id: _id, ...rest } = mockCareerverseData.education[i];
        await EducationRepository.create({ ...rest, display_order: i + 1 });
      }

      for (let i = 0; i < mockCareerverseData.skills.length; i++) {
        const { id: _id, ...rest } = mockCareerverseData.skills[i];
        await SkillsRepository.create({ ...rest, display_order: i + 1 });
      }

      for (let i = 0; i < mockCareerverseData.experience.length; i++) {
        const { id: _id, ...rest } = mockCareerverseData.experience[i];
        await ExperienceRepository.create({ ...rest, display_order: i + 1 });
      }

      for (let i = 0; i < mockCareerverseData.achievements.length; i++) {
        const { id: _id, ...rest } = mockCareerverseData.achievements[i];
        await AchievementsRepository.create({ ...rest, display_order: i + 1 });
      }

      const { id: _cid, ...contactRest } = mockCareerverseData.contact;
      await ContactsRepository.create({ ...contactRest });

      const { id: _sid, ...settingsRest } = mockCareerverseData.settings;
      await SettingsRepository.create({ ...settingsRest });

      console.info('[ContentProvider] Auto-seed complete. onSnapshot will refresh UI automatically.');
    } catch (err) {
      console.error('[ContentProvider] Auto-seed failed:', err);
    }
  }, []);

  // Subscribe once to all repositories
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribes: (() => void)[] = [];

    // Tracks collection hydration
    const hydration = {
      profile: false,
      education: false,
      skills: false,
      experience: false,
      achievements: false,
      contacts: false,
      settings: false,
    };

    // Tracks if each snapshot query was successful
    const successStatus = {
      profile: true,
      education: true,
      skills: true,
      experience: true,
      achievements: true,
      contacts: true,
      settings: true,
    };

    // Stores document counts for successful queries
    const snapshotCounts = {
      profile: -1,
      education: -1,
      skills: -1,
      experience: -1,
      achievements: -1,
      contacts: -1,
      settings: -1,
    };

    let hasPermissionDeniedError = false;

    const checkHydration = () => {
      if (
        hydration.profile &&
        hydration.education &&
        hydration.skills &&
        hydration.experience &&
        hydration.achievements &&
        hydration.contacts &&
        hydration.settings
      ) {
        setIsLoading(false);

        // Check if any subscription returned success: false or a permission denied error
        const anyFailed = Object.values(successStatus).some(status => !status);

        if (hasPermissionDeniedError || anyFailed) {
          setError("Database access restriction detected (Permission Denied). Running in local fallback mode.");
          // Ensure auto-seed is completely disabled
          seedAttempted.current = true;
          return;
        }

        // Auto-seed only runs if Firebase is connected, no errors occurred, and all collections are empty
        if (isFirebaseConfigured) {
          const allCollectionsEmpty =
            snapshotCounts.profile === 0 &&
            snapshotCounts.education === 0 &&
            snapshotCounts.skills === 0 &&
            snapshotCounts.experience === 0 &&
            snapshotCounts.achievements === 0 &&
            snapshotCounts.contacts === 0 &&
            snapshotCounts.settings === 0;

          if (allCollectionsEmpty && !seedAttempted.current) {
            autoSeedIfEmpty();
          }
        }
      }
    };

    try {
      // 1. Profile subscription
      const unsubProfile = ProfileRepository.subscribe((status) => {
        hydration.profile = true;
        successStatus.profile = status.success;
        if (status.error?.code === 'permission-denied' || status.error?.message?.toLowerCase().includes('permission')) {
          hasPermissionDeniedError = true;
        }

        if (status.success) {
          snapshotCounts.profile = status.data.length;
          setData((prev) => ({ ...prev, profile: status.data[0] || mockCareerverseData.profile }));
        } else {
          // Keep portfolio functional using mockData
          setData((prev) => ({ ...prev, profile: mockCareerverseData.profile }));
        }
        checkHydration();
      });
      unsubscribes.push(unsubProfile);

      // 2. Education subscription
      const unsubEdu = EducationRepository.subscribe((status) => {
        hydration.education = true;
        successStatus.education = status.success;
        if (status.error?.code === 'permission-denied' || status.error?.message?.toLowerCase().includes('permission')) {
          hasPermissionDeniedError = true;
        }

        if (status.success) {
          snapshotCounts.education = status.data.length;
          setData((prev) => ({ ...prev, education: status.data }));
        } else {
          setData((prev) => ({ ...prev, education: mockCareerverseData.education }));
        }
        checkHydration();
      });
      unsubscribes.push(unsubEdu);

      // 3. Skills subscription
      const unsubSkills = SkillsRepository.subscribe((status) => {
        hydration.skills = true;
        successStatus.skills = status.success;
        if (status.error?.code === 'permission-denied' || status.error?.message?.toLowerCase().includes('permission')) {
          hasPermissionDeniedError = true;
        }

        if (status.success) {
          snapshotCounts.skills = status.data.length;
          setData((prev) => ({ ...prev, skills: status.data }));
        } else {
          setData((prev) => ({ ...prev, skills: mockCareerverseData.skills }));
        }
        checkHydration();
      });
      unsubscribes.push(unsubSkills);

      // 4. Experience subscription
      const unsubExp = ExperienceRepository.subscribe((status) => {
        hydration.experience = true;
        successStatus.experience = status.success;
        if (status.error?.code === 'permission-denied' || status.error?.message?.toLowerCase().includes('permission')) {
          hasPermissionDeniedError = true;
        }

        if (status.success) {
          snapshotCounts.experience = status.data.length;
          setData((prev) => ({ ...prev, experience: status.data }));
        } else {
          setData((prev) => ({ ...prev, experience: mockCareerverseData.experience }));
        }
        checkHydration();
      });
      unsubscribes.push(unsubExp);

      // 5. Achievements subscription
      const unsubAch = AchievementsRepository.subscribe((status) => {
        hydration.achievements = true;
        successStatus.achievements = status.success;
        if (status.error?.code === 'permission-denied' || status.error?.message?.toLowerCase().includes('permission')) {
          hasPermissionDeniedError = true;
        }

        if (status.success) {
          snapshotCounts.achievements = status.data.length;
          setData((prev) => ({ ...prev, achievements: status.data }));
        } else {
          setData((prev) => ({ ...prev, achievements: mockCareerverseData.achievements }));
        }
        checkHydration();
      });
      unsubscribes.push(unsubAch);

      // 6. Contacts subscription
      const unsubContacts = ContactsRepository.subscribe((status) => {
        hydration.contacts = true;
        successStatus.contacts = status.success;
        if (status.error?.code === 'permission-denied' || status.error?.message?.toLowerCase().includes('permission')) {
          hasPermissionDeniedError = true;
        }

        if (status.success) {
          snapshotCounts.contacts = status.data.length;
          setData((prev) => ({ ...prev, contact: status.data[0] || mockCareerverseData.contact }));
        } else {
          setData((prev) => ({ ...prev, contact: mockCareerverseData.contact }));
        }
        checkHydration();
      });
      unsubscribes.push(unsubContacts);

      // 7. Settings subscription
      const unsubSettings = SettingsRepository.subscribe((status) => {
        hydration.settings = true;
        successStatus.settings = status.success;
        if (status.error?.code === 'permission-denied' || status.error?.message?.toLowerCase().includes('permission')) {
          hasPermissionDeniedError = true;
        }

        if (status.success) {
          snapshotCounts.settings = status.data.length;
          setData((prev) => ({ ...prev, settings: status.data[0] || mockCareerverseData.settings }));
        } else {
          setData((prev) => ({ ...prev, settings: mockCareerverseData.settings }));
        }
        checkHydration();
      });
      unsubscribes.push(unsubSettings);

    } catch (err: any) {
      console.error("ContentProvider subscription error:", err);
      setError(err?.message || "Failed to initialize telemetry database link.");
      setIsLoading(false);
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [autoSeedIfEmpty]);

  // Expose manual refresh function to refetch all repository data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        profileRes,
        educationRes,
        skillsRes,
        experienceRes,
        achievementsRes,
        contactsRes,
        settingsRes,
      ] = await Promise.all([
        ProfileRepository.getAll(),
        EducationRepository.getAll(),
        SkillsRepository.getAll(),
        ExperienceRepository.getAll(),
        AchievementsRepository.getAll(),
        ContactsRepository.getAll(),
        SettingsRepository.getAll(),
      ]);

      const anyFailed = !profileRes.success || !educationRes.success || !skillsRes.success || !experienceRes.success || !achievementsRes.success || !contactsRes.success || !settingsRes.success;
      if (anyFailed) {
        setError("Database access restriction detected (Permission Denied). Running in local fallback mode.");
      }

      setData({
        profile: profileRes.success ? (profileRes.data[0] || mockCareerverseData.profile) : mockCareerverseData.profile,
        education: educationRes.success ? educationRes.data : mockCareerverseData.education,
        skills: skillsRes.success ? skillsRes.data : mockCareerverseData.skills,
        experience: experienceRes.success ? experienceRes.data : mockCareerverseData.experience,
        achievements: achievementsRes.success ? achievementsRes.data : mockCareerverseData.achievements,
        contact: contactsRes.success ? (contactsRes.data[0] || mockCareerverseData.contact) : mockCareerverseData.contact,
        settings: settingsRes.success ? (settingsRes.data[0] || mockCareerverseData.settings) : mockCareerverseData.settings,
      });
    } catch (err: any) {
      console.error("ContentProvider manual refresh error:", err);
      setError(err?.message || "Failed to manually synchronize telemetry database.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <ContentContext.Provider value={{ data, isLoading, refresh, error }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}
