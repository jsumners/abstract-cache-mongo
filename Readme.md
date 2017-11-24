# abstract-cache-mongo

This module provides a cache client that is compliant with the
[abstract-cache](https://github.com/jsumners/abstract-cache) protocol. This
client implements the `await` style of the protocol.

This module uses the native [mongodb driver](https://npm.im/mongodb).

## Example

```js
// Create a client that uses mongodb to connect to `localhost:6379`.
const client = require('abstract-cache-mongo')()

client.start()
  .then(() => client.set('foo', 'foo', 1000))
  .then(() => client.has('foo'))
  .then(console.log) // true
  .then(() => client.stop())
  .catch(console.error)
```

## Options

The client factory accepts the an object with the following properties:

+ `client`: An already connected instance of `mongodb`.
+ `segment`: A string denoting the collection to use for storage. The default
is `abstractCacheMongo`.
+ `mongo`:
  * `url`: A regular MongoDB connection URL. Should include username and
  password if authentication is needed. The default is:
  `mongodb://localhost:27017/abstractCacheMongo'.
  * `connectOptions`: Will be passed as the second parameter to
  `MongoClient.connect()`.

Notes:

1. `client` takes precedence to `mongodb`.
1. The user is responsible for opening and closing the connection.

## Tests

In order to run the tests for this project a local instance of MongoDB must
be running on port `27017`. A `docker-compose.yml` is included to facilitate
this:

```shell
$ docker-compose -d up
$ tap test/*.test.js
```

`npm test` automates the above.

## License

[MIT License](http://jsumners.mit-license.org/)
