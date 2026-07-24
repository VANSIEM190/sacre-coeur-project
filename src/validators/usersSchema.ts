import { z } from 'zod'

export const studentSchema = z.object({
  lastName: z.string().trim().min(3, 'Requis').max(60),
  middleName: z.string().trim().min(3, 'Requis').max(60),
  firstName: z.string().trim().min(3, 'Requis').max(60),
  birthDate: z.string().min(1, 'Requis'),
  birthPlace: z.string().trim().min(1, 'Requis').max(80),
  gender: z.enum(['M', 'F']),
  fatherName: z.string().trim().min(1, 'Requis').max(80),
  motherName: z.string().trim().min(1, 'Requis').max(80),
  fatherProfession: z.string().trim().min(1, 'Requis').max(80),
  motherProfession: z.string().trim().min(1, 'Requis').max(80),
  childMedicalCondition: z.string().trim().max(200),
  guardianRelation: z.string().trim().min(1, 'Requis').max(40),
  phone: z.string().trim().min(6, 'Requis').max(20),
  previousSchoolPercentage: z.coerce.number().min(0).max(100),
  currentClassName: z.string().min(1, 'Requis'),
  previousSchoolName: z.string().trim().min(1, 'Requis').max(100),
  religion: z.string().trim().min(1, 'Requis').max(40),
  address: z.string().trim().min(1, 'Requis').max(120),
  province: z.string().trim().min(1, 'Requis').max(60),
})

export const parentSchema = z.object({
  lastName: z.string().trim().min(1, 'Requis').max(60),
  middleName: z.string().trim().min(1, 'Requis').max(60),
  firstName: z.string().trim().min(1, 'Requis').max(60),
  profession: z.string().trim().min(1, 'Requis').max(80),
  guardianRelation: z.string().trim().min(1, 'Requis').max(60),
  phone: z.string().trim().min(6, 'Requis').max(20),
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(6, 'Min. 6 caractères'),
})

export type ParentFormValues = z.infer<typeof parentSchema>
export type studentType = z.infer<typeof studentSchema>
