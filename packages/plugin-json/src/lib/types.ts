export interface AmpliencePropertyType {
  title?: string;
  description?: string;
  type?: string;
  const?: any;
  enum?: string[];
  allOf?: { [key: string]: any }[];
  items?: AmpliencePropertyType;
  properties?: any;
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

export interface AmplienceContentTypeSchemaBody {
  $id: string;
  $schema: string;
  allOf: any[];
  title: string;
  description: string;
  "trait:filterable"?: {};
  "trait:hierarchy"?: {};
  "trait:sortable"?: {};
  type: "object";
  properties?: { [name: string]: AmpliencePropertyType };
  definitions?: { [name: string]: AmpliencePropertyType };
  propertyOrder?: string[];
  required?: string[];
}
