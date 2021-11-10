// Code here
import {
  getCachedDocumentNodeFromSchema,
  PluginFunction,
  PluginValidateFn,
  Types,
} from '@graphql-codegen/plugin-helpers';
import { paramCase, snakeCase } from 'change-case';
import {
  FieldDefinitionNode,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  visit,
} from 'graphql';
import { extname } from 'path';
import { TerraformGenerator } from 'terraform-generator';

type Config = {
  hostname: string;
};

export const plugin: PluginFunction<any> = (
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  _config: Config
) => {
  const astNode = getCachedDocumentNodeFromSchema(schema);
  const tfg = new TerraformGenerator({
    required_version: '>= 0.12',
  });

  const visitor = {
    FieldDefinition: (node: FieldDefinitionNode) => {
      return {
        [node.name.value]: {
          title: paramCase(node.name.value),
        },
      };
    },
    ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
      tfg.resource(
        'amplience_content_type_schema',
        snakeCase(node.name.value),
        { validation_level: 'CONTENT_TYPE' }
      );
      return tfg.generate().tf;
    },
  };

  const result = visit(astNode, { leave: visitor });

  return result.definitions[0];
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
  if (extname(outputFile) !== '.tf') {
    throw new Error(
      `Plugin "amplience-terraform" requires output extension to be ".tf"!`
    );
  }
};
