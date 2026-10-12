import test from 'node:test'
import assert from 'node:assert/strict'
import { createTeacherAccountsHandler } from '../functions/teacher-accounts/handler.ts'

const actor = 'c5a0b857-028f-446a-a0bb-3ca587eeec40'
const teacherId = '063e3181-d93f-4909-9bcd-8e85758d22d0'
function setup(role = 'admin', teacher = null) {
  let deletes = 0
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: actor } }, error: null }) },
    from: table => {
      const query = {
        select: () => query, eq: () => query,
        maybeSingle: async () => ({ data: table === 'profiles' ? { role } : teacher, error: null }),
        delete: () => { deletes++; return query },
      }
      return query
    },
  }
  return { handle: createTeacherAccountsHandler({ client, siteUrl: 'https://site.example', adminOrigin: 'https://admin.example' }), getDeletes: () => deletes }
}
const command = body => new Request('https://supabase.example/teacher-accounts', { method: 'POST', headers: { Authorization: 'Bearer user-token', 'Content-Type': 'application/json', Origin: 'https://admin.example' }, body: JSON.stringify(body) })

test('requires authentication before querying a profile', async () => {
  const { handle } = setup()
  assert.equal((await handle(new Request('https://supabase.example', { method: 'POST' }))).status, 401)
})
for (const role of ['parent', 'teacher']) test('denies administrative commands to ' + role, async () => {
  const { handle, getDeletes } = setup(role)
  assert.equal((await handle(command({ action: 'delete', id: teacherId }))).status, 403)
  assert.equal(getDeletes(), 0)
})
test('rejects a foreign origin', async () => {
  const { handle } = setup()
  const request = command({ action: 'delete', id: teacherId })
  request.headers.set('Origin', 'https://foreign.example')
  assert.equal((await handle(request)).status, 403)
})
test('rejects invalid teacher fields before database writes', async () => {
  const { handle } = setup()
  assert.equal((await handle(command({ action: 'create', fullName: '', email: 'invalid', assignedclasses: [] }))).status, 400)
})
test('refuses own-account deletion even when a teacher record points to actor', async () => {
  const { handle, getDeletes } = setup('admin', { id: teacherId, user_id: actor })
  assert.equal((await handle(command({ action: 'delete', id: teacherId }))).status, 403)
  assert.equal(getDeletes(), 0)
})
test('reports missing teacher without attempting deletion', async () => {
  const { handle, getDeletes } = setup()
  assert.equal((await handle(command({ action: 'delete', id: teacherId }))).status, 404)
  assert.equal(getDeletes(), 0)
})

