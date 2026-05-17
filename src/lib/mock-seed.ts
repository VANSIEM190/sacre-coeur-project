import type {
  AdminUser,
  TeacherUser,
  StudentUser,
  Announcement,
  Course,
  ScheduleEntry,
  GradingSheet,
  ArchiveDocument,
  AnnualHonorRoll,
  PaymentReceipt,
  SchoolClassName,
} from './types'

export const ALL_CLASS_NAMES: SchoolClassName[] = [
  '1ère Primaire',
  '2ème Primaire',
  '3ème Primaire',
  '4ème Primaire',
  '5ème Primaire',
  '6ème Primaire',
  '1ère Secondaire',
  '2ème Secondaire',
  '3ème Secondaire',
  '4ème Secondaire',
  '5ème Secondaire',
  '6ème Secondaire',
]

export const seedAdmin: AdminUser = {
  id: 'admin-1',
  email: 'admin@sacrecoeur.edu',
  role: 'admin',
  fullName: 'Père Joseph Mwamba',
  createdAt: new Date('2024-09-01').toISOString(),
}

export const seedTeachers: TeacherUser[] = [
  {
    id: 'teacher-1',
    email: 'kabongo@sacrecoeur.edu',
    role: 'teacher',
    fullName: 'M. André Kabongo',
    teacherAccessId: 'SC-T-2024-8821',
    assignedClassNames: ['4ème Secondaire', '5ème Secondaire'],
    createdAt: new Date('2024-09-05').toISOString(),
  },
  {
    id: 'teacher-2',
    email: 'ngandu@sacrecoeur.edu',
    role: 'teacher',
    fullName: 'Mme Sylvie Ngandu',
    teacherAccessId: 'SC-T-2024-3492',
    assignedClassNames: ['6ème Primaire', '1ère Secondaire'],
    createdAt: new Date('2024-09-05').toISOString(),
  },
]

export const seedStudents: StudentUser[] = [
  {
    id: 'student-1',
    email: 'jean.kabeya@student.edu',
    role: 'student',
    fullName: 'Jean-Dieudonné Kabeya',
    isValidatedByAdmin: true,
    currentClassName: '4ème Secondaire',
    lastName: 'Kabeya',
    middleName: 'Dieudonné',
    firstName: 'Jean',
    birthDate: '2008-04-12',
    birthPlace: 'Kinshasa',
    gender: 'M',
    fatherName: 'Pierre Kabeya',
    motherName: 'Marie Kabeya',
    fatherProfession: 'Ingénieur',
    motherProfession: 'Enseignante',
    childMedicalCondition: 'Aucune',
    guardianRelation: 'Père',
    phone: '+243 81 234 5678',
    previousSchoolPercentage: 78,
    previousSchoolName: 'Collège Saint-Pierre',
    religion: 'Catholique',
    address: 'Av. Lumumba 23',
    province: 'Kinshasa',
    createdAt: new Date('2024-09-10').toISOString(),
  },
  {
    id: 'student-2',
    email: 'grace.mbuyi@student.edu',
    role: 'student',
    fullName: 'Grace Mbuyi',
    isValidatedByAdmin: false,
    currentClassName: '3ème Secondaire',
    lastName: 'Mbuyi',
    middleName: '',
    firstName: 'Grace',
    birthDate: '2009-07-22',
    birthPlace: 'Lubumbashi',
    gender: 'F',
    fatherName: 'Joseph Mbuyi',
    motherName: 'Esther Mbuyi',
    fatherProfession: 'Médecin',
    motherProfession: 'Avocate',
    childMedicalCondition: 'Asthme léger',
    guardianRelation: 'Mère',
    phone: '+243 99 876 5432',
    previousSchoolPercentage: 82,
    previousSchoolName: 'École Sainte-Marie',
    religion: 'Catholique',
    address: 'Av. Kasai 8',
    province: 'Haut-Katanga',
    createdAt: new Date('2024-10-02').toISOString(),
  },
]

export const seedAnnouncements: Announcement[] = [
  {
    id: 'a-1',
    title: 'Messe de rentrée scolaire',
    body: "Tous les élèves en uniforme complet sont attendus vendredi à 8h00 pour la bénédiction de l'année.",
    authorId: 'admin-1',
    targetClassNames: 'all',
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: 'a-2',
    title: 'Horaire modifié — 4ème Humanités',
    body: 'Le cours de mathématiques de mercredi est déplacé à 8h30 au local B12.',
    authorId: 'admin-1',
    targetClassNames: ['4ème Secondaire'],
    createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
]

export const seedCourses: Course[] = [
  {
    id: 'c-1',
    title: 'Algèbre — Équations du second degré',
    description: 'Chapitre 3 : factorisation et discriminant.',
    className: '4ème Secondaire',
    uploadedAt: new Date().toISOString(),
  },
  {
    id: 'c-2',
    title: 'Histoire — Indépendance du Congo',
    description: 'Étude des événements de 1960.',
    className: '4ème Secondaire',
    uploadedAt: new Date().toISOString(),
  },
]

export const seedSchedule: ScheduleEntry[] = [
  {
    id: 's-1',
    className: '4ème Secondaire',
    dayOfWeek: 'Lundi',
    startTime: '08:00',
    endTime: '09:30',
    subject: 'Mathématiques',
    teacherId: 'teacher-1',
    room: 'B12',
  },
  {
    id: 's-2',
    className: '4ème Secondaire',
    dayOfWeek: 'Lundi',
    startTime: '09:45',
    endTime: '11:15',
    subject: 'Français',
    teacherId: 'teacher-1',
    room: 'A04',
  },
  {
    id: 's-3',
    className: '4ème Secondaire',
    dayOfWeek: 'Mardi',
    startTime: '08:00',
    endTime: '09:30',
    subject: 'Histoire',
    teacherId: 'teacher-1',
    room: 'B12',
  },
]

export const seedGradingSheets: GradingSheet[] = [
  {
    id: 'g-1',
    teacherId: 'teacher-1',
    className: '4ème Secondaire',
    subject: 'Mathématiques',
    tranche: 1,
    entries: [{ studentId: 'student-1', score: 17, maxScore: 20 }],
    submittedAt: new Date().toISOString(),
  },
]

export const seedArchives: ArchiveDocument[] = [
  {
    id: 'ar-1',
    title: 'Palmarès 2023-2024',
    year: 2024,
    category: 'Palmarès',
    description: 'Classement final.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ar-2',
    title: 'PV Conseil 2023',
    year: 2023,
    category: 'Procès-Verbal',
    description: "Réunion fin d'année.",
    createdAt: new Date().toISOString(),
  },
]

export const seedHonorRolls: AnnualHonorRoll[] = [
  {
    id: 'hr-1',
    year: 2024,
    className: '4ème Secondaire',
    rankings: [
      { studentName: 'Jean-Dieudonné Kabeya', percentage: 84.2, rank: 1 },
      { studentName: 'Marie Lubaki', percentage: 81.5, rank: 2 },
    ],
    createdAt: new Date().toISOString(),
  },
]

export const seedReceipts: PaymentReceipt[] = [
  {
    id: 'r-1',
    studentId: 'student-1',
    tranche: 1,
    amount: 250,
    currency: 'USD',
    schoolYear: '2024-2025',
    paidAt: new Date().toISOString(),
    cashierName: 'Sœur Béatrice',
    receiptNumber: 'REC-2024-0001',
  },
]
