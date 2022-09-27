import {
  combinations,
  hasDirective,
  ifNotEmpty,
  ifValue,
  maybeDirective,
  maybeDirectiveValue,
  switchArray,
  typeName,
  typeUri,
} from 'amplience-graphql-codegen-common'
import { capitalCase, paramCase } from 'change-case'
import {
  FieldDefinitionNode,
  GraphQLSchema,
  IntValueNode,
  isEnumType,
  isObjectType,
  isUnionType,
  ListValueNode,
  ObjectTypeDefinitionNode,
  StringValueNode,
  TypeDefinitionNode,
  TypeNode,
  UnionTypeDefinitionNode,
} from 'graphql'
import { AmplienceContentTypeSchemaBody, AmpliencePropertyType } from './types'

/**
 * Returns a Amplience ContentType from an interface type.
 */
export const contentTypeSchemaBody = (
  type: ObjectTypeDefinitionNode,
  schema: GraphQLSchema,
  schemaHost: string,
  hierarchy?: boolean
): AmplienceContentTypeSchemaBody => {
  const amplienceContentTypeSchema: AmplienceContentTypeSchemaBody = {
    $id: typeUri(type, schemaHost),
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...refType(AMPLIENCE_TYPE.CORE.Content),
    title: capitalCase(type.name.value),
    properties: {
      ...objectProperties(type, schema, schemaHost),
    },
    description: type.description?.value ?? capitalCase(type.name.value),
    'trait:sortable': sortableTrait(type),
    'trait:hierarchy': hierarchy ? hierarchyTrait(type, schemaHost) : undefined,
    'trait:filterable': filterableTrait(type),
    type: 'object',
    propertyOrder:
      type.fields
        ?.filter((field) => {
          return ['ignoreAmplience', ...(hierarchy ? ['children'] : [])].every(
            (term) => !hasDirective(field, term)
          )
        })
        .map((field) => {
          return field.name.value
        }) ?? [],
    required: type.fields
      ?.filter((field) =>
        ['ignoreAmplience', ...(hierarchy ? ['children'] : [])].every(
          (term) => !hasDirective(field, term)
        )
      )
      .filter((field) => field.type.kind === 'NonNullType')
      .map((n) => n.name.value),
  }
  const ref = refType(AMPLIENCE_TYPE.CORE.HierarchyNode).allOf[0]
  if (hierarchy) amplienceContentTypeSchema.allOf.push(ref)
  return amplienceContentTypeSchema
}
/**
 * Returns the properties that go inside Amplience `{type: 'object', properties: ...}`
 */
export const objectProperties = (
  type: ObjectTypeDefinitionNode,
  schema: GraphQLSchema,
  schemaHost: string
): { [name: string]: AmpliencePropertyType } =>
  Object.fromEntries(
    type.fields
      // Children can not be available as a field on the object itself
      ?.filter((prop) =>
        ['children', 'ignoreAmplience'].every(
          (term) => !hasDirective(prop, term)
        )
      )
      .map((prop) => [
        prop.name.value,
        {
          title: capitalCase(prop.name.value),
          description: prop.description?.value,
          ...switchArray<AmpliencePropertyType>(prop.type, {
            ifArray: (subType) => ({
              type: 'array',
              minItems: ifValue(
                ifValue(
                  maybeDirective(prop, 'list'),
                  (d) => maybeDirectiveValue<IntValueNode>(d, 'minItems')?.value
                ),
                Number
              ),
              maxItems: ifValue(
                ifValue(
                  maybeDirective(prop, 'list'),
                  (d) => maybeDirectiveValue<IntValueNode>(d, 'maxItems')?.value
                ),
                Number
              ),
              items: ampliencePropertyType(prop, subType, schema, schemaHost),
              const: arrayConstValues(prop),
            }),
            other: (type) =>
              ampliencePropertyType(prop, type, schema, schemaHost),
          }),
        },
      ]) ?? []
  )

const arrayConstValues = (prop: FieldDefinitionNode) =>
  ifValue(maybeDirective(prop, 'const'), (d) =>
    maybeDirectiveValue<ListValueNode>(d, 'items')?.values.map(
      (v) => (v as StringValueNode)?.value
    )
  )

/**
 * Returns an Amplience type object of various types (number/string/object)
 */
export const ampliencePropertyType = (
  prop: FieldDefinitionNode,
  type: TypeNode,
  schema: GraphQLSchema,
  schemaHost: string
): AmpliencePropertyType => {
  const node = schema.getType(typeName(type))
  // Handle non-primitive types.
  if (node) {
    if (isUnionType(node) && node.astNode) {
      return contentLink(node.astNode, schemaHost)
    }
    if (isEnumType(node) && node.astNode) {
      return {
        type: 'string',
        enum: node.astNode.values?.map((v) => v.name.value),
      }
    }
    if (isObjectType(node) && node.astNode) {
      if (hasDirective(prop, 'link')) {
        return contentLink(node.astNode, schemaHost)
      }
      if (hasDirective(prop, 'reference')) {
        return contentReference(node.astNode, schemaHost)
      }
      if (hasDirective(prop, 'refLink')) {
        return refLinkContent(node.astNode, schemaHost)
      }
      return inlineObject(node.astNode, schema, schemaHost)
    }
  }

  // Handle primitive types.
  switch (typeName(type)) {
    case 'String':
      const constValue = ifValue(maybeDirective(prop, 'const'), (d) =>
        maybeDirectiveValue<StringValueNode>(d, 'item')
      )?.value

      // Special case for const values.
      if (constValue) {
        return {
          type: 'string',
          const: constValue,
        }
      }

      return checkLocalized(prop, type, {
        type: 'string',

        ...ifValue(maybeDirective(prop, 'text'), (d) => ({
          format: maybeDirectiveValue<StringValueNode>(d, 'format')?.value,
          pattern: maybeDirectiveValue<StringValueNode>(d, 'pattern')?.value,
          minLength: ifValue(
            maybeDirectiveValue<IntValueNode>(d, 'minLength')?.value,
            Number
          ),
          maxLength: ifValue(
            maybeDirectiveValue<IntValueNode>(d, 'maxLength')?.value,
            Number
          ),
        })),
        examples: ifValue(maybeDirective(prop, 'example'), (d) =>
          maybeDirectiveValue<ListValueNode>(d, 'items')?.values.map(
            (v) => (v as StringValueNode)?.value
          )
        ),
      })
    case 'Boolean':
      return checkLocalized(prop, type, { type: 'boolean' })
    case 'Int':
    case 'Float':
      return checkLocalized(prop, type, {
        type: typeName(type) === 'Float' ? 'number' : 'integer',
        ...ifValue(maybeDirective(prop, 'number'), (d) => ({
          format: maybeDirectiveValue<StringValueNode>(d, 'format')?.value,
          minimum: ifValue(
            maybeDirectiveValue<IntValueNode>(d, 'minimum')?.value,
            Number
          ),
          maximum: ifValue(
            maybeDirectiveValue<IntValueNode>(d, 'maximum')?.value,
            Number
          ),
        })),
      })
    case 'AmplienceImage':
    case 'AmplienceVideo':
      return hasDirective(prop, 'localized')
        ? refType(
            AMPLIENCE_TYPE.LOCALIZED[
              typeName(type) as 'AmplienceImage' | 'AmplienceVideo'
            ]
          )
        : refType(
            AMPLIENCE_TYPE.CORE[
              typeName(type) as 'AmplienceImage' | 'AmplienceVideo'
            ]
          )
  }
  return {}
}

const contentReference = (type: ObjectTypeDefinitionNode, schemaHost: string) =>
  refType(
    AMPLIENCE_TYPE.CORE.ContentReference,
    enumProperties(type, schemaHost)
  )

const contentLink = (
  type: UnionTypeDefinitionNode | ObjectTypeDefinitionNode,
  schemaHost: string
) => refType(AMPLIENCE_TYPE.CORE.ContentLink, enumProperties(type, schemaHost))

const refLinkContent = (
  type: ObjectTypeDefinitionNode,
  schemaHost: string
) => ({
  type: 'object',
  ...refType(typeUri(type, schemaHost)),
})

const inlineObject = (
  type: ObjectTypeDefinitionNode,
  schema: GraphQLSchema,
  schemaHost: string
) => ({
  type: 'object',
  properties: objectProperties(type, schema, schemaHost),
  propertyOrder: type.fields?.map((n) => n.name.value),
  required: type.fields
    ?.filter((field) => field.type.kind === 'NonNullType')
    .map((field) => field.name.value),
})

const enumProperties = (
  typeOrUnion: TypeDefinitionNode,
  schemaHost: string
) => ({
  properties: {
    contentType: {
      enum: (typeOrUnion.kind === 'UnionTypeDefinition'
        ? ((typeOrUnion.types ?? []) as unknown as TypeDefinitionNode[])
        : [typeOrUnion]
      ).map((t) => typeUri(t, schemaHost)),
    },
  },
})

/**
 * Wraps a Amplience type object in localized JSON.
 */
export const checkLocalized = (
  prop: FieldDefinitionNode,
  type: TypeNode,
  result: AmpliencePropertyType
) =>
  hasDirective(prop, 'localized')
    ? prop.directives?.length === 1 && typeName(type) === 'String'
      ? refType(AMPLIENCE_TYPE.LOCALIZED.String)
      : localized(result)
    : result

export const AMPLIENCE_TYPE = {
  LOCALIZED: {
    AmplienceImage:
      'http://bigcontent.io/cms/schema/v1/localization#/definitions/localized-image',
    AmplienceVideo:
      'http://bigcontent.io/cms/schema/v1/localization#/definitions/localized-video',
    String:
      'http://bigcontent.io/cms/schema/v1/localization#/definitions/localized-string',
  },
  CORE: {
    LocalizedValue:
      'http://bigcontent.io/cms/schema/v1/core#/definitions/localized-value',
    Content: 'http://bigcontent.io/cms/schema/v1/core#/definitions/content',
    AmplienceImage:
      'http://bigcontent.io/cms/schema/v1/core#/definitions/image-link',
    AmplienceVideo:
      'http://bigcontent.io/cms/schema/v1/core#/definitions/video-link',
    ContentReference:
      'http://bigcontent.io/cms/schema/v1/core#/definitions/content-reference',
    ContentLink:
      'http://bigcontent.io/cms/schema/v1/core#/definitions/content-link',
    HierarchyNode:
      'http://bigcontent.io/cms/schema/v2/hierarchy#/definitions/hierarchy-node',
  },
}

export const refType = (ref: string, ...other: object[]) => ({
  allOf: [{ $ref: ref }, ...other],
})

export const localized = (value: AmpliencePropertyType) => ({
  ...refType(AMPLIENCE_TYPE.CORE.LocalizedValue),
  properties: {
    values: {
      items: {
        properties: {
          value,
        },
      },
    },
  },
})

/**
 * Returns sortable trait path for amplience based on properties containing the `@sortable` tag
 * @returns Object that can be pushed to `trait:sortable` directly
 */
export const sortableTrait = (type: ObjectTypeDefinitionNode) =>
  ifNotEmpty(
    type.fields?.filter((m) => hasDirective(m, 'sortable')) ?? [],
    (items) => ({
      sortBy: [
        {
          key: 'default',
          paths: items.map((n) => `/${n.name.value}`),
        },
      ],
    })
  )

/**
 * Returns hierarchy trait child content types with the current type and any other
 * types based on the `@children` tag
 * @returns Object that can be pushed to the `trait:hierarchy` directly
 */
export const hierarchyTrait = (
  type: ObjectTypeDefinitionNode,
  schemaHost: string
) => ({
  childContentTypes: [
    typeUri(type, schemaHost),
    ...(type.fields
      ?.filter((m) => hasDirective(m, 'children'))
      .map((n) => `${schemaHost}/${paramCase(n.name.value)}`) ?? []),
  ],
})

/**
 * Returns filterable trait path for amplience based on properties containing the `@filterable` tag.
 * Generates all possible combinations of the tags for multi-path filtering. Note Amplience only supports
 * multi-path filtering up to 5 paths.
 * @returns Object that can be pushed to `trait:filterable` directly
 */
export const filterableTrait = (type: ObjectTypeDefinitionNode) => {
  const filterableProps =
    type.fields?.filter((m) => hasDirective(m, 'filterable')) ?? []
  if (filterableProps.length === 0) return undefined
  if (filterableProps.length > 5)
    throw new Error('max @filterable tags can be five')
  const filterCombinations = combinations(
    filterableProps.map((s) => `/${s.name.value}`)
  )

  return {
    filterBy: filterCombinations.map((paths) => ({ paths })),
  }
}
