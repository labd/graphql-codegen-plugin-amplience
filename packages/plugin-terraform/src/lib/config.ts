export type VisualizationType = {
  /**
   * @example
   * ```yml
   * for_each: var.visualizations
   * ```
   */
  for_each?: string
  /**
   * @example
   * ```yml
   * label: Test environment
   * ```
   */
  label: string
  /**
   * @example
   * ```yml
   * templated_uri: "https://www.example.com/preview?vse={{vse.domain}}&content={{content.sys.id}}"
   * ```
   */
  templated_uri: string
  /**
   * Note: you can only have 1 marked as default, which may not also have a for_each property.
   *
   * @example
   * ```yml
   * default: true
   * ```
   */
  default?: boolean
}

export type PluginConfig = {
  /**
   * The hostname used for the Amplience JSON schema IDs.
   *
   * @default https://schema-examples.com
   */
  hostname?: string
  /**
   *
   */
  visualization?: VisualizationType[]
  /**
   * @example
   * ```yml
   * content_repositories:
   *   content_brand1: 123123
   *   content_brand2: 234234
   * ```
   */
  content_repositories?: { [name: string]: string }
  /**
   * @example
   * ```yml
   * slot_repositories:
   *   slot_brand1: 123123
   *   slot_brand2: 234234
   * ```
   */
  slot_repositories?: { [name: string]: string }
  schemaSuffix?: string
  add_required_provider?: boolean
}
