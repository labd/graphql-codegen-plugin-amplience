import {
  hasDirective,
  isObjectTypeDefinitionNode
} from '@amplience-codegen/common'
import { getCachedDocumentNodeFromSchema } from '@graphql-codegen/plugin-helpers'
import fs from 'fs'
import { buildSchema } from 'graphql'
import { addToSchema } from '../src/index'
import { contentTypeSchemaBody } from '../src/lib/amplience-schema-transformers'

it.each([{ graphqlFile: 'base', jsons: ['base', 'localized'] }])(
  'correct JSON files for $graphql',
  ({ graphqlFile, jsons }) => {
    const schema = buildSchema(
      addToSchema +
        fs.readFileSync(`./test/testdata/${graphqlFile}.graphql`, 'utf8')
    )
    const documentNode = getCachedDocumentNodeFromSchema(schema)
    const contentTypes = documentNode.definitions
      .filter(isObjectTypeDefinitionNode)
      .filter(d => hasDirective(d, 'amplience'))

    const result = contentTypes.map(type =>
      contentTypeSchemaBody(type, schema, 'https://schema-examples.com')
    )

    for (const [i, json] of jsons.entries()) {
      const contentTypeSchema = readJson(
        `./test/testdata/expected/${json}.json`
      )
      if (process.env.LOG) {
        console.log(JSON.stringify(pruned(result[i]), null, 2))
      }
      expect(pruned(result[i])).toEqual(contentTypeSchema)
    }
  }
)

/** Removes all undefined properties */
const pruned = <T>(object: T): Partial<T> => JSON.parse(JSON.stringify(object))

// slot with content link
// or content type with content reference

const readJson = <T>(path: string) =>
  JSON.parse(fs.readFileSync(path, 'utf-8')) as T
