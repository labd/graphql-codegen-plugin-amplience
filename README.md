# GraphQL Codegen Amplience

This repository contains 2 plugins for Graphql codegen to generate Amplience JSON schemas and Terraform resources for Amplience Content Types out of a Graphql schema.

## AmplienceJSON plugin

For more details see the [JSON plugin folder](/packages/plugin-json)

## Terraform plugin

This plugin requires the JSON plugin as well.

For more details see the [Terraform plugin folder](/packages/plugin-terraform)

# Development

Assuming you have yarn installed with node 16, run:

```bash
yarn
yarn start
```

# Publish

Go to Github, click on release and give it a version number higher than the ones you can currently find in the package.json, prepended with a `v`.

For instance if `packages/common/package.json` reads `"version": "0.1.8",`, you can enter `v0.1.9`.
This will create a new npm release for all 3 packages with that name as the git tag and release name.

Note that these versions are the same among all three packages.
The version in the `package.json`s is managed by Lerna and automatically updated after you've create a release in Github.
