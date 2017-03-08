'use strict'

const constants = require('./constants')

const SHALLOW_EQUAL = constants.SHALLOW_EQUAL
const UNEQUAL = constants.UNEQUAL

class Comparable {
  constructor (symbols, values) {
    this.symbols = symbols
    this.values = values
    this.ordered = new Array(symbols.size)
  }

  createRecursor () {
    const length = this.ordered.length
    let index = 0
    return () => {
      if (index === length) return null

      return this.values.get(this.ordered[index++])
    }
  }

  compare (expected) {
    if (this.symbols.size !== expected.symbols.size) return UNEQUAL

    let index = 0
    for (const symbol of this.symbols) {
      if (!expected.symbols.has(symbol)) return UNEQUAL

      this.ordered[index] = expected.ordered[index] = symbol
      index++
    }

    return SHALLOW_EQUAL
  }

  compareDiff (expected) {
    this.ordered = Array.from(this.symbols)

    expected.ordered = this.ordered.filter(symbol => expected.symbols.has(symbol))
    for (const symbol of expected.symbols) {
      if (!this.symbols.has(symbol)) {
        expected.ordered.push(symbol)
      }
    }

    return SHALLOW_EQUAL
  }
}
Object.defineProperty(Comparable.prototype, 'isSymbolPropertiesComparable', { value: true })
exports.Comparable = Comparable

class Collector {
  constructor (firstProperty, recursor) {
    this.symbols = new Set()
    this.values = new Map()
    this.recursor = recursor
    this.remainder = null

    this.collect(firstProperty)
  }

  collect (property) {
    const symbol = property.key.value
    this.symbols.add(symbol)
    this.values.set(symbol, property)
  }

  collectAll () {
    do {
      const next = this.recursor()
      if (next && next.isProperty) { // All properties will have symbol keys
        this.collect(next)
      } else {
        return next
      }
    } while (true)
  }

  createRecursor () {
    let done = false
    return () => {
      if (done) return null
      done = true
      return new Comparable(this.symbols, this.values)
    }
  }
}
Object.defineProperty(Collector.prototype, 'isSymbolPropertiesCollector', { value: true })
exports.Collector = Collector