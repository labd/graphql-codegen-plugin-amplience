// Code here
import {
  getCachedDocumentNodeFromSchema,
  PluginFunction,
  PluginValidateFn,
  Types,
} from '@graphql-codegen/plugin-helpers';
import { snakeCase, paramCase, capitalCase } from 'change-case';
import { GraphQLSchema, ObjectTypeDefinitionNode, visit } from 'graphql';
import { extname } from 'path';
import { TerraformGenerator, fn } from 'terraform-generator';

type Config = {
  hostname: string;
  schemaDirectory: string;
};

export const plugin: PluginFunction<any> = (
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: Config
) => {
  const astNode = getCachedDocumentNodeFromSchema(schema);
  const tfg = new TerraformGenerator();

  /**
   * Visitor is only used to add resources to the TerraformGenerator,
   * it doesn't return anything itself
   */
  const visitor = {
    ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
      const snakeName = snakeCase(node.name.value);
      const paramName = paramCase(node.name.value);
      if (
        node.directives?.find(
          directive => directive.name.value === 'amplienceContent'
        )
      ) {
        const schema = tfg.resource(
          'amplience_content_type_schema',
          snakeName,
          {
            body: fn(
              'file',
              `${config.schemaDirectory ?? '.'}/${paramName}.json`
            ),
            schema_id: `${config.hostname}/${paramName}`,
            validation_level: 'CONTENT_TYPE',
          }
        );

        tfg.resource('amplience_content_type', snakeName, {
          content_type_uri: schema.attr('schema_id'),
          label: capitalCase(node.name.value),
          status: 'ACTIVE',
        });
      }
      return null;
    },
  };

  visit(astNode, { leave: visitor });

  return tfg.generate().tf;
};

export const addToSchema = `
directive @amplienceContent on OBJECT
`;

export const validate: PluginValidateFn<any> = async (
  _schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: Config,
  outputFile: string
) => {
  // Hostname is used for setting up
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
