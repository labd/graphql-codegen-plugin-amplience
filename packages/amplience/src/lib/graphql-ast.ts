import {
  DefinitionNode,
  DocumentNode,
  ObjectTypeDefinitionNode,
  TypeDefinitionNode,
  TypeNode
} from 'graphql'

export const isObjectTypeDefinitionNode = (
  definitionNode: DefinitionNode
): definitionNode is ObjectTypeDefinitionNode =>
  definitionNode.kind === 'ObjectTypeDefinition'

export const getUnions = (definitions: TypeDefinitionNode[]) =>
  definitions.filter(d => d.kind === 'UnionTypeDefinition')

export const getUnionFields = (
  definitionNode: ObjectTypeDefinitionNode,
  unionNames: string[]
) =>
  definitionNode.fields!.filter(f =>
    unionNames.includes(typeName(f.type) ?? '')
  )

export const typeName = (type: TypeNode): string => {
  switch (type.kind) {
    case 'ListType':
      return typeName(type.type)
    case 'NamedType':
      return type.name.value
    case 'NonNullType':
      return typeName(type.type)
  }
}

export const getContentTypes = (documentNode: DocumentNode) =>
  documentNode.definitions
    .filter(isObjectTypeDefinitionNode)
    .filter(a => a.directives?.some(d => d.name.value === 'amplience'))

export const switchArray = <T>(
  type: TypeNode,
  {
    ifArray,
    other
  }: { ifArray: (subType: TypeNode) => T; other: (type: TypeNode) => T }
) =>
  type.kind === 'ListType'
    ? ifArray(type.type)
    : type.kind === 'NonNullType' && type.type.kind === 'ListType'
    ? ifArray(type.type.type)
    : other(type)
