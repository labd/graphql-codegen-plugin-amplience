import { getCachedDocumentNodeFromSchema } from "@graphql-codegen/plugin-helpers";
import {
  hasDirective,
  isObjectTypeDefinitionNode,
} from "amplience-graphql-codegen-common";
import { paramCase } from "change-case";
import fs from "fs";
import { buildSchema } from "graphql";
import { addToSchema } from "../src/index";
import { contentTypeSchemaBody } from "../src/lib/amplience-schema-transformers";

it.each(["base", "hierarchy"])("correct JSON files for %s", (graphqlFile) => {
  const schema = buildSchema(
    addToSchema +
      fs.readFileSync(`./test/testdata/${graphqlFile}.graphql`, "utf8"),
  );
  const documentNode = getCachedDocumentNodeFromSchema(schema);
  const contentTypes = documentNode.definitions
    .filter(isObjectTypeDefinitionNode)
    .filter((d) => hasDirective(d, "amplienceContentType"));

  const results = contentTypes.map((type) =>
    contentTypeSchemaBody(type, schema, "https://schema-examples.com"),
  );

  const jsonDir = `./test/testdata/expected/${graphqlFile}`;
  for (const jsonFile of fs.readdirSync(jsonDir)) {
    const contentTypeSchema = readJson(`${jsonDir}/${jsonFile}`);

    const result = results.find(
      (r) =>
        r.$id ===
        `https://schema-examples.com/${paramCase(
          jsonFile.replace(".json", ""),
        )}`,
    );
    if (process.env.LOG) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(pruned(result), null, 2));
    }
    expect(pruned(result)).toEqual(contentTypeSchema);
  }
});

/** Removes all undefined properties */
const pruned = <T>(object: T): Partial<T> => {
  try {
    return JSON.parse(JSON.stringify(object));
  } catch {
    throw new Error(`Could not prune ${JSON.stringify(object)}`);
  }
};

// slot with content link
// or content type with content reference

const readJson = <T>(path: string) =>
  JSON.parse(fs.readFileSync(path, "utf-8")) as T;
