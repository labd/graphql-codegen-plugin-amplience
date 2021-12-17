import {
  PluginFunction,
  PluginValidateFn,
  Types,
} from '@graphql-codegen/plugin-helpers'
import { pathCase } from 'change-case'
import { ObjectTypeDefinitionNode } from 'graphql'
import { extname } from 'path'
import { contentTypeSchemaBody } from './lib/content-type'
import { getContentTypes } from './lib/graphql-ast'

type PluginConfig = {
  hostname: string
  type: ObjectTypeDefinitionNode
}

export const addToSchema = `
scalar AmplienceImage
scalar AmplienceVideo
directive @amplience on OBJECT
directive @text (minLength: Int, maxLength: Int, format: String) on FIELD_DEFINITION
directive @number(minimum: Int, maximum: Int) on FIELD_DEFINITION
directive @list (minItems: Int, maxItems: Int) on FIELD_DEFINITION
directive @const(item: String, items: [String!]) on FIELD_DEFINITION
directive @link on FIELD_DEFINITION
directive @localized on FIELD_DEFINITION
directive @example(items: [String!]) on FIELD_DEFINITION
`

export const plugin: PluginFunction<PluginConfig> = (
  schema,
  _documents,
  config,
  _info
) => {
  const result = contentTypeSchemaBody(config.type, schema, {
    schemaHost: config.hostname,
    visualizations: [],
  })

  return JSON.stringify(result)
}

export const validate: PluginValidateFn<PluginConfig> = async (
  _schema,
  _documents,
  config,
  outputFile
) => {
  if (config.hostname === undefined) {
    throw new Error(
      `Plugin "amplience" requires a hostname to be set in the config!`
    )
  }
  if (extname(outputFile) !== '.json') {
    throw new Error(`Plugin "amplience" requires extension to be ".json"!`)
  }
}

export const preset: Types.OutputPreset<PresetConfig> = {
  buildGeneratesSection: options =>
    getContentTypes(options.schema).map(typeNode => ({
      ...options,
      filename: `${options.baseOutputDir}/${pathCase(
        typeNode.name.value
      )}${options.presetConfig.extension ?? '.json'}`,

      config: {
        ...options.config,
        type: typeNode,
      },
    })),
}

export type PresetConfig = {
  /**
   * @description Optional, sets the extension for the generated files. Use this to override the extension if you are using plugins that requires a different type of extensions (such as `typescript-react-apollo`)
   * @default .generated.ts
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   src/:
   *     preset: amplience
   *     presetConfig:
   *       extension: -schema.json
   *     plugins:
   *       - typescript-operations
   *       - typescript-react-apollo
   * ```
   */
  extension?: string
  /**
   * @description Optional, override the `cwd` of the execution. We are using `cwd` to figure out the imports between files. Use this if your execution path is not your project root directory.
   * @default process.cwd()
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   src/:
   *     preset: near-operation-file
   *     presetConfig:
   *       baseTypesPath: types.ts
   *       cwd: /some/path
   *     plugins:
   *       - typescript-operations
   * ```
   */
  cwd?: string
  /**
   * @description Optional, defines a folder, (Relative to the source files) where the generated files will be created.
   * @default ''
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   src/:
   *     preset: near-operation-file
   *     presetConfig:
   *       baseTypesPath: types.ts
   *       folder: __generated__
   *     plugins:
   *       - typescript-operations
   * ```
   */
  folder?: string
}
