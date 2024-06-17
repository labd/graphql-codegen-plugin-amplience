import type { Ensure } from "amplience-graphql-codegen-common";
import {
  hasProperty,
  maybeDirective,
  maybeDirectiveValue,
  typeUri,
} from "amplience-graphql-codegen-common";
import { capitalCase, paramCase, snakeCase } from "change-case";
import type {
  BooleanValueNode,
  EnumValueNode,
  ObjectTypeDefinitionNode,
  StringValueNode,
} from "graphql";
import type { Argument, Data, TerraformGenerator } from "terraform-generator";
import { list } from "terraform-generator";
import { arg, fn } from "terraform-generator";
import type { VisualizationType } from "./config";

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
    contentRepositoriesForEach,
    slotRepositoriesForEach,
    schemaSuffix,
    addAmplienceIsManagedSwitch,
  }: {
    tfg: TerraformGenerator;
    hostname: string;
    visualization?: VisualizationType[];
    contentRepositories?: Data[];
    slotRepositories?: Data[];
    contentRepositoriesForEach?: string;
    slotRepositoriesForEach?: string;
    schemaSuffix?: string;
    addAmplienceIsManagedSwitch?: boolean;
  }) =>
  (node: ObjectTypeDefinitionNode): null => {
    const directive = maybeDirective(node, "amplienceContentType");
    if (!directive) return null;

    const name = snakeCase(node.name.value);

    const isSlot =
      maybeDirectiveValue<EnumValueNode>(directive, "kind")?.value === "SLOT";

    const isAutoSync =
      maybeDirectiveValue<EnumValueNode>(directive, "autoSync")?.value ?? true;

    const schema = tfg.resource("amplience_content_type_schema", name, {
      body: fn(
        "file",
        `\${path.module}/schemas/${paramCase(node.name.value)}${
          schemaSuffix ? "-" + schemaSuffix : ""
        }.json`,
      ),
      schema_id: typeUri(node, hostname),
      validation_level: isSlot ? "SLOT" : "CONTENT_TYPE",
      auto_sync: isAutoSync,
      ...(addAmplienceIsManagedSwitch
        ? { count: arg(`var.amplience_is_managed ? 1 : 0`) }
        : {}),
    });

    const shouldVisualize = maybeDirectiveValue<BooleanValueNode>(
      directive,
      "visualizations",
    )?.value;

    const iconUrl = directive
      ? maybeDirectiveValue<StringValueNode>(directive, "icon")?.value
      : undefined;

    const dynamicVisualization = visualization?.find(hasProperty("for_each"));

    const contentType = tfg.resource("amplience_content_type", name, {
      content_type_uri: typeUri(node, hostname),
      label: capitalCase(node.name.value),
      icon: iconUrl ? { size: 256, url: iconUrl } : undefined,
      status: "ACTIVE",
      'dynamic"visualization"':
        shouldVisualize && dynamicVisualization
          ? dynamicVisualizationBlock(dynamicVisualization)
          : undefined,
      visualization:
        shouldVisualize && visualization
          ? visualization.filter((v) => !v.for_each)
          : undefined,
      depends_on: list(schema),
      ...(addAmplienceIsManagedSwitch
        ? { count: arg(`var.amplience_is_managed ? 1 : 0`) }
        : {}),
    });

    const repositoryName = maybeDirectiveValue<StringValueNode>(
      directive,
      "repository",
    )?.value;

    if (contentRepositories?.length && !isSlot) {
      tfg.resource("amplience_content_type_assignment", name, {
        content_type_id: contentType.id,
        repository_id: (
          contentRepositories.find((r) => r.name === repositoryName) ??
          contentRepositories[0]
        ).id,
        ...(addAmplienceIsManagedSwitch
          ? { count: arg(`var.amplience_is_managed ? 1 : 0`) }
          : {}),
      });
    }
    if (slotRepositories?.length && isSlot) {
      tfg.resource("amplience_content_type_assignment", name, {
        content_type_id: contentType.id,
        repository_id: (
          slotRepositories.find((r) => r.name === repositoryName) ??
          slotRepositories[0]
        ).id,
        ...(addAmplienceIsManagedSwitch
          ? { count: arg(`var.amplience_is_managed ? 1 : 0`) }
          : {}),
      });
    }

    if (contentRepositoriesForEach && !isSlot) {
      tfg.resource("amplience_content_type_assignment", name, {
        for_each: arg(contentRepositoriesForEach),
        content_type_id: contentType.id,
        repository_id: arg("each.value"),
        ...(addAmplienceIsManagedSwitch
          ? { count: arg(`var.amplience_is_managed ? 1 : 0`) }
          : {}),
      });
    }

    if (slotRepositoriesForEach && isSlot) {
      tfg.resource("amplience_content_type_assignment", name, {
        for_each: arg(slotRepositoriesForEach),
        content_type_id: contentType.id,
        repository_id: arg("each.value"),
        ...(addAmplienceIsManagedSwitch
          ? { count: arg(`var.amplience_is_managed ? 1 : 0`) }
          : {}),
      });
    }

    return null;
  };

export const maybeArg = (
  value: string,
  ...prefixes: string[]
): Argument | string =>
  ["var.", "local.", ...prefixes].some((prefix) => value.startsWith(prefix))
    ? arg(value)
    : value;

const dynamicVisualizationBlock = (
  visualization: Ensure<VisualizationType, "for_each">,
) => ({
  for_each: arg(visualization.for_each),
  content: {
    label: maybeArg(visualization.label, "visualization"),
    templated_uri: maybeArg(visualization.templated_uri, "visualization"),
    default: visualization.default,
  },
});
