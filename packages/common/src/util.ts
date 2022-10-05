/*
Utility file for strings, numbers, arrays, objects etc.
Should be split up or replaced by libraries if this file becomes too big.
*/

export const isValue = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

export const ifValue = <T, S>(value: T | undefined, ifValue: (v: T) => S) =>
  value === undefined ? undefined : ifValue(value)

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
  return results.filter((c) => c.length).sort((a, b) => a.length - b.length)
}

export type Ensure<T extends {}, K extends keyof T> = T &
  Record<K, NonNullable<T[K]>>
export const hasProperty =
  <T extends {}, K extends keyof T>(prop: K) =>
  (obj: T): obj is Ensure<T, K> =>
    Boolean(obj[prop])
