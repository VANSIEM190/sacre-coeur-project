import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import { modePaymentService } from '@sacre-coeur/data-access/services/finance/modePayment.service'
import { getCurrentSchoolYear } from '@sacre-coeur/domain/utils/getCurrentSchoolYear'
import { filterElement } from '@sacre-coeur/domain/utils/filterElements'
import type { ClassFeeConfig, ClassName } from '@sacre-coeur/domain/types'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'
import { toast } from 'sonner'
import type { ClassFeeFormState } from '../types/class-fee-form'

const sanitizeInput = (value: string) => value.replace(/[<>]/g, '').trim()

export function useClassFeesPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ClassFeeFormState>({ classId: '', reason: 'Minerval', amount: 250, currency: 'USD', tranche: 1 })
  const [schoolYear] = useState(getCurrentSchoolYear())
  const [filterSearch, setFilterSearch] = useState('')
  const [filterYear, setFilterYear] = useState('all')
  const { data: classes = [] } = useFetchData<ClassName[]>(['classes'], classService.getAllClasses)
  const { data: feeConfigs = [] } = useFetchData<ClassFeeConfig[]>(['class-fees-configs'], () => modePaymentService.getClassesPayment())
  const { mutate: fixClassFee, isPending: isFixingFee } = useMutateData<ClassFeeConfig, Error, Omit<ClassFeeConfig, 'id' | 'paidAt'>>(config => modePaymentService.createModePayment(config), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-fees-configs'] })
      setForm(previous => ({ ...previous, classId: '', amount: 250 }))
      toast.success('Tarif enregistré.')
    },
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const selectedClass = classes.find(classe => classe.id === form.classId)
  const filteredConfigs = useMemo(() => filterElement<ClassFeeConfig>({ items: feeConfigs, keys: ['className', 'reason'], searchQuery: filterSearch, selectKey: 'schoolYear', selectedValue: filterYear === 'all' ? 'Tous' : filterYear }), [feeConfigs, filterSearch, filterYear])
  const years = Array.from(new Set([schoolYear, ...feeConfigs.map(config => config.schoolYear)])).sort().reverse()
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const classId = sanitizeInput(form.classId)
    if (!classId || !selectedClass) { toast.error('Sélectionnez une classe existante.'); return }
    fixClassFee({ classId, className: selectedClass.nom_classe, tranche: form.tranche, reason: sanitizeInput(form.reason), amount: form.amount, currency: sanitizeInput(form.currency) as 'USD' | 'FC', schoolYear: sanitizeInput(schoolYear) })
    setForm(previous => ({ ...previous, classId: '', amount: 250 }))
  }
  return { classes, filteredConfigs, years, schoolYear, form, setForm, filterSearch, setFilterSearch, filterYear, setFilterYear, isFixingFee, submit }
}
