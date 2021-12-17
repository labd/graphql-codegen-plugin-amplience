import {
  FieldDefinitionNode,
  TypeDefinitionNode,
  TypeNode,
  ValueNode,
} from 'graphql'

export const hasDirective = (
  symbol: FieldDefinitionNode | TypeDefinitionNode,
  name: string
) => symbol.directives?.some(t => t.name.value === name)

export const findDirective = (symbol: FieldDefinitionNode, name: string) =>
  symbol.directives?.find(t => t.name.value === name)

export const findDirectiveValue = <T extends ValueNode>(
  symbol: FieldDefinitionNode,
  name: string,
  argument: string
) =>
  symbol.directives
    ?.find(t => t.name.value === name)
    ?.arguments?.find(t => t.name.value === argument)?.value as T | undefined

export const isValue = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

export const maybeToNumber = (value: string | undefined) =>
  value ? Number(value) : undefined

export const switchArray = <T>(
  type: TypeNode,
  {
    ifArray,
    other,
  }: { ifArray: (subType: TypeNode) => T; other: (type: TypeNode) => T }
) =>
  type.kind === 'ListType'
    ? ifArray(type.type)
    : type.kind === 'NonNullType' && type.type.kind === 'ListType'
    ? ifArray(type.type.type)
    : other(type)

export const ifNotEmpty = <T, S>(items: T[], callback: (items: T[]) => S) =>
  items.length ? callback(items) : undefined

export const combinations = (array: string[]): string[][] => {
  const results = [[] as string[]] as string[][]
  for (const value of array) {
    const copy = [...results]
    for (const prefix of copy) {
      results.push(prefix.concat(value))
    }
  }
  return results.filter(c => c.length).sort((a, b) => a.length - b.length)
}
