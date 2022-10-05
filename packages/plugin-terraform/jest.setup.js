const toMatchStringIgnoringWhitespace = require('./matchStringIgnoreWhiteSpace.js')

expect.extend({
  toMatchStringIgnoringWhitespace: toMatchStringIgnoringWhitespace,
})
