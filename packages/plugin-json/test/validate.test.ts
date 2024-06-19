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

it.each([
  gql`
    type Test {
      a: String! @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type Test {
      a: Int! @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type Test {
      a: Float! @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type Test {
      a: Boolean! @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type Test {
      a: String @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type Test {
      a: Int @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type Test {
      a: Float @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type Test {
      a: Boolean @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type ObjectType {
      a: String!
    }
    type Test {
      a: [ObjectType] @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type ObjectType {
      a: String!
    }
    type Test {
      a: ObjectType! @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    type ObjectType {
      a: String!
    }
    type Test {
      a: [ObjectType!]! @amplienceExtension(name: "test-extension")
    }
  `,
  gql`
    scalar Date
    type Test {
      a: Date @amplienceExtension(name: "test-extension")
    }
  `,
])(
  "Throw error: Fields with '@amplienceExtension' must be Nullable and of an Object type defined elsewhere in the schema",
  (testSchema) => {
    const schema = buildASTSchema(gql`
      ${print(schemaPrepend)}
      ${print(testSchema)}
    `);
    expect(() => validate(schema, [], {}, "", [])).toThrow(
      "Fields with '@amplienceExtension' must be Nullable and of an Object type defined elsewhere in the schema.\n\ntype Test\n\ta",
    );
  },
);

it("Throws error: Types referenced by fields with '@amplienceExtension' must not have '@amplienceContentType' directive", () => {
  const schema = buildASTSchema(gql`
    ${print(schemaPrepend)}
    type ReferencedType @amplienceContentType {
      a: String!
    }
    type Test {
      a: ReferencedType @amplienceExtension(name: "test-extension")
    }
  `);
  expect(() => validate(schema, [], {}, "", [])).toThrow(
    "Types referenced by fields with '@amplienceExtension' must not have '@amplienceContentType' directive.\n\ntype Test\n\ta",
  );
});

it.each([
  {
    testSchema: gql`
      type Test @amplienceContentType(fieldOrder: "test ignored") {
        test: String!
        ignored: String @amplienceIgnore
      }
    `,
    errorFields: ["ignored"],
  },
  {
    testSchema: gql`
      type Test @amplienceContentType(fieldOrder: "test deliveryKey") {
        test: String!
        deliveryKey: String @amplienceDeliveryKey
      }
    `,
    errorFields: ["deliveryKey"],
  },
  {
    testSchema: gql`
      type Test @amplienceContentType(fieldOrder: "test ignored deliveryKey") {
        test: String!
        ignored: String @amplienceIgnore
        deliveryKey: String @amplienceDeliveryKey
      }
    `,
    errorFields: ["ignored", "deliveryKey"],
  },
])(
  "Throws error: @amplienceContentType fieldOrder arguments must not specify fields with @amplienceDeliveryKey or @amplienceIgnore",
  ({ testSchema, errorFields }) => {
    const schema = buildASTSchema(gql`
      ${print(schemaPrepend)}
      ${print(testSchema)}
    `);
    expect(() => validate(schema, [], {}, "", [])).toThrow(
      `@amplienceContentType fieldOrder arguments must not specify fields with @amplienceDeliveryKey or @amplienceIgnore.\n\ntype Test\n\t${errorFields.join(
        "\n\t",
      )}`,
    );
  },
);

it("Throws error: @amplienceContentType fieldOrder arguments must specify every field defined within the type", () => {
  const schema = buildASTSchema(gql`
    ${print(schemaPrepend)}
    type Test @amplienceContentType(fieldOrder: "test") {
      test: String!
      missing: String
      ignored: String @amplienceIgnore
      deliveryKey: String @amplienceDeliveryKey
    }
  `);
  expect(() => validate(schema, [], {}, "", [])).toThrow(
    `@amplienceContentType fieldOrder arguments must specify every field defined within the type.\n\ntype Test\n\tmissing`,
  );
});

it("Throws error: @amplienceContentType fieldOrder arguments must not specify fields not defined within the type", () => {
  const schema = buildASTSchema(gql`
    ${print(schemaPrepend)}
    type Test @amplienceContentType(fieldOrder: "test unknown") {
      test: String!
      ignored: String @amplienceIgnore
      deliveryKey: String @amplienceDeliveryKey
    }
  `);
  expect(() => validate(schema, [], {}, "", [])).toThrow(
    `@amplienceContentType fieldOrder arguments must not specify fields not defined within the type.\n\ntype Test\n\tunknown`,
  );
});
