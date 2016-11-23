# csrkey-cache [![Join the chat at https://gitter.im/ZenyWay/csrkey-cache](https://badges.gitter.im/ZenyWay/csrkey-cache.svg)](https://gitter.im/ZenyWay/csrkey-cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![NPM](https://nodei.co/npm/csrkey-cache.png?compact=true)](https://nodei.co/npm/csrkey-cache/)
[![build status](https://travis-ci.org/ZenyWay/csrkey-cache.svg?branch=master)](https://travis-ci.org/ZenyWay/csrkey-cache)
[![coverage status](https://coveralls.io/repos/github/ZenyWay/csrkey-cache/badge.svg?branch=master)](https://coveralls.io/github/ZenyWay/csrkey-cache)
[![Dependency Status](https://gemnasium.com/badges/github.com/ZenyWay/csrkey-cache.svg)](https://gemnasium.com/github.com/ZenyWay/csrkey-cache)

a cache wrapper that generates its own cryptographically secure random keys.

by default, this module wraps [`lru-cache`](https://www.npmjs.com/package/lru-cache),
defined as a [peer dependency](https://docs.npmjs.com/files/package.json#peerdependencies).

# <a name="example"></a> EXAMPLE
```javascript
import getCache from 'csrkey-cache'
const cache = getCache() // use lru-cache with { max: 1024, maxAge: 15 * 60 * 1000 } defaults

const key = cache.set('Rob says wow!')
cache.has(key) // true
cache.get(key) // 'Rob says wow!'
cache.del(key)
cache.has(key) // false
```

# <a name="api"></a> API
run the [unit tests](https://cdn.rawgit.com/ZenyWay/csrkey-cache/v1.1.0/spec/web/index.html)
in your browser.

note that [`lru-cache`](https://www.npmjs.com/package/lru-cache)
is the cache wrapped by default.
it is defined as a
[peer dependency](https://docs.npmjs.com/files/package.json#peerdependencies)
and should hence be explicitely added as a dependency in client modules
relying on the default cache.

# <a name="contributing"></a> CONTRIBUTING
see the [contribution guidelines](./CONTRIBUTING.md)

# <a name="license"></a> LICENSE
Copyright 2016 Stéphane M. Catala

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the [License](./LICENSE) for the specific language governing permissions and
Limitations under the License.
