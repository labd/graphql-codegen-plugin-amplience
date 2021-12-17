import { capitalCase } from 'change-case'
import { GraphQLSchema, ObjectTypeDefinitionNode } from 'graphql'
import { hasDirective } from '../lib/util'
import {
  AMPLIENCE_TYPE,
  filterableTrait,
  hierarchyTrait,
  objectProperties,
  refType,
  sortableTrait,
  typeUri,
} from './common'
import { AmplienceContentTypeSchema, GeneratorConfig } from './types'

/**
 * Returns a Amplience ContentType from an interface type.
 */
export const contentTypeSchemaBody = (
  type: ObjectTypeDefinitionNode,
  schema: GraphQLSchema,
  { schemaHost }: GeneratorConfig,
  hierarchy?: boolean
): AmplienceContentTypeSchema => ({
  $id: typeUri(type, schemaHost),
  $schema: 'http://json-schema.org/draft-07/schema#',
  ...refType(AMPLIENCE_TYPE.CORE.Content),
  title: capitalCase(type.name.value),
  description: type.description?.value ?? capitalCase(type.name.value),
  'trait:sortable': sortableTrait(type),
  'trait:hierarchy': hierarchy ? hierarchyTrait(type, schemaHost) : undefined,
  'trait:filterable': filterableTrait(type), // TODO can hierarchies have filterables?
  type: 'object',
  properties: {
    ...objectProperties(type, schema, schemaHost),
  },
  propertyOrder:
    type.fields
      ?.filter(field =>
        ['ignoreAmplience', ...(hierarchy ? ['children'] : [])].every(
          term => !hasDirective(field, term)
        )
      )
      .map(field => field.name.value) ?? [],
  required: type.fields
    ?.filter(field =>
      ['ignoreAmplience', ...(hierarchy ? ['children'] : [])].every(
        term => !hasDirective(field, term)
      )
    )
    .filter(field => field.type.kind === 'NonNullType')
    .map(n => n.name.value),
})
