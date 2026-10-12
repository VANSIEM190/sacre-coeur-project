import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { paymentService } from '@sacre-coeur/data-access/services/finance/payment.service'
import { studentService } from '@sacre-coeur/data-access/services/student/Student.service'
import { getCurrentSchoolYear } from '@sacre-coeur/domain/utils/getCurrentSchoolYear'
import { filterElement } from '@sacre-coeur/domain/utils/filterElements'
import type { EleveDetails, PaymentReceipt } from '@sacre-coeur/domain/types'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'
import { toast } from 'sonner'
import type { StudentSuggestion } from '../types/payment-form'
import { getStudentFullName } from '../utils/payment-format'

const sanitizeInput = (value: string) => value.replace(/[<>]/g, '').trim()
export function usePaymentsPage() {
  const queryClient = useQueryClient()
  const { data: students = [] } = useFetchData<EleveDetails[]>(['students', 'admin'], () => studentService.getAllStudents())
  const { data: receipts = [] } = useFetchData<PaymentReceipt[]>(['payments', 'admin'], () => paymentService.getStudentPayment())
  const { mutate: createReceipt, isPending: isCreatingReceipt } = useMutateData<PaymentReceipt, Error, Omit<PaymentReceipt, 'id' | 'paidAt'>>(newPayment => paymentService.createPayment(newPayment), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const [studentId, setStudentId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [tranche, setTranche] = useState<1 | 2 | 3>(1)
  const [currency, setCurrency] = useState<'USD' | 'FC'>('USD')
  const [amount, setAmount] = useState(250)
  const [cashier, setCashier] = useState('')
  const [schoolYear] = useState(getCurrentSchoolYear())
  const [reason, setReason] = useState('Minerval')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterYear, setFilterYear] = useState('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const matchingStudents = useMemo<StudentSuggestion[]>(() => {
    const cleanQuery = studentSearch.trim().toLowerCase()
    return students.map(student => ({ student, fullName: getStudentFullName(student) }))
      .filter(({ student, fullName }) => !cleanQuery || fullName.toLowerCase().includes(cleanQuery) || student.currentClassName?.toLowerCase().includes(cleanQuery))
      .slice(0, 8)
  }, [students, studentSearch])
  const filteredReceipts = useMemo(() => filterElement<PaymentReceipt>({ items: receipts, keys: ['studentName', 'reason', 'id'], searchQuery: filterSearch, selectKey: 'schoolYear', selectedValue: filterYear === 'all' ? 'Tous' : filterYear }), [receipts, filterSearch, filterYear])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const cleanStudentId = sanitizeInput(studentId)
    const selectedStudent = students.find(student => student.id === studentId)
    if (!selectedStudent) { toast.error('Sélectionnez un élève dans la liste.'); return }
    const cleanCashier = sanitizeInput(cashier)
    if (!cleanStudentId || !cleanCashier || amount === 0) return
    createReceipt({ studentId: cleanStudentId, studentName: getStudentFullName(selectedStudent), tranche, amount, currency: sanitizeInput(currency) as 'USD' | 'FC', schoolYear: sanitizeInput(schoolYear), cashierName: cleanCashier, reason: sanitizeInput(reason) })
    setStudentId('')
    setStudentSearch('')
    setCashier('')
  }

  return {
    students, receipts, matchingStudents, filteredReceipts, dropdownRef, isCreatingReceipt,
    studentId, studentSearch, isDropdownOpen, tranche, currency, amount, cashier, schoolYear, reason,
    filterSearch, filterYear, setStudentId, setStudentSearch, setIsDropdownOpen, setTranche,
    setCurrency, setAmount, setCashier, setReason, setFilterSearch, setFilterYear, submit,
  }
}
