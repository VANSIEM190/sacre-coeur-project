// Domain types — SRP, explicit naming
export type UserRole = 'admin' | 'teacher' | 'parent'
export type InscriptionStatus = 'en_attente' | 'accepte' | 'rejete'
export type Day =
  | 'Lundi'
  | 'Mardi'
  | 'Mercredi'
  | 'Jeudi'
  | 'Vendredi'
  | 'Samedi'

export interface ClassName {
  id: string
  nom_classe: string
  annee_scolaire: string
  studentCount: number
}

/** Les libellés réels proviennent de la table classes, sans liste prédéfinie. */
export type SchoolClassName = string

export type PaymentTranche = 1 | 2 | 3

export interface BaseUser {
  id: string
  email: string
  role: UserRole
  fullName: string
  createdAt: string
}

export interface AdminUser extends BaseUser {
  role: 'admin'
}

export interface TeacherUser extends BaseUser {
  role: 'teacher'
  teacherAccessId: string
  assignedclasses: string[]
}

export interface ParentUser extends BaseUser {
  role: 'parent'
  lastName?: string
  middleName?: string | null
  firstName?: string
  guardianRelation?: string
  profession?: string
  phone?: string
}

export interface EleveDetails {
  id: string
  lastName: string
  middleName: string
  firstName: string
  birthDate: string
  birthPlace: string
  gender: string
  fatherName: string
  motherName: string
  fatherProfession: string
  motherProfession: string
  guardianRelation: string
  phone: string
  previousSchoolName: string
  currentClassName: string
  childMedicalCondition?: string
  previousSchoolPercentage?: number
  religion: string
  address: string
  province: string
  parent_id: string
  updated_at?: string

  inscriptions?: Array<{
    id: string
    status: InscriptionStatus
    classe_id: string
    classes?: {
      id: string
      nom_classe: string
    }
  }>

  // Champs Optionnels (si tu choisis de les aplatir dans le service)
  inscription_id?: string | null
  status?: InscriptionStatus
  classe_id?: string | null
  nom_classe?: string
  /** Champs calculés à la lecture : classe acceptée, distincte d'une demande en attente. */
  currentClassId?: string
  currentClassLabel?: string
}

export interface Inscription {
  id: string
  eleve_id: string
  classe_id: string
  annee_scolaire: string
  status: InscriptionStatus
  date_inscription?: string
}

export interface SystemSetting {
  key: string
  value: string
  updated_at?: string
}

export type AnyUser = AdminUser | TeacherUser | ParentUser

export interface Announcement {
  id: string
  title: string
  body: string
  author: string
  targetClassNames: string
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  title: string
  description: string
  class_id: string
  pdfUrl: string
  uploadedAt: string
}

export interface ScheduleEntry {
  id: string
  classe_id: string
  teacher_id: string | null
  dayOfWeek: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi'
  startTime: string
  endTime: string
  subject: string
  room: string
  teacherName: string | null
  created_at?: string
}

export interface ArchiveDocument {
  id: string
  title: string
  year: number
  category: 'Palmarès' | 'Bulletin' | 'Procès-Verbal' | 'Autre'
  file: string
  description: string
  created_at: string
}

export interface ArchiveDocumentInput {
  title: string
  year: number
  category: 'Palmarès' | 'Bulletin' | 'Procès-Verbal' | 'Autre'
  file: File
  description: string
}

export interface ArchiveDocumentUpdateInput {
  title: string
  year: number
  category: 'Palmarès' | 'Bulletin' | 'Procès-Verbal' | 'Autre'
  file?: File | null
  description: string
}

export interface PaymentReceipt {
  id: string
  studentId: string
  tranche: PaymentTranche
  amount: number
  schoolYear: string
  paidAt: string
  cashierName: string
  studentName: string
  reason: string
  currency: 'USD' | 'FC'
}

export interface filterElementType<T> {
  items: T[]
  keys: (keyof T)[]
  searchQuery: string
  selectKey?: keyof T
  selectedValue?: string
}

//fixation
export interface ClassFeeConfig {
  id: string
  classId: string
  className: string
  tranche: 1 | 2 | 3
  reason: string
  amount: number
  currency: 'USD' | 'FC'
  schoolYear: string
  paidAt: string
}

export interface DownloadFileOptions {
  bucket: string
  filePath: string
  fileName?: string
}
