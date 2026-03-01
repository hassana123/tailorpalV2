type ProfileLike = {
  user_type?: string | null
  created_at?: string | null
  updated_at?: string | null
}

function parseTime(value?: string | null) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

export function requiresRoleSelection(profile: ProfileLike | null | undefined) {
  if (!profile?.user_type) {
    return true
  }

  // If DB auto-defaulted to `customer` at signup, created_at and updated_at are
  // usually identical until role is explicitly chosen.
  if (profile.user_type === 'customer') {
    const created = parseTime(profile.created_at)
    const updated = parseTime(profile.updated_at)
    if (created !== null && updated !== null && created === updated) {
      return true
    }
  }

  return false
}
