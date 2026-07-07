import type { Course } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'
import { nanoid } from 'nanoid'

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'docx']
const BUCKET_NAME = 'sacre-coeur-files-courses'

class AdminCoursesServices {
  async getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('uploadedat', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createCourse(
    values: Omit<Course, 'id' | 'pdfUrl' | 'uploadedAt'> & { pdfUrl: File }
  ): Promise<string> {
    if (!values || !values.pdfUrl) {
      throw new Error('Les données du cours et le fichier sont obligatoires.')
    }

    const fileNameExt = values.pdfUrl.name.split('.').pop()?.toLowerCase()
    if (!fileNameExt || !ALLOWED_EXTENSIONS.includes(fileNameExt)) {
      throw new Error('Format de fichier non autorisé.')
    }

    const filePath = `courses/${nanoid()}.${fileNameExt}`

    const { data: storageData, error: fileError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, values.pdfUrl, {
        cacheControl: '1800',
        upsert: false,
      })

    if (fileError) throw fileError

    try {
      const { data: dbData, error: dbError } = await supabase
        .from('courses')
        .insert({
          title: values.title,
          description: values.description,
          class_id: values.class_id,
          pdfUrl: storageData.path,
        })
        .select('id')
        .single()

      if (dbError) throw dbError
      return dbData.id
    } catch (error) {
      await supabase.storage.from(BUCKET_NAME).remove([filePath])
      throw error
    }
  }

  async updateCourse(
    id: string,
    values: Partial<Omit<Course, 'id' | 'uploadedAt'>> & { pdfUrl?: File }
  ): Promise<void> {
    if (!id) throw new Error("L'identifiant du cours est requis.")

    const { data: oldCourse, error: fetchError } = await supabase
      .from('courses')
      .select('pdfUrl')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const updateData: Omit<Partial<Course>, 'pdfUrl'> & { pdfUrl?: string } = {
      title: values.title,
      description: values.description,
      class_id: values.class_id,
    }

    let newFilePath: string | null = null

    if (values.pdfUrl) {
      const fileNameExtUpdate = values.pdfUrl.name
        .split('.')
        .pop()
        ?.toLowerCase()
      if (
        !fileNameExtUpdate ||
        !ALLOWED_EXTENSIONS.includes(fileNameExtUpdate)
      ) {
        throw new Error('Format de fichier non autorisé.')
      }

      newFilePath = `courses/${nanoid()}.${fileNameExtUpdate}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(newFilePath, values.pdfUrl, {
          cacheControl: '1800',
          upsert: false,
        })

      if (uploadError) throw uploadError
      updateData.pdfUrl = newFilePath
    }

    const { error: updateError } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      if (newFilePath) {
        await supabase.storage.from(BUCKET_NAME).remove([newFilePath])
      }
      throw updateError
    }

    if (values.pdfUrl && oldCourse?.pdfUrl) {
      await supabase.storage.from(BUCKET_NAME).remove([oldCourse.pdfUrl])
    }
  }

  async deleteCourse(payload: {
    courseId: string
    filePath: string
  }): Promise<void> {
    if (!payload.courseId || !payload.filePath) {
      throw new Error(
        "L'identifiant du cours et le chemin du fichier sont requis."
      )
    }

    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([payload.filePath])

    if (storageError) throw storageError

    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', payload.courseId)

    if (deleteError) throw deleteError
  }
}

export const adminCoursesServices = new AdminCoursesServices()
