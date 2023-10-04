import { paramCase } from "change-case-all";
import { TypeDefinitionNode } from "graphql";

export * from "./graphql";
export * from "./util";
export * from "./directives";

export const typeUri = (type: TypeDefinitionNode, schemaHost: string) =>
  `${schemaHost}/${paramCase(type.name.value)}`;
