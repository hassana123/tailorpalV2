import { createClient } from '@/lib/supabase/server';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  user_type: 'shop_owner' | 'staff' | 'customer' | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error);
  }

  return data as UserProfile | null;
}

/**
 * Create user profile (called after signup via trigger)
 */
export async function createUserProfile(
  userId: string,
  fullName?: string,
  userType?: 'shop_owner' | 'staff' | 'customer'
): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        first_name: fullName?.split(' ')[0] || null,
        last_name: fullName?.split(' ').slice(1).join(' ') || null,
        user_type: userType,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
  }

  return data as UserProfile | null;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
  }

  return data as UserProfile | null;
}

/**
 * Sign out user
 */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
