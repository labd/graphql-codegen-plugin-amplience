import fs from 'fs'
import {
  hasDirective,
  isObjectTypeDefinitionNode,
} from 'amplience-graphql-codegen-common'
import { getCachedDocumentNodeFromSchema } from '@graphql-codegen/plugin-helpers'
import { buildSchema } from 'graphql'
import { addToSchema } from '../src/index'
import { contentTypeSchemaBody } from '../src/lib/amplience-schema-transformers'

it.each([{ graphqlFile: 'base', jsons: ['a', 'b', 'base', 'localized'] }])(
  'correct JSON files for $graphqlFile',
  ({ graphqlFile, jsons }) => {
    const schema = buildSchema(
      addToSchema +
        fs.readFileSync(`./test/testdata/${graphqlFile}.graphql`, 'utf8')
    )
    const documentNode = getCachedDocumentNodeFromSchema(schema)
    const contentTypes = documentNode.definitions
      .filter(isObjectTypeDefinitionNode)
      .filter((d) => hasDirective(d, 'amplience'))

    const results = contentTypes.map((type) =>
      contentTypeSchemaBody(type, schema, 'https://schema-examples.com')
    )

    for (const json of jsons) {
      const contentTypeSchema = readJson(
        `./test/testdata/expected/${json}.json`
      )
      const result = results.find(
        (r) => r.$id === `https://schema-examples.com/${json}`
      )
      if (process.env.LOG) {
        console.log(JSON.stringify(pruned(result), null, 2))
      }
      expect(pruned(result)).toEqual(contentTypeSchema)
    }
  }
)

/** Removes all undefined properties */
const pruned = <T>(object: T): Partial<T> => JSON.parse(JSON.stringify(object))

// slot with content link
// or content type with content reference

const readJson = <T>(path: string) =>
  JSON.parse(fs.readFileSync(path, 'utf-8')) as T
