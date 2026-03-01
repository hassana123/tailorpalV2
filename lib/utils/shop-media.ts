type UploadFolder = 'logos' | 'banners' | 'catalog'

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function uploadShopMedia(
  supabase: {
    auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> }
    storage: {
      from: (bucket: string) => {
        upload: (
          path: string,
          file: File,
          options?: { upsert?: boolean; contentType?: string },
        ) => Promise<{ error: { message?: string } | null }>
        getPublicUrl: (path: string) => { data: { publicUrl: string } }
      }
    }
  },
  file: File,
  folder: UploadFolder,
) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be 5MB or less.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You need to be signed in to upload images.')
  }

  const filePath = `${user.id}/${folder}/${Date.now()}-${sanitizeFileName(file.name)}`
  const { error } = await supabase.storage.from('shop-media').upload(filePath, file, {
    upsert: false,
    contentType: file.type,
  })

  if (error) {
    throw new Error(error.message || 'Failed to upload image')
  }

  const { data } = supabase.storage.from('shop-media').getPublicUrl(filePath)
  return data.publicUrl
}
