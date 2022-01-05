import fs from 'fs'

export const addToSchema = fs.readFileSync(
  './src/schema-prepend.graphql',
  'utf-8'
)
