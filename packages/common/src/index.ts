import { kebabCase } from "change-case";
import { TypeDefinitionNode } from "graphql";

export * from "./graphql.js";
export * from "./util.js";
export * from "./directives.js";

export const typeUri = (type: TypeDefinitionNode, schemaHost: string) =>
  `${schemaHost}/${kebabCase(type.name.value)}`;
