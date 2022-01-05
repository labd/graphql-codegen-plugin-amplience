import {
  PluginFunction,
  PluginValidateFn,
  Types
} from '@graphql-codegen/plugin-helpers'
import { paramCase } from 'change-case'
import fs from 'fs'
import { dirname } from 'path'
import { contentTypeSchemaBody } from './lib/amplience-schema-transformers'
import { getContentTypes } from './lib/graphql-ast'

export type PluginConfig = {
  /**
   * The hostname
   *
   * @example 'https://schema-examples.com'
   */
  hostname: string
}

export type PresetConfig = {}

export const addToSchema = fs.readFileSync(
  './src/lib/schema-prepend.graphql',
  'utf-8'
)

export const plugin: PluginFunction<PluginConfig> = (
  schema,
  _documents,
  config,
  info
) => {
  const result = contentTypeSchemaBody(
    info?.pluginContext?.typeNode,
    schema,
    config.hostname
  )

  return JSON.stringify(result)
}

export const validate: PluginValidateFn<PluginConfig> = async (
  _schema,
  _documents,
  config,
  _outputFile
) => {
  if (config.hostname === undefined) {
    throw new Error(
      `Plugin "amplience" requires a hostname to be set in the config!`
    )
  }
}

export const preset: Types.OutputPreset<PresetConfig> = {
  buildGeneratesSection: options =>
    getContentTypes(options.schema).map(node => ({
      ...options,
      filename: `${dirname(options.baseOutputDir)}/schemas/${paramCase(
        node.name.value
      )}.json`,

      config: {
        ...options.config,
        type: node
      },
      pluginContext: {
        typeNode: node
      }
    }))
}
