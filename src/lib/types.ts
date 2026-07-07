// Domain types — SRP, explicit naming
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent'
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

export type SchoolClassName =
  | '1ère Primaire'
  | '2ème Primaire'
  | '3ème Primaire'
  | '4ème Primaire'
  | '5ème Primaire'
  | '6ème Primaire'
  | '1ère Secondaire'
  | '2ème Secondaire'
  | '3ème Secondaire'
  | '4ème Secondaire'
  | '5ème Secondaire'
  | '6ème Secondaire'

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

export interface RegisterParentUser extends BaseUser {
  role: 'parent'
  password: string
  lastName: string
  middleName?: string | null
  firstName: string
  guardianRelation: string
  profession: string
  phone: string
}

export interface StudentUser extends BaseUser {
  role: 'student'
  isValidatedByAdmin: boolean
  currentClassName: SchoolClassName
  // Detailed registration data
  lastName: string
  middleName: string
  firstName: string
  birthDate: string
  birthPlace: string
  gender: 'M' | 'F'
  fatherName: string
  motherName: string
  fatherProfession: string
  motherProfession: string
  childMedicalCondition: string
  guardianRelation: string
  phone: string
  previousSchoolPercentage: number
  previousSchoolName: string
  religion: string
  address: string
  province: string
  classe_id?: string
}

export type AnyUser = AdminUser | TeacherUser | StudentUser | RegisterParentUser

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
  dayOfWeek: Day
  startTime: string
  endTime: string
  subject: string
  teacherName: string
  room: string
  classe_id: string
  created_at: string
}

export interface GradingSheet {
  id: string
  teacherId: string
  className: SchoolClassName
  subject: string
  tranche: PaymentTranche
  entries: Array<{ studentId: string; score: number; maxScore: number }>
  submittedAt: string
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

export interface AnnualHonorRoll {
  id: string
  year: number
  className: SchoolClassName
  rankings: Array<{ studentName: string; percentage: number; rank: number }>
  createdAt: string
}

export interface PaymentReceipt {
  id: string
  studentId: string
  tranche: PaymentTranche
  amount: number
  currency: 'USD' | 'CDF'
  schoolYear: string
  paidAt: string
  cashierName: string
  receiptNumber: string
}

export interface filterElementType<T> {
  items: T[]
  keys: (keyof T)[]
  searchQuery: string
  selectKey?: keyof T
  selectedValue?: string
}
