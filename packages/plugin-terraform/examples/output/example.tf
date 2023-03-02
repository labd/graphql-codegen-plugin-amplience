terraform {
  required_providers {
    amplience = {
      source = "labd/amplience"
    }
  }
}

data "amplience_content_repository" "website1" {
  id = var.variables["CONTENT_REPO1_ID"]
}

data "amplience_content_repository" "website2" {
  id = var.variables["CONTENT_REPO2_ID"]
}

data "amplience_content_repository" "slot1" {
  id = var.variables["SLOT_REPO1_ID"]
}

data "amplience_content_repository" "slot2" {
  id = var.variables["SLOT_REPO2_ID"]
}

resource "amplience_content_type_schema" "test" {
  body             = file("${path.module}/schemas/test.json")
  schema_id        = "https://schema-examples.com/test"
  validation_level = "CONTENT_TYPE"
  auto_sync        = true
}

resource "amplience_content_type" "test" {
  content_type_uri = amplience_content_type_schema.test.schema_id
  label            = "Test"
  status           = "ACTIVE"
}

resource "amplience_content_type_assignment" "test" {
  content_type_id = amplience_content_type.test.id
  repository_id   = data.amplience_content_repository.website1.id
}

resource "amplience_content_type_schema" "test_auto_sync_false" {
  body             = file("${path.module}/schemas/test-auto-sync-false.json")
  schema_id        = "https://schema-examples.com/test-auto-sync-false"
  validation_level = "CONTENT_TYPE"
  auto_sync        = false
}

resource "amplience_content_type" "test_auto_sync_false" {
  content_type_uri = amplience_content_type_schema.test_auto_sync_false.schema_id
  label            = "Test Auto Sync False"
  status           = "ACTIVE"
}

resource "amplience_content_type_assignment" "test_auto_sync_false" {
  content_type_id = amplience_content_type.test_auto_sync_false.id
  repository_id   = data.amplience_content_repository.website1.id
}

resource "amplience_content_type_schema" "test_auto_sync_true" {
  body             = file("${path.module}/schemas/test-auto-sync-true.json")
  schema_id        = "https://schema-examples.com/test-auto-sync-true"
  validation_level = "CONTENT_TYPE"
  auto_sync        = true
}

resource "amplience_content_type" "test_auto_sync_true" {
  content_type_uri = amplience_content_type_schema.test_auto_sync_true.schema_id
  label            = "Test Auto Sync True"
  status           = "ACTIVE"
}

resource "amplience_content_type_assignment" "test_auto_sync_true" {
  content_type_id = amplience_content_type.test_auto_sync_true.id
  repository_id   = data.amplience_content_repository.website1.id
}

resource "amplience_content_type_schema" "test_no_auto_sync" {
  body             = file("${path.module}/schemas/test-no-auto-sync.json")
  schema_id        = "https://schema-examples.com/test-no-auto-sync"
  validation_level = "CONTENT_TYPE"
  auto_sync        = true
}

resource "amplience_content_type" "test_no_auto_sync" {
  content_type_uri = amplience_content_type_schema.test_no_auto_sync.schema_id
  label            = "Test No Auto Sync"
  status           = "ACTIVE"
}

resource "amplience_content_type_assignment" "test_no_auto_sync" {
  content_type_id = amplience_content_type.test_no_auto_sync.id
  repository_id   = data.amplience_content_repository.website1.id
}

resource "amplience_content_type_schema" "test_other_repository" {
  body             = file("${path.module}/schemas/test-other-repository.json")
  schema_id        = "https://schema-examples.com/test-other-repository"
  validation_level = "CONTENT_TYPE"
  auto_sync        = true
}

resource "amplience_content_type" "test_other_repository" {
  content_type_uri = amplience_content_type_schema.test_other_repository.schema_id
  label            = "Test Other Repository"
  status           = "ACTIVE"
}

resource "amplience_content_type_assignment" "test_other_repository" {
  content_type_id = amplience_content_type.test_other_repository.id
  repository_id   = data.amplience_content_repository.website2.id
}

resource "amplience_content_type_schema" "test_slot" {
  body             = file("${path.module}/schemas/test-slot.json")
  schema_id        = "https://schema-examples.com/test-slot"
  validation_level = "SLOT"
  auto_sync        = true
}

resource "amplience_content_type" "test_slot" {
  content_type_uri = amplience_content_type_schema.test_slot.schema_id
  label            = "Test Slot"
  status           = "ACTIVE"
}

resource "amplience_content_type_assignment" "test_slot" {
  content_type_id = amplience_content_type.test_slot.id
  repository_id   = data.amplience_content_repository.slot1.id
}

resource "amplience_content_type_schema" "test_visualizations" {
  body             = file("${path.module}/schemas/test-visualizations.json")
  schema_id        = "https://schema-examples.com/test-visualizations"
  validation_level = "CONTENT_TYPE"
  auto_sync        = true
}

resource "amplience_content_type" "test_visualizations" {
  content_type_uri = amplience_content_type_schema.test_visualizations.schema_id
  label            = "Test Visualizations"
  status           = "ACTIVE"
  dynamic "visualization" {
    for_each = var.variables["VISUALIZATION_HOST"]
    content {
      label         = visualization.key
      templated_uri = "${visualization.value}/preview/with-layout?vse={{vse.domain}}&content={{content.sys.id}}"
      default       = false
    }
  }
  visualization {
    label         = "Localhost with layout"
    templated_uri = "http://localhost:3000/preview/with-layout?vse={{vse.domain}}&content={{content.sys.id}}"
    default       = false
  }
  visualization {
    label         = "Localhost without layout"
    templated_uri = "http://localhost:3000/preview/without-layout?vse={{vse.domain}}&content={{content.sys.id}}"
    default       = false
  }
}

resource "amplience_content_type_assignment" "test_visualizations" {
  content_type_id = amplience_content_type.test_visualizations.id
  repository_id   = data.amplience_content_repository.website1.id
}

