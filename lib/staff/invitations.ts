import { createHash, randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export type InviteDeliveryMethod = 'supabase_email' | 'manual_link'

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

type InviteCodeLookupClient = {
  from: (table: 'staff_invitations') => {
    select: (columns: 'id') => {
      eq: (column: 'invite_code', value: string) => {
        maybeSingle: () => PromiseLike<{ data: { id: string } | null }>
      }
    }
  }
}

export function createInviteToken() {
  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  return { token, tokenHash }
}

export function createInviteCode(length = 8) {
  const bytes = randomBytes(length)
  let code = ''
  for (let index = 0; index < length; index += 1) {
    code += INVITE_CODE_ALPHABET[bytes[index] % INVITE_CODE_ALPHABET.length]
  }
  return code
}

export async function createUniqueInviteCode(supabase: unknown) {
  const lookupClient = supabase as InviteCodeLookupClient
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const inviteCode = createInviteCode(8)
    const { data } = await lookupClient
      .from('staff_invitations')
      .select('id')
      .eq('invite_code', inviteCode)
      .maybeSingle()

    if (!data) {
      return inviteCode
    }
  }

  throw new Error('Could not generate unique invite code')
}

export function buildInviteLinks(appUrl: string, token: string, inviteCode: string) {
  const tokenInviteLink = `${appUrl}/dashboard/staff/onboarding?token=${token}`
  const codeInviteLink = `${appUrl}/dashboard/staff/onboarding?code=${inviteCode}`
  return { tokenInviteLink, codeInviteLink }
}

export function buildStaffSignUpLink(appUrl: string, inviteCode: string) {
  return `${appUrl}/auth/sign-up?role=staff&inviteCode=${inviteCode}`
}

export function buildStaffOnboardingLink(appUrl: string, inviteCode: string) {
  return `${appUrl}/dashboard/staff/onboarding?code=${inviteCode}`
}

export function buildSocialShareLinks(
  signUpLink: string,
  onboardingLink: string,
  inviteCode: string,
  shopName: string,
) {
  const text =
    `Join ${shopName} on TailorPal.\n` +
    `1) Sign up: ${signUpLink}\n` +
    `2) Choose Staff role\n` +
    `3) Open onboarding: ${onboardingLink}\n` +
    `4) Invite code: ${inviteCode}`
  const encodedText = encodeURIComponent(text)
  return {
    whatsapp: `https://wa.me/?text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(signUpLink)}&text=${encodedText}`,
  }
}

export async function sendInviteViaSupabaseAuth(params: {
  to: string
  shopName: string
  inviterEmail: string
  redirectTo: string
  inviteCode: string
  signUpLink: string
  onboardingLink: string
}) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.inviteUserByEmail(params.to, {
    redirectTo: params.redirectTo,
    data: {
      inviter_email: params.inviterEmail,
      invited_shop_name: params.shopName,
      invite_code: params.inviteCode,
      signup_link: params.signUpLink,
      onboarding_link: params.onboardingLink,
      invite_steps:
        '1) Create account. 2) Choose Staff role. 3) Open Staff Onboarding. 4) Enter invite code to accept.',
    },
  })

  if (error) {
    throw new Error(error.message || 'Failed to send invite email')
  }
}
