import { extname } from 'path'
import {
  getCachedDocumentNodeFromSchema,
  PluginFunction,
  PluginValidateFn,
  Types,
} from '@graphql-codegen/plugin-helpers'
import { schemaPrepend } from 'amplience-graphql-codegen-common'
import { snakeCase } from 'change-case'
import { GraphQLSchema, visit } from 'graphql'
import { TerraformGenerator } from 'terraform-generator'
import { createObjectTypeVisitor, maybeArg } from './lib/visitor'
import { PluginConfig } from './lib/config'

export const addToSchema = schemaPrepend.loc?.source.body

export const plugin: PluginFunction<PluginConfig> = (
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  {
    hostname = 'https://schema-examples.com',
    visualization,
    content_repositories,
    slot_repositories,
    schemaSuffix,
  }
) => {
  const astNode = getCachedDocumentNodeFromSchema(schema)

  // This class can build a terraform file string.
  const tfg = new TerraformGenerator()

  // To connect the Amplience content type resources to the correct Amplience repository,
  // we first generate the terraform repositories as terraform data.
  const contentRepositories = content_repositories
    ? Object.entries(content_repositories).map(([name, value]) =>
        tfg.data('amplience_content_repository', snakeCase(name), {
          id: maybeArg(value),
        })
      )
    : undefined
  const slotRepositories = slot_repositories
    ? Object.entries(slot_repositories).map(([name, value]) =>
        tfg.data('amplience_content_repository', snakeCase(name), {
          id: maybeArg(value),
        })
      )
    : undefined

  // For each GraphQl object type, add corresponding resources to the terraform generator.
  visit(astNode, {
    ObjectTypeDefinition: {
      leave: createObjectTypeVisitor({
        tfg,
        contentRepositories,
        slotRepositories,
        hostname,
        visualization,
        schemaSuffix,
      }),
    },
  })

  // Return the terraform file string
  return tfg.generate().tf
}

export const validate: PluginValidateFn<any> = async (
  _schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: PluginConfig,
  outputFile: string
) => {
  if (extname(outputFile) !== '.tf') {
    throw new Error(
      `Plugin "amplience-terraform" requires output extension to be ".tf"!`
    )
  }
  if (config.visualization) {
    if (config.visualization.filter((v) => v.for_each).length > 1) {
      throw new Error(
        `You can only have 1 item with a for_each property in your visualization list.`
      )
    }
    if (
      config.visualization.filter((v) => v.default).length > 1 ||
      config.visualization.some((v) => v.default && v.for_each)
    ) {
      throw new Error(
        `You can only set 1 item, which may not be a for_each-item to be the default.`
      )
    }
  }
}
