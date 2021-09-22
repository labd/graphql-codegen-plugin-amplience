import {
  getCachedDocumentNodeFromSchema,
  PluginFunction,
  PluginValidateFn,
  Types,
} from '@graphql-codegen/plugin-helpers';
import { capitalCase, paramCase } from 'change-case';
import {
  FieldDefinitionNode,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  visit,
} from 'graphql';
import { extname } from 'path';

type Config = {
  hostname: string;
};

export const plugin: PluginFunction<any> = (
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: Config
) => {
  const astNode = getCachedDocumentNodeFromSchema(schema);

  const visitor = {
    FieldDefinition: (node: FieldDefinitionNode) => {
      return {
        [node.name.value]: {
          title: paramCase(node.name.value),
        },
      };
    },
    ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
      return {
        $id: `${config.hostname}/${paramCase(node.name.value)}`,
        title: capitalCase(node.name.value),
        properties: node.fields,
      };
    },
  };

  const result = visit(astNode, { leave: visitor });

  return JSON.stringify(result.definitions[0]);
};

export const validate: PluginValidateFn<any> = async (
  _schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: Config,
  outputFile: string
) => {
  if (config.hostname === undefined) {
    throw new Error(
      `Plugin "amplience" requires a hostname to be set in the config!`
    );
  }
  if (extname(outputFile) !== '.json') {
    throw new Error(`Plugin "amplience" requires extension to be ".json"!`);
  }
};
