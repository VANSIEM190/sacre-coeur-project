import test from 'node:test'
import assert from 'node:assert/strict'
import { createTeacherAccountsHandler } from '../functions/teacher-accounts/handler.ts'

const actorId = 'c5a0b857-028f-446a-a0bb-3ca587eeec40'
const teacherId = '063e3181-d93f-4909-9bcd-8e85758d22d0'
const teacherUserId = 'da59bd29-9f28-40c7-9f8b-5c876159625d'
const invitedUserId = '59e6428e-1bbc-42f4-9bdf-7ae2d6c362c8'
const classId = 'a920f233-292d-411c-9294-696e4b79e2b4'

function teacher(overrides = {}) {
  return {
    id: teacherId, user_id: teacherUserId, fullName: 'Enseignant',
    email: 'teacher@example.com', teacherAccessId: 'SC-T-ABCDE',
    assignedclasses: [classId], created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setup(options = {}) {
  const records = options.teacher === null ? [] : [teacher(options.teacher)]
  const calls = { authenticated: 0, reads: [], writes: [], authCreates: [], invitations: [], resets: [], authDeletes: [] }
  const databaseError = { message: 'Database unavailable', code: '42501' }
  const client = {
    auth: {
      getUser: async () => {
        calls.authenticated += 1
        return options.invalidSession
          ? { data: { user: null }, error: { message: 'Invalid or expired JWT' } }
          : { data: { user: { id: actorId } }, error: null }
      },
      resetPasswordForEmail: async (email, config) => {
        calls.resets.push({ email, ...config })
        return { error: options.resetError ? new Error('Mail unavailable') : null }
      },
      admin: {
        createUser: async values => {
          calls.authCreates.push(values)
          return options.existingAuthAccount
            ? { data: { user: null }, error: Object.assign(new Error('An Auth account already uses this email'), { code: 'email_exists' }) }
            : { data: { user: { id: invitedUserId } }, error: null }
        },
        getUserById: async id => ({
          data: { user: options.missingAuthUser ? null : { id, email: options.accountEmail ?? 'teacher@example.com' } },
          error: options.missingAuthUser ? new Error('Account missing') : null,
        }),
        inviteUserByEmail: async (email, config) => {
          calls.invitations.push({ email, ...config })
          return options.existingAuthAccount
            ? { data: { user: null }, error: Object.assign(new Error('An Auth account already uses this email'), { code: 'email_exists' }) }
            : options.invitationError
            ? { data: { user: null }, error: new Error('Invitation unavailable') }
            : { data: { user: { id: options.invitationUserId ?? invitedUserId, email } }, error: null }
        },
        deleteUser: async id => {
          calls.authDeletes.push(id)
          return { error: options.authDeleteError ? new Error('Account deletion unavailable') : null }
        },
      },
    },
    from: table => {
      let operation = 'select'
      let values
      const filters = {}
      const execute = () => {
        if (operation === 'select') {
          calls.reads.push({ table, filters: { ...filters } })
          if (table === 'profiles') {
            return { data: { role: filters.id === actorId ? options.actorRole ?? 'admin' : options.targetRole ?? 'teacher' }, error: null }
          }
          if (table === 'classes') {
            const ids = options.missingClass ? [] : filters.id ?? []
            return { data: ids.map(id => ({ id })), error: null }
          }
          return { data: records.find(record => Object.entries(filters).every(([field, value]) => record[field] === value)) ?? null, error: null }
        }

        calls.writes.push({ table, operation, values, filters: { ...filters } })
        if ((operation === 'upsert' && options.profileWriteError) ||
            (operation === 'update' && values.user_id && options.linkError) ||
            (operation === 'update' && values.email && options.emailSyncError) ||
            (operation === 'delete' && options.detailDeleteError)) {
          return { data: null, error: databaseError }
        }
        if (operation === 'insert') {
          const record = teacher({ user_id: null, ...values })
          records.push(record)
          return { data: record, error: null }
        }
        if (operation === 'update') {
          const record = records.find(record => record.id === filters.id)
          Object.assign(record, values)
          return { data: record, error: null }
        }
        if (operation === 'delete') {
          const index = records.findIndex(record => record.id === filters.id)
          if (index !== -1) records.splice(index, 1)
        }
        return { data: null, error: null }
      }
      const query = {
        select: () => query,
        eq: (field, value) => { filters[field] = value; return query },
        in: (field, value) => { filters[field] = value; return query },
        insert: value => { operation = 'insert'; values = value; return query },
        update: value => { operation = 'update'; values = value; return query },
        upsert: value => { operation = 'upsert'; values = value; return query },
        delete: () => { operation = 'delete'; return query },
        single: async () => execute(),
        maybeSingle: async () => execute(),
        then: (resolve, reject) => Promise.resolve(execute()).then(resolve, reject),
      }
      return query
    },
  }

  return {
    calls, records,
    handle: createTeacherAccountsHandler({ client, siteUrl: 'https://site.example', adminOrigin: 'https://admin.example' }),
  }
}

function command(body, overrides = {}) {
  return new Request('https://supabase.example/teacher-accounts', {
    method: 'POST',
    headers: { Authorization: 'Bearer valid-user-token', 'Content-Type': 'application/json', Origin: 'https://admin.example' },
    body: JSON.stringify(body),
    ...overrides,
  })
}

test('expired sessions cannot read profiles or issue a privileged command', async () => {
  const { handle, calls } = setup({ invalidSession: true })
  assert.equal((await handle(command({ action: 'delete', id: teacherId }))).status, 401)
  assert.equal(calls.reads.length, 0)
  assert.equal(calls.writes.length, 0)
  assert.deepEqual(calls.authDeletes, [])
})

test('malformed JSON receives a client error without database mutation', async () => {
  const { handle, calls } = setup()
  assert.equal((await handle(command({}, { body: '{invalid json' }))).status, 400)
  assert.equal(calls.writes.length, 0)
})

for (const targetRole of ['admin', 'parent']) {
  test('deletion refuses a linked ' + targetRole + ' account even for an authenticated admin', async () => {
    const { handle, calls } = setup({ targetRole })
    assert.equal((await handle(command({ action: 'delete', id: teacherId }))).status, 409)
    assert.equal(calls.writes.length, 0)
    assert.deepEqual(calls.authDeletes, [])
  })
}

test('deletion removes only the teacher account identified by its record', async () => {
  const { handle, calls, records } = setup()
  const response = await handle(command({ action: 'delete', id: teacherId }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true })
  assert.equal(records.length, 0)
  assert.deepEqual(calls.authDeletes, [teacherUserId])
  assert.ok(!calls.authDeletes.includes(actorId))
})

test('a failure deleting the teacher record preserves its Auth account', async context => {
  context.mock.method(console, 'error', () => {})
  const { handle, calls, records } = setup({ detailDeleteError: true })
  assert.equal((await handle(command({ action: 'delete', id: teacherId }))).status, 500)
  assert.equal(records.length, 1)
  assert.deepEqual(calls.authDeletes, [])
})

test('a partial account deletion is reported instead of a false success', async () => {
  const { handle, calls, records } = setup({ authDeleteError: true })
  const response = await handle(command({ action: 'delete', id: teacherId }))
  assert.equal(response.status, 502)
  assert.equal((await response.json()).partial, true)
  assert.equal(records.length, 0)
  assert.deepEqual(calls.authDeletes, [teacherUserId])
})

test('creation refuses a class that does not exist before sending any invitation', async () => {
  const { handle, calls } = setup({ teacher: null, missingClass: true })
  const response = await handle(command({ action: 'create', fullName: 'Enseignant', email: 'teacher@example.com', assignedclasses: [classId] }))
  assert.equal(response.status, 400)
  assert.equal(calls.writes.length, 0)
  assert.equal(calls.invitations.length, 0)
})

test('class assignments are verified in Supabase and stored in the schema text column', async () => {
  const { handle, calls, records } = setup()
  const response = await handle(command({ action: 'assign-classes', id: teacherId, assignedclasses: [classId, classId] }))
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).teacher.assignedclasses, [classId])
  assert.deepEqual(JSON.parse(records[0].assignedclasses), [classId])
  assert.equal(records[0].classe_id, classId)
  assert.ok(calls.reads.some(call => call.table === 'classes'))
})

test('class assignment rejects classes missing from Supabase', async () => {
  const { handle, calls, records } = setup({ missingClass: true })
  const response = await handle(command({ action: 'assign-classes', id: teacherId, assignedclasses: [classId] }))
  assert.equal(response.status, 400)
  assert.deepEqual(records[0].assignedclasses, [classId])
  assert.equal(calls.writes.some(call => call.table === 'enseignants_details' && call.operation === 'update'), false)
})

test('creation fixes the teacher role server-side and ignores a client redirect URL', async () => {
  const { handle, calls, records } = setup({ teacher: null })
  const response = await handle(command({
    action: 'create', fullName: 'Enseignant', email: 'Teacher@example.com',
    assignedclasses: [classId, classId], role: 'admin', redirectTo: 'https://foreign.example/steal-token',
  }))
  assert.equal(response.status, 201)
  const result = await response.json()
  assert.equal(result.teacher.role, 'teacher')
  assert.equal(result.teacher.email, 'teacher@example.com')
  assert.deepEqual(JSON.parse(records[0].assignedclasses), [classId])
  assert.equal(records[0].classe_id, classId)
  assert.equal(records[0].user_id, invitedUserId)
  assert.equal(calls.invitations[0].redirectTo, 'https://site.example/auth/invitation')
  const profileWrite = calls.writes.find(call => call.table === 'profiles')
  assert.equal(profileWrite.values.role, 'teacher')
  assert.equal(profileWrite.values.id, invitedUserId)
  assert.deepEqual(calls.authDeletes, [])
})

test('an invitation delivery failure keeps the record available for a retry', async context => {
  context.mock.method(console, 'error', () => {})
  const { handle, calls, records } = setup({ teacher: null, invitationError: true })
  const response = await handle(command({ action: 'create', fullName: 'Enseignant', email: 'teacher@example.com', assignedclasses: [classId] }))
  assert.equal(response.status, 502)
  assert.equal((await response.json()).partial, true)
  assert.equal(records.length, 1)
  assert.equal(records[0].user_id, null)
  assert.equal(calls.invitations.length, 1)
  assert.deepEqual(calls.authDeletes, [])
})

for (const failure of ['profileWriteError', 'linkError']) {
  test('failed ' + failure + ' compensates only the just-created Auth account', async context => {
    context.mock.method(console, 'error', () => {})
    const { handle, calls, records } = setup({ teacher: null, [failure]: true })
    const response = await handle(command({ action: 'create', fullName: 'Enseignant', email: 'teacher@example.com', assignedclasses: [classId] }))
    assert.equal(response.status, 502)
    assert.equal((await response.json()).partial, true)
    assert.deepEqual(calls.authDeletes, [invitedUserId])
    assert.ok(!calls.authDeletes.includes(actorId))
    assert.ok(!calls.authDeletes.includes(teacherUserId))
    assert.equal(records[0].user_id, null)
    assert.equal(calls.invitations.length, 1)
  })
}

test('resending a link follows the confirmed Auth email and synchronizes the teacher record', async () => {
  const { handle, calls, records } = setup({ accountEmail: 'new.email@example.com' })
  const response = await handle(command({ action: 'invite', id: teacherId, redirectTo: 'https://foreign.example' }))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).teacher.email, 'new.email@example.com')
  assert.equal(records[0].email, 'new.email@example.com')
  assert.deepEqual(calls.resets, [{ email: 'new.email@example.com', redirectTo: 'https://site.example/auth/invitation' }])
  assert.equal(calls.invitations.length, 0)
})

test('email synchronization failure prevents sending a link to an inconsistent record', async context => {
  context.mock.method(console, 'error', () => {})
  const { handle, calls } = setup({ accountEmail: 'new.email@example.com', emailSyncError: true })
  assert.equal((await handle(command({ action: 'invite', id: teacherId }))).status, 500)
  assert.equal(calls.resets.length, 0)
  assert.deepEqual(calls.authDeletes, [])
})

test('a linked administrator is never sent a teacher password setup link', async context => {
  context.mock.method(console, 'error', () => {})
  const { handle, calls } = setup({ targetRole: 'admin' })
  assert.equal((await handle(command({ action: 'invite', id: teacherId }))).status, 500)
  assert.equal(calls.resets.length, 0)
  assert.equal(calls.invitations.length, 0)
  assert.equal(calls.writes.length, 0)
})

test('missing linked Auth accounts do not cause a fabricated invitation success', async context => {
  context.mock.method(console, 'error', () => {})
  const { handle, calls } = setup({ missingAuthUser: true })
  assert.equal((await handle(command({ action: 'invite', id: teacherId }))).status, 500)
  assert.equal(calls.resets.length, 0)
})

test('legacy records without an Auth account can be invited and linked', async () => {
  const { handle, calls, records } = setup({ teacher: { user_id: null } })
  assert.equal((await handle(command({ action: 'invite', id: teacherId }))).status, 200)
  assert.equal(records[0].user_id, invitedUserId)
  assert.equal(calls.invitations.length, 1)
  assert.equal(calls.writes.filter(call => call.operation === 'insert').length, 0)
})

test('an existing unconfirmed Auth account is never reassigned or deleted by teacher creation', async context => {
  context.mock.method(console, 'error', () => {})
  const { handle, calls, records } = setup({ teacher: null, existingAuthAccount: true })
  const response = await handle(command({ action: 'create', fullName: 'Enseignant', email: 'teacher@example.com', assignedclasses: [classId] }))
  assert.equal(response.status, 409)
  assert.equal((await response.json()).partial, true)
  assert.equal(records[0].user_id, null)
  assert.equal(calls.invitations.length, 1)
  assert.equal(calls.writes.filter(call => call.table === 'profiles').length, 0)
  assert.deepEqual(calls.authDeletes, [])
})

test('an unexpected invitation UID never rewrites or deletes a foreign Auth account', async context => {
  context.mock.method(console, 'error', () => {})
  const { handle, calls, records } = setup({ teacher: null, invitationUserId: actorId })
  const response = await handle(command({ action: 'create', fullName: 'Enseignant', email: 'teacher@example.com', assignedclasses: [classId] }))
  assert.equal(response.status, 502)
  assert.equal((await response.json()).partial, true)
  assert.equal(records[0].user_id, null)
  assert.deepEqual(calls.authDeletes, [])
  assert.equal(calls.writes.some(call => call.table === 'profiles'), false)
})
