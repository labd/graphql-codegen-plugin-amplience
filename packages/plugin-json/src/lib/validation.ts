import {
  hasDirective,
  isObjectTypeDefinitionNode,
  isValue,
} from "amplience-graphql-codegen-common";
import {
  FieldDefinitionNode,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
} from "graphql";

export const getObjectTypeDefinitions = (schema: GraphQLSchema) =>
  Object.values(schema.getTypeMap())
    .map((type) => type.astNode)
    .filter(isValue)
    .filter(isObjectTypeDefinitionNode);

export const getRequiredLocalizedFieldsReport = (
  types: ObjectTypeDefinitionNode[]
) =>
  getFieldsReport(
    types.filter((type) => type.fields?.some(isNonNullLocalizedField)),
    isNonNullLocalizedField
  );

const isNonNullLocalizedField = (field: FieldDefinitionNode) =>
  hasDirective(field, "amplienceLocalized") &&
  // String! @amplienceLocalized
  ((field.type.kind === "NonNullType" &&
    field.type.type.kind === "NamedType") ||
    // [String!] @amplienceLocalized
    (field.type.kind === "ListType" &&
      field.type.type.kind === "NonNullType") ||
    // [String!]! @amplienceLocalized
    (field.type.kind === "NonNullType" &&
      field.type.type.kind === "ListType" &&
      field.type.type.type.kind === "NonNullType"));

export const getTooManyFiltersReport = (types: ObjectTypeDefinitionNode[]) =>
  getFieldsReport(
    types.filter(
      (type) => (type.fields?.filter(filterableField)?.length ?? 0) > 5
    ),
    filterableField
  );

const filterableField = (field: FieldDefinitionNode) =>
  hasDirective(field, "amplienceFilterable");

export const getTooManyDeliveryKeysReport = (types: ObjectTypeDefinitionNode[]) =>
  getFieldsReport(
    types.filter(
      (type) => (type.fields?.filter(deliveryKeyField)?.length ?? 0) > 1
    ),
    deliveryKeyField
  )

export const getDeliveryKeyNotNullableStringReport = (types: ObjectTypeDefinitionNode[]) =>
  getFieldsReport(
    types.filter(
      (type) => type.fields?.some((field) => deliveryKeyField(field) && !nullableStringField(field))
    ),
    (field) => deliveryKeyField(field) && !nullableStringField(field)
  )

const deliveryKeyField = (field: FieldDefinitionNode) =>
  hasDirective(field, 'amplienceDeliveryKey')

const nullableStringField = (field: FieldDefinitionNode) =>
  (
    field.type.kind === 'NamedType' &&
    field.type.name.value === 'String'
  )

/**
 * Converts a type with filtered fields in a simple string report.
 *
 * @example
 * ```
 * Type
 *   prop1
 *   prop2
 * ```
 */
const getFieldsReport = (
  types: ObjectTypeDefinitionNode[],
  fieldFilter: (field: FieldDefinitionNode) => boolean | undefined
) =>
  types
    .map((type) => ({
      type: type.name.value,
      fields: type.fields?.filter(fieldFilter).map((f) => f.name.value),
    }))
    .map(
      ({ type, fields }) =>
        `type ${type}\n${fields?.map((f) => `\t${f}`).join("\n")}`
    )
    .join("\n\n");
