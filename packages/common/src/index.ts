import { paramCase } from 'change-case'
import { TypeDefinitionNode } from 'graphql'
import schema from './schema-prepend.graphql'

export * from './graphql'
export * from './util'

export const schemaPrepend = schema

export const typeUri = (type: TypeDefinitionNode, schemaHost: string) =>
  `${schemaHost}/${paramCase(type.name.value)}`
