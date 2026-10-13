import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAmount, validateCurrency, validateGrade, validateTranche } from '../src/validation.ts'
import { calculateStudentFinances } from '../src/utils/calculateStudentFinances.ts'
import { validateTimeRange, timeRangesOverlap } from '../src/utils/scheduleRules.ts'
import { getCurrentSchoolYear } from '../src/utils/getCurrentSchoolYear.ts'
import { getEligibleReenrollmentClasses } from '../src/utils/getEligibleReenrollmentClasses.ts'
import { createTeacherSchema } from '../src/teachers.ts'

const receipt = (amount, currency = 'USD', tranche = 1) => ({
  id: 'receipt', studentId: 'student', studentName: 'Élève', schoolYear: '2026-2027',
  reason: 'Minerval', cashierName: 'Caisse', paidAt: '2026-10-12', amount, currency, tranche,
})
const fee = (amount, currency = 'USD', tranche = 1) => ({
  id: 'fee', classId: 'class', className: '1ère Primaire', schoolYear: '2026-2027',
  reason: 'Minerval', paidAt: '2026-10-12', amount, currency, tranche,
})

test('un paiement refuse les montants invalides, les devises inconnues et les tranches hors contrat', () => {
  for (const amount of [NaN, Infinity, -1, 0]) assert.throws(() => validateAmount(amount))
  assert.doesNotThrow(() => validateAmount(12.5))
  assert.throws(() => validateCurrency('EUR'))
  assert.throws(() => validateTranche(4))
})

test('les frais sont cumulés par tranche et les deux devises restent indépendantes', () => {
  const result = calculateStudentFinances([receipt(100), receipt(50), receipt(20, 'FC')], [fee(100), fee(50), fee(25, 'FC')])
  assert.equal(result.tranches[1].requiredUSD, 150)
  assert.deepEqual(result.totals, { USD: 150, FC: 20 })
  assert.equal(result.tranches[1].status, 'Incomplète')
  assert.equal(result.isGloballyCompliant, false)
})

test('un tarif absent ne produit ni dette présumée ni conformité financière', () => {
  const result = calculateStudentFinances([receipt(100)], [])
  assert.equal(result.hasFeeConfiguration, false)
  assert.equal(result.tranches[1].status, 'Non configurée')
  assert.equal(result.isGloballyCompliant, false)
})

test('les reçus couvrant tous les frais configurés règlent la scolarité sans conversion de devise', () => {
  const result = calculateStudentFinances([receipt(10), receipt(50, 'FC', 2)], [fee(10), fee(50, 'FC', 2)])
  assert.equal(result.tranches[1].status, 'Réglée')
  assert.equal(result.tranches[2].status, 'Réglée')
  assert.equal(result.tranches[3].status, 'Non configurée')
  assert.equal(result.isGloballyCompliant, true)
})

test('les erreurs binaires décimales ne créent pas un impayé artificiel', () => {
  const result = calculateStudentFinances([receipt(0.3)], [fee(0.1), fee(0.2)])
  assert.equal(result.tranches[1].status, 'Réglée')
})

test('une note négative, non finie ou dépassant le barème est refusée', () => {
  for (const [score, max] of [[-1, 20], [21, 20], [1, 0], [NaN, 20], [1, Infinity]]) {
    assert.throws(() => validateGrade(score, max))
  }
  assert.doesNotThrow(() => validateGrade(0, 20))
})

test('les périodes adjacentes sont autorisées et les chevauchements détectés', () => {
  const first = { startTime: '08:00', endTime: '09:00' }
  assert.equal(timeRangesOverlap(first, { startTime: '09:00:00', endTime: '10:00:00' }), false)
  assert.equal(timeRangesOverlap(first, { startTime: '08:30', endTime: '10:00' }), true)
  assert.throws(() => validateTimeRange('09:00', '08:00'))
  assert.throws(() => validateTimeRange('24:00', '25:00'))
})

test("la règle existante d'année scolaire bascule en juillet", () => {
  assert.equal(getCurrentSchoolYear(new Date(2026, 5, 30, 12)), '2025-2026')
  assert.equal(getCurrentSchoolYear(new Date(2026, 6, 1, 12)), '2026-2027')
})

test('la réinscription conserve la filière et exclut les classes des autres niveaux', () => {
  const classes = ['2ème Scientifique', '2ème Littéraire', '1ère Scientifique', '2ème Primaire'].map((nom_classe, index) => ({
    id: String(index), nom_classe, annee_scolaire: '2026-2027', studentCount: 0,
  }))
  assert.deepEqual(getEligibleReenrollmentClasses('1ère Scientifique', classes).map(classe => classe.nom_classe), ['2ème Scientifique'])
})

test("la création de fiche enseignant refuse les affectations sans UUID réel", () => {
  assert.equal(createTeacherSchema.safeParse({ fullName: 'Professeur', email: 'prof@ecole.test', assignedclasses: ['classe-inventée'] }).success, false)
  assert.equal(createTeacherSchema.safeParse({ fullName: 'Professeur', email: 'prof@ecole.test', assignedclasses: ['11111111-1111-4111-8111-111111111111'] }).success, true)
})
