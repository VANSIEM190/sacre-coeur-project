export interface ClassFeeFormState {
  classId: string
  reason: string
  amount: number
  currency: 'USD' | 'FC'
  tranche: 1 | 2 | 3
}
