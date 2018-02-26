'use strict'

const tap = require('tap')
const test = tap.test
const abstractCache = require('abstract-cache')
const mongodb = require('mongodb')
const factory = require('../')

tap.tearDown((done) => {
  mongodb.MongoClient.connect('mongodb://localhost:27017/testing')
    .then((client) => {
      return client.db('testing').dropDatabase()
        .then(() => client.close())
        .catch((err) => {
          tap.threw(err)
        })
    })
    .catch((err) => {
      tap.threw(err)
    })
})

test('can be passed as an instance to abstract-cache', (t) => {
  t.plan(2)
  const client = factory({
    dbName: 'testing',
    mongodb: {
      url: 'mongodb://localhost:27017/testing'
    }
  })
  let cache
  client.start()
    .then(() => {
      cache = abstractCache({
        useAwait: true,
        client
      })
    })
    .then(() => cache.set('foo', 'bar', 1000))
    .then(() => cache.get('foo'))
    .then((result) => {
      t.ok(result.item)
      t.is(result.item, 'bar')
    })
    .catch(t.threw)

  t.tearDown(() => client.stop())
})

test('can be specified as a driver', (t) => {
  t.plan(2)
  const cache = abstractCache({
    useAwait: true,
    driver: {
      name: require.resolve('../'),
      options: {
        dbName: 'testing',
        mongodb: {
          url: 'mongodb://localhost:27017/testing'
        }
      }
    }
  })
  cache.start()
    .then(() => cache.set('foobar', 'baz', 1000))
    .then(() => cache.get('foobar'))
    .then((result) => {
      t.ok(result.item)
      t.is(result.item, 'baz')
    })
    .catch(t.threw)

  t.tearDown(() => cache.stop())
})
