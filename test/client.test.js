'use strict'

const tap = require('tap')
const test = tap.test
const mongodb = require('mongodb')
const factory = require('../')

tap.tearDown(() => {
  mongodb.MongoClient.connect('mongodb://localhost:27017/testing')
    .then((db) => {
      return db.dropDatabase()
        .then(() => db.close())
    })
    .catch((err) => {
      throw err
    })
})

test('accepts an existing client', (t) => {
  t.plan(1)
  mongodb.MongoClient.connect('mongodb://localhost:27017/testing')
    .then((db) => {
      const client = factory({client: db})
      client.set('foo', 'foo', 1000)
        .then(() => t.pass())
        .then(() => db.collection(client._segment))
        .then((col) => col.drop())
        .then(() => client.stop())
        .catch(t.threw)
    })
    .catch(t.threw)
})

test('creates a new connection', (t) => {
  t.plan(2)
  const client = factory({
    mongodb: {
      url: 'mongodb://localhost:27017/testing'
    }
  })
  t.throws(() => client.get('foo'))
  client.start()
    .then(() => client.set('foo', 'foo', 1000))
    .then(() => t.pass())
    .then(() => client.mongo.db.collection(client._segment))
    .then((col) => col.drop())
    .then(() => client.stop())
    .catch(t.threw)
})

test('returns null for missing doc', (t) => {
  t.plan(1)
  const client = factory()
  client.start()
    .then(() => client.get('foo'))
    .then((result) => t.is(result, null))
    .then(() => client.stop())
    .catch(t.threw)
})

test('purges expired items', (t) => {
  t.plan(1)
  const client = factory()
  client.start()
    .then(() => client.set('foo', 'foo', 100))
    .then(() => {
      setTimeout(() => {
        client.get('foo')
          .then((doc) => {
            t.is(doc, null)
          })
          .then(() => client.mongo.db.collection(client._segment))
          .then((col) => col.drop())
          .then(() => client.stop())
          .catch(t.threw)
      }, 150)
    })
    .catch(t.threw)
})

test('has returns false for missing item', (t) => {
  t.plan(1)
  const client = factory()
  client.start()
    .then(() => client.has('foo'))
    .then((result) => t.is(result, false))
    .then(() => client.stop())
    .catch(t.threw)
})

test('has returns true for found item', (t) => {
  t.plan(1)
  const client = factory()
  client.start()
    .then(() => client.set('foo', 'foo', 1000))
    .then(() => client.has('foo'))
    .then((result) => t.is(result, true))
    .then(() => client.mongo.db.collection(client._segment))
    .then((col) => col.drop())
    .then(() => client.stop())
    .catch(t.threw)
})

test('supports object keys', (t) => {
  t.plan(4)
  const key = {id: 'foo', segment: 'foobar'}
  const client = factory()
  client.start()
    .then(() => client.set(key, 'foo', 10000))
    .then(() => client.has(key))
    .then((result) => t.is(result, true))
    .then(() => client.get(key))
    .then((cached) => {
      t.type(cached, Object)
      t.ok(cached.item)
      t.is(cached.item, 'foo')
    })
    .then(() => client.delete(key))
    .then(() => client.stop())
    .catch(t.threw)
})
