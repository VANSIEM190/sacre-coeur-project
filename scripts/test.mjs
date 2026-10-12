import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const testDirectories = ['packages/domain/tests', 'supabase/tests']
const files = testDirectories.flatMap(directory =>
  fs.readdirSync(directory, { recursive: true })
    .filter(file => file.endsWith('.test.mjs'))
    .map(file => directory + '/' + file),
)

if (!files.length) throw new Error('No tests found')
const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  windowsHide: true,
})
process.exit(result.status ?? 1)
