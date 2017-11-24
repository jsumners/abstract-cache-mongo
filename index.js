'use strict'

const mongodb = require('mongodb')

const proto = {
  delete: function (key) {
    return this.mongo.db
      .collection(this._segment)
      .deleteOne({key})
      .then((result) => {
        return result.deletedCount === 1
      })
  },

  get: function (key) {
    return this.mongo.db
      .collection(this._segment)
      .findOne({key})
      .then((doc) => {
        if (!doc) return null
        const now = Date.now()
        const expires = doc.payload.ttl + doc.payload.stored
        const ttl = expires - now
        if (ttl < 1) {
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
          item: doc.item,
          stored: doc.stored,
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
    const doc = {
      key: key,
      payload: {
        item: value,
        stored: Date.now(),
        ttl
      }
    }
    return this.mongo.db
      .collection(this._segment)
      .insertOne(doc)
  },

  start: function () {
    return mongodb.MongoClient
      .connect(
        this.mongo.options.url,
        this.mongo.options.connectOptions
      )
      .then((db) => {
        this.mongo.db = db
      })
      .catch((err) => {
        throw err
      })
  },

  stop: function () {
    return this.mongo.db.close()
  }
}

module.exports = function abstractCacheMongoFactory (options) {
  const opts = options || {
    mongodb: {
      url: 'mongodb://localhost:27017/abstractCacheMongo',
      connectOptions: {}
    }
  }
  const instance = Object.create(proto)

  Object.defineProperties(instance, {
    await: {
      enumerable: true,
      value: true
    },
    mongo: {
      enumerable: false,
      value: {
        db: opts.client || {},
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
