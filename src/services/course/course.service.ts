import type { Course } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'
import { nanoid } from 'nanoid'

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    'docx',
  ],
}
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo
const BUCKET_NAME = 'sacre-coeur-files-courses'

class AdminCoursesServices {
  private validateFile(file: File): string {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowedExts = ALLOWED_MIME_TYPES[file.type]

    if (!ext || !allowedExts || !allowedExts.includes(ext)) {
      throw new Error('Format de fichier non autorisé.')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Fichier trop volumineux (10 Mo max).')
    }

    return ext
  }

  async getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('uploadedAt', { ascending: false })

    if (error) {
      console.error('[AdminCoursesServices.getCourses]', error)
      throw new Error('Impossible de récupérer les cours.')
    }
    return data || []
  }

  async createCourse(
    values: Partial<Omit<Course, 'id' | 'uploadedAt' | 'pdfUrl'>> & {
      pdfUrl?: File
    }
  ): Promise<string> {
    if (!values || !values.pdfUrl) {
      throw new Error('Les données du cours et le fichier sont obligatoires.')
    }

    const ext = this.validateFile(values.pdfUrl)
    const filePath = `courses/${nanoid()}.${ext}`

    const { data: storageData, error: fileError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, values.pdfUrl, {
        cacheControl: '1800',
        upsert: false,
      })

    if (fileError) {
      console.error('[AdminCoursesServices.createCourse] upload', fileError)
      throw new Error("Impossible d'envoyer le fichier du cours.")
    }

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
      const { error: rollbackError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])
      if (rollbackError) {
        console.error(
          '[AdminCoursesServices.createCourse] rollback échoué, fichier orphelin:',
          filePath,
          rollbackError
        )
      }
      console.error('[AdminCoursesServices.createCourse] insert', error)
      throw new Error('Impossible de créer le cours.', { cause: error })
    }
  }

  async updateCourse(
    id: string,
    values: Partial<Omit<Course, 'id' | 'uploadedAt' | 'pdfUrl'>> & {
      pdfUrl?: File
    }
  ): Promise<void> {
    if (!id) throw new Error("L'identifiant du cours est requis.")

    const { data: oldCourse, error: fetchError } = await supabase
      .from('courses')
      .select('pdfUrl')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('[AdminCoursesServices.updateCourse] fetch', fetchError)
      throw new Error(`Cours introuvable (id: ${id}).`)
    }

    const updateData: Omit<Partial<Course>, 'pdfUrl'> & { pdfUrl?: string } = {
      title: values.title,
      description: values.description,
      class_id: values.class_id,
    }

    let newFilePath: string | null = null

    if (values.pdfUrl) {
      const ext = this.validateFile(values.pdfUrl)
      newFilePath = `courses/${nanoid()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(newFilePath, values.pdfUrl, {
          cacheControl: '1800',
          upsert: false,
        })

      if (uploadError) {
        console.error('[AdminCoursesServices.updateCourse] upload', uploadError)
        throw new Error("Impossible d'envoyer le nouveau fichier du cours.")
      }
      updateData.pdfUrl = newFilePath
    }

    const { error: updateError } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      if (newFilePath) {
        const { error: rollbackError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([newFilePath])
        if (rollbackError) {
          console.error(
            '[AdminCoursesServices.updateCourse] rollback échoué, fichier orphelin:',
            newFilePath,
            rollbackError
          )
        }
      }
      console.error('[AdminCoursesServices.updateCourse] update', updateError)
      throw new Error('Impossible de mettre à jour le cours.')
    }

    if (values.pdfUrl && oldCourse?.pdfUrl) {
      const { error: cleanupError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([oldCourse.pdfUrl])
      if (cleanupError) {
        console.error(
          '[AdminCoursesServices.updateCourse] ancien fichier non supprimé (orphelin):',
          oldCourse.pdfUrl,
          cleanupError
        )
      }
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

    // On supprime la référence DB en premier : si ça échoue, rien n'est perdu.
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', payload.courseId)

    if (deleteError) {
      console.error('[AdminCoursesServices.deleteCourse] delete', deleteError)
      throw new Error('Impossible de supprimer le cours.')
    }

    // Le fichier storage est supprimé ensuite ; un échec ici ne laisse
    // qu'un fichier orphelin (sans impact utilisateur), pas une incohérence DB.
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([payload.filePath])

    if (storageError) {
      console.error(
        '[AdminCoursesServices.deleteCourse] fichier orphelin à nettoyer manuellement:',
        payload.filePath,
        storageError
      )
    }
  }
}

export const adminCoursesServices = new AdminCoursesServices()
