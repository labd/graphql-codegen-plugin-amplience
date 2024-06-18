import {
  hasDirective,
  ifValue,
  isObjectTypeDefinitionNode,
  isValue,
  maybeDirective,
  maybeDirectiveValue,
} from "amplience-graphql-codegen-common";
import type { NamedTypeNode, StringValueNode, TypeNode } from "graphql";
import {
  type FieldDefinitionNode,
  type GraphQLSchema,
  type ObjectTypeDefinitionNode,
} from "graphql";

export const getObjectTypeDefinitions = (
  schema: GraphQLSchema,
): ObjectTypeDefinitionNode[] =>
  Object.values(schema.getTypeMap())
    .map((type) => type.astNode)
    .filter(isValue)
    .filter(isObjectTypeDefinitionNode);

export const getRequiredLocalizedFieldsReport = (
  types: ObjectTypeDefinitionNode[],
): string =>
  getFieldsReport(
    types.filter((type) => type.fields?.some(isNonNullLocalizedField)),
    isNonNullLocalizedField,
  );

const isNonNullLocalizedField = (
  field: FieldDefinitionNode,
): boolean | undefined =>
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

export const getTooManyFiltersReport = (
  types: ObjectTypeDefinitionNode[],
): string =>
  getFieldsReport(
    types.filter(
      (type) => (type.fields?.filter(isFilterableField).length ?? 0) > 5,
    ),
    isFilterableField,
  );

const isFilterableField = (field: FieldDefinitionNode) =>
  hasDirective(field, "amplienceFilterable");

export const getTooManyDeliveryKeysReport = (
  types: ObjectTypeDefinitionNode[],
): string =>
  getFieldsReport(
    types.filter(
      (type) => (type.fields?.filter(isDeliveryKeyField).length ?? 0) > 1,
    ),
    isDeliveryKeyField,
  );

export const getDeliveryKeyNotNullableStringReport = (
  types: ObjectTypeDefinitionNode[],
): string =>
  getFieldsReport(
    types.filter(
      (type) =>
        type.fields?.some(
          (field) => isDeliveryKeyField(field) && !isNullableStringField(field),
        ),
    ),
    (field) => isDeliveryKeyField(field) && !isNullableStringField(field),
  );

const isDeliveryKeyField = (field: FieldDefinitionNode) =>
  hasDirective(field, "amplienceDeliveryKey");

const isNullableStringField = (field: FieldDefinitionNode) =>
  field.type.kind === "NamedType" && field.type.name.value === "String";

export const getAmplienceExtensionNotNullableObjectReport = (
  types: ObjectTypeDefinitionNode[],
): string =>
  getFieldsReport(
    types.filter(
      (type) =>
        type.fields?.some(
          (field) =>
            isAmplienceExtensionField(field) &&
            !isNullableObjectField(field.type, types),
        ),
    ),
    (field) =>
      isAmplienceExtensionField(field) &&
      !isNullableObjectField(field.type, types),
  );

// @amplienceExtension referencing an @amplienceContentType produces odd behavior we want to avoid
export const getAmplienceExtensionReferencesAmplienceContentTypeReport = (
  types: ObjectTypeDefinitionNode[],
): string =>
  getFieldsReport(
    types.filter(
      (type) =>
        type.fields?.some(
          (field) =>
            isAmplienceExtensionField(field) &&
            isNullableObjectField(field.type, types) &&
            isAmplienceContentTypeField(field.type, types),
        ),
    ),
    (field) =>
      isAmplienceExtensionField(field) &&
      isNullableObjectField(field.type, types) &&
      isAmplienceContentTypeField(field.type, types),
  );

const isAmplienceExtensionField = (field: FieldDefinitionNode) =>
  hasDirective(field, "amplienceExtension");

const isNullableObjectField = (
  fieldType: TypeNode,
  allTypes: ObjectTypeDefinitionNode[],
): fieldType is NamedTypeNode =>
  fieldType.kind === "NamedType" &&
  allTypes.some((type) => type.name.value === fieldType.name.value);

const isAmplienceContentTypeField = (
  fieldType: NamedTypeNode,
  allTypes: ObjectTypeDefinitionNode[],
) => {
  const referencedType = allTypes.find(
    (t) => t.name.value === fieldType.name.value,
  );

  return referencedType
    ? hasDirective(referencedType, "amplienceContentType")
    : false;
};

export const getContentTypeFieldOrderOnIllegalFieldsReport = (
  types: ObjectTypeDefinitionNode[],
): string =>
  getFieldsReport(
    types.filter((type) =>
      ifFieldOrderValue(
        type,
        (fieldOrder) =>
          type.fields?.some(
            (field) =>
              fieldOrder.includes(field.name.value) &&
              hasIllegalDirectivesForFieldOrder(field),
          ),
      ),
    ),
    (field, type) =>
      ifFieldOrderValue(
        type,
        (fieldOrder) =>
          fieldOrder.includes(field.name.value) &&
          hasIllegalDirectivesForFieldOrder(field),
      ),
  );

export const getContentTypeFieldOrderMissingFieldsReport = (
  types: ObjectTypeDefinitionNode[],
): string =>
  getFieldsReport(
    types.filter((type) =>
      ifFieldOrderValue(
        type,
        (fieldOrder) =>
          type.fields
            ?.filter((field) => !hasIllegalDirectivesForFieldOrder(field))
            .some((field) => !fieldOrder.includes(field.name.value)),
      ),
    ),
    (field, type) =>
      ifFieldOrderValue(
        type,
        (fieldOrder) =>
          !hasIllegalDirectivesForFieldOrder(field) &&
          !fieldOrder.includes(field.name.value),
      ),
  );

export const getContentTypeFieldOrderUnknownFieldsReport = (
  types: ObjectTypeDefinitionNode[],
): string =>
  types.reduce<string>((acc, type) => {
    const fieldNames = type.fields?.map((field) => field.name.value);

    const unknownFields = ifFieldOrderValue<string[]>(type, (fieldOrder) =>
      fieldOrder.filter((fieldName) => !fieldNames?.includes(fieldName)),
    );

    return unknownFields?.length
      ? `${acc ? `${acc}\n\n` : ""}type ${
          type.name.value
        }\n\t${unknownFields.join("\n\t")}`
      : acc;
  }, "");

const ifFieldOrderValue = <T = boolean>(
  type: ObjectTypeDefinitionNode,
  ifFieldOrderValue: (fieldOrder: string[]) => T | undefined,
) =>
  ifValue(maybeDirective(type, "amplienceContentType"), (directive) =>
    ifValue(
      maybeDirectiveValue<StringValueNode>(directive, "fieldOrder"),
      (fieldOrder) => ifFieldOrderValue(fieldOrder.value.split(" ")),
    ),
  );

const hasIllegalDirectivesForFieldOrder = (field: FieldDefinitionNode) =>
  hasDirective(field, "amplienceDeliveryKey") ||
  hasDirective(field, "amplienceIgnore");

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
  fieldFilter: (
    field: FieldDefinitionNode,
    type: ObjectTypeDefinitionNode,
  ) => boolean | undefined,
): string =>
  types
    .map((type) => ({
      type: type.name.value,
      fields: type.fields
        ?.filter((field) => fieldFilter(field, type))
        .map((f) => f.name.value),
    }))
    .map(
      ({ type, fields }) =>
        `type ${type}\n${fields?.map((f) => `\t${f}`).join("\n")}`,
    )
    .join("\n\n");
