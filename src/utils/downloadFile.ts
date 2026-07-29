import type { DownloadFileOptions } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'

export async function downloadFile({
  bucket,
  filePath,
  fileName,
}: DownloadFileOptions): Promise<void> {
  if (!bucket || !filePath) {
    throw new Error('Le bucket et le chemin du fichier sont requis.')
  }

  const { data, error } = await supabase.storage.from(bucket).download(filePath)

  if (error) {
    throw new Error('Impossible de télécharger le fichier.', { cause: error })
  }

  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName ?? filePath.split('/').pop() ?? 'fichier'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Libère la mémoire une fois le téléchargement déclenché
  URL.revokeObjectURL(url)
}
