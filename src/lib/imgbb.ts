import { IMGBB_API_KEY } from '../firebase'

interface ImgBBResponse {
  success: boolean
  data: {
    id: string
    url: string
    display_url: string
    thumb?: { url: string }
    delete_url?: string
  }
  error?: { message: string }
}

export async function uploadToImgBB(file: File): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error('ImgBB API key missing. Add VITE_IMGBB_API_KEY to .env and restart dev server.')
  }
  if (file.size > 32 * 1024 * 1024) {
    throw new Error('Image is larger than 32 MB. Please compress it first.')
  }

  const form = new FormData()
  form.append('image', file)

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: form,
  })

  const json = (await res.json().catch(() => ({}))) as Partial<ImgBBResponse>

  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error?.message || `ImgBB upload failed (HTTP ${res.status})`)
  }

  return json.data.display_url || json.data.url
}