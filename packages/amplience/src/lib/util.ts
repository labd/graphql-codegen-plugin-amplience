/*
Utility file for strings, numbers, arrays, objects etc.
Should be split up or replaced by libraries if this file becomes too big.
*/

export const isValue = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

export const maybeToNumber = (value: string | undefined) =>
  value ? Number(value) : undefined

export const ifNotEmpty = <T, S>(items: T[], callback: (items: T[]) => S) =>
  items.length ? callback(items) : undefined

export const combinations = (array: string[]): string[][] => {
  const results = [[] as string[]] as string[][]
  for (const value of array) {
    const copy = [...results]
    for (const prefix of copy) {
      results.push(prefix.concat(value))
    }
  }
  return results.filter(c => c.length).sort((a, b) => a.length - b.length)
}
