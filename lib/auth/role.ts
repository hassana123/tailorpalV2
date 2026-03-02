type ProfileLike = {
  user_type?: string | null
}

export function requiresRoleSelection(profile: ProfileLike | null | undefined) {
  return !profile?.user_type
}
