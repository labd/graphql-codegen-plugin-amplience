# amplience-graphql-codegen-json

Plugin for GraphQL codegen that outputs your schema to Amplience JSON schemas.

This plugin will look for Graphql types within your schema that contain an `@amplience` decorator and generate a JSON schema file for each type.

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
type MyContentType @amplience {
  """
  This a description for the "name" property.
  """
  name: String
  age: Int!
}
```

This will generate 1 json schema file called `terraform/schemas/my-content-type.json` describing the content type with 2 properties of which `age` is required.


# Fields

Besides primitive types, lists and enums, you can also use your custom types.
These custom types will generated as inline types by default.
To create content _links_, use the `@link` directive as shown below.
Alternatively, to create content _references_, use the `@reference` directive as shown below.
Please keep in mind that linked or referenced types also need an `@amplience` directive, otherwise the linked field will link to an nonexisting content type.

Union types are always linked so no `@link` directive necessary.

## Special Amplience Scalars

This plugin adds 2 basic Amplience Scalars that you can use:

- AmplienceImage
- AmplienceVideo

```graphql
type MyContentType @amplience {
  image: AmplienceImage!
  video: AmplienceVideo!
}
```


# Field directives

To further enhance the properties in the JSON schemas, you can add directives to the fields.

## @text

Only works on `String` types.

```graphql
type MyContentType @amplience {
  description: String!
    @text(minLength: 2, maxLength: 4, format: markdown)
}
```

## @number

Only works on `Int` and `Float` types.


```graphql
type MyContentType @amplience {
  rating: Int!
    @number(minimum: 0, maximum: 10)
}
```

## @list

Only works on list types.

```graphql
type MyContentType @amplience {
  name: [String!] @list(minItems: 1, maxItems: 10)
}
```

## @localized

Works on `String`, `Int`, `Float`, `Boolean`, `AmplienceImage`, and `AmplienceVideo`.

```graphql
type MyContentType @amplience {
  name: String! @localized
}
```

## @link

Only works on custom types.


```graphql
type MyContentType @amplience {
  other: OtherContentType @link
}

type OtherContentType @amplience {
  name: String!
}
```

## @reference

Only works on custom types.

```graphql
type MyContentType @amplience {
  other: OtherContentType @reference
}

type OtherContentType @amplience {
  name: String!
}
```

## @const

Only works on `String!` and `[String!]!` types.

> Note that for a string list, you should use the `items` argument, whereas for a regular string, you should use the `item` argument.

```graphql
type MyContentType @amplience {
  constString: String @const(item: "const")
  constArray: [String!]! @const(items: ["this", "is", "const"])
}
```

## @example

Only works on `String`.

```graphql
type MyContentType @amplience {
  occupation: String!
   @example(items: ["fireman", "musician"])
}
```