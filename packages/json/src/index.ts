import {
  hasDirective,
  isObjectTypeDefinitionNode,
  maybeDirective,
  maybeDirectiveValue,
  schemaPrepend
} from '@amplience-codegen/common'
import {
  PluginFunction,
  PluginValidateFn,
  Types
} from '@graphql-codegen/plugin-helpers'
import { paramCase } from 'change-case'
import { EnumValueNode, ObjectTypeDefinitionNode } from 'graphql'
import { dirname } from 'path'
import { contentTypeSchemaBody } from './lib/amplience-schema-transformers'

export type PluginConfig = {
  /**
   * The hostname
   *
   * @default 'https://schema-examples.com'
   */
  hostname?: string
}

export type PresetConfig = {}

export const addToSchema = schemaPrepend.loc?.source.body

export const plugin: PluginFunction<PluginConfig> = (
  schema,
  _documents,
  { hostname = 'https://schema-examples.com' },
  info
) => {
  const node = info?.pluginContext?.typeNode as ObjectTypeDefinitionNode

  const isHierarchy =
    maybeDirectiveValue<EnumValueNode>(
      maybeDirective(node, 'amplience')!, // We check for the amplience directive in the preset function below
      'validationLevel'
    )?.value === 'HIERARCHY'

  const result = contentTypeSchemaBody(node, schema, hostname, isHierarchy)

  return JSON.stringify(result)
}

export const validate: PluginValidateFn<PluginConfig> = async (
  _schema,
  _documents,
  _config,
  _outputFile
) => {
  //
}

export const preset: Types.OutputPreset<PresetConfig> = {
  buildGeneratesSection: options =>
    options.schema.definitions
      .filter(isObjectTypeDefinitionNode)
      .filter(d => hasDirective(d, 'amplience'))
      .map(node => ({
        ...options,
        filename: `${dirname(options.baseOutputDir)}/schemas/${paramCase(
          node.name.value
        )}.json`,

        pluginContext: {
          typeNode: node
        }
      }))
}
