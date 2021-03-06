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

data "amplience_slot_repository" "slot1" {
  id = var.variables["SLOT_REPO1_ID"]
}

data "amplience_slot_repository" "slot2" {
  id = var.variables["SLOT_REPO2_ID"]
}

resource "amplience_content_type_schema" "test" {
  body             = file("${path.module}/schemas/test.json")
  schema_id        = "https://schema-examples.com/test"
  validation_level = "CONTENT_TYPE"
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

resource "amplience_content_type_schema" "test_other_repository" {
  body             = file("${path.module}/schemas/test-other-repository.json")
  schema_id        = "https://schema-examples.com/test-other-repository"
  validation_level = "CONTENT_TYPE"
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
}

resource "amplience_content_type" "test_slot" {
  content_type_uri = amplience_content_type_schema.test_slot.schema_id
  label            = "Test Slot"
  status           = "ACTIVE"
}

resource "amplience_content_type_assignment" "test_slot" {
  content_type_id = amplience_content_type.test_slot.id
  repository_id   = data.amplience_slot_repository.slot1.id
}

resource "amplience_content_type_schema" "test_visualizations" {
  body             = file("${path.module}/schemas/test-visualizations.json")
  schema_id        = "https://schema-examples.com/test-visualizations"
  validation_level = "CONTENT_TYPE"
}

resource "amplience_content_type" "test_visualizations" {
  content_type_uri = amplience_content_type_schema.test_visualizations.schema_id
  label            = "Test Visualizations"
  status           = "ACTIVE"
  visualization {
    label         = "Visualization"
    templated_uri = var.variables["VISUALIZATION_HOST"]
    default       = true
  }
}

resource "amplience_content_type_assignment" "test_visualizations" {
  content_type_id = amplience_content_type.test_visualizations.id
  repository_id   = data.amplience_content_repository.website1.id
}

