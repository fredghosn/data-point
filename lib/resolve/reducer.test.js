/* eslint-env jest */
'use strict'

const nock = require('nock')

const fixtureStore = require('../../test/utils/fixture-store')
const testData = require('../../test/data.json')

const AccumulatorFactory = require('../accumulator/factory')
const reducerFactory = require('../reducer/factory')
const TransformExpression = require('../transform-expression')

const resolveReducer = require('./reducer')

let store

beforeAll(() => {
  store = fixtureStore.create()
})

describe('reducer.getReducerFunction', () => {
  test('resolve to ReducerPath', () => {
    const resolver = resolveReducer.getReducerFunction(store, 'ReducerPath')
    expect(resolver).toBeInstanceOf(Function)
  })
  test('resolve to ReducerFunction', () => {
    const resolver = resolveReducer.getReducerFunction(store, 'ReducerFunction')
    expect(resolver).toBeInstanceOf(Function)
  })
  test('resolve to ReducerEntity', () => {
    const resolver = resolveReducer.getReducerFunction(store, 'ReducerEntity')
    expect(resolver).toBeInstanceOf(Function)
  })
  test('resolve to ReducerEntity', () => {
    expect(() => {
      resolveReducer.getReducerFunction(store, 'INVALID TYPE')
    }).toThrow()
  })
})

test('resolve#reducer.resolveReducer', () => {
  const accumulator = AccumulatorFactory.create({
    value: testData.a.b.c
  })

  const reducer = reducerFactory.create('test.addCollectionValues()')
  return resolveReducer
    .resolveReducer(store, accumulator, reducer)
    .then(result => {
      expect(result.value).toEqual(6)
    })
})

test('resolve#reducer.resolve - reducer empty', () => {
  const accumulator = AccumulatorFactory.create({
    value: testData.a.g
  })

  const transform = TransformExpression.create('')

  return resolveReducer
    .resolve(store, accumulator, transform)
    .then(result => expect(result.value).toEqual(testData.a.g))
})

describe('resolve#reducer.resolve - reducer transform', () => {
  test('only transform', () => {
    const accumulator = AccumulatorFactory.create({
      value: testData
    })

    const transform = TransformExpression.create('$a.g')
    return resolveReducer
      .resolve(store, accumulator, transform)
      .then(result => expect(result.value).toEqual(testData.a.g))
  })

  test('multiple transforms', () => {
    const accumulator = AccumulatorFactory.create({
      value: testData
    })

    const transform = TransformExpression.create('$a.g | $g1')

    return resolveReducer
      .resolve(store, accumulator, transform)
      .then(result => expect(result.value).toBe(1))
  })
})

describe('resolve#reducer.resolve - reducer filter', () => {
  test('only transform', () => {
    const accumulator = AccumulatorFactory.create({
      value: 'hello '
    })

    const transform = TransformExpression.create('test.addString(world)')
    return resolveReducer
      .resolve(store, accumulator, transform)
      .then(result => expect(result.value).toBe('hello world'))
  })

  test('multiple filters', () => {
    const expectedResult = {
      g1: 1,
      g2: 2
    }

    const accumulator = AccumulatorFactory.create({
      value: testData.a.g
    })

    const transform = TransformExpression.create(
      'test.passThrough() | test.addKeyValue(g2,2)'
    )

    return resolveReducer
      .resolve(store, accumulator, transform)
      .then(result => expect(result.value).toEqual(expectedResult))
  })
})

describe('resolve#reducer.resolve - reducer model', () => {
  test('simplest model', () => {
    const accumulator = AccumulatorFactory.create({
      value: testData
    })

    const transform = TransformExpression.create('hash:asIs')
    return resolveReducer
      .resolve(store, accumulator, transform)
      .then(result => expect(result.value).toEqual(testData))
  })

  test('multiple models', () => {
    const accumulator = AccumulatorFactory.create({
      value: testData
    })

    const transform = TransformExpression.create('hash:asIs | hash:a.1')

    return resolveReducer
      .resolve(store, accumulator, transform)
      .then(result => expect(result.value).toEqual(testData.a.h))
  })
})

describe('resolve#reducer.resolve - reducer source', () => {
  test('simplest source', () => {
    nock('http://remote.test')
      .get('/source1')
      .reply(200, {
        ok: true
      })

    const accumulator = AccumulatorFactory.create({
      value: testData.foo
    })

    const transform = TransformExpression.create('source:a1')
    return resolveReducer.resolve(store, accumulator, transform).then(result =>
      expect(result.value).toEqual({
        ok: true
      })
    )
  })

  test('multiple models', () => {
    nock('http://remote.test')
      .get('/source1')
      .reply(200, {
        itemPath: '/source2'
      })

    nock('http://remote.test')
      .get('/source2')
      .reply(200, {
        ok: true
      })

    const accumulator = AccumulatorFactory.create({
      value: testData
    })

    const transform = TransformExpression.create('source:a1 | source:a3')

    return resolveReducer.resolve(store, accumulator, transform).then(result =>
      expect(result.value).toEqual({
        ok: true
      })
    )
  })
})
