import { paramCase } from 'change-case'
import {
  BooleanValueNode,
  DirectiveNode,
  FieldDefinitionNode,
  ObjectValueNode,
  StringValueNode,
  TypeDefinitionNode,
  ValueNode
} from 'graphql'

export const typeUri = (type: TypeDefinitionNode, schemaHost: string) =>
  `${schemaHost}/${paramCase(type.name.value)}`

export const hasDirective = (
  symbol: FieldDefinitionNode | TypeDefinitionNode,
  name: string
) => symbol.directives?.some(t => t.name.value === name)

export const findDirective = (
  symbol: FieldDefinitionNode | TypeDefinitionNode,
  name: string
) => symbol.directives?.find(t => t.name.value === name)

export const findDirectiveValue = <T extends ValueNode>(
  directive: DirectiveNode,
  argument: string
) =>
  directive?.arguments?.find(t => t.name.value === argument)?.value as
    | T
    | undefined

export const getBooleanValue = (node: ObjectValueNode, name: string) =>
  node.fields.find(f => f.name.value === name)?.value as
    | BooleanValueNode
    | undefined

export const getStringValue = (node: ObjectValueNode, name: string) =>
  node.fields.find(f => f.name.value === name)?.value as
    | StringValueNode
    | undefined

export const visualization = (node: ObjectValueNode) => ({
  label: getStringValue(node, 'label')?.value,
  templated_uri: getStringValue(node, 'templated_uri')?.value,
  default: getBooleanValue(node, 'default')?.value ?? false
})
