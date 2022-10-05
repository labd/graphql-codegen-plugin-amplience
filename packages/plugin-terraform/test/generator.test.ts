import fs from 'fs'
import { buildSchema } from 'graphql'
import { addToSchema, plugin } from '../src/index'

it.each([{ graphqlFile: 'base' }])(
  'correct JSON files for $graphql',
  ({ graphqlFile }) => {
    const schema = buildSchema(
      addToSchema +
        fs.readFileSync(`./test/testdata/${graphqlFile}.graphql`, 'utf8')
    )
    const expected = fs.readFileSync(
      `./test/testdata/expected/${graphqlFile}.tf`,
      'utf8'
    )

    const terraformResult = plugin(schema, [], {
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
    })

    // Note: the terraform generator does output the terraform code with ugly formatting.
    // Normally we can deal with this by configuring "prettier" in the codegen config.
    // But in this unittest we test the raw result.
    // Therefore the expected output is also formatted ugly.

    expect(terraformResult).toEqual(expected + '\n')
  }
)
