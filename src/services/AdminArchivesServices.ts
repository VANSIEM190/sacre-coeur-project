import type {
  ArchiveDocument,
  ArchiveDocumentInput,
  ArchiveDocumentUpdateInput,
} from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'
import { nanoid } from 'nanoid/non-secure'

class AdminArchivesServices {
  async getArchives(): Promise<ArchiveDocument[]> {
    const { data, error } = await supabase
      .from('archives')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createArchive(values: ArchiveDocumentInput): Promise<string> {
    const fileNameExt = values.file.name.split('.').pop()
    const filePath = `archives/${nanoid()}.${fileNameExt}`

    const { data: storageData, error: fileError } = await supabase.storage
      .from('sacre-coeur-files-archives')
      .upload(filePath, values.file, {
        cacheControl: '1800',
        upsert: false,
      })

    if (fileError) throw fileError

    try {
      const { data: dbData, error: dbError } = await supabase
        .from('archives')
        .insert({
          title: values.title,
          year: values.year,
          category: values.category,
          file: storageData.path,
          description: values.description,
        })
        .select('id')
        .single()

      if (dbError) throw dbError
      return dbData.id
    } catch (error) {
      await supabase.storage
        .from('sacre-coeur-files-archives')
        .remove([storageData.path])
      throw error
    }
  }

  async updateArchive(
    id: string,
    values: ArchiveDocumentUpdateInput
  ): Promise<void> {
    const { data: oldArchive, error: fetchError } = await supabase
      .from('archives')
      .select('file_path')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const updateData: any = {
      title: values.title,
      year: values.year,
      category: values.category,
      description: values.description,
    }

    let newFilePath: string | null = null

    if (values.file) {
      const fileNameExt = values.file.name.split('.').pop()
      newFilePath = `archives/${nanoid()}.${fileNameExt}`

      const { error: uploadError } = await supabase.storage
        .from('sacre-coeur-files-archives')
        .upload(newFilePath, values.file, {
          cacheControl: '1800',
          upsert: false,
        })

      if (uploadError) throw uploadError
      updateData.file = newFilePath
    }

    const { error: updateError } = await supabase
      .from('archives')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      if (newFilePath) {
        await supabase.storage
          .from('sacre-coeur-files-archives')
          .remove([newFilePath])
      }
      throw updateError
    }

    if (values.file && oldArchive?.file_path) {
      await supabase.storage
        .from('sacre-coeur-files-archives')
        .remove([oldArchive.file_path])
    }
  }

  async deleteArchive(payload: {
    archiveId: string
    filePath: string
  }): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from('sacre-coeur-files-archives')
      .remove([payload.filePath])

    if (storageError) throw storageError

    const { error: deleteError } = await supabase
      .from('archives')
      .delete()
      .eq('id', payload.archiveId)

    if (deleteError) throw deleteError
  }
}

export const adminArchivesServices = new AdminArchivesServices()
