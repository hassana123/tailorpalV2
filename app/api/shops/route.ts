import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreateShopRequest } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

type DbErrorLike = {
  code?: string
  message?: string
}

function isPermissionDenied(error: unknown) {
  const dbError = error as DbErrorLike | null
  return dbError?.code === '42501'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = payloadSchema.safeParse((await request.json()) as CreateShopRequest)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const payload = parsed.data

    let admin = null as ReturnType<typeof createAdminClient> | null
    const { data: existing, error: existingError } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)

    let ownerAlreadyHasShop = Boolean(existing && existing.length > 0)

    if (existingError) {
      if (!isPermissionDenied(existingError)) {
        console.error('Error checking existing shop:', existingError)
        return NextResponse.json({ error: 'Failed to validate shop ownership' }, { status: 500 })
      }

      try {
        admin = createAdminClient()
        const { data: adminExisting, error: adminExistingError } = await admin
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)

        if (adminExistingError) {
          console.error('Admin fallback failed while checking existing shop:', adminExistingError)
          return NextResponse.json({ error: 'Failed to validate shop ownership' }, { status: 500 })
        }

        ownerAlreadyHasShop = Boolean(adminExisting && adminExisting.length > 0)
      } catch (adminError) {
        console.error('Failed to create admin client for shops ownership check:', adminError)
        return NextResponse.json({ error: 'Failed to validate shop ownership' }, { status: 500 })
      }
    }

    if (ownerAlreadyHasShop) {
      return NextResponse.json(
        { error: 'This account already owns a shop.' },
        { status: 409 },
      )
    }

    const slug = await generateUniqueSlug(supabase, payload.name)

    const insertPayload = {
      owner_id: user.id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      country: payload.country ?? null,
      description: payload.description ?? null,
      logo_url: payload.logoUrl ?? null,
      banner_url: payload.bannerUrl ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      slug,
      is_featured: false,
    }

    let { data: shop, error } = await supabase
      .from('shops')
      .insert([insertPayload])
      .select('*')
      .single()

    if (error && isPermissionDenied(error)) {
      try {
        admin = admin ?? createAdminClient()
        const adminSlug = await generateUniqueSlug(admin, payload.name)
        const { data: adminShop, error: adminInsertError } = await admin
          .from('shops')
          .insert([{ ...insertPayload, slug: adminSlug }])
          .select('*')
          .single()

        if (!adminInsertError) {
          return NextResponse.json({ shop: adminShop }, { status: 201 })
        }

        error = adminInsertError
        shop = null
      } catch (adminError) {
        console.error('Failed to create admin client for shops insert fallback:', adminError)
      }
    }

    if (error) {
      console.error('Error creating shop:', error)
      return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 })
    }

    return NextResponse.json({ shop }, { status: 201 })
  } catch (error) {
    console.error('Error in shops POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
) {
  const base = slugify(name)
  let slug = base
  let attempt = 1

  for (;;) {
    const { data } = await supabase.from('shops').select('id').eq('slug', slug).maybeSingle()
    if (!data) {
      return slug
    }
    attempt += 1
    slug = `${base}-${attempt}`
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}
