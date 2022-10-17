import { gql } from 'graphql-tag'

export const schemaPrepend = gql`
  scalar AmplienceImage
  scalar AmplienceVideo

  # Field directives
  directive @amplienceText(
    minLength: Int
    maxLength: Int
    format: String
    pattern: String
    examples: [String!]
  ) on FIELD_DEFINITION
  directive @amplienceNumber(minimum: Int, maximum: Int) on FIELD_DEFINITION
  directive @amplienceList(minItems: Int, maxItems: Int) on FIELD_DEFINITION
  directive @amplienceConst(item: String, items: [String!]) on FIELD_DEFINITION
  directive @amplienceLink on FIELD_DEFINITION
  directive @amplienceReference on FIELD_DEFINITION
  directive @amplienceLocalized on FIELD_DEFINITION
  directive @amplienceIgnore on FIELD_DEFINITION
  directive @amplienceSortable on FIELD_DEFINITION
  directive @amplienceFilterable on FIELD_DEFINITION

  enum ValidationLevel {
    SLOT
    CONTENT_TYPE
    HIERARCHY
  }

  # Object directives
  directive @amplienceContentType(
    repository: String
    kind: ValidationLevel
    visualizations: Boolean
    icon: String
  ) on OBJECT
`
