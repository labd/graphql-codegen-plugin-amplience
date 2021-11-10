resource "amplience_content_type_schema" "test" {
  body             = file("${path.module}/content-type-schemas/schemas/test.json")
  schema_id        = "https://schema-examples.com/test"
  validation_level = "CONTENT_TYPE"
}

resource "amplience_content_type" "test" {
  content_type_uri = amplience_content_type_schema.test.schema_id
  label            = "Test"
  status           = "ACTIVE"
}

