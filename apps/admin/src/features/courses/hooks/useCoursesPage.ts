import { useRef, useState } from 'react'
import { adminCoursesServices } from '@sacre-coeur/data-access/services/course/course.service'
import { downloadFile } from '@sacre-coeur/data-access/utils/downloadFile'
import { filterElement } from '@sacre-coeur/domain/utils/filterElements'
import type { Course } from '@sacre-coeur/domain/types'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'
import { useAdminCoursesData } from './useAdminCoursesData'

const BUCKET_NAME = 'sacre-coeur-files-courses'

export function useCoursesPage() {
  const { coursesQuery, classesQuery } = useAdminCoursesData()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [classId, setClassId] = useState('')
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassFilter, setSelectedClassFilter] = useState('Tous')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setFile(null)
    setClassId('')
    setEditingCourse(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startEdit = (course: Course) => {
    setEditingCourse(course)
    setTitle(course.title)
    setDescription(course.description)
    setClassId(course.class_id)
    setFile(null)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editingCourse && !file) {
      alert('Veuillez sélectionner un fichier valide.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingCourse) {
        await adminCoursesServices.updateCourse(editingCourse.id, {
          title,
          description,
          class_id: classId,
          ...(file ? { pdfUrl: file } : {}),
        })
      } else {
        await adminCoursesServices.createCourse({
          title,
          description,
          class_id: classId,
          pdfUrl: file as File,
        })
      }
      resetForm()
      coursesQuery.refetch()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du cours :", error)
      SupabaseErrorHandler.handle(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const remove = async (courseId: string, filePath: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce cours ?')) return
    try {
      await adminCoursesServices.deleteCourse({ courseId, filePath })
      if (editingCourse?.id === courseId) resetForm()
      coursesQuery.refetch()
    } catch (error) {
      console.error('Erreur lors de la suppression :', error)
      SupabaseErrorHandler.handle(error)
    }
  }

  const download = async (course: Course) => {
    setDownloadingId(course.id)
    try {
      const extension = course.pdfUrl.split('.').pop()
      await downloadFile({
        bucket: BUCKET_NAME,
        filePath: course.pdfUrl,
        fileName: `${course.title}.${extension}`,
      })
    } catch (error) {
      console.error('Erreur lors du téléchargement :', error)
      SupabaseErrorHandler.handle(error)
    } finally {
      setDownloadingId(null)
    }
  }

  const courses = coursesQuery.data ?? []
  const classes = classesQuery.data ?? []
  const filteredCourses = filterElement({
    items: courses,
    keys: ['title', 'description'],
    searchQuery,
    selectKey: 'class_id',
    selectedValue: selectedClassFilter,
  })

  return {
    classes,
    filteredCourses,
    title,
    description,
    file,
    classId,
    editingCourse,
    isSubmitting,
    downloadingId,
    searchQuery,
    selectedClassFilter,
    fileInputRef,
    setTitle,
    setDescription,
    setFile,
    setClassId,
    setSearchQuery,
    setSelectedClassFilter,
    resetForm,
    startEdit,
    submit,
    remove,
    download,
  }
}
