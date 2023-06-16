# amplience-graphql-codegen-terraform

This is a plugin for GraphQL Codegen that outputs your schema to Amplience resources in Terraform.

It will look for types with an `@amplienceContentType` directive and generate Terraform resources that create Amplience Content Types.
This terraform code is dependent on the [Amplience Terraform provider](https://registry.terraform.io/providers/labd/amplience/latest).

Furthermore, this plugin requires `amplience-graphql-codegen-json` to generate the necessary JSON files the terraform code refers to.

For an example output see [the example output terraform file](examples/output/example.tf).

For more information on the Amplience Terraform provider, see the documentation on the [terraform registry](https://registry.terraform.io/providers/labd/amplience/latest/docs).

# codegen.yml

A basic example:

```yml
overwrite: true
schema: ./schema.graphql
hooks:
  afterAllFileWrite:
    - terraform fmt
generates:
  terraform/amplience_content_types.tf:
    plugins:
      - amplience-graphql-codegen-terraform
    config:
      hostname: "https://schema-examples.com"
      visualization:
        - label: Localhost with layout
          templated_uri: https://example.com/preview?vse={{vse.domain}}&content={{content.sys.id}}
          default: false
      content_repositories:
        website1: var.variables["CONTENT_REPO1_ID"] # A terraform variable.
        website2: 1234567890123456789 # A direct content repo id value.
        website3: ${WEBSITE_3} # A environment variable.
      slot_repositories:
        slot1: var.variables["SLOT_REPO1_ID"]
        slot2: var.variables["SLOT_REPO2_ID"]
      add_required_provider: true # defaulted to true, will generate required_providers block, removed otherwise
```

The `hostname` is optional and will default to `https://schema-examples.com`.
This is a prefix that is used to define the JSON schema resources and should be a URL.
The `visualization` is also optional.

The values for the `visualization`, the `content_repositories`, and the `slot_repositories` can either be a direct value,
an environment variable using the `${MY_VAR}` syntax, or a reference to a terraform variable.

# Your Graphql file

Basic example:

```graphql
type MyContentType @amplienceContentType {
    ...
}
```

By default this will generate Terraform resources for a content type named "my-content-type".
It will be assigned to the first repository (e.g. website1).

You can change the repository and its validationLevel by specifying those as arguments.
Please note that if you use a `SLOT` validation level, you should refer to one within the `slot_repositories` or otherwise it will default to the first slot repository.
You can also enable visualizations for this type by setting that argument to true.

Optionally, you can also add `@icon(url: 'some-test-url')`. This will add icon support for the Amplience content-type

Additionally, you can also add `autoSync` into the directive. This is an optional directive that accepts boolean (defaulted to `true`). This will allow `autoSync` to be in place.
**Note that this only available from Amplience Terraform Provider version >= 0.4.0**

A full example you can see below:

```graphql
type MyContentType @amplienceContentType(
    repository: "slot2", # To overwrite the default repository (first)
    kind: SLOT, # Can either be CONTENT_TYPE (default), SLOT, or HIERARCHY
    visualizations: true, # If true, it will add the visualizations defined in the codegen.yml
    icon: "http://example.com/icon.png"
    autoSync: true # Optional field, defaulted to `true` if not specified, and it will allow content-type to be sync-ed automatically
) {
    ...
}
```

Note that partials are not supported.
Instead you could just inline all the partials using `amplience-graphql-codegen-json`.
