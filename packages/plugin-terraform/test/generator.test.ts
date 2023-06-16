import fs from "fs";
import { buildSchema } from "graphql";
import { addToSchema, plugin } from "../src/index";

it.each([{ graphqlFile: 'base' }])(
  'correct Terraform file for $graphqlFile WITH required_providers without property being passed on',
  async ({ graphqlFile }) => {
    const schema = buildSchema(
      addToSchema +
        fs.readFileSync(`./test/testdata/${graphqlFile}.graphql`, "utf8")
    );
    const expected = fs.readFileSync(
      `./test/testdata/expected/${graphqlFile}.tf`,
      "utf8"
    );

    const terraformResult = await plugin(schema, [], {
      hostname: "https://schema-examples.com",
      visualization: [
        {
          for_each: 'var.variables["VISUALIZATION_HOST"]',
          label: "visualization.key",
          templated_uri:
            "${visualization.value}/preview/with-layout?vse={{vse.domain}}&content={{content.sys.id}}",
          default: false,
        },
        {
          label: "Localhost with layout",
          templated_uri:
            "http://localhost:3000/preview/with-layout?vse={{vse.domain}}&content={{content.sys.id}}",
          default: false,
        },
        {
          label: "Localhost without layout",
          templated_uri:
            "http://localhost:3000/preview/without-layout?vse={{vse.domain}}&content={{content.sys.id}}",
          default: false,
        },
      ],
      content_repositories: {
        website1: 'var.variables["CONTENT_REPO1_ID"]',
        website2: 'var.variables["CONTENT_REPO2_ID"]',
      },
      slot_repositories: {
        slot1: 'var.variables["SLOT_REPO1_ID"]',
        slot2: 'var.variables["SLOT_REPO2_ID"]',
      },
    });

    // Note: the terraform generator does output the terraform code with ugly formatting.
    // Normally we can deal with this by configuring "prettier" in the codegen config.
    // But in this unittest we test the raw result.
    // Therefore the expected output is also formatted ugly.

    expect(terraformResult.toString().replace(/\r/g, "")).toEqual(
      expected.replace(/\r/g, "") + "\n"
    );
  }
)

it.each([{ graphqlFile: 'base_repo_for_each' }])(
  'creates "amplience_content_type_assignment" resources with a "for_each" for $graphqlFile in case for_each key is used',
  async ({ graphqlFile }) => {
    const schema = buildSchema(
      addToSchema +
        fs.readFileSync(`./test/testdata/${graphqlFile}.graphql`, 'utf8')
    )
    const expected = fs.readFileSync(
      `./test/testdata/expected/${graphqlFile}.tf`,
      'utf8'
    )

    const terraformResult = await plugin(schema, [], {
      hostname: 'https://schema-examples.com',
      visualization: [
        {
          for_each: 'var.variables["VISUALIZATION_HOST"]',
          label: 'visualization.key',
          templated_uri:
            '${visualization.value}/preview/with-layout?vse={{vse.domain}}&content={{content.sys.id}}',
          default: false,
        },
        {
          label: 'Localhost with layout',
          templated_uri:
            'http://localhost:3000/preview/with-layout?vse={{vse.domain}}&content={{content.sys.id}}',
          default: false,
        },
        {
          label: 'Localhost without layout',
          templated_uri:
            'http://localhost:3000/preview/without-layout?vse={{vse.domain}}&content={{content.sys.id}}',
          default: false,
        },
      ],
      content_repositories: {
        for_each: 'var.variables["CONTENT_REPO_MAP"]',
      },
      slot_repositories: {
        for_each: 'var.variables["SLOT_REPO_MAP"]',
      },
    })

    // Note: the terraform generator does output the terraform code with ugly formatting.
    // Normally we can deal with this by configuring "prettier" in the codegen config.
    // But in this unittest we test the raw result.
    // Therefore the expected output is also formatted ugly.

    expect(terraformResult.toString().replace(/\r/g, '')).toEqual(
      expected.replace(/\r/g, '') + '\n'
    )
  }
)


it.each([{ graphqlFile: 'base' }])(
  'correct Terraform file for $graphqlFile WITHOUT required_providers and property being passed on as false',
  async ({ graphqlFile }) => {
    const schema = buildSchema(
      addToSchema +
        fs.readFileSync(`./test/testdata/${graphqlFile}.graphql`, 'utf8')
    )
    const expected = fs.readFileSync(
      `./test/testdata/expected/${graphqlFile}_without_provider.tf`,
      'utf8'
    )

    const terraformResult = await plugin(schema, [], {
      hostname: 'https://schema-examples.com',
      visualization: [
        {
          for_each: 'var.variables["VISUALIZATION_HOST"]',
          label: 'visualization.key',
          templated_uri:
            '${visualization.value}/preview/with-layout?vse={{vse.domain}}&content={{content.sys.id}}',
          default: false,
        },
        {
          label: 'Localhost with layout',
          templated_uri:
            'http://localhost:3000/preview/with-layout?vse={{vse.domain}}&content={{content.sys.id}}',
          default: false,
        },
        {
          label: 'Localhost without layout',
          templated_uri:
            'http://localhost:3000/preview/without-layout?vse={{vse.domain}}&content={{content.sys.id}}',
          default: false,
        },
      ],
      content_repositories: {
        website1: 'var.variables["CONTENT_REPO1_ID"]',
        website2: 'var.variables["CONTENT_REPO2_ID"]',
      },
      slot_repositories: {
        slot1: 'var.variables["SLOT_REPO1_ID"]',
        slot2: 'var.variables["SLOT_REPO2_ID"]',
      },
      add_required_provider: false
    })

    // Note: the terraform generator does output the terraform code with ugly formatting.
    // Normally we can deal with this by configuring "prettier" in the codegen config.
    // But in this unittest we test the raw result.
    // Therefore the expected output is also formatted ugly.

    expect(terraformResult.toString().replace(/\r/g, '')).toEqual(
      expected.replace(/\r/g, '') + '\n'
    )
  }
)
