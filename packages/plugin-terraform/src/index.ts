import type {
  PluginFunction,
  PluginValidateFn,
  Types,
} from "@graphql-codegen/plugin-helpers";
import { getCachedDocumentNodeFromSchema } from "@graphql-codegen/plugin-helpers";
import { schemaPrepend } from "amplience-graphql-codegen-common";
import { snakeCase } from "change-case";
import type { GraphQLSchema } from "graphql";
import { visit } from "graphql";
import { extname } from "path";
import { TerraformGenerator, map, arg } from "terraform-generator";
import type { PluginConfig } from "./lib/config";
import { createObjectTypeVisitor, maybeArg } from "./lib/visitor";

export const addToSchema = schemaPrepend.loc?.source.body;
export const amplienceIsManagedSwitchName = "amplience_is_managed";

export const plugin: PluginFunction<PluginConfig> = (
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  {
    hostname = "https://schema-examples.com",
    visualization,
    content_repositories,
    slot_repositories,
    schemaSuffix,
    add_required_provider = true,
    add_amplience_is_managed_switch = false,
  },
) => {
  const astNode = getCachedDocumentNodeFromSchema(schema);

  // This class can build a terraform file string.
  const tfg = new TerraformGenerator(
    add_required_provider
      ? {
          required_providers: { amplience: map({ source: "labd/amplience" }) },
        }
      : undefined,
  );

  // To connect the Amplience content type resources to the correct Amplience repository,
  // we first generate the terraform repositories as terraform data.
  const contentRepositories = content_repositories
    ? Object.entries(content_repositories)
        .filter(([name]) => name !== "for_each")
        .map(([name, value]) =>
          tfg.data("amplience_content_repository", snakeCase(name), {
            id: maybeArg(value),
            ...(add_amplience_is_managed_switch
              ? { count: arg(`var.${amplienceIsManagedSwitchName} ? 1 : 0`) }
              : {}),
          }),
        )
    : undefined;
  const slotRepositories = slot_repositories
    ? Object.entries(slot_repositories)
        .filter(([name]) => name !== "for_each")
        .map(([name, value]) =>
          tfg.data("amplience_content_repository", snakeCase(name), {
            id: maybeArg(value),
            ...(add_amplience_is_managed_switch
              ? { count: arg(`var.${amplienceIsManagedSwitchName} ? 1 : 0`) }
              : {}),
          }),
        )
    : undefined;

  const slotRepositoriesForEach = slot_repositories?.for_each;
  const contentRepositoriesForEach = content_repositories?.for_each;

  // For each GraphQl object type, add corresponding resources to the terraform generator.
  visit(astNode, {
    ObjectTypeDefinition: {
      leave: createObjectTypeVisitor({
        tfg,
        contentRepositories,
        slotRepositories,
        contentRepositoriesForEach,
        slotRepositoriesForEach,
        hostname,
        visualization,
        schemaSuffix,
        addAmplienceIsManagedSwitch: add_amplience_is_managed_switch,
      }),
    },
  });

  // Add the managed switch to the terraform generator
  if (add_amplience_is_managed_switch) {
    tfg.variable(amplienceIsManagedSwitchName, {
      type: arg("bool"),
      default: true,
      description: "Set to false to disable all the Amplience resources",
    });
  }

  // Return the terraform file string
  return tfg.generate().tf;
};

export const validate: PluginValidateFn<PluginConfig> = async (
  _schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: PluginConfig,
  outputFile: string,
) => {
  if (extname(outputFile) !== ".tf") {
    throw new Error(
      `Plugin "amplience-terraform" requires output extension to be ".tf"!`,
    );
  }
  if (config.visualization) {
    if (config.visualization.filter((v) => v.for_each).length > 1) {
      throw new Error(
        `You can only have 1 item with a for_each property in your visualization list.`,
      );
    }
    if (
      config.visualization.filter((v) => v.default).length > 1 ||
      config.visualization.some((v) => v.default && v.for_each)
    ) {
      throw new Error(
        `You can only set 1 item, which may not be a for_each-item to be the default.`,
      );
    }
  }
  if (config.content_repositories) {
    validateRepositoryConfig(config.content_repositories);
  }

  if (config.slot_repositories) {
    validateRepositoryConfig(config.slot_repositories);
  }
};

function validateRepositoryConfig(repositoryMap: { [name: string]: string }) {
  const repositoryKeys = Object.keys(repositoryMap);

  if (repositoryKeys.length > 1 && repositoryMap.for_each) {
    throw new Error(
      `for_each should not be used when multiple repositories are defined to prevent duplicate resources.`,
    );
  }
}
