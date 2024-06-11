import { GraphQLSchema } from "graphql";
import { validate } from "../src";

it("Validates valid schema", async () => {
  const config = {
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
  };
  let e;
  try {
    await validate(new GraphQLSchema({}), [], config, "test.tf", []);
  } catch (error) {
    e = error;
  } finally {
    expect(e).toBeUndefined();
  }
});

it("throws an error in case output file is not a terraform file", async () => {
  const config = {
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
  };
  let error;
  try {
    await validate(new GraphQLSchema({}), [], config, "test.notf", []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    error = e;
  } finally {
    expect(error.message).toEqual(
      'Plugin "amplience-terraform" requires output extension to be ".tf"!',
    );
  }
});

it("throws an error in case a repository map containing a for_each key has additional key value pairs", async () => {
  const config = {
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
      for_each: 'var.variables["CONTENT_REPO_MAP"]',
      invalid: 'var.variables["CONTENT_REPO_MAP"]',
    },
    slot_repositories: {
      slot1: 'var.variables["SLOT_REPO1_ID"]',
      slot2: 'var.variables["SLOT_REPO2_ID"]',
    },
  };
  let error;

  try {
    await validate(new GraphQLSchema({}), [], config, "test.tf", []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    error = e;
  } finally {
    expect(error.message).toEqual(
      "for_each should not be used when multiple repositories are defined to prevent duplicate resources.",
    );
  }
});
it("throws an error in case output file is not a terraform file", async () => {
  const config = {
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
  };
  let error;
  try {
    await validate(new GraphQLSchema({}), [], config, "test.notf", []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    error = e;
  } finally {
    expect(error.message).toEqual(
      'Plugin "amplience-terraform" requires output extension to be ".tf"!',
    );
  }
});

it('throws an error in case you have multiple "for_each" attributes in your visualization config', async () => {
  const config = {
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
        for_each: 'var.variables["VISUALIZATION_HOST"]',
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
      for_each: 'var.variables["CONTENT_REPO_MAP"]',
    },
    slot_repositories: {
      slot1: 'var.variables["SLOT_REPO1_ID"]',
      slot2: 'var.variables["SLOT_REPO2_ID"]',
    },
  };
  let error;

  try {
    await validate(new GraphQLSchema({}), [], config, "test.tf", []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    error = e;
  } finally {
    expect(error.message).toEqual(
      "You can only have 1 item with a for_each property in your visualization list.",
    );
  }
});
