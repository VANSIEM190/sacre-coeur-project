import test from 'node:test'
import assert from 'node:assert/strict'
import { createTeacherAccountsHandler } from '../functions/teacher-accounts/handler.ts'

const adminId = 'c5a0b857-028f-446a-a0bb-3ca587eeec40'
const teacherId = '063e3181-d93f-4909-9bcd-8e85758d22d0'
const classId = 'a920f233-292d-411c-9294-696e4b79e2b4'

function setup({ role = 'admin', records = [] } = {}) {
  const writes = []
  const authCalls = []
  const client = {
    auth: {
      getUser: async token => ({
        data: token === 'valid-user-token' ? { user: { id: adminId } } : { user: null },
        error: token === 'valid-user-token' ? null : new Error('Invalid token'),
      }),
      admin: {
        createUser: async value => { authCalls.push(['createUser', value]); return { data: { user: { id: 'unexpected' } }, error: null } },
        inviteUserByEmail: async (...args) => { authCalls.push(['inviteUserByEmail', ...args]); return { data: null, error: null } },
        deleteUser: async id => { authCalls.push(['deleteUser', id]); return { error: null } },
      },
    },
    from: table => {
      let operation = 'select'
      let values
      const filters = {}
      const execute = () => {
        if (operation === 'select') {
          if (table === 'profiles') return { data: { role }, error: null }
          if (table === 'classes') return { data: (filters.id ?? []).map(id => ({ id })), error: null }
          return { data: records.find(record => Object.entries(filters).every(([field, value]) => record[field] === value)) ?? null, error: null }
        }
        writes.push({ table, operation, values, filters: { ...filters } })
        if (operation === 'insert') {
          const record = { id: teacherId, user_id: null, created_at: '2026-01-01', ...values }
          records.push(record)
          return { data: record, error: null }
        }
        if (operation === 'update') {
          const record = records.find(item => item.id === filters.id)
          if (record) Object.assign(record, values)
          return { data: record ?? null, error: null }
        }
        if (operation === 'delete') {
          const index = records.findIndex(item => item.id === filters.id)
          if (index >= 0) records.splice(index, 1)
        }
        return { data: null, error: null }
      }
      const query = {
        select: () => query,
        eq: (field, value) => { filters[field] = value; return query },
        in: (field, value) => { filters[field] = value; return query },
        insert: value => { operation = 'insert'; values = value; return query },
        update: value => { operation = 'update'; values = value; return query },
        delete: () => { operation = 'delete'; return query },
        single: async () => execute(),
        maybeSingle: async () => execute(),
        then: (resolve, reject) => Promise.resolve(execute()).then(resolve, reject),
      }
      return query
    },
  }

  return {
    writes,
    authCalls,
    records,
    handle: createTeacherAccountsHandler({ client, adminOrigin: 'https://admin.example' }),
  }
}

const command = body => new Request('https://supabase.example/teacher-accounts', {
  method: 'POST',
  headers: { Authorization: 'Bearer valid-user-token', 'Content-Type': 'application/json', Origin: 'https://admin.example' },
  body: JSON.stringify(body),
})

test('requires a valid session before checking the administrator profile', async () => {
  const { handle, writes } = setup()
  const response = await handle(new Request('https://supabase.example/teacher-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://admin.example' }, body: '{}' }))
  assert.equal(response.status, 401)
  assert.equal(writes.length, 0)
})

test('rejects non-admin users before writes', async () => {
  const { handle, writes } = setup({ role: 'teacher' })
  assert.equal((await handle(command({ action: 'create', fullName: 'Professeur', email: 'p@example.test', assignedclasses: [classId] }))).status, 403)
  assert.equal(writes.length, 0)
})

test('rejects a foreign origin', async () => {
  const { handle, writes } = setup()
  const request = command({ action: 'delete', id: teacherId })
  request.headers.set('Origin', 'https://foreign.example')
  assert.equal((await handle(request)).status, 403)
  assert.equal(writes.length, 0)
})

test('creates an unlinked teacher record with a high-entropy matricule and sends no email', async () => {
  const { handle, writes, authCalls, records } = setup()
  const response = await handle(command({
    action: 'create',
    fullName: 'Professeur',
    email: 'Teacher@example.test',
    assignedclasses: [classId, classId],
  }))

  assert.equal(response.status, 201)
  const { teacher } = await response.json()
  assert.match(teacher.teacherAccessId, /^SC-T-[A-F0-9]{32}$/)
  assert.equal(teacher.email, 'teacher@example.test')
  assert.equal(records[0].user_id, null)
  assert.deepEqual(records[0].assignedclasses, [classId])
  assert.deepEqual(authCalls, [])
  assert.equal(writes.filter(write => write.table === 'enseignants_details' && write.operation === 'insert').length, 1)
})

test('rejects invalid teacher data before writing', async () => {
  const { handle, writes } = setup()
  const response = await handle(command({ action: 'create', fullName: '', email: 'invalid', assignedclasses: [] }))
  assert.equal(response.status, 400)
  assert.equal(writes.length, 0)
})
