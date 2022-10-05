// const { replace, map, equals } = require('ramda')
const {
  matcherHint,
  printReceived,
  printExpected,
} = require('jest-matcher-utils')
const { diff } = require('jest-diff')

const replaceWhitespace = (s) => s.replace(/\s+/g, ` `)

const name = `toEqualWithCompressedWhitespace`

module.exports = function (received, expected) {
  const [receivedWithCompressedWhitespace, expectedWithCompressedWhitespace] = [
    received,
    expected,
  ].map(replaceWhitespace)
  const pass =
    receivedWithCompressedWhitespace === expectedWithCompressedWhitespace
  const message = pass
    ? () =>
        `${matcherHint(`.not.${name}`)}\n\n` +
        `Uncompressed expected value:\n` +
        `  ${printExpected(expected)}\n` +
        `Expected value with compressed whitespace to not equal:\n` +
        `  ${printExpected(expectedWithCompressedWhitespace)}\n` +
        `Uncompressed received value:\n` +
        `  ${printReceived(received)}\n` +
        `Received value with compressed whitespace:\n` +
        `  ${printReceived(receivedWithCompressedWhitespace)}`
    : () => {
        const diffString = diff(
          expectedWithCompressedWhitespace,
          receivedWithCompressedWhitespace,
          {
            expand: this.expand,
          }
        )
        return (
          `${matcherHint(`.${name}`)}\n\n` +
          `Uncompressed expected value:\n` +
          `  ${printExpected(expected)}\n` +
          `Expected value with compressed whitespace to equal:\n` +
          `  ${printExpected(expectedWithCompressedWhitespace)}\n` +
          `Uncompressed received value:\n` +
          `  ${printReceived(received)}\n` +
          `Received value with compressed whitespace:\n` +
          `  ${printReceived(receivedWithCompressedWhitespace)}${
            diffString ? `\n\nDifference:\n\n${diffString}` : ``
          }`
        )
      }
  return {
    actual: received,
    expected,
    message,
    name,
    pass,
  }
}
