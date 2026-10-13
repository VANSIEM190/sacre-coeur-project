import test from 'node:test'
import assert from 'node:assert/strict'
import { createTeacherEnrollmentHandler } from '../functions/teacher-enrollment/handler.ts'

const accessId = 'SC-T-0123456789ABCDEF0123456789ABCDEF'
const teacherId = '063e3181-d93f-4909-9bcd-8e85758d22d0'
const authId = '59e6428e-1bbc-42f4-9bdf-7ae2d6c362c8'

function setup(options = {}) {
  const teacher = {
    id: teacherId,
    user_id: options.userId ?? null,
    teacherAccessId: accessId,
    fullName: 'Professeur Test',
    email: 'teacher@example.test',
  }
  const profiles = []
  const writes = []
  const createdUsers = []
  const deletedUsers = []
  let teacherLookups = 0

  const client = {
    auth: {
      admin: {
        createUser: async values => {
          createdUsers.push(values)
          if (options.emailExists)
            return { data: { user: null }, error: Object.assign(new Error('email exists'), { code: 'email_exists' }) }
          return { data: { user: { id: authId, email: values.email } }, error: null }
        },
        deleteUser: async id => { deletedUsers.push(id); return { error: null } },
      },
    },
    from: table => {
      let operation = 'select'
      let values
      const filters = {}
      const execute = () => {
        if (operation === 'select') {
          if (table === 'enseignants_details') {
            teacherLookups += 1
            return filters.teacherAccessId === accessId ? { data: teacher, error: null } : { data: null, error: null }
          }
          return { data: null, error: null }
        }

        writes.push({ table, operation, values, filters: { ...filters } })
        if (table === 'profiles' && operation === 'upsert') {
          if (options.profileError) return { data: null, error: new Error('profile write failed') }
          profiles.push(values)
          return { data: values, error: null }
        }
        if (table === 'profiles' && operation === 'delete') {
          const index = profiles.findIndex(profile => profile.id === filters.id)
          if (index >= 0) profiles.splice(index, 1)
          return { data: null, error: null }
        }
        if (table === 'enseignants_details' && operation === 'update') {
          const matches = Object.entries(filters).every(([field, value]) => teacher[field] === value)
          if (!matches || options.claimLost) return { data: null, error: null }
          Object.assign(teacher, values)
          return { data: { id: teacher.id }, error: null }
        }
        return { data: null, error: null }
      }
      const query = {
        select: () => query,
        eq: (field, value) => { filters[field] = value; return query },
        is: (field, value) => { filters[field] = value; return query },
        upsert: value => { operation = 'upsert'; values = value; return query },
        update: value => { operation = 'update'; values = value; return query },
        delete: () => { operation = 'delete'; return query },
        maybeSingle: async () => execute(),
        then: (resolve, reject) => Promise.resolve(execute()).then(resolve, reject),
      }
      return query
    },
  }

  return {
    teacher,
    profiles,
    writes,
    createdUsers,
    deletedUsers,
    getTeacherLookups: () => teacherLookups,
    handle: createTeacherEnrollmentHandler({ client, siteOrigin: 'https://site.example' }),
  }
}

const command = body => new Request('https://supabase.example/teacher-enrollment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'https://site.example' },
  body: JSON.stringify(body),
})

test('rejects short matricules before looking up a teacher', async () => {
  const harness = setup()
  const response = await harness.handle(command({ teacherAccessId: 'SC-T-ABCDE', password: 'strong-pass-123' }))
  assert.equal(response.status, 400)
  assert.equal(harness.getTeacherLookups(), 0)
  assert.equal(harness.createdUsers.length, 0)
})

test('rejects a matricule that does not identify an admin-created record', async () => {
  const harness = setup()
  const response = await harness.handle(command({ teacherAccessId: 'SC-T-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', password: 'strong-pass-123' }))
  assert.equal(response.status, 400)
  assert.match((await response.json()).error, /invalide ou déjà utilisé/i)
  assert.equal(harness.createdUsers.length, 0)
})

test('rejects an already claimed matricule without creating another account', async () => {
  const harness = setup({ userId: 'already-linked' })
  const response = await harness.handle(command({ teacherAccessId: accessId, password: 'strong-pass-123' }))
  assert.equal(response.status, 400)
  assert.match((await response.json()).error, /invalide ou déjà utilisé/i)
  assert.equal(harness.createdUsers.length, 0)
})

test('creates Auth with the admin-recorded email, assigns teacher role and consumes the matricule', async () => {
  const harness = setup()
  const response = await harness.handle(command({ teacherAccessId: accessId.toLowerCase(), password: 'strong-pass-123' }))

  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { success: true, email: 'teacher@example.test' })
  assert.equal(harness.createdUsers.length, 1)
  assert.equal(harness.createdUsers[0].email, 'teacher@example.test')
  assert.equal(harness.createdUsers[0].password, 'strong-pass-123')
  assert.equal(harness.createdUsers[0].email_confirm, true)
  assert.deepEqual(harness.profiles, [{ id: authId, email: 'teacher@example.test', role: 'teacher' }])
  assert.equal(harness.teacher.user_id, authId)
  assert.ok(harness.writes.some(write => write.table === 'enseignants_details' && write.filters.user_id === null))
})

test('does not attach an existing Auth account to a teacher record', async () => {
  const harness = setup({ emailExists: true })
  const response = await harness.handle(command({ teacherAccessId: accessId, password: 'strong-pass-123' }))
  assert.equal(response.status, 400)
  assert.deepEqual(harness.profiles, [])
  assert.equal(harness.teacher.user_id, null)
  assert.deepEqual(harness.deletedUsers, [])
})

test('compensates the new Auth account if the profile write fails', async context => {
  context.mock.method(console, 'error', () => {})
  const harness = setup({ profileError: true })
  const response = await harness.handle(command({ teacherAccessId: accessId, password: 'strong-pass-123' }))
  assert.equal(response.status, 500)
  assert.deepEqual(harness.deletedUsers, [authId])
  assert.equal(harness.teacher.user_id, null)
})

test('compensates if another request consumes the matricule first', async context => {
  context.mock.method(console, 'error', () => {})
  const harness = setup({ claimLost: true })
  const response = await harness.handle(command({ teacherAccessId: accessId, password: 'strong-pass-123' }))
  assert.equal(response.status, 500)
  assert.deepEqual(harness.deletedUsers, [authId])
  assert.deepEqual(harness.profiles, [])
  assert.equal(harness.teacher.user_id, null)
})

test('rejects invalid password before querying a teacher', async () => {
  const harness = setup()
  const response = await harness.handle(command({ teacherAccessId: accessId, password: 'short' }))
  assert.equal(response.status, 400)
  assert.equal(harness.getTeacherLookups(), 0)
  assert.equal(harness.createdUsers.length, 0)
})

test('rejects browser calls from a foreign origin', async () => {
  const harness = setup()
  const request = command({ teacherAccessId: accessId, password: 'strong-pass-123' })
  request.headers.set('Origin', 'https://foreign.example')
  assert.equal((await harness.handle(request)).status, 403)
  assert.equal(harness.createdUsers.length, 0)
})
