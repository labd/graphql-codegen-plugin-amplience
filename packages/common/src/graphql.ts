import {
  DefinitionNode,
  DirectiveNode,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  ObjectValueNode,
  TypeDefinitionNode,
  TypeNode,
  ValueNode
} from 'graphql'

export const hasDirective = (
  symbol: FieldDefinitionNode | TypeDefinitionNode,
  name: string
) => symbol.directives?.some(t => t.name.value === name)

export const maybeDirective = (
  symbol: FieldDefinitionNode | TypeDefinitionNode,
  name: string
) => symbol.directives?.find(t => t.name.value === name)

export const maybeDirectiveValue = <T extends ValueNode>(
  directive: DirectiveNode,
  argument: string
) =>
  directive?.arguments?.find(t => t.name.value === argument)?.value as
    | T
    | undefined

export const maybeFieldValue = <T extends ValueNode>(
  node: ObjectValueNode,
  field: string
) => node.fields.find(f => f.name.value === field)?.value as T | undefined

export const isObjectTypeDefinitionNode = (
  definitionNode: DefinitionNode
): definitionNode is ObjectTypeDefinitionNode =>
  definitionNode.kind === 'ObjectTypeDefinition'

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
