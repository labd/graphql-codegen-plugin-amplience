import type {
  PluginFunction,
  PluginValidateFn,
  Types,
} from "@graphql-codegen/plugin-helpers";
import {
  hasDirective,
  isObjectTypeDefinitionNode,
  schemaPrepend,
} from "amplience-graphql-codegen-common";
import { paramCase } from "change-case";
import type { ObjectTypeDefinitionNode } from "graphql";
import { dirname } from "path";
import { contentTypeSchemaBody } from "./lib/amplience-schema-transformers";
import {
  getAmplienceExtensionNotNullableObjectReport,
  getAmplienceExtensionReferencesAmplienceContentTypeReport,
  getDeliveryKeyNotNullableStringReport,
  getObjectTypeDefinitions,
  getRequiredLocalizedFieldsReport,
  getTooManyDeliveryKeysReport,
  getTooManyFiltersReport,
} from "./lib/validation";

export type PluginConfig = {
  /**
   * The hostname
   *
   * @default 'https://schema-examples.com'
   */
  hostname?: string;
  /**
   * The suffix for the schema file generated if needed
   *
   */
  schemaSuffix?: string;
};

export type PresetConfig = {};

export const addToSchema = schemaPrepend.loc?.source?.body;

export const plugin: PluginFunction<PluginConfig> = (
  schema,
  _documents,
  { hostname = "https://schema-examples.com" },
  info,
) => {
  const node = info?.pluginContext?.typeNode as ObjectTypeDefinitionNode;

  const result = contentTypeSchemaBody(node, schema, hostname);
  return JSON.stringify(result);
};

export const validate: PluginValidateFn<PluginConfig> = (
  schema,
  _documents,
  _config,
  _outputFile,
) => {
  const types = getObjectTypeDefinitions(schema);
  const requiredLocalizedFieldsReport = getRequiredLocalizedFieldsReport(types);

  if (requiredLocalizedFieldsReport.length) {
    throw new Error(
      `Fields with '@amplienceLocalized' must be Nullable.\n\n${requiredLocalizedFieldsReport}`,
    );
  }

  const tooManyFiltersReport = getTooManyFiltersReport(types);
  if (tooManyFiltersReport.length) {
    throw new Error(
      `Types can have no more than 5 fields with '@amplienceFiltered'.\n\n${tooManyFiltersReport}`,
    );
  }

  const tooManyDeliveryKeysReport = getTooManyDeliveryKeysReport(types);
  if (tooManyDeliveryKeysReport) {
    throw new Error(
      `Types can only have 1 field with '@amplienceDeliveryKey'.\n\n${tooManyDeliveryKeysReport}`,
    );
  }

  const deliveryKeyNotNullableStringReport =
    getDeliveryKeyNotNullableStringReport(types);
  if (deliveryKeyNotNullableStringReport) {
    throw new Error(
      `Fields with '@amplienceDeliveryKey' must be of Nullable type String.\n\n${deliveryKeyNotNullableStringReport}`,
    );
  }

  const amplienceExtensionNotNullableObjectReport =
    getAmplienceExtensionNotNullableObjectReport(types);
  if (amplienceExtensionNotNullableObjectReport) {
    throw new Error(
      `Fields with '@amplienceExtension' must be of a Nullable Object type.\n\n${amplienceExtensionNotNullableObjectReport}`,
    );
  }

  const amplienceExtensionOnAmplienceContentTypeReport =
    getAmplienceExtensionReferencesAmplienceContentTypeReport(types);
  if (amplienceExtensionOnAmplienceContentTypeReport) {
    throw new Error(
      `Types referenced by fields with '@amplienceExtension' must not have '@amplienceContentType' directive.\n\n${amplienceExtensionOnAmplienceContentTypeReport}`,
    );
  }
};

export const preset: Types.OutputPreset<PresetConfig> = {
  buildGeneratesSection: (options) =>
    options.schema.definitions
      .filter(isObjectTypeDefinitionNode)
      .filter((d) => hasDirective(d, "amplienceContentType"))
      .map((node) => ({
        ...options,
        filename: `${dirname(options.baseOutputDir)}/schemas/${paramCase(
          node.name.value,
        )}${
          options.config.schemaSuffix ? "-" + options.config.schemaSuffix : ""
        }.json`,

        pluginContext: {
          typeNode: node,
        },
      })),
};
