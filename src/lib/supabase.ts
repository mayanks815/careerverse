import { createClient } from '@supabase/supabase-js';
import { 
  mockCareerverseData, 
  Profile, 
  Education, 
  Skill, 
  Experience, 
  Achievement, 
  Contacts,
  CareerverseData
} from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Log configuration status
if (!isSupabaseConfigured) {
  console.warn("Supabase credentials missing. Careerverse is running in Mock Fallback Mode using 'src/lib/mockData.ts'.");
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// RLS safe read queries with silent error fallback
export async function getProfile(): Promise<Profile> {
  if (!supabase) return mockCareerverseData.profile;
  try {
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("Error fetching profile from Supabase:", error.message);
      return mockCareerverseData.profile;
    }
    return data as Profile;
  } catch (err) {
    console.error("Catch error fetching profile:", err);
    return mockCareerverseData.profile;
  }
}

export async function getEducation(): Promise<Education[]> {
  if (!supabase) return mockCareerverseData.education;
  try {
    const { data, error } = await supabase
      .from('education')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.error("Error fetching education from Supabase:", error.message);
      return mockCareerverseData.education;
    }
    return data as Education[];
  } catch (err) {
    console.error("Catch error fetching education:", err);
    return mockCareerverseData.education;
  }
}

export async function getSkills(): Promise<Skill[]> {
  if (!supabase) return mockCareerverseData.skills;
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.error("Error fetching skills from Supabase:", error.message);
      return mockCareerverseData.skills;
    }
    return data as Skill[];
  } catch (err) {
    console.error("Catch error fetching skills:", err);
    return mockCareerverseData.skills;
  }
}

export async function getExperience(): Promise<Experience[]> {
  if (!supabase) return mockCareerverseData.experience;
  try {
    const { data, error } = await supabase
      .from('experience')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.error("Error fetching experience from Supabase:", error.message);
      return mockCareerverseData.experience;
    }
    return data as Experience[];
  } catch (err) {
    console.error("Catch error fetching experience:", err);
    return mockCareerverseData.experience;
  }
}

export async function getAchievements(): Promise<Achievement[]> {
  if (!supabase) return mockCareerverseData.achievements;
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.error("Error fetching achievements from Supabase:", error.message);
      return mockCareerverseData.achievements;
    }
    return data as Achievement[];
  } catch (err) {
    console.error("Catch error fetching achievements:", err);
    return mockCareerverseData.achievements;
  }
}

export async function getContacts(): Promise<Contacts> {
  if (!supabase) return mockCareerverseData.contact;
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("Error fetching contacts from Supabase:", error.message);
      return mockCareerverseData.contact;
    }
    return data as Contacts;
  } catch (err) {
    console.error("Catch error fetching contacts:", err);
    return mockCareerverseData.contact;
  }
}

// Bulk retrieval helper
export async function getAllCareerverseData(): Promise<CareerverseData> {
  const [profile, education, skills, experience, achievements, contacts] = await Promise.all([
    getProfile(),
    getEducation(),
    getSkills(),
    getExperience(),
    getAchievements(),
    getContacts()
  ]);

  return {
    profile,
    education,
    skills,
    experience,
    achievements,
    contact: contacts,
    settings: mockCareerverseData.settings
  };
}
