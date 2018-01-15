'use strict'

const conflate = require('conflate')
const mongodb = require('mongodb')

function mapKey (inputKey, defaultSegment) {
  if (typeof inputKey === 'string') return {key: inputKey, segment: defaultSegment}
  return {
    key: inputKey.id,
    segment: inputKey.segment
  }
}

const proto = {
  delete: function (key) {
    const keyObj = mapKey(key, this._segment)
    return this.mongo.db
      .collection(keyObj.segment)
      .deleteOne({key: keyObj.key})
      .then((result) => {
        return result.deletedCount === 1
      })
  },

  get: function (key) {
    const keyObj = mapKey(key, this._segment)
    return this.mongo.db
      .collection(keyObj.segment)
      .findOne({key: keyObj.key})
      .then((doc) => {
        if (!doc) return null
        const now = Date.now()
        const expires = doc.payload.ttl + doc.payload.stored
        const ttl = expires - now
        if (expires < now) {
          return this.delete(key)
            .then((result) => {
              if (result === true) return null
              throw Error('abstract-cache-mongo: unknown result from delete')
            })
            .catch((err) => {
              throw err
            })
        }
        return {
          item: doc.payload.item,
          stored: doc.payload.stored,
          ttl
        }
      })
  },

  has: function (key) {
    return this.get(key)
      .then((doc) => {
        if (doc) return true
        return false
      })
      .catch((err) => {
        throw err
      })
  },

  set: function (key, value, ttl) {
    const keyObj = mapKey(key, this._segment)
    const doc = {
      key: keyObj.key,
      payload: {
        item: value,
        stored: Date.now(),
        ttl
      }
    }
    return this.mongo.db
      .collection(keyObj.segment)
      .insertOne(doc)
  },

  start: function () {
    return mongodb.MongoClient
      .connect(
        this.mongo.options.url,
        this.mongo.options.connectOptions
      )
      .then((client) => {
        this.mongo.client = client
        this.mongo.db = client.db(this.mongo.dbName)
      })
      .catch((err) => {
        throw err
      })
  },

  stop: function () {
    return this.mongo.client.close()
  }
}

const defaultOptions = {
  client: undefined,
  dbName: 'abstractCacheMongo',
  mongodb: {
    url: 'mongodb://localhost:27017/abstractCacheMongo',
    connectOptions: {}
  }
}

module.exports = function abstractCacheMongoFactory (options) {
  const opts = conflate({}, defaultOptions, options)
  const instance = Object.create(proto)

  Object.defineProperties(instance, {
    await: {
      enumerable: true,
      value: true
    },
    mongo: {
      enumerable: false,
      value: {
        client: opts.client || {},
        db: opts.client && opts.client.db(opts.dbName),
        dbName: opts.dbName,
        options: opts.mongodb,
        MongoClient: mongodb.MongoClient,
        ObjectId: mongodb.ObjectId
      }
    },
    _segment: {
      enumerable: false,
      value: opts.segment || 'abstractCacheMongo'
    }
  })
  return instance
}
