import { paramCase } from "change-case";
import type { TypeDefinitionNode } from "graphql";

export * from "./graphql";
export * from "./util";
export * from "./directives";

export const typeUri = (type: TypeDefinitionNode, schemaHost: string): string =>
  `${schemaHost}/${paramCase(type.name.value)}`;
