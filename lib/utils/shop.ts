import { createClient } from '@/lib/supabase/server';

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  is_featured: boolean;
  rating: number;
  total_ratings: number;
  slug: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's shop if they are a shop owner
 */
export async function getUserShop(userId: string): Promise<Shop | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user shop:', error);
  }

  return data as Shop | null;
}

/**
 * Get all featured shops for marketplace
 */
export async function getFeaturedShops(): Promise<Shop[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('is_featured', true)
    .order('rating', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured shops:', error);
    return [];
  }

  return data as Shop[];
}

/**
 * Search shops by name, city, state, or country
 */
export async function searchShops(query: string): Promise<Shop[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,country.ilike.%${query}%`)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error searching shops:', error);
    return [];
  }

  return data as Shop[];
}

/**
 * Get shop by ID
 */
export async function getShopById(shopId: string): Promise<Shop | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single();

  if (error) {
    console.error('Error fetching shop:', error);
  }

  return data as Shop | null;
}

/**
 * Create a new shop
 */
export async function createShop(
  ownerId: string,
  shopData: Partial<Shop>
): Promise<Shop | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shops')
    .insert([
      {
        owner_id: ownerId,
        name: shopData.name,
        description: shopData.description,
        email: shopData.email,
        phone: shopData.phone,
        address: shopData.address,
        city: shopData.city,
        state: shopData.state,
        country: shopData.country,
        slug:
          shopData.slug ||
          String(shopData.name || 'shop')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating shop:', error);
  }

  return data as Shop | null;
}

/**
 * Update shop information
 */
export async function updateShop(
  shopId: string,
  updates: Partial<Shop>
): Promise<Shop | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shops')
    .update(updates)
    .eq('id', shopId)
    .select()
    .single();

  if (error) {
    console.error('Error updating shop:', error);
  }

  return data as Shop | null;
}
