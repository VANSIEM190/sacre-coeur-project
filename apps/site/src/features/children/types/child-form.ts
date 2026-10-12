import type { studentType } from '@sacre-coeur/domain/validators/usersSchema'

export const initialChildValues: studentType = {
  lastName: '',
  middleName: '',
  firstName: '',
  birthDate: '',
  birthPlace: '',
  gender: 'M',
  fatherName: '',
  motherName: '',
  fatherProfession: '',
  motherProfession: '',
  childMedicalCondition: '',
  guardianRelation: '',
  phone: '',
  previousSchoolPercentage: 0,
  currentClassName: '',
  previousSchoolName: '',
  religion: 'Catholique',
  address: '',
  province: '',
}
