import { schemaPrepend } from "amplience-graphql-codegen-common";
import fs from "fs";
import { buildASTSchema, buildSchema, print } from "graphql";
import { gql } from "graphql-tag";
import { addToSchema, validate } from "../src";

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

it("Throws error: Types can only have 1 field with '@amplienceDeliveryKey'", () => {
  const schema = buildASTSchema(gql`
    ${print(schemaPrepend)}
    type Test {
      a: String @amplienceDeliveryKey
      b: String @amplienceDeliveryKey
    }
  `);
  expect(() => validate(schema, [], {}, "", [])).toThrow(
    "Types can only have 1 field with '@amplienceDeliveryKey'.\n\ntype Test\n\ta\n\tb",
  );
});

it.each([
  gql`
    type Test {
      a: String! @amplienceDeliveryKey
    }
  `,
  gql`
    type Test {
      a: Int! @amplienceDeliveryKey
    }
  `,
  gql`
    type Test {
      a: Float! @amplienceDeliveryKey
    }
  `,
  gql`
    type Test {
      a: Boolean! @amplienceDeliveryKey
    }
  `,
  gql`
    type Test {
      a: Int @amplienceDeliveryKey
    }
  `,
  gql`
    type Test {
      a: Float @amplienceDeliveryKey
    }
  `,
  gql`
    type Test {
      a: Boolean @amplienceDeliveryKey
    }
  `,
  gql`
    type ObjectType {
      a: String!
    }
    type Test {
      a: ObjectType @amplienceDeliveryKey
    }
  `,
])(
  "Throws error: Fields with '@amplienceDeliveryKey' must be of Nullable type String",
  (testSchema) => {
    const schema = buildASTSchema(gql`
      ${print(schemaPrepend)}
      ${print(testSchema)}
    `);
    expect(() => validate(schema, [], {}, "", [])).toThrow(
      "Fields with '@amplienceDeliveryKey' must be of Nullable type String.\n\ntype Test\n\ta",
    );
  },
);
