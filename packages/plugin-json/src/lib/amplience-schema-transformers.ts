import {
  combinations,
  hasDirective,
  ifNotEmpty,
  ifValue,
  maybeDirective,
  maybeDirectiveValue,
  namedType,
  switchArray,
  typeName,
  typeUri,
} from "amplience-graphql-codegen-common";
import { capitalCase, paramCase } from "change-case-all";
import {
  EnumValueNode,
  FieldDefinitionNode,
  GraphQLSchema,
  IntValueNode,
  ListValueNode,
  ObjectTypeDefinitionNode,
  StringValueNode,
  TypeDefinitionNode,
  TypeNode,
  UnionTypeDefinitionNode,
  isEnumType,
  isObjectType,
  isUnionType,
} from "graphql";
import { AmplienceContentTypeSchemaBody, AmpliencePropertyType } from "./types";

/**
 * Returns a Amplience ContentType from an interface type.
 */
export const contentTypeSchemaBody = (
  type: ObjectTypeDefinitionNode,
  schema: GraphQLSchema,
  schemaHost: string,
): AmplienceContentTypeSchemaBody => ({
  $id: typeUri(type, schemaHost),
  $schema: "http://json-schema.org/draft-07/schema#",
  ...refType(AMPLIENCE_TYPE.CORE.Content),
  title: capitalCase(type.name.value),
  properties: {
    ...objectProperties(type, schema, schemaHost),
  },
  description: type.description?.value ?? capitalCase(type.name.value),
  "trait:sortable": sortableTrait(type),
  "trait:hierarchy": isHierarchy(type)
    ? hierarchyTrait(type, schema, schemaHost)
    : undefined,
  "trait:filterable": filterableTrait(type),
  type: "object",
  propertyOrder:
    type.fields
      ?.filter((field) => isAmplienceProperty(type, field))
      .map((field) => field.name.value) ?? [],
  required: type.fields
    ?.filter((field) => isAmplienceProperty(type, field))
    .filter(
      (field) =>
        field.type.kind === "NonNullType" ||
        hasDirective(field, "amplienceLocalized"),
    )
    .map((n) => n.name.value),
  ...(isHierarchy(type)
    ? {
      allOf: [
        refType(AMPLIENCE_TYPE.CORE.Content).allOf[0],
        refType(AMPLIENCE_TYPE.CORE.HierarchyNode).allOf[0],
      ],
    }
    : {}),
});

/**
 * Returns the properties that go inside Amplience `{type: 'object', properties: ...}`
 */
export const objectProperties = (
  type: ObjectTypeDefinitionNode,
  schema: GraphQLSchema,
  schemaHost: string,
): { [name: string]: AmpliencePropertyType } =>
  Object.fromEntries(
    type.fields
      ?.filter((field) => isAmplienceProperty(type, field))
      .map((prop) => [
        prop.name.value,
        {
          title: capitalCase(prop.name.value),
          description: prop.description?.value,
          ...switchArray<AmpliencePropertyType>(prop.type, {
            ifArray: (subType) => ({
              type: "array",
              minItems: ifValue(
                ifValue(
                  maybeDirective(prop, "amplienceList"),
                  (d) =>
                    maybeDirectiveValue<IntValueNode>(d, "minItems")?.value,
                ),
                Number,
              ),
              maxItems: ifValue(
                ifValue(
                  maybeDirective(prop, "amplienceList"),
                  (d) =>
                    maybeDirectiveValue<IntValueNode>(d, "maxItems")?.value,
                ),
                Number,
              ),
              items: ampliencePropertyType(prop, subType, schema, schemaHost),
              const: arrayConstValues(prop),
            }),
            other: (type) =>
              ampliencePropertyType(prop, type, schema, schemaHost),
          }),
        },
      ]) ?? [],
  );

const isHierarchy = (type: ObjectTypeDefinitionNode) =>
  maybeDirectiveValue<EnumValueNode>(
    maybeDirective(type, "amplienceContentType")!,
    "kind",
  )?.value === "HIERARCHY";

const isAmplienceProperty = (
  type: ObjectTypeDefinitionNode,
  field: FieldDefinitionNode,
) =>
  !hasDirective(field, "amplienceIgnore") &&
  (!isHierarchy(type) || field.name.value !== "children");

const arrayConstValues = (prop: FieldDefinitionNode) =>
  ifValue(
    maybeDirective(prop, "amplienceConst"),
    (d) =>
      maybeDirectiveValue<ListValueNode>(d, "items")?.values.map(
        (v) => (v as StringValueNode)?.value,
      ),
  );

/**
 * Returns an Amplience type object of various types (number/string/object)
 */
export const ampliencePropertyType = (
  prop: FieldDefinitionNode,
  type: TypeNode,
  schema: GraphQLSchema,
  schemaHost: string,
): AmpliencePropertyType => {
  const node = schema.getType(typeName(type));
  // Handle non-primitive types.
  if (node) {
    if (isUnionType(node) && node.astNode) {
      return contentLink(node.astNode, schemaHost);
    }

    if (isEnumType(node) && node.astNode) {
      return {
        type: "string",
        enum: node.astNode.values?.map((v) => v.name.value),
      };
    }

    if (isObjectType(node) && node.astNode) {
      if (hasDirective(prop, "amplienceLink")) {
        return contentLink(node.astNode, schemaHost);
      }
      if (hasDirective(prop, "amplienceReference")) {
        return contentReference(node.astNode, schemaHost);
      }

      if (hasDirective(node.astNode, "amplienceContentType")) {
        return inlineContentReference(node.astNode, schemaHost);
      }

      return inlineObject(node.astNode, schema, schemaHost);
    }
  }

  // Handle primitive types.
  switch (typeName(type)) {
    case "String":
      const constValue = ifValue(maybeDirective(prop, "amplienceConst"), (d) =>
        maybeDirectiveValue<StringValueNode>(d, "item"),
      )?.value;

      // Special case for const values.
      if (constValue) {
        return {
          type: "string",
          const: constValue,
        };
      }

      return checkLocalized(prop, type, {
        type: "string",

        ...ifValue(maybeDirective(prop, "amplienceText"), (d) => ({
          format: maybeDirectiveValue<StringValueNode>(d, "format")?.value,
          pattern: maybeDirectiveValue<StringValueNode>(d, "pattern")?.value,
          minLength: ifValue(
            maybeDirectiveValue<IntValueNode>(d, "minLength")?.value,
            Number,
          ),
          maxLength: ifValue(
            maybeDirectiveValue<IntValueNode>(d, "maxLength")?.value,
            Number,
          ),
          examples: maybeDirectiveValue<ListValueNode>(
            d,
            "examples",
          )?.values.map((v) => (v as StringValueNode)?.value),
        })),
      });
    case "Boolean":
      return checkLocalized(prop, type, { type: "boolean" });
    case "Int":
    case "Float":
      return checkLocalized(prop, type, {
        type: typeName(type) === "Float" ? "number" : "integer",
        ...ifValue(maybeDirective(prop, "amplienceNumber"), (d) => ({
          format: maybeDirectiveValue<StringValueNode>(d, "format")?.value,
          minimum: ifValue(
            maybeDirectiveValue<IntValueNode>(d, "minimum")?.value,
            Number,
          ),
          maximum: ifValue(
            maybeDirectiveValue<IntValueNode>(d, "maximum")?.value,
            Number,
          ),
        })),
      });
    case "AmplienceImage":
    case "AmplienceVideo":
      return hasDirective(prop, "amplienceLocalized")
        ? refType(
          AMPLIENCE_TYPE.LOCALIZED[
          typeName(type) as "AmplienceImage" | "AmplienceVideo"
          ],
        )
        : refType(
          AMPLIENCE_TYPE.CORE[
          typeName(type) as "AmplienceImage" | "AmplienceVideo"
          ],
        );
  }
  return {};
};

const contentReference = (type: ObjectTypeDefinitionNode, schemaHost: string) =>
  refType(
    AMPLIENCE_TYPE.CORE.ContentReference,
    enumProperties(type, schemaHost),
  );

const contentLink = (
  type: UnionTypeDefinitionNode | ObjectTypeDefinitionNode,
  schemaHost: string,
) => refType(AMPLIENCE_TYPE.CORE.ContentLink, enumProperties(type, schemaHost));

const enumProperties = (
  typeOrUnion: TypeDefinitionNode,
  schemaHost: string,
) => ({
  properties: {
    contentType: {
      enum: (typeOrUnion.kind === "UnionTypeDefinition"
        ? ((typeOrUnion.types ?? []) as unknown as TypeDefinitionNode[])
        : [typeOrUnion]
      ).map((t) => typeUri(t, schemaHost)),
    },
  },
});

const inlineObject = (
  type: ObjectTypeDefinitionNode,
  schema: GraphQLSchema,
  schemaHost: string,
) => ({
  type: "object",
  properties: objectProperties(type, schema, schemaHost),
  propertyOrder: type.fields?.map((n) => n.name.value),
  required: type.fields
    ?.filter((field) => field.type.kind === "NonNullType")
    .map((field) => field.name.value),
});

const inlineContentReference = (
  type: ObjectTypeDefinitionNode,
  schemaHost: string,
) => ({
  type: "object",
  // use inline content (https://amplience.com/developers/docs/schema-reference/data-types/#inline-content)
  // to prevent property duplication and enrich content type with meta data (e.g. schema name)
  ...refType(typeUri(type, schemaHost)),
});

/**
 * Wraps a Amplience type object in localized JSON.
 */
export const checkLocalized = (
  prop: FieldDefinitionNode,
  type: TypeNode,
  result: AmpliencePropertyType,
) =>
  hasDirective(prop, "amplienceLocalized")
    ? prop.directives?.length === 1 && typeName(type) === "String"
      ? refType(AMPLIENCE_TYPE.LOCALIZED.String)
      : localized(result)
    : result;

export const AMPLIENCE_TYPE = {
  LOCALIZED: {
    AmplienceImage:
      "http://bigcontent.io/cms/schema/v1/localization#/definitions/localized-image",
    AmplienceVideo:
      "http://bigcontent.io/cms/schema/v1/localization#/definitions/localized-video",
    String:
      "http://bigcontent.io/cms/schema/v1/localization#/definitions/localized-string",
  },
  CORE: {
    LocalizedValue:
      "http://bigcontent.io/cms/schema/v1/core#/definitions/localized-value",
    Content: "http://bigcontent.io/cms/schema/v1/core#/definitions/content",
    AmplienceImage:
      "http://bigcontent.io/cms/schema/v1/core#/definitions/image-link",
    AmplienceVideo:
      "http://bigcontent.io/cms/schema/v1/core#/definitions/video-link",
    ContentReference:
      "http://bigcontent.io/cms/schema/v1/core#/definitions/content-reference",
    ContentLink:
      "http://bigcontent.io/cms/schema/v1/core#/definitions/content-link",
    HierarchyNode:
      "http://bigcontent.io/cms/schema/v2/hierarchy#/definitions/hierarchy-node",
  },
};

export const refType = (ref: string, ...other: object[]) => ({
  allOf: [{ $ref: ref }, ...other],
});

export const localized = (value: AmpliencePropertyType) => ({
  ...refType(AMPLIENCE_TYPE.CORE.LocalizedValue),
  properties: {
    values: {
      items: {
        properties: {
          value,
        },
      },
    },
  },
});

/**
 * Returns sortable trait path for amplience based on properties containing the `@amplienceSortable` tag
 * @returns Object that can be pushed to `trait:sortable` directly
 */
export const sortableTrait = (type: ObjectTypeDefinitionNode) =>
  ifNotEmpty(
    type.fields?.filter((m) => hasDirective(m, "amplienceSortable")) ?? [],
    (items) => ({
      sortBy: [
        {
          key: "default",
          paths: items.map((n) => `/${n.name.value}`),
        },
      ],
    }),
  );

/**
 * Returns hierarchy trait child content types with the current type and any other
 * types based on the `@children` tag.
 * @returns Object that can be pushed to the `trait:hierarchy` directly
 */
export const hierarchyTrait = (
  type: ObjectTypeDefinitionNode,
  schema: GraphQLSchema,
  schemaHost: string,
) => ({
  childContentTypes: type.fields
    ?.filter((field) => field.name.value === "children")
    .map((field) => namedType(field.type))
    .flatMap((type) => {
      const node = schema.getType(typeName(type));

      return isUnionType(node) && node.astNode
        ? node.astNode.types ?? []
        : [type];
    })
    .map((t) => `${schemaHost}/${paramCase(t.name.value)}`),
});

/**
 * Returns filterable trait path for amplience based on properties containing the `@amplienceFilterable` tag.
 * Generates all possible combinations of the tags for multi-path filtering. Note Amplience only supports
 * multi-path filtering up to 5 paths.
 * @returns Object that can be pushed to `trait:filterable` directly
 */
export const filterableTrait = (type: ObjectTypeDefinitionNode) => {
  const filterableProps =
    type.fields?.filter((m) => hasDirective(m, "amplienceFilterable")) ?? [];

  if (filterableProps.length === 0) return undefined;

  return {
    filterBy: combinations(filterableProps.map((s) => `/${s.name.value}`)).map(
      (paths) => ({ paths }),
    ),
  };
};
