# amplience-graphql-codegen-json

This is a plugin for GraphQL codegen that generates Amplience JSON schemas from your Graphql schema.

This plugin will look for Graphql types within your schema that contain an `@amplienceContentType` directive and generate a JSON schema file for each type.

For more information on the Amplience JSON schemas see the documentation on [amplience.com](https://amplience.com/docs/integration/contenttypes.html).

## A basic example

```yml
overwrite: true
hooks:
  afterAllFileWrite:
    - prettier --write
schema: ./schema.graphql
generates:
  terraform/amplience_content_types.tf:
    preset: amplience-graphql-codegen-json
    plugins:
      - amplience-graphql-codegen-json
    config:
      hostname: https://schema-examples.com
```

The `hostname` is optional and will default to `https://schema-examples.com`.

```graphql
type MyContentType @amplienceContentType {
  """
  This a description for the "name" property.
  """
  name: String
  age: Int!
}
```

This will generate 1 json schema file named `terraform/schemas/my-content-type.json` describing the content type with 2 properties of which `age` is required.

# Fields

Besides primitive types, lists and enums, you can also use your custom types.
These custom types will be generated as inline types by default.
To create content _links_, use the `@link` directive as shown below.
Alternatively, to create content _references_, use the `@reference` directive as shown below.
Please keep in mind that linked or referenced types also need an `@amplienceContentType` directive, otherwise the linked field will link to a nonexisting content type.

Union types are always linked so no `@link` directive is necessary.

## Special Amplience Scalars

This plugin adds 2 basic Amplience Scalars that you can use:

- AmplienceImage
- AmplienceVideo

```graphql
type MyContentType @amplienceContentType {
  image: AmplienceImage!
  video: AmplienceVideo!
}
```

# Field directives

To further enhance the properties in the JSON schemas, you can add directives to the fields.

## @amplienceText

Only works on `String` types.

```graphql
type MyContentType @amplienceContentType {
  description: String!
    @amplienceText(
      minLength: 2
      maxLength: 4
      format: markdown
      examples: ["fireman", "musician"]
    )
}
```

## @amplienceNumber

Only works on `Int` and `Float` types.

```graphql
type MyContentType @amplienceContentType {
  rating: Int! @amplienceNumber(minimum: 0, maximum: 10)
}
```

## @amplienceList

Only works on list types.

```graphql
type MyContentType @amplienceContentType {
  name: [String!] @amplienceList(minItems: 1, maxItems: 10)
}
```

## @amplienceLocalized

Works on `String`, `Int`, `Float`, `Boolean`, `AmplienceImage`, and `AmplienceVideo`.

```graphql
type MyContentType @amplienceContentType {
  name: String! @amplienceLocalized
}
```

## @amplienceLink

Only works on custom types.

```graphql
type MyContentType @amplienceContentType {
  other: OtherContentType @amplienceLink
}

type OtherContentType @amplienceContentType {
  name: String!
}
```

## @amplienceReference

Only works on custom types.

```graphql
type MyContentType @amplienceContentType {
  other: OtherContentType @amplienceReference
}

type OtherContentType @amplienceContentType {
  name: String!
}
```

## @amplienceConst

Only works on `String!` and `[String!]!` types.

> Note that for a string list, you should use the `items` argument, whereas for a regular string, you should use the `item` argument.

```graphql
type MyContentType @amplienceContentType {
  constString: String @amplienceConst(item: "const")
  constArray: [String!]! @amplienceConst(items: ["this", "is", "const"])
}
```

## @amplienceDeliveryKey

Adds a delivery key field to the Content Type form. Only works on `String` types.

[See documentation](https://amplience.com/developers/docs/dev-tools/guides-tutorials/delivery-keys/#including-the-deliverykey-property-in-a-content-type-schema)

```graphql
type MyContentType @amplienceContentType {
  deliveryKey: String
    @amplienceDeliveryKey(
      # Optional field title
      # Default value: 'Delivery Key'
      title: "example title"

      # Optional field description
      # Default value: 'Set a delivery key for this content item'
      description: "Format: delivery-key/format/requirement"

      # Optional field validation pattern
      pattern: "delivery-key/format/requirement"
    )
}
```

## @amplienceExtension

Currently works ONLY on custom types (object)
[See available extensions](https://github.com/amplience/awesome-dynamic-content-extensions?tab=readme-ov-file#content-field)

```graphql
type MyContentType @amplienceContentType {
  other: OtherContentType @amplienceExtension(name: "extension-name")
}

type OtherContentType {
  name: String
}
```
