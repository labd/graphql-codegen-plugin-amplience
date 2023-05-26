# GraphQL Codegen Amplience

This repository contains 2 plugins for Graphql codegen to generate Amplience JSON schemas and Terraform resources for Amplience Content Types out of a Graphql schema.

## AmplienceJSON plugin

For more details see the [JSON plugin folder](/packages/plugin-json)

## Terraform plugin

This plugin requires the JSON plugin as well.

For more details see the [Terraform plugin folder](/packages/plugin-terraform)

# Development

Assuming you have pnpm installed with node 18, run:

```bash
pnpm install
pnpm start
```

# Publish

Publishing is automatically done when merging a pull request to main.
