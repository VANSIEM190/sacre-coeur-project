import { createServer } from 'vite'

const servers = []
async function closeServers() {
  await Promise.all(servers.map(server => server.close()))
}

try {
  for (const app of ['site', 'admin']) {
    const server = await createServer({ configFile: 'apps/' + app + '/vite.config.ts' })
    servers.push(server)
    await server.listen()
    console.log(app + ':')
    server.printUrls()
  }
} catch (error) {
  await closeServers()
  throw error
}

for (const event of ['SIGINT', 'SIGTERM']) {
  process.on(event, async () => {
    await closeServers()
    process.exit(0)
  })
}
