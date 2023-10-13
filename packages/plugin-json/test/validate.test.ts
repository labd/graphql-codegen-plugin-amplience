import fs from "fs";
import { gql } from "graphql-tag";
import { buildASTSchema, buildSchema, print } from "graphql/index.js";
import { schemaPrepend } from "amplience-graphql-codegen-common";
import { addToSchema, validate } from "../src/index.js";
import { it, expect } from "vitest";

it.each([{ graphqlFile: "base" }, { graphqlFile: "hierarchy" }])(
  "Validates valid schema $graphqlFile",
  ({ graphqlFile }) => {
    const schema = buildSchema(
      addToSchema +
      fs.readFileSync(`./test/testdata/${graphqlFile}.graphql`, "utf8"),
    );
    expect(validate(schema, [], {}, "", [])).toBe(undefined);
  },
);

it("Throws Error: Fields with '@amplienceLocalized' must be Nullable", () => {
  const schema = buildASTSchema(gql`
    ${print(schemaPrepend)}
    type Test {
      invalidLocalizedProp: String! @amplienceLocalized
      invalidLocalizedListProp2: [String!] @amplienceLocalized
      invalidLocalizedListProp: [String!]! @amplienceLocalized

      validLocalizedProp: String @amplienceLocalized
      validLocalizedListProp: [String] @amplienceLocalized
      validLocalizedListProp2: [String]! @amplienceLocalized
      validStringProp: String!
    }
  `);
  expect(() => validate(schema, [], {}, "", [])).toThrow(
    "Fields with '@amplienceLocalized' must be Nullable.\n\ntype Test\n\tinvalidLocalizedProp\n\tinvalidLocalizedListProp2\n\tinvalidLocalizedListProp",
  );
});

it("Throws Error: Types can have no more than 5 fields with '@amplienceFiltered'", () => {
  const schema = buildASTSchema(gql`
    ${print(schemaPrepend)}
    type Test {
      a: String @amplienceFilterable
      b: String @amplienceFilterable
      c: String @amplienceFilterable
      d: String @amplienceFilterable
      e: String @amplienceFilterable
      f: String @amplienceFilterable
      g: String
    }
  `);
  expect(() => validate(schema, [], {}, "", [])).toThrow(
    "Types can have no more than 5 fields with '@amplienceFiltered'.\n\ntype Test\n\ta\n\tb\n\tc\n\td\n\te\n\tf",
  );
});
