import {
  getCachedDocumentNodeFromSchema,
  PluginFunction,
  PluginValidateFn,
  Types
} from '@graphql-codegen/plugin-helpers'
import {
  maybeDirective,
  maybeDirectiveValue,
  schemaPrepend,
  typeUri
} from 'amplience-graphql-codegen-common'
import { capitalCase, paramCase, snakeCase } from 'change-case'
import {
  BooleanValueNode,
  EnumValueNode,
  GraphQLSchema,
  StringValueNode,
  visit
} from 'graphql'
import { extname } from 'path'
import { arg, fn, map, TerraformGenerator } from 'terraform-generator'

export const addToSchema = schemaPrepend.loc?.source.body

export type PluginConfig = {
  /**
   * The hostname used for the Amplience JSON schema IDs.
   *
   * @default https://schema-examples.com
   */
  hostname?: string
  /**
   *
   */
  visualization?: string
  /**
   * @example
   * ```yml
   * content_repositories:
   *   content_brand1: 123123
   *   content_brand2: 234234
   * ```
   */
  content_repositories?: { [name: string]: string }
  /**
   * @example
   * ```yml
   * slot_repositories:
   *   slot_brand1: 123123
   *   slot_brand2: 234234
   * ```
   */
  slot_repositories?: { [name: string]: string }
}

export const plugin: PluginFunction<PluginConfig> = (
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  {
    hostname = 'https://schema-examples.com',
    visualization,
    content_repositories,
    slot_repositories
  }
) => {
  const astNode = getCachedDocumentNodeFromSchema(schema)
  const tfg = new TerraformGenerator({
    required_providers: { amplience: map({ source: 'labd/amplience' }) }
  })

  const contentRepositories = content_repositories
    ? Object.entries(content_repositories).map(([name, value]) =>
        tfg.data('amplience_content_repository', snakeCase(name), {
          id: maybeArg(value)
        })
      )
    : undefined

  const slotRepositories = slot_repositories
    ? Object.entries(slot_repositories).map(([name, value]) =>
        tfg.data('amplience_slot_repository', snakeCase(name), {
          id: maybeArg(value)
        })
      )
    : undefined

  visit(astNode, {
    leave: {
      ObjectTypeDefinition: node => {
        const directive = maybeDirective(node, 'amplience')
        if (!directive) return null

        const name = snakeCase(node.name.value)

        const isSlot =
          maybeDirectiveValue<EnumValueNode>(directive, 'validationLevel')
            ?.value === 'SLOT'

        const schema = tfg.resource('amplience_content_type_schema', name, {
          body: fn(
            'file',
            `\${path.module}/schemas/${paramCase(node.name.value)}.json`
          ),
          schema_id: typeUri(node, hostname),
          validation_level: isSlot ? 'SLOT' : 'CONTENT_TYPE'
        })

        const shouldVisualize = maybeDirectiveValue<BooleanValueNode>(
          directive,
          'visualizations'
        )?.value

        const contentType = tfg.resource('amplience_content_type', name, {
          content_type_uri: schema.attr('schema_id'),
          label: capitalCase(node.name.value),
          status: 'ACTIVE',
          visualization:
            shouldVisualize && visualization
              ? {
                  label: 'Visualization',
                  templated_uri: maybeArg(visualization),
                  default: true
                }
              : undefined
        })
        const repositoryName = maybeDirectiveValue<StringValueNode>(
          directive,
          'repository'
        )?.value

        if (contentRepositories && !isSlot) {
          tfg.resource('amplience_content_type_assignment', name, {
            content_type_id: contentType.id,
            repository_id: (
              contentRepositories.find(r => r.name === repositoryName) ??
              contentRepositories[0]
            ).id
          })
        }
        if (slotRepositories && isSlot) {
          tfg.resource('amplience_content_type_assignment', name, {
            content_type_id: contentType.id,
            repository_id: (
              slotRepositories.find(r => r.name === repositoryName) ??
              slotRepositories[0]
            ).id
          })
        }
        return null
      }
    }
  })

  return tfg.generate().tf
}

export const validate: PluginValidateFn<any> = async (
  _schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  _config: PluginConfig,
  outputFile: string
) => {
  if (extname(outputFile) !== '.tf') {
    throw new Error(
      `Plugin "amplience-terraform" requires output extension to be ".tf"!`
    )
  }
}

const maybeArg = (value: string) =>
  ['var.', 'local.'].some(prefix => value.startsWith(prefix))
    ? arg(value)
    : value
