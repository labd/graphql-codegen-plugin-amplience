export type RefType = { allOf: Array<{ $ref: string } | object> };

export type LocalizedType = RefType & {
  properties: {
    values: {
      items: {
        properties: {
          value: AmpliencePropertyType;
        };
      };
    };
  };
};

export type SortableTrait = {
  sortBy: {
    key: string;
    paths: string[];
  }[];
};

export type HierarchyTrait = {
  childContentTypes: string[] | undefined;
};

export type FilterableTrait = {
  filterBy: {
    paths: string[];
  }[];
};

export type EnumProperties = {
  properties: {
    contentType: {
      enum: string[];
    };
  };
};

export type InlineObject = {
  type: string;
  properties: Properties;
  propertyOrder: string[] | undefined;
  required: string[] | undefined;
};

export type InlineContentReference = {
  type: "object";
  allOf: RefType["allOf"];
};

export type Properties = {
  [name: string]: AmpliencePropertyType;
};

export interface AmpliencePropertyType {
  title?: string;
  description?: string;
  type?: string;
  const?: string | string[];
  enum?: string[];
  allOf?: RefType["allOf"];
  items?: AmpliencePropertyType;
  properties?: Properties;
  propertyOrder?: string[];
  required?: string[];
  format?: string;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
  examples?: string[];
}

export type AmplienceDeliveryKeyType = {
  type: "object";
  title: "Delivery Key";
  properties: {
    deliveryKey: {
      type: "string";
      title: string;
      description: string;
      pattern?: string;
    };
  };
};

export interface AmplienceContentTypeSchemaBody {
  $id: string;
  $schema: string;
  allOf?: RefType["allOf"][number];
  title: string;
  description: string;
  "trait:filterable"?: {};
  "trait:hierarchy"?: {};
  "trait:sortable"?: {};
  type: "object";
  properties?: {
    [name: string | "_meta"]:
      | AmpliencePropertyType
      | AmplienceDeliveryKeyType
      | undefined;
  };
  definitions?: { [name: string]: AmpliencePropertyType };
  propertyOrder?: string[];
  required?: string[];
}
