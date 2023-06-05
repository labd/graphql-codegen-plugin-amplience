import {
  maybeDirective,
  maybeDirectiveValue,
  typeUri,
  Ensure,
  hasProperty,
} from 'amplience-graphql-codegen-common'
import { snakeCase, paramCase, capitalCase } from 'change-case'
import {
  ObjectTypeDefinitionNode,
  EnumValueNode,
  BooleanValueNode,
  StringValueNode,
} from 'graphql'
import { TerraformGenerator, Data, fn, arg } from 'terraform-generator'
import { VisualizationType } from './config'

/**
 * This visitor checks the GraphQL object type and *updates* the terraform generator to include:
 * - a amplience_content_type_schema resource
 * - a amplience_content_type resource
 * - a amplience_content_type_assignment resource (if a matching content repository is provided)
 */
export const createObjectTypeVisitor =
  ({
    tfg,
    hostname,
    visualization,
    contentRepositories,
    slotRepositories,
    contentRepositoriesMapVariable,
    slotRepositoriesMapVariable,
    schemaSuffix,
  }: {
    tfg: TerraformGenerator
    hostname: string
    visualization?: VisualizationType[]
    contentRepositories?: Data[]
    slotRepositories?: Data[]
    contentRepositoriesMapVariable?: string
    slotRepositoriesMapVariable?: string
    schemaSuffix?: string
  }) =>
  (node: ObjectTypeDefinitionNode) => {
    const directive = maybeDirective(node, 'amplienceContentType')
    if (!directive) return null

    const name = snakeCase(node.name.value)

    const isSlot =
      maybeDirectiveValue<EnumValueNode>(directive, 'kind')?.value === 'SLOT'

    const isAutoSync =
      maybeDirectiveValue<EnumValueNode>(directive, 'autoSync')?.value ?? true

    const schema = tfg.resource('amplience_content_type_schema', name, {
      body: fn(
        'file',
        `\${path.module}/schemas/${paramCase(node.name.value)}${
          schemaSuffix ? '-' + schemaSuffix : ''
        }.json`
      ),
      schema_id: typeUri(node, hostname),
      validation_level: isSlot ? 'SLOT' : 'CONTENT_TYPE',
      auto_sync: isAutoSync,
    })

    const shouldVisualize = maybeDirectiveValue<BooleanValueNode>(
      directive,
      'visualizations'
    )?.value

    const iconUrl = directive
      ? maybeDirectiveValue<StringValueNode>(directive, 'icon')?.value
      : undefined

    const dynamicVisualization = visualization?.find(hasProperty('for_each'))

    const contentType = tfg.resource('amplience_content_type', name, {
      content_type_uri: schema.attr('schema_id'),
      label: capitalCase(node.name.value),
      icon: iconUrl ? { size: 256, url: iconUrl } : undefined,
      status: 'ACTIVE',
      'dynamic"visualization"':
        shouldVisualize && dynamicVisualization
          ? dynamicVisualizationBlock(dynamicVisualization)
          : undefined,
      visualization:
        shouldVisualize && visualization
          ? visualization.filter((v) => !v.for_each)
          : undefined,
    })

    const repositoryName = maybeDirectiveValue<StringValueNode>(
      directive,
      'repository'
    )?.value

    if (contentRepositories?.length && !isSlot) {
      tfg.resource('amplience_content_type_assignment', name, {
        content_type_id: contentType.id,
        repository_id: (
          contentRepositories.find((r) => r.name === repositoryName) ??
          contentRepositories[0]
        ).id,
      })
    }
    if (slotRepositories?.length && isSlot) {
      tfg.resource('amplience_content_type_assignment', name, {
        content_type_id: contentType.id,
        repository_id: (
          slotRepositories.find((r) => r.name === repositoryName) ??
          slotRepositories[0]
        ).id,
      })
    }

    if (contentRepositoriesMapVariable && !isSlot) {
      tfg.resource('amplience_content_type_assignment', name, {
        for_each: arg(contentRepositoriesMapVariable),
        content_type_id: contentType.id,
        repository_id: arg('each.value'),
      })
    }

    if (slotRepositoriesMapVariable && isSlot) {
      tfg.resource('amplience_content_type_assignment', name, {
        for_each: arg(slotRepositoriesMapVariable),
        content_type_id: contentType.id,
        repository_id: arg('each.value'),
      })
    }

    return null
  }

export const maybeArg = (value: string, ...prefixes: string[]) =>
  ['var.', 'local.', ...prefixes].some((prefix) => value.startsWith(prefix))
    ? arg(value)
    : value

const dynamicVisualizationBlock = (
  visualization: Ensure<VisualizationType, 'for_each'>
) => ({
  for_each: arg(visualization.for_each),
  content: {
    label: maybeArg(visualization.label, 'visualization'),
    templated_uri: maybeArg(visualization.templated_uri, 'visualization'),
    default: visualization.default,
  },
})
