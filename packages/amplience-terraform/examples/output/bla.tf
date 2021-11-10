terraform {
  required_version = ">= 0.12"
}

resource "amplience_content_type_schema" "test" {
  validation_level = "CONTENT_TYPE"
}

