const run = async () => {
  await import('./import-blockchain.js')
}

run().catch((err) => {
  console.error('Error running import:', err)
  process.exit(1)
})