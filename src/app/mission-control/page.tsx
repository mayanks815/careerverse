'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { uploadFile, buildStoragePath } from '@/lib/storage';
import * as ProfileRepository from '@/lib/repositories/profile';
import * as EducationRepository from '@/lib/repositories/education';
import * as SkillsRepository from '@/lib/repositories/skills';
import * as ExperienceRepository from '@/lib/repositories/experience';
import * as AchievementsRepository from '@/lib/repositories/achievements';
import * as ContactsRepository from '@/lib/repositories/contacts';
import * as SettingsRepository from '@/lib/repositories/settings';
import { mockCareerverseData } from '@/lib/mockData';
import { 
  Database, 
  Lock, 
  Globe, 
  BookOpen, 
  Cpu, 
  Briefcase, 
  Award, 
  Send, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff, 
  LogOut,
  RefreshCw,
  Upload,
  ChevronRight,
  Sliders,
  ExternalLink,
  Laptop,
  Check,
  Loader2,
  Volume2,
  VolumeX,
  FolderOpen,
  BarChart2,
  Undo,
  FileText,
  Copy
} from 'lucide-react';
import Link from 'next/link';

// Drag & drop kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { SortableItem } from '@/components/mc/SortableItem';
import { AddEntryDrawer } from '@/components/mc/AddEntryDrawer';
import { subscribeAnalytics } from '@/lib/repositories/analytics';

type TabId = 'profile' | 'education' | 'skills' | 'experience' | 'achievements' | 'contact' | 'settings' | 'storage' | 'analytics';

export default function MissionControl() {
  const { data, addLog, soundMuted, setSoundMuted } = useNavigation();

  // CMS state copies (allows editing)
  const [profileState, setProfileState] = useState(data.profile);
  const [eduState, setEduState] = useState(data.education);
  const [skillsState, setSkillsState] = useState(data.skills);
  const [expState, setExpState] = useState(data.experience);
  const [achState, setAchState] = useState(data.achievements);
  const [contactsState, setContactsState] = useState(data.contact);
  const [settingsState, setSettingsState] = useState(data.settings);

  // Sync state if context loads dynamic data later
  useEffect(() => {
    setProfileState(data.profile);
    setEduState(data.education);
    setSkillsState(data.skills);
    setExpState(data.experience);
    setAchState(data.achievements);
    setContactsState(data.contact);
    setSettingsState(data.settings);
  }, [data]);

  // Auth gate states
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [seedStatus, setSeedStatus] = useState<'idle' | 'seeding' | 'seeded' | 'error'>('idle');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Undo / Delete confirmations
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<{ type: 'education' | 'skills' | 'experience' | 'achievements'; item: any; index: number } | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validation Error state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Storage tab state
  const [storageFiles, setStorageFiles] = useState<{ name: string; url: string; size: string; type: string }[]>([
    { name: 'resume_aditi_mallick.pdf', url: data.profile.resume_url || '#', size: '185 KB', type: 'PDF Document' },
    { name: 'avatar_aditi.jpg', url: data.profile.avatar || '#', size: '840 KB', type: 'Profile Image' },
    { name: 'german_a1_certificate.pdf', url: '#', size: '420 KB', type: 'Certificate PDF' }
  ]);
  const [storageProgress, setStorageProgress] = useState<number | null>(null);

  // Analytics subscription state
  const [analytics, setAnalytics] = useState<any>({
    visitors: 342,
    planetVisits: { core: 245, education: 189, skills: 210, experience: 198, achievements: 154, contact: 120 },
    resumeDownloads: 84,
    contactClicks: 52,
    averageSessionTime: 145,
    lastSyncTime: new Date().toLocaleTimeString()
  });

  // Settings history/reset copy (for Unsaved Warning and Resetting fields)
  const originalSettingsRef = useRef(data.settings);
  useEffect(() => {
    originalSettingsRef.current = data.settings;
  }, [data.settings]);

  // Subscribe to live analytics feed
  useEffect(() => {
    const unsub = subscribeAnalytics((status) => {
      if (status.success) {
        setAnalytics(status.data);
      }
    });
    return () => unsub();
  }, []);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts if focusing inputs or textareas
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.tagName === 'SELECT';

      // 1. ESC to close drawer & deselect
      if (e.key === 'Escape') {
        if (drawerOpen) {
          setDrawerOpen(false);
          addLog("Navigation drawer closed via Escape shortcut.");
        }
        setDeleteConfirmId(null);
        setSelectedRecordId(null);
      }

      // 2. Ctrl + S to save (works even if focusing input)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const saveButton = document.getElementById('cms-save-button');
        if (saveButton && !saveButton.hasAttribute('disabled')) {
          saveButton.click();
        }
      }

      // 3. Arrow Keys to navigate tabs
      if (!isInput && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const tabs: TabId[] = ['profile', 'education', 'skills', 'experience', 'achievements', 'contact', 'settings', 'storage', 'analytics'];
        const currentIndex = tabs.indexOf(activeTab);
        let nextIndex = currentIndex;
        if (e.key === 'ArrowUp') {
          nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : tabs.length - 1;
        } else {
          nextIndex = currentIndex + 1 < tabs.length ? currentIndex + 1 : 0;
        }
        setActiveTab(tabs[nextIndex]);
        setSelectedRecordId(null);
        addLog(`Uplink shifted to: ${tabs[nextIndex].toUpperCase()}`);
      }

      // 4. Delete key to delete selected record
      if (!isInput && e.key === 'Delete' && selectedRecordId) {
        e.preventDefault();
        const deleteButton = document.getElementById(`delete-btn-${selectedRecordId}`);
        if (deleteButton) {
          deleteButton.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, activeTab, selectedRecordId, addLog]);

  // Skill Editor Temporary State
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<'Programming' | 'Frameworks' | 'Automation' | 'Database' | 'Tools' | 'Other'>('Programming');
  const [newSkillProficiency, setNewSkillProficiency] = useState(80);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: '' }) });
        if (res.status === 200) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      }
    };
    checkAuth();
  }, []);

  const handleUnlock = React.useCallback(async () => {
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits.');
      return;
    }
    setIsVerifyingPin(true);
    setPinError('');
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.status === 200) {
        setIsAuthorized(true);
        setShowPinDialog(false);
      } else {
        setPinError('Invalid decryption code.');
        setPin('');
      }
    } catch {
      setPinError('Uplink error.');
    } finally {
      setIsVerifyingPin(false);
    }
  }, [pin]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setIsAuthorized(false);
      setPin('');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Drag End handler
  const handleDragEnd = (event: DragEndEvent, type: 'education' | 'experience' | 'skills' | 'achievements') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (type === 'education') {
      setEduState((items) => {
        const oldIndex = items.findIndex((x) => x.id === active.id);
        const newIndex = items.findIndex((x) => x.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    } else if (type === 'experience') {
      setExpState((items) => {
        const oldIndex = items.findIndex((x) => x.id === active.id);
        const newIndex = items.findIndex((x) => x.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    } else if (type === 'skills') {
      setSkillsState((items) => {
        const oldIndex = items.findIndex((x) => x.id === active.id);
        const newIndex = items.findIndex((x) => x.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    } else if (type === 'achievements') {
      setAchState((items) => {
        const oldIndex = items.findIndex((x) => x.id === active.id);
        const newIndex = items.findIndex((x) => x.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    addLog(`CMS: Reordered list item in ${type}.`);
  };

  // Upload Avatar/Resume/Certificate to Storage
  const handleFileUpload = async (type: 'avatar' | 'resume' | 'certificate', file: File) => {
    // Basic file checks
    if (!file) return;

    addLog(`CMS: Initializing storage transfer for ${file.name}...`);
    setStorageProgress(10);

    if (!isFirebaseConfigured) {
      // Offline Simulated upload with progress bar
      let currentProgress = 10;
      const interval = setInterval(() => {
        currentProgress += 25;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setStorageProgress(100);
          
          const objectUrl = '#'; // Fallback link
          const newFile = {
            name: file.name,
            url: objectUrl,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type || 'System Binary'
          };
          
          setStorageFiles(prev => [newFile, ...prev]);
          if (type === 'avatar') {
            setProfileState(prev => ({ ...prev, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300&q=80' }));
          } else if (type === 'resume') {
            setProfileState(prev => ({ ...prev, resume_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }));
          }
          
          addLog(`CMS: Simulated upload of ${file.name} finished. Status: DOCKED.`);
          setTimeout(() => setStorageProgress(null), 1000);
        } else {
          setStorageProgress(currentProgress);
        }
      }, 250);
      return;
    }

    // Live Firebase Upload
    try {
      const category = type === 'avatar' ? 'avatars' : type === 'resume' ? 'resume' : 'certificates';
      const path = buildStoragePath(category, file.name);
      setStorageProgress(35);
      
      const url = await uploadFile(path, file);
      setStorageProgress(80);

      const newFile = {
        name: file.name,
        url,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || 'Cloud Resource'
      };

      setStorageFiles(prev => [newFile, ...prev]);
      if (type === 'avatar') {
        setProfileState(prev => ({ ...prev, avatar: url }));
      } else if (type === 'resume') {
        setProfileState(prev => ({ ...prev, resume_url: url }));
      }

      setStorageProgress(100);
      addLog(`CMS: Cloud upload of ${file.name} complete.`);
      setTimeout(() => setStorageProgress(null), 1000);
    } catch (err: any) {
      console.error(err);
      setStorageProgress(null);
      addLog(`CMS Error: Cloud transfer aborted: ${err.message || 'uplink timeout'}`);
    }
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Email check
    if (contactsState.email && (!contactsState.email.includes('@') || !contactsState.email.includes('.'))) {
      errors.email = "Email must be a valid email address containing '@' and '.'";
    }

    // 2. LinkedIn check
    if (contactsState.linkedin && !contactsState.linkedin.startsWith('http') && !contactsState.linkedin.startsWith('www.')) {
      errors.linkedin = "LinkedIn link must start with http/https or www.";
    }

    // 3. GitHub check
    if (contactsState.github && !contactsState.github.startsWith('http') && !contactsState.github.startsWith('www.')) {
      errors.github = "GitHub link must start with http/https or www.";
    }

    // 4. Custom Socials check (handles phone vs url validation)
    Object.entries(contactsState.socials || {}).forEach(([key, val]) => {
      const isPhone = key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile') || key.toLowerCase().includes('tel');
      if (isPhone) {
        const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
        if (val && !phoneRegex.test(val)) {
          errors[`social_${key}`] = `Phone number "${val}" must contain only digits, spaces, dashes or parentheses.`;
        }
      } else {
        if (val && !val.startsWith('http') && !val.startsWith('www.') && !val.startsWith('mailto:') && !val.startsWith('tel:')) {
          errors[`social_${key}`] = `Social link "${key}" must be a valid URL starting with http/https.`;
        }
      }
    });

    // 5. Profile name validation
    if (!profileState.name.trim()) {
      errors.profileName = "Profile name cannot be empty.";
    }

    // 6. Settings numeric parameters validation
    const wSpeed = Number(settingsState.warpSpeed);
    const lDuration = Number(settingsState.landingDuration);
    if (settingsState.warpSpeed !== undefined && (isNaN(wSpeed) || wSpeed < 0.1 || wSpeed > 10.0)) {
      errors.warpSpeed = "Warp speed duration must be a number between 0.1 and 10 seconds.";
    }
    if (settingsState.landingDuration !== undefined && (isNaN(lDuration) || lDuration < 0.1 || lDuration > 10.0)) {
      errors.landingDuration = "Landing speed duration must be a number between 0.1 and 10 seconds.";
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      addLog(`CMS Validation Error: ${Object.values(errors)[0]}`);
      return false;
    }
    return true;
  };

  // Save changes to repositories
  const handleSave = async () => {
    // Run validation checks
    if (!validateFields()) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
      return;
    }

    setSaveStatus('saving');
    addLog("CMS: Packaging updates...");
    try {
      // 1. Sync Profile
      await ProfileRepository.update(profileState.id || 'default', {
        name: profileState.name,
        title: profileState.title,
        tagline: profileState.tagline,
        bio: profileState.bio,
        avatar: profileState.avatar,
        resume_url: profileState.resume_url,
      });

      // 2. Sync Settings
      await SettingsRepository.update(settingsState.id || 'default', {
        theme: settingsState.theme,
        maintenanceMode: settingsState.maintenanceMode,
        accentColor: settingsState.accentColor || 'blue',
        animationSpeed: Number(settingsState.animationSpeed ?? 1),
        warpSpeed: Number(settingsState.warpSpeed ?? 1.5),
        landingDuration: Number(settingsState.landingDuration ?? 1.0),
        soundEnabled: !!settingsState.soundEnabled,
        backgroundMusicEnabled: !!settingsState.backgroundMusicEnabled,
        reducedMotion: !!settingsState.reducedMotion,
      });

      // 3. Sync Contacts
      await ContactsRepository.update(contactsState.id || 'default', {
        email: contactsState.email,
        linkedin: contactsState.linkedin,
        github: contactsState.github,
        socials: contactsState.socials || {},
      });

      // 4. Sync Education
      const initialEduRes = await EducationRepository.getAll();
      if (!initialEduRes.success) throw new Error("Failed to load initial education data. Sync aborted.");
      const initialEdu = initialEduRes.data;
      const currentEduIds = new Set(eduState.map(item => item.id));
      for (const item of initialEdu) {
        if (!currentEduIds.has(item.id)) {
          await EducationRepository.remove(item.id);
        }
      }
      for (let i = 0; i < eduState.length; i++) {
        const item = eduState[i];
        const itemData = { ...item, display_order: i + 1 };
        if (!initialEdu.some(x => x.id === item.id)) {
          await EducationRepository.create(itemData);
        } else {
          await EducationRepository.update(item.id, itemData);
        }
      }

      // 5. Sync Skills
      const initialSkillsRes = await SkillsRepository.getAll();
      if (!initialSkillsRes.success) throw new Error("Failed to load initial skills data. Sync aborted.");
      const initialSkills = initialSkillsRes.data;
      const currentSkillIds = new Set(skillsState.map(item => item.id));
      for (const item of initialSkills) {
        if (!currentSkillIds.has(item.id)) {
          await SkillsRepository.remove(item.id);
        }
      }
      for (let i = 0; i < skillsState.length; i++) {
        const item = skillsState[i];
        const itemData = { ...item, display_order: i + 1 };
        if (!initialSkills.some(x => x.id === item.id)) {
          await SkillsRepository.create(itemData);
        } else {
          await SkillsRepository.update(item.id, itemData);
        }
      }

      // 6. Sync Experience
      const initialExpRes = await ExperienceRepository.getAll();
      if (!initialExpRes.success) throw new Error("Failed to load initial experience data. Sync aborted.");
      const initialExp = initialExpRes.data;
      const currentExpIds = new Set(expState.map(item => item.id));
      for (const item of initialExp) {
        if (!currentExpIds.has(item.id)) {
          await ExperienceRepository.remove(item.id);
        }
      }
      for (let i = 0; i < expState.length; i++) {
        const item = expState[i];
        const itemData = { ...item, display_order: i + 1 };
        if (!initialExp.some(x => x.id === item.id)) {
          await ExperienceRepository.create(itemData);
        } else {
          await ExperienceRepository.update(item.id, itemData);
        }
      }

      // 7. Sync Achievements
      const initialAchRes = await AchievementsRepository.getAll();
      if (!initialAchRes.success) throw new Error("Failed to load initial achievements data. Sync aborted.");
      const initialAch = initialAchRes.data;
      const currentAchIds = new Set(achState.map(item => item.id));
      for (const item of initialAch) {
        if (!currentAchIds.has(item.id)) {
          await AchievementsRepository.remove(item.id);
        }
      }
      for (let i = 0; i < achState.length; i++) {
        const item = achState[i];
        const itemData = { ...item, display_order: i + 1 };
        if (!initialAch.some(x => x.id === item.id)) {
          await AchievementsRepository.create(itemData);
        } else {
          await AchievementsRepository.update(item.id, itemData);
        }
      }

      setSaveStatus('saved');
      addLog("CMS: Successfully synced all records to database.");
      
      // Reload preview panel iframe
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }

      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus('error');
      addLog(`CMS Save Error: ${err.message || "Uplink packet lost."}`);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Seed Firestore
  const seedPortfolio = async () => {
    if (!isFirebaseConfigured) return;
    setSeedStatus('seeding');
    addLog("CMS: Re-initializing databases with Aditi's portfolio...");
    try {
      // 1. Reset Profile
      addLog("CMS: Resetting profiles collection...");
      const profilesRes = await ProfileRepository.getAll();
      if (profilesRes.success) {
        for (const p of profilesRes.data) {
          await ProfileRepository.remove(p.id);
        }
      }
      await ProfileRepository.create({ ...mockCareerverseData.profile });

      // 2. Reset Education
      addLog("CMS: Resetting education collection...");
      const eduRes = await EducationRepository.getAll();
      if (eduRes.success) {
        for (const e of eduRes.data) {
          await EducationRepository.remove(e.id);
        }
      }
      for (let i = 0; i < mockCareerverseData.education.length; i++) {
        const dataRest = { ...mockCareerverseData.education[i] };
        delete (dataRest as any).id;
        await EducationRepository.create({ ...dataRest, display_order: i + 1 });
      }

      // 3. Reset Skills
      addLog("CMS: Resetting skills collection...");
      const skillsRes = await SkillsRepository.getAll();
      if (skillsRes.success) {
        for (const s of skillsRes.data) {
          await SkillsRepository.remove(s.id);
        }
      }
      for (let i = 0; i < mockCareerverseData.skills.length; i++) {
        const dataRest = { ...mockCareerverseData.skills[i] };
        delete (dataRest as any).id;
        await SkillsRepository.create({ ...dataRest, display_order: i + 1 });
      }

      // 4. Reset Experience
      addLog("CMS: Resetting experience collection...");
      const expRes = await ExperienceRepository.getAll();
      if (expRes.success) {
        for (const e of expRes.data) {
          await ExperienceRepository.remove(e.id);
        }
      }
      for (let i = 0; i < mockCareerverseData.experience.length; i++) {
        const dataRest = { ...mockCareerverseData.experience[i] };
        delete (dataRest as any).id;
        await ExperienceRepository.create({ ...dataRest, display_order: i + 1 });
      }

      // 5. Reset Achievements
      addLog("CMS: Resetting achievements collection...");
      const achRes = await AchievementsRepository.getAll();
      if (achRes.success) {
        for (const a of achRes.data) {
          await AchievementsRepository.remove(a.id);
        }
      }
      for (let i = 0; i < mockCareerverseData.achievements.length; i++) {
        const dataRest = { ...mockCareerverseData.achievements[i] };
        delete (dataRest as any).id;
        await AchievementsRepository.create({ ...dataRest, display_order: i + 1 });
      }

      // 6. Reset Contacts
      addLog("CMS: Resetting contacts collection...");
      const contactsRes = await ContactsRepository.getAll();
      if (contactsRes.success) {
        for (const c of contactsRes.data) {
          await ContactsRepository.remove(c.id);
        }
      }
      const contactRest = { ...mockCareerverseData.contact };
      delete (contactRest as any).id;
      await ContactsRepository.create({ ...contactRest });

      // 7. Reset Settings
      addLog("CMS: Resetting settings collection...");
      const settingsRes = await SettingsRepository.getAll();
      if (settingsRes.success) {
        for (const s of settingsRes.data) {
          await SettingsRepository.remove(s.id);
        }
      }
      const settingsRest = { ...mockCareerverseData.settings };
      delete (settingsRest as any).id;
      await SettingsRepository.create({ ...settingsRest });

      setSeedStatus('seeded');
      addLog("CMS: Database successfully reset and seeded with Aditi's real data.");
      setTimeout(() => setSeedStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setSeedStatus('error');
      addLog(`CMS Seed Error: ${err.message}`);
      setTimeout(() => setSeedStatus('idle'), 3000);
    }
  };

  // Visibility toggle
  const toggleVisibility = (type: 'education' | 'skills' | 'experience' | 'achievements', id: string) => {
    if (type === 'education') {
      setEduState(prev => prev.map(item => item.id === id ? { ...item, is_visible: !item.is_visible } : item));
    } else if (type === 'skills') {
      setSkillsState(prev => prev.map(item => item.id === id ? { ...item, is_visible: !item.is_visible } : item));
    } else if (type === 'experience') {
      setExpState(prev => prev.map(item => item.id === id ? { ...item, is_visible: !item.is_visible } : item));
    } else if (type === 'achievements') {
      setAchState(prev => prev.map(item => item.id === id ? { ...item, is_visible: !item.is_visible } : item));
    }
    addLog(`CMS: Toggled visibility status for entry in ${type}.`);
  };

  // Add new items
  const addNewSkill = () => {
    if (!newSkillName.trim()) return;
    const newItem = {
      id: `skill-${Date.now()}`,
      skill_name: newSkillName,
      category: newSkillCategory,
      proficiency: newSkillProficiency,
      is_visible: true,
      display_order: skillsState.length + 1
    };
    setSkillsState(prev => [...prev, newItem]);
    setNewSkillName('');
    addLog(`CMS: Added skill '${newSkillName}' to category ${newSkillCategory}.`);
  };

  const deleteItem = async (type: 'education' | 'skills' | 'experience' | 'achievements', id: string) => {
    // 1. Confirmation check
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      // Auto reset confirmation after 4 seconds
      setTimeout(() => setDeleteConfirmId(null), 4000);
      return;
    }

    setDeleteConfirmId(null);
    setSelectedRecordId(null);

    // 2. Locate the item and index
    let itemToDelete: any = null;
    let deletedIndex = -1;

    if (type === 'education') {
      deletedIndex = eduState.findIndex(x => x.id === id);
      itemToDelete = eduState[deletedIndex];
      setEduState(prev => prev.filter(item => item.id !== id));
    } else if (type === 'skills') {
      deletedIndex = skillsState.findIndex(x => x.id === id);
      itemToDelete = skillsState[deletedIndex];
      setSkillsState(prev => prev.filter(item => item.id !== id));
    } else if (type === 'experience') {
      deletedIndex = expState.findIndex(x => x.id === id);
      itemToDelete = expState[deletedIndex];
      setExpState(prev => prev.filter(item => item.id !== id));
    } else if (type === 'achievements') {
      deletedIndex = achState.findIndex(x => x.id === id);
      itemToDelete = achState[deletedIndex];
      setAchState(prev => prev.filter(item => item.id !== id));
    }

    if (!itemToDelete) return;

    // 3. Store in undoItem state and show toast
    setUndoItem({ type, item: itemToDelete, index: deletedIndex });
    setShowUndoToast(true);
    addLog(`CMS: Removed item from ${type}. 10s remaining to undo.`);

    // Clear existing timeout
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    // Set 10s expiration
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndoToast(false);
      setUndoItem(null);
    }, 10000);

    // 4. Update Firestore immediately
    try {
      if (type === 'education') {
        await EducationRepository.remove(id);
      } else if (type === 'skills') {
        await SkillsRepository.remove(id);
      } else if (type === 'experience') {
        await ExperienceRepository.remove(id);
      } else if (type === 'achievements') {
        await AchievementsRepository.remove(id);
      }
    } catch (err) {
      console.error(`Error deleting ${type} in Firestore:`, err);
      addLog(`CMS Error: Firestore delete failed.`);
    }
  };

  const handleUndo = async () => {
    if (!undoItem) return;
    const { type, item, index } = undoItem;
    
    // Clear toast
    setShowUndoToast(false);
    setUndoItem(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    addLog(`CMS: Restoring item back to ${type}...`);

    // 1. Put back into state
    if (type === 'education') {
      setEduState(prev => {
        const next = [...prev];
        next.splice(index, 0, item);
        return next;
      });
    } else if (type === 'skills') {
      setSkillsState(prev => {
        const next = [...prev];
        next.splice(index, 0, item);
        return next;
      });
    } else if (type === 'experience') {
      setExpState(prev => {
        const next = [...prev];
        next.splice(index, 0, item);
        return next;
      });
    } else if (type === 'achievements') {
      setAchState(prev => {
        const next = [...prev];
        next.splice(index, 0, item);
        return next;
      });
    }

    // 2. Put back into Firestore
    try {
      const dataRest = { ...item };
      delete (dataRest as any).id;
      if (type === 'education') {
        await EducationRepository.create({ ...dataRest });
      } else if (type === 'skills') {
        await SkillsRepository.create({ ...dataRest });
      } else if (type === 'experience') {
        await ExperienceRepository.create({ ...dataRest });
      } else if (type === 'achievements') {
        await AchievementsRepository.create({ ...dataRest });
      }
      addLog(`CMS: Item restored successfully.`);
    } catch (err) {
      console.error(`Error restoring ${type} to Firestore:`, err);
      addLog(`CMS Error: Restoring item failed.`);
    }
  };

  const duplicateItem = async (type: 'education' | 'skills' | 'experience' | 'achievements', id: string) => {
    addLog(`CMS: Duplicating item in ${type}...`);
    try {
      if (type === 'education') {
        const orig = eduState.find(x => x.id === id);
        if (orig) {
          const dataRest = { ...orig };
          delete (dataRest as any).id;
          const newRecord = { ...dataRest, degree: `${orig.degree} (Copy)`, display_order: eduState.length + 1 };
          const newId = await EducationRepository.create(newRecord);
          setEduState(prev => [...prev, { ...newRecord, id: newId }]);
        }
      } else if (type === 'skills') {
        const orig = skillsState.find(x => x.id === id);
        if (orig) {
          const dataRest = { ...orig };
          delete (dataRest as any).id;
          const newRecord = { ...dataRest, skill_name: `${orig.skill_name} (Copy)`, display_order: skillsState.length + 1 };
          const newId = await SkillsRepository.create(newRecord);
          setSkillsState(prev => [...prev, { ...newRecord, id: newId }]);
        }
      } else if (type === 'experience') {
        const orig = expState.find(x => x.id === id);
        if (orig) {
          const dataRest = { ...orig };
          delete (dataRest as any).id;
          const newRecord = { ...dataRest, role: `${orig.role} (Copy)`, display_order: expState.length + 1 };
          const newId = await ExperienceRepository.create(newRecord);
          setExpState(prev => [...prev, { ...newRecord, id: newId }]);
        }
      } else if (type === 'achievements') {
        const orig = achState.find(x => x.id === id);
        if (orig) {
          const dataRest = { ...orig };
          delete (dataRest as any).id;
          const newRecord = { ...dataRest, title: `${orig.title} (Copy)`, display_order: achState.length + 1 };
          const newId = await AchievementsRepository.create(newRecord);
          setAchState(prev => [...prev, { ...newRecord, id: newId }]);
        }
      }
      addLog(`CMS: Item duplicated in ${type} and synced immediately.`);
    } catch (err: any) {
      console.error(`Error duplicating ${type}:`, err);
      addLog(`CMS Error: Duplication failed.`);
    }
  };

  // Listen to keyboard digits when PIN dialog is open
  useEffect(() => {
    if (!showPinDialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVerifyingPin) return;
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          setPin((prev) => prev + e.key);
          setPinError('');
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setPinError('');
      } else if (e.key === 'Enter') {
        if (pin.length > 0) {
          handleUnlock();
        }
      } else if (e.key === 'Escape') {
        setShowPinDialog(false);
        setPin('');
        setPinError('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinDialog, pin, isVerifyingPin, handleUnlock]);

  const triggerAddDrawer = () => {
    if (activeTab === 'education' || activeTab === 'experience' || activeTab === 'achievements') {
      setDrawerOpen(true);
    }
  };

  // Drawer Add Handlers
  const handleDrawerAdd = (newRecord: any) => {
    if (activeTab === 'education') {
      setEduState(prev => [...prev, newRecord]);
    } else if (activeTab === 'experience') {
      setExpState(prev => [...prev, newRecord]);
    } else if (activeTab === 'achievements') {
      setAchState(prev => [...prev, newRecord]);
    }
    addLog(`CMS: Appended new entry in ${activeTab}. Save to commit changes.`);
  };

  // Loading state during session check
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="space-y-4 text-center z-10 max-w-sm">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mx-auto" />
          <div className="space-y-1">
            <h1 className="text-sm font-semibold text-white tracking-tight">Authenticating Session</h1>
            <p className="text-xs text-zinc-500 font-light">Verifying credentials with command uplink...</p>
          </div>
        </div>
      </div>
    );
  }

  // ACCESS SCREEN
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-850 rounded-2xl p-8 space-y-6 shadow-2xl relative z-10">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-white tracking-tight">Authorization Required</h1>
              <p className="text-xs text-zinc-400 font-light">
                Mission Control requires a security clearance verification.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1.5 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold text-zinc-350">Uplink Status: Secure Offline</span>
            </div>
            <p className="leading-relaxed">
              Enter the valid server decryption PIN code below to unlock CMS nodes and enable database editing.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                setShowPinDialog(true);
                setPinError('');
              }}
              className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
            >
              <Lock className="w-4 h-4" />
              Unlock Dashboard
            </button>
            
            <div className="text-center pt-2">
              <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1.5">
                Return to Portfolio Universe
              </Link>
            </div>
          </div>
        </div>

        {/* PIN DIALOG MODAL */}
        {showPinDialog && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.15s_ease-out]">
            <div className="bg-zinc-900 w-full max-w-sm border border-zinc-850 rounded-2xl p-6 space-y-6 shadow-2xl relative">
              <div className="text-center space-y-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Security Access PIN</h2>
                <p className="text-xs text-zinc-500 font-light">
                  Enter decryption credentials below
                </p>
              </div>

              {/* Pin Display digits indicator */}
              <div className="space-y-3">
                <div className="flex justify-center gap-2.5">
                  {[0, 1, 2, 3].map((idx) => {
                    const hasChar = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center text-lg font-bold transition-all ${
                          hasChar
                            ? 'border-white text-white bg-zinc-850 shadow-inner'
                            : 'border-zinc-800 text-zinc-700 bg-zinc-950/60'
                        }`}
                      >
                        {hasChar ? '•' : ''}
                      </div>
                    );
                  })}
                </div>
                
                {pinError && (
                  <div className="text-rose-400 text-xs text-center bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg font-medium">
                    {pinError}
                  </div>
                )}
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      if (pin.length < 4) {
                        setPin((prev) => prev + num);
                        setPinError('');
                      }
                    }}
                    disabled={isVerifyingPin}
                    className="py-2.5 bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700 text-white font-semibold text-base rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Clear */}
                <button
                  onClick={() => {
                    setPin('');
                    setPinError('');
                  }}
                  disabled={isVerifyingPin}
                  className="py-2.5 bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-850 text-zinc-500 hover:text-white font-medium text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Clear
                </button>

                {/* 0 */}
                <button
                  onClick={() => {
                    if (pin.length < 4) {
                      setPin((prev) => prev + '0');
                      setPinError('');
                    }
                  }}
                  disabled={isVerifyingPin}
                  className="py-2.5 bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700 text-white font-semibold text-base rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  onClick={() => {
                    setPin((prev) => prev.slice(0, -1));
                    setPinError('');
                  }}
                  disabled={isVerifyingPin}
                  className="py-2.5 bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-850 text-zinc-500 hover:text-white font-medium text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  ⌫
                </button>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="flex gap-2 border-t border-zinc-850 pt-4">
                <button
                  onClick={() => {
                    setShowPinDialog(false);
                    setPin('');
                    setPinError('');
                  }}
                  disabled={isVerifyingPin}
                  className="flex-1 py-2.5 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl transition-all text-xs font-semibold cursor-pointer"
                >
                  Abort
                </button>
                <button
                  onClick={() => handleUnlock()}
                  disabled={isVerifyingPin || pin.length === 0}
                  className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingPin ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Unlocking...
                    </>
                  ) : (
                    'Unlock'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN CMS DASHBOARD
  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col font-sans select-text text-zinc-200 overflow-hidden">
      
      {/* 1. TOP NAVIGATION BAR (Fixed, reserves layout space, no overlap) */}
      <header className="h-16 border-b border-zinc-850 bg-zinc-950 px-6 flex items-center justify-between shrink-0 select-none z-30">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300">
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">Careerverse Control</span>
            <span className="text-zinc-700 text-xs">/</span>
            <span className="text-xs font-semibold text-zinc-400 capitalize">{activeTab}</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Firestore Status indicator */}
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-850/80 rounded-full px-3 py-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-[11px] font-medium text-zinc-300 font-mono">
              {isFirebaseConfigured ? 'Firestore Live' : 'Mock Fallback Mode'}
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-850" />

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className="p-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Preview Toggle (Hides/Shows the Live Preview iframe panel) */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 border rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                showPreview 
                  ? 'bg-zinc-900 border-zinc-700 text-white shadow-inner' 
                  : 'border-zinc-800 hover:bg-zinc-900 text-zinc-500 hover:text-white'
              }`}
              title={showPreview ? 'Hide Live Preview' : 'Show Live Preview'}
            >
              <Laptop className="w-4 h-4" />
            </button>

            <Link 
              href="/"
              className="px-3.5 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-350 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              View Portfolio
            </Link>

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-zinc-500" />
                  Save
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Terminate Secure Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. THREE-COLUMN DESKTOP WORKSPACE LAYOUT (Scroll independent, no cover/overlap) */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        
        {/* COLUMN 1: NAVIGATION SIDEBAR (Scrolls independently, horizontal swipe on mobile) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-850 bg-zinc-950 p-3 md:p-5 flex flex-row md:flex-col justify-between items-center md:items-stretch overflow-x-auto md:overflow-y-auto shrink-0 gap-4 md:gap-6 select-none scrollbar-none">
          <div className="flex flex-row md:flex-col items-center md:items-stretch gap-2 w-max md:w-auto shrink-0">
            <div className="hidden md:block text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-1">Sections</div>
            <div className="flex flex-row md:flex-col gap-1 w-max md:w-auto shrink-0">
              {[
                { id: 'profile', label: 'Admin Profile', icon: <Globe className="w-4 h-4" /> },
                { id: 'education', label: 'Education Systems', icon: <BookOpen className="w-4 h-4" /> },
                { id: 'skills', label: 'Skills Satellites', icon: <Cpu className="w-4 h-4" /> },
                { id: 'experience', label: 'Experience Pods', icon: <Briefcase className="w-4 h-4" /> },
                { id: 'achievements', label: 'Achievement Belt', icon: <Award className="w-4 h-4" /> },
                { id: 'contact', label: 'Contact Terminals', icon: <Send className="w-4 h-4" /> },
                { id: 'settings', label: 'Global Settings', icon: <Sliders className="w-4 h-4" /> },
                { id: 'storage', label: 'Storage Node', icon: <FolderOpen className="w-4 h-4" /> },
                { id: 'analytics', label: 'Analytics Uplink', icon: <BarChart2 className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`px-3 py-2 md:px-3.5 md:py-3 rounded-xl text-left flex items-center justify-between font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
                      : 'text-zinc-500 border border-transparent hover:bg-zinc-900/50 hover:text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-2 md:gap-3 text-xs font-medium">
                    {tab.icon}
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </span>
                  {activeTab === tab.id && <ChevronRight className="hidden md:block w-3.5 h-3.5 text-zinc-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Seed Info Box (Hidden on Mobile) */}
          {isFirebaseConfigured && (
            <div className="hidden md:block bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl space-y-3">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Database Seed</div>
              <p className="text-[11px] text-zinc-500 leading-normal font-light">Seeding Firestore populates default mock entries in empty collections.</p>
              <button
                onClick={seedPortfolio}
                disabled={seedStatus === 'seeding'}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {seedStatus === 'seeding' ? 'Seeding...' : seedStatus === 'seeded' ? 'Database Seeded' : 'Seed Mock Data'}
              </button>
            </div>
          )}
        </aside>

        {/* COLUMN 2: MAIN EDITOR AREA (Scrolls independently, spacious padding, high-contrast typography) */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-8 md:p-10 space-y-8">
          
          {/* Header block with obivous Add actions */}
          <div className="flex items-center justify-between border-b border-zinc-850 pb-6 mb-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight capitalize">
                {activeTab === 'contact' ? 'Contact Details' : activeTab === 'profile' ? 'Profile Details' : activeTab === 'settings' ? 'Settings Node' : activeTab}
              </h2>
              <p className="text-sm text-zinc-400 font-light max-w-xl leading-normal">
                {activeTab === 'profile' && 'Update primary credentials, professional titles, descriptions, profile photo and CV file.'}
                {activeTab === 'education' && 'Add programs, institution timeline details and drag items to reorder them.'}
                {activeTab === 'skills' && 'Manage proficiencies and categorize core capabilities.'}
                {activeTab === 'experience' && 'Create job records, milestones and technology lists.'}
                {activeTab === 'achievements' && 'Highlight certifications, credentials and awards.'}
                {activeTab === 'contact' && 'Configure active portfolio communication links.'}
                {activeTab === 'settings' && 'Toggle maintenance mode settings and preferences.'}
              </p>
            </div>

            {/* Obvious Add action */}
            {(activeTab === 'education' || activeTab === 'experience' || activeTab === 'achievements') && (
              <button
                onClick={triggerAddDrawer}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Record
              </button>
            )}
          </div>

          {/* TAB 1: PROFILE EDIT */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-3xl bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-350">Full Name</label>
                  <input 
                    type="text" 
                    value={profileState.name}
                    onChange={(e) => {
                      setProfileState({ ...profileState, name: e.target.value });
                      if (validationErrors.profileName) {
                        setValidationErrors(prev => {
                          const next = { ...prev };
                          delete next.profileName;
                          return next;
                        });
                      }
                    }}
                    className={`w-full cms-input ${validationErrors.profileName ? 'border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {validationErrors.profileName && (
                    <span className="text-[11px] text-rose-450 font-medium block mt-1">{validationErrors.profileName}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-355">Professional Title</label>
                  <input 
                    type="text" 
                    value={profileState.title}
                    onChange={(e) => setProfileState({ ...profileState, title: e.target.value })}
                    className="w-full cms-input"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-355">Bio Tagline</label>
                  <input 
                    type="text" 
                    value={profileState.tagline}
                    onChange={(e) => setProfileState({ ...profileState, tagline: e.target.value })}
                    className="w-full cms-input"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-355">Bio Description</label>
                  <textarea 
                    value={profileState.bio}
                    rows={4}
                    onChange={(e) => setProfileState({ ...profileState, bio: e.target.value })}
                    className="w-full cms-input resize-none"
                  />
                </div>
                
                {/* File Upload Fields */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-355">Avatar Image</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={profileState.avatar}
                      onChange={(e) => setProfileState({ ...profileState, avatar: e.target.value })}
                      className="flex-1 cms-input text-xs"
                      placeholder="Avatar URL or upload..."
                    />
                    {isFirebaseConfigured ? (
                      <>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('avatar', e.target.files[0])}
                        />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={storageProgress !== null}
                          className="px-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {storageProgress !== null ? '...' : 'Upload'}
                        </button>
                      </>
                    ) : (
                      <button disabled className="px-3.5 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded-xl text-xs font-semibold cursor-not-allowed">Upload</button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-355">Resume PDF URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={profileState.resume_url}
                      onChange={(e) => setProfileState({ ...profileState, resume_url: e.target.value })}
                      className="flex-1 cms-input text-xs"
                      placeholder="Resume URL or upload..."
                    />
                    {isFirebaseConfigured ? (
                      <>
                        <input
                          ref={resumeInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('resume', e.target.files[0])}
                        />
                        <button
                          type="button"
                          onClick={() => resumeInputRef.current?.click()}
                          disabled={storageProgress !== null}
                          className="px-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {storageProgress !== null ? '...' : 'Upload'}
                        </button>
                      </>
                    ) : (
                      <button disabled className="px-3.5 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded-xl text-xs font-semibold cursor-not-allowed">Upload</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDUCATION TIMELINE */}
          {activeTab === 'education' && (
            <div className="space-y-4 max-w-3xl">
              {eduState.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/30 border border-dashed border-zinc-850 rounded-2xl space-y-3">
                  <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-355">No Education Records found</p>
                    <p className="text-xs text-zinc-500 mt-1">Click the Add New Record button to create a degree timeline entry.</p>
                  </div>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'education')}>
                  <SortableContext items={eduState.map((x) => x.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {eduState.map((edu) => (
                        <SortableItem key={edu.id} id={edu.id}>
                          <div 
                            onClick={() => setSelectedRecordId(edu.id)}
                            className={`flex items-center justify-between gap-4 p-2.5 rounded-xl border transition-all cursor-pointer ${
                              selectedRecordId === edu.id 
                                ? 'border-blue-500 bg-zinc-900/70 shadow-lg ring-1 ring-blue-500/15' 
                                : 'border-transparent hover:bg-zinc-900/25'
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-semibold text-white text-sm">{edu.degree}</div>
                              <div className="text-xs text-zinc-500 font-light mt-1">{edu.institution} • {edu.duration}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVisibility('education', edu.id);
                                }}
                                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Toggle visibility"
                              >
                                {edu.is_visible ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateItem('education', edu.id);
                                }}
                                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Duplicate record"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                id={`delete-btn-${edu.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem('education', edu.id);
                                }}
                                className={`p-2 rounded-lg transition-all cursor-pointer ${
                                  deleteConfirmId === edu.id 
                                    ? 'bg-rose-600 text-white animate-pulse' 
                                    : 'hover:bg-rose-500/10 text-zinc-400 hover:text-rose-455'
                                }`}
                                title={deleteConfirmId === edu.id ? "Click again to confirm" : "Delete record"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* TAB 3: SKILLS SATELLITES */}
          {activeTab === 'skills' && (
            <div className="space-y-6 max-w-3xl">
              {/* Add New Skill Form */}
              <div className="p-6 bg-zinc-900/60 border border-zinc-850 rounded-2xl space-y-4">
                <div className="text-sm font-semibold text-zinc-300">Launch New Skill Node</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400">Skill Name</label>
                    <input 
                      type="text" 
                      placeholder="GLSL Shaders" 
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="w-full cms-input text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400">Category Group</label>
                    <select
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value as any)}
                      className="w-full cms-input cms-select text-xs"
                    >
                      <option value="Programming">Programming</option>
                      <option value="Frameworks">Frameworks</option>
                      <option value="Automation">Automation</option>
                      <option value="Database">Database</option>
                      <option value="Tools">Tools</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 flex justify-between">
                      <span>Proficiency</span>
                      <span className="text-zinc-355">{newSkillProficiency}%</span>
                    </label>
                    <div className="flex items-center h-10">
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={newSkillProficiency}
                        onChange={(e) => setNewSkillProficiency(Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={addNewSkill}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Launch Skill
                  </button>
                </div>
              </div>

              {/* Skill items drag list */}
              {skillsState.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/30 border border-dashed border-zinc-850 rounded-2xl space-y-3">
                  <Cpu className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-355">No Skill Nodes</p>
                    <p className="text-xs text-zinc-500 mt-1">Use the launcher tool above to append capabilities.</p>
                  </div>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'skills')}>
                  <SortableContext items={skillsState.map((x) => x.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {skillsState.map((skill) => (
                        <SortableItem key={skill.id} id={skill.id}>
                          <div 
                            onClick={() => setSelectedRecordId(skill.id)}
                            className={`flex items-center justify-between gap-4 p-2 rounded-xl border transition-all cursor-pointer ${
                              selectedRecordId === skill.id 
                                ? 'border-blue-500 bg-zinc-900/70 shadow-lg ring-1 ring-blue-500/15' 
                                : 'border-transparent hover:bg-zinc-900/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-850 px-2.5 py-0.5 rounded border border-zinc-800">
                                  {skill.category}
                              </span>
                              <span className="font-semibold text-white text-sm">{skill.skill_name}</span>
                              <span className="text-zinc-500 text-xs font-mono">({skill.proficiency}%)</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVisibility('skills', skill.id);
                                }}
                                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Toggle visibility"
                              >
                                {skill.is_visible ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateItem('skills', skill.id);
                                }}
                                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Duplicate record"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                id={`delete-btn-${skill.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem('skills', skill.id);
                                }}
                                className={`p-2 rounded-lg transition-all cursor-pointer ${
                                  deleteConfirmId === skill.id 
                                    ? 'bg-rose-600 text-white animate-pulse' 
                                    : 'hover:bg-rose-500/10 text-zinc-400 hover:text-rose-455'
                                }`}
                                title={deleteConfirmId === skill.id ? "Click again to confirm" : "Delete record"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* TAB 4: EXPERIENCE PODS */}
          {activeTab === 'experience' && (
            <div className="space-y-4 max-w-3xl">
              {expState.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/30 border border-dashed border-zinc-850 rounded-2xl space-y-3">
                  <Briefcase className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-355">No Job Records</p>
                    <p className="text-xs text-zinc-500 mt-1">Click Add New to structure a career milestone.</p>
                  </div>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'experience')}>
                  <SortableContext items={expState.map((x) => x.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {expState.map((exp) => (
                        <SortableItem key={exp.id} id={exp.id}>
                          <div 
                            onClick={() => setSelectedRecordId(exp.id)}
                            className={`space-y-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                              selectedRecordId === exp.id 
                                ? 'border-blue-500 bg-zinc-900/70 shadow-lg ring-1 ring-blue-500/15' 
                                : 'border-zinc-850 hover:bg-zinc-900/20'
                            }`}
                          >
                            <div className="flex justify-between items-center gap-4">
                              <div className="truncate">
                                <div className="font-semibold text-white text-sm">{exp.role}</div>
                                <div className="text-xs text-zinc-505 font-light mt-1">{exp.company} • {exp.duration}</div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleVisibility('experience', exp.id);
                                  }}
                                  className="p-2 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="Toggle visibility"
                                >
                                  {exp.is_visible ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateItem('experience', exp.id);
                                  }}
                                  className="p-2 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="Duplicate record"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  id={`delete-btn-${exp.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteItem('experience', exp.id);
                                  }}
                                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                                    deleteConfirmId === exp.id 
                                      ? 'bg-rose-600 text-white animate-pulse' 
                                      : 'hover:bg-rose-500/10 text-zinc-400 hover:text-rose-455'
                                  }`}
                                  title={deleteConfirmId === exp.id ? "Click again to confirm" : "Delete record"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2 border-t border-zinc-850 pt-3.5 flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description Summary</label>
                              <textarea 
                                value={exp.description}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setExpState(prev => prev.map(item => item.id === exp.id ? { ...item, description: val } : item));
                                }}
                                className="w-full cms-input text-xs resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* TAB 5: ACHIEVEMENT BELT */}
          {activeTab === 'achievements' && (
            <div className="space-y-4 max-w-3xl">
              {achState.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/30 border border-dashed border-zinc-850 rounded-2xl space-y-3">
                  <Award className="w-8 h-8 text-zinc-650 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-355">No Achievements Records</p>
                    <p className="text-xs text-zinc-500 mt-1">Click Add New to insert certification or award details.</p>
                  </div>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'achievements')}>
                  <SortableContext items={achState.map((x) => x.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {achState.map((ach) => (
                        <SortableItem key={ach.id} id={ach.id}>
                          <div 
                            onClick={() => setSelectedRecordId(ach.id)}
                            className={`flex items-center justify-between gap-4 p-2.5 rounded-xl border transition-all cursor-pointer ${
                              selectedRecordId === ach.id 
                                ? 'border-blue-500 bg-zinc-900/70 shadow-lg ring-1 ring-blue-500/15' 
                                : 'border-transparent hover:bg-zinc-900/25'
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-semibold text-white text-sm">{ach.title}</div>
                              <div className="text-xs text-zinc-500 font-light mt-1">{ach.date} • {ach.description}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVisibility('achievements', ach.id);
                                }}
                                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Toggle visibility"
                              >
                                {ach.is_visible ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateItem('achievements', ach.id);
                                }}
                                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Duplicate record"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                id={`delete-btn-${ach.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem('achievements', ach.id);
                                }}
                                className={`p-2 rounded-lg transition-all cursor-pointer ${
                                  deleteConfirmId === ach.id 
                                    ? 'bg-rose-600 text-white animate-pulse' 
                                    : 'hover:bg-rose-500/10 text-zinc-400 hover:text-rose-455'
                                }`}
                                title={deleteConfirmId === ach.id ? "Click again to confirm" : "Delete record"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* TAB 6: CONTACT TERMINALS */}
          {activeTab === 'contact' && (
            <div className="space-y-6 max-w-2xl bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-350">Admin Email Address</label>
                  <input 
                    type="email" 
                    value={contactsState.email}
                    onChange={(e) => setContactsState({ ...contactsState, email: e.target.value })}
                    className={`w-full cms-input ${validationErrors.email ? 'border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {validationErrors.email && (
                    <span className="text-[11px] text-rose-450 font-medium block mt-1">{validationErrors.email}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-350">LinkedIn Profile Link</label>
                  <input 
                    type="text" 
                    value={contactsState.linkedin}
                    onChange={(e) => setContactsState({ ...contactsState, linkedin: e.target.value })}
                    className={`w-full cms-input ${validationErrors.linkedin ? 'border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {validationErrors.linkedin && (
                    <span className="text-[11px] text-rose-450 font-medium block mt-1">{validationErrors.linkedin}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-350">GitHub Profile Link</label>
                  <input 
                    type="text" 
                    value={contactsState.github}
                    onChange={(e) => setContactsState({ ...contactsState, github: e.target.value })}
                    className={`w-full cms-input ${validationErrors.github ? 'border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {validationErrors.github && (
                    <span className="text-[11px] text-rose-450 font-medium block mt-1">{validationErrors.github}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: GLOBAL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl">
              {/* Unsaved changes banner */}
              {JSON.stringify(settingsState) !== JSON.stringify(originalSettingsRef.current) && (
                <div className="p-3.5 bg-blue-950/45 border border-blue-900/35 rounded-xl flex items-center justify-between text-xs text-blue-300">
                  <span>Settings modified. Save to commit configuration changes globally.</span>
                  <button 
                    onClick={() => {
                      setSettingsState(originalSettingsRef.current);
                      addLog("Settings reset to current database state.");
                    }}
                    className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-800 border border-blue-800/45 text-[10px] rounded text-white cursor-pointer uppercase tracking-wider font-bold"
                  >
                    Reset
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
                <div>
                  <div className="text-sm font-semibold text-white">Maintenance Mode Status</div>
                  <p className="text-xs text-zinc-500 font-light mt-0.5">Toggle simulated site lock restrictions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsState({ ...settingsState, maintenanceMode: !settingsState.maintenanceMode })}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all cursor-pointer flex items-center ${settingsState.maintenanceMode ? 'bg-amber-500 justify-end' : 'bg-zinc-800 justify-start'}`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white shadow" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-350">Space Theme Mode</label>
                  <select
                    value={settingsState.theme}
                    onChange={(e) => setSettingsState({ ...settingsState, theme: e.target.value })}
                    className="w-full cms-input cms-select font-medium text-zinc-250 bg-zinc-950"
                  >
                    <option value="space-dark">Galactic Void (Default)</option>
                    <option value="nebula-purple">Nebula Gradient</option>
                    <option value="deep-matter">Deep void charcoal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-350">Accent Color Palette</label>
                  <select
                    value={settingsState.accentColor || 'blue'}
                    onChange={(e) => setSettingsState({ ...settingsState, accentColor: e.target.value })}
                    className="w-full cms-input cms-select font-medium text-zinc-250 bg-zinc-950"
                  >
                    <option value="blue">Celestial Blue</option>
                    <option value="purple">Cosmic Purple</option>
                    <option value="emerald">Aurora Emerald</option>
                    <option value="amber">Sol Amber</option>
                    <option value="rose">Nova Rose</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-zinc-850 pt-4">
                <div className="flex justify-between text-xs font-semibold text-zinc-350">
                  <span>Simulation Animation Speed Multiplier</span>
                  <span className="font-mono text-blue-400">{settingsState.animationSpeed || 1}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1" 
                  value={settingsState.animationSpeed || 1}
                  onChange={(e) => setSettingsState({ ...settingsState, animationSpeed: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-850 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-350">Warp Speed Duration (Seconds)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    max="10.0"
                    value={isNaN(settingsState.warpSpeed) ? '' : (settingsState.warpSpeed ?? 1.5)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSettingsState({ ...settingsState, warpSpeed: val });
                      if (validationErrors.warpSpeed) {
                        setValidationErrors(prev => {
                          const next = { ...prev };
                          delete next.warpSpeed;
                          return next;
                        });
                      }
                    }}
                    className={`w-full cms-input ${validationErrors.warpSpeed ? 'border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {validationErrors.warpSpeed && (
                    <span className="text-[11px] text-rose-450 font-medium block mt-1">{validationErrors.warpSpeed}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-350">Landing Speed Duration (Seconds)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    max="10.0"
                    value={isNaN(settingsState.landingDuration) ? '' : (settingsState.landingDuration ?? 1.0)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSettingsState({ ...settingsState, landingDuration: val });
                      if (validationErrors.landingDuration) {
                        setValidationErrors(prev => {
                          const next = { ...prev };
                          delete next.landingDuration;
                          return next;
                        });
                      }
                    }}
                    className={`w-full cms-input ${validationErrors.landingDuration ? 'border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {validationErrors.landingDuration && (
                    <span className="text-[11px] text-rose-450 font-medium block mt-1">{validationErrors.landingDuration}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-zinc-850 pt-4">
                <div className="flex flex-col items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">Engine Sound</span>
                  <button
                    type="button"
                    onClick={() => setSettingsState({ ...settingsState, soundEnabled: !settingsState.soundEnabled })}
                    className={`w-10 h-5.5 rounded-full p-0.5 mt-2.5 transition-all cursor-pointer flex items-center ${settingsState.soundEnabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'}`}
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-white shadow" />
                  </button>
                </div>

                <div className="flex flex-col items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">Background Music</span>
                  <button
                    type="button"
                    onClick={() => setSettingsState({ ...settingsState, backgroundMusicEnabled: !settingsState.backgroundMusicEnabled })}
                    className={`w-10 h-5.5 rounded-full p-0.5 mt-2.5 transition-all cursor-pointer flex items-center ${settingsState.backgroundMusicEnabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'}`}
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-white shadow" />
                  </button>
                </div>

                <div className="flex flex-col items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">Reduced Motion</span>
                  <button
                    type="button"
                    onClick={() => setSettingsState({ ...settingsState, reducedMotion: !settingsState.reducedMotion })}
                    className={`w-10 h-5.5 rounded-full p-0.5 mt-2.5 transition-all cursor-pointer flex items-center ${settingsState.reducedMotion ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'}`}
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-white shadow" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: STORAGE NODE */}
          {activeTab === 'storage' && (
            <div className="space-y-6 max-w-3xl">
              {/* Progress Bar Indicator */}
              {storageProgress !== null && (
                <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      Uploading binary artifact...
                    </span>
                    <span>{storageProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                    <div className="bg-blue-500 h-full transition-all duration-200" style={{ width: `${storageProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Upload CTA Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex flex-col items-center text-center space-y-3">
                  <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Avatar Image</h3>
                    <p className="text-[10px] text-zinc-550 mt-0.5">JPEG/PNG format.</p>
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Replace Image
                  </button>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('avatar', file);
                    }}
                    className="hidden"
                  />
                </div>

                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex flex-col items-center text-center space-y-3">
                  <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Resume PDF</h3>
                    <p className="text-[10px] text-zinc-550 mt-0.5">PDF limit 10MB.</p>
                  </div>
                  <button
                    onClick={() => resumeInputRef.current?.click()}
                    className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Upload CV
                  </button>
                  <input
                    type="file"
                    ref={resumeInputRef}
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('resume', file);
                    }}
                    className="hidden"
                  />
                </div>

                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex flex-col items-center text-center space-y-3">
                  <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Certificate</h3>
                    <p className="text-[10px] text-zinc-550 mt-0.5">PDF or image.</p>
                  </div>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'application/pdf,image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('certificate', file);
                      };
                      input.click();
                    }}
                    className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Add File
                  </button>
                </div>
              </div>

              {/* Uploaded Files Table */}
              <div className="bg-zinc-900/20 border border-zinc-850 rounded-2xl overflow-hidden p-1">
                <div className="p-4 border-b border-zinc-850 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Registered Assets</h3>
                </div>
                <div className="divide-y divide-zinc-850">
                  {storageFiles.map((file, i) => (
                    <div key={i} className="p-4 flex items-center justify-between gap-4">
                      <div className="truncate">
                        <div className="text-xs font-semibold text-zinc-200 truncate">{file.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{file.type} • {file.size}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(file.url);
                            addLog(`CMS: Copied link URL for asset ${file.name}`);
                          }}
                          className="px-2 py-1.5 hover:bg-zinc-850 border border-transparent hover:border-zinc-800 text-[10px] text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer font-bold uppercase tracking-wider"
                          title="Copy Link URL"
                        >
                          Copy URL
                        </button>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1.5 hover:bg-zinc-850 border border-transparent hover:border-zinc-800 text-[10px] text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          Preview
                        </a>
                        <button
                          onClick={() => {
                            if (window.confirm(`Permanently destroy asset ${file.name}?`)) {
                              setStorageFiles(prev => prev.filter((_, idx) => idx !== i));
                              addLog(`CMS: Deleted asset artifact ${file.name}`);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: ANALYTICS UPLINK */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 max-w-3xl">
              {/* Metric grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-1">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Galactic Visitors</div>
                  <div className="text-xl font-bold text-white tracking-tight">{analytics.visitors}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-1">▲ Sync Status: ONLINE</div>
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-1">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Resume Downloads</div>
                  <div className="text-xl font-bold text-white tracking-tight">{analytics.resumeDownloads}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-1">Conversions: {analytics.visitors > 0 ? Math.round((analytics.resumeDownloads / analytics.visitors) * 100) : 0}%</div>
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-1">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Avg Session Duration</div>
                  <div className="text-xl font-bold text-white tracking-tight">{analytics.averageSessionTime}s</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-1">Active telemetry feed</div>
                </div>
              </div>

              {/* Extra metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Most Explored System</div>
                    <div className="text-sm font-bold text-blue-400 tracking-tight mt-1">
                      {(() => {
                        if (!analytics.planetVisits) return 'NONE';
                        const entries = Object.entries(analytics.planetVisits);
                        if (entries.length === 0) return 'NONE';
                        let maxKey = 'None';
                        let maxValue = -1;
                        entries.forEach(([k, v]) => {
                          if ((v as number) > maxValue) {
                            maxValue = v as number;
                            maxKey = k;
                          }
                        });
                        return maxKey.toUpperCase();
                      })()}
                    </div>
                  </div>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-blue-400">
                    <Globe className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Last Telemetry Sync</div>
                    <div className="text-sm font-bold text-white font-mono tracking-tight mt-1">{analytics.lastSyncTime}</div>
                  </div>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Planet visits bar percentages */}
              <div className="bg-zinc-900/20 border border-zinc-850 rounded-2xl overflow-hidden p-1">
                <div className="p-4 border-b border-zinc-850">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">System Visits Breakdown</h3>
                </div>
                <div className="p-4 space-y-4">
                  {Object.entries(analytics.planetVisits || {}).map(([planet, count]) => {
                    const totalVisits = Object.values(analytics.planetVisits).reduce((a, b) => (a as number) + (b as number), 0) as number;
                    const percent = totalVisits > 0 ? Math.round(((count as number) / totalVisits) * 100) : 0;
                    return (
                      <div key={planet} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300 capitalize">{planet} system</span>
                          <span className="text-zinc-500 font-mono">{count as number} visits ({percent}%)</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                          <div className="bg-blue-500 h-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* COLUMN 3: LIVE PREVIEW (Sticky/Fixed container, independent scroll inside, toggled on/off) */}
        {showPreview && (
          <aside className="hidden xl:flex w-[480px] border-l border-zinc-850 bg-zinc-950 flex-col shrink-0 overflow-hidden select-none">
            <div className="p-4 border-b border-zinc-850 bg-zinc-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-300">Live Preview Sandbox</span>
              </div>
              <button
                onClick={() => {
                  if (iframeRef.current) {
                    iframeRef.current.src = iframeRef.current.src;
                  }
                }}
                className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
                title="Reload Preview System"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex-1 bg-zinc-950 flex items-center justify-center p-5">
              {/* Browser Device mockup */}
              <div className="w-full h-full border border-zinc-850 rounded-2xl bg-zinc-900 shadow-2xl overflow-hidden flex flex-col">
                <div className="h-7 bg-zinc-905 border-b border-zinc-850 flex items-center gap-1.5 px-3 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="text-[10px] text-zinc-505 ml-2 font-mono truncate">localhost:3000/planet/{activeTab}</span>
                </div>
                
                <iframe 
                  ref={iframeRef}
                  src={activeTab === 'profile' || activeTab === 'settings' ? '/' : `/planet/${activeTab}`}
                  className="w-full flex-1 bg-black pointer-events-auto border-none"
                  title="Live Sandbox Preview"
                />
              </div>
            </div>
          </aside>
        )}

      </div>

      {/* Slide-over Form Drawer */}
      <AddEntryDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        type={activeTab === 'education' || activeTab === 'experience' || activeTab === 'achievements' ? activeTab : 'education'}
        onAdd={handleDrawerAdd}
      />
      {/* 10-Second Undo Delete Toast */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-zinc-350">
              Item deleted from <strong className="text-white uppercase font-bold font-mono">{undoItem?.type}</strong>
            </span>
          </div>
          <button
            onClick={handleUndo}
            className="px-3 py-1 bg-white hover:bg-zinc-200 text-zinc-950 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <Undo className="w-3 h-3 text-zinc-650" />
            Undo (10s)
          </button>
        </div>
      )}
      
    </div>
  );
}
