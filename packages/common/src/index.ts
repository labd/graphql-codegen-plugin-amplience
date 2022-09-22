import { paramCase } from 'change-case'
import { TypeDefinitionNode } from 'graphql'
import { gql } from 'graphql-tag'
// import schema from './schema-prepend.graphql'

export * from './graphql'
export * from './util'

export const schemaPrepend = gql`
  scalar AmplienceImage
  scalar AmplienceVideo

  # Field directives
  directive @text(
    minLength: Int
    maxLength: Int
    format: String
    pattern: String
  ) on FIELD_DEFINITION
  directive @number(minimum: Int, maximum: Int) on FIELD_DEFINITION
  directive @list(minItems: Int, maxItems: Int) on FIELD_DEFINITION
  directive @const(item: String, items: [String!]) on FIELD_DEFINITION
  directive @link on FIELD_DEFINITION
  directive @reference on FIELD_DEFINITION
  directive @inline on FIELD_DEFINITION
  directive @localized on FIELD_DEFINITION
  directive @example(items: [String!]) on FIELD_DEFINITION

  enum ValidationLevel {
    SLOT
    CONTENT_TYPE
    HIERARCHY
  }

  type Visualization {
    label: String!
    templated_uri: String!
    default: Boolean
  }

  # Object directives
  directive @amplience(
    repository: String
    validationLevel: ValidationLevel
    visualizations: [Visualization!]
  ) on OBJECT
`

export const typeUri = (type: TypeDefinitionNode, schemaHost: string) =>
  `${schemaHost}/${paramCase(type.name.value)}`

export const typeUriInline = (type: TypeDefinitionNode, schemaHost: string) =>
  `${typeUri(type, schemaHost)}#/definitions/${paramCase(type.name.value)}`
