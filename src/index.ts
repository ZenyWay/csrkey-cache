/**
 * Copyright 2018 Stephane M. Catala
 * @author Stephane M. Catala
 * @license Apache@2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * Limitations under the License.
 */
//
import base64 = require('base64-js')

/**
 * factory for a generic, minimal
 * Cryptographically-Secure-Random-Key (CSRK) cache.
 *
 * @export
 * @interface CsrKeyCacheFactory
 * @template V value type
 * @param {CsrKeyCacheFactoryConfig} [config]
 */
export interface CsrKeyCacheFactory {
  <V>(config?: Partial<CsrKeyCacheFactoryConfig<V>>): CsrKeyCache<V>
}

export interface CsrKeyCacheFactoryConfig<V> {
  /**
   * default: `lru-cache` module,
   * with the following defauls:
   * * `max: 1024` // max elements
   * * `maxAge: 15 * 60 * 1000 // ms`
   *
   * @type {Cache<string, V>|LruCacheOptions<V>}
   * @memberOf CsrKeyCacheFactoryConfig
   */
  cache: Cache<string, V> | LruCacheOptions<V>
  /**
   * length of generated keys.
   *
   * @type {number=32}
   * @memberOf CsrKeyCacheFactoryConfig
   */
  keylength: number
  /**
   * default: `crypto#randomBytes` from browserify's `crypto` module
   * (available as standalone module on npm: `randombytes`),
   * which wraps `window.crypto.getRandomBytes`
   * or `window.msCrypto.getRandomBytes` in the browser,
   * or `crypto.randomBytes` in node.
   *
   * @type {Csrng=crypto#randomBytes}
   * @memberOf CsrKeyCacheFactoryConfig
   */
  csrng: Csrng
}

/**
 * minimal Cryptographically-Secure-Random-Number-Generator interface.
 *
 * @export
 * @interface Csrng
 */
export interface Csrng {
  /**
   * @param {number} length
   * @returns {Uint8Array} list of `length` random bytes.
   *
   * @memberOf Csrng
   */
  (length: number): Uint8Array
}

/**
 * options for [lru-cache]{@link https://www.npmjs.com/package/lru-cache#options}
 *
 * @template V
 *
 * @export
 * @interface LruCacheOptions
 */
export interface LruCacheOptions<V> {
  /**
   * The maximum size of the cache,
   * checked by applying the length function to all values in the cache.
   * Not setting this is kind of silly,
   * since that's the whole purpose of this lib, but it defaults to Infinity.
   *
   * @type {number}
   * @memberOf LruCacheOptions
   */
  max?: number
  /**
   * Maximum age in ms.
   * Items are not pro-actively pruned out as they age,
   * but if you try to get an item that is too old,
   * it'll drop it and return `undefined` instead of giving it to you.
   *
   * @type {number}
   * @memberOf LruCacheOptions
   */
  maxAge?: number
  /**
   * Function that is used to calculate the length of stored items.
   *
   * If you're storing strings or buffers,
   * then you probably want to do something like
   * `function(n, key){return n.length}`.
   *
   * The default is `function(){return 1}`,
   * which is fine if you want to store max like-sized things.
   *
   * The item is passed as the first argument,
   * and the key is passed as the second argumnet.
   *
   * @type {(value: V)=>number}
   * @memberOf LruCacheOptions
   */
  length?: (value: V) => number
  /**
   * Function that is called on items when they are dropped from the cache.
   * This can be handy if you want to close file descriptors
   * or do other cleanup tasks when items are no longer accessible.
   *
   * Called with key, value.
   *
   * It's called before actually removing the item from the internal cache,
   * so if you want to immediately put it back in,
   * you'll have to do that in a nextTick or setTimeout callback
   * or it won't do anything.
   *
   * @type {(key:any,value:V)=>void}
   * @memberOf LruCacheOptions
   */
  dispose?: (key: any, value: V) => void
  /**
   * By default, if you set a maxAge,
   * it'll only actually pull stale items out of the cache when you get(key).
   * (That is, it's not pre-emptively doing a setTimeout or anything.)
   * * If you set `stale:true`, it'll return the stale value before deleting it.
   * * If you don't set this, then it'll return `undefined`
   * when you try to get a stale entry, as if it had already been deleted.
   *
   * @type {boolean}
   * @memberOf LruCacheOptions
   */
  stale?: boolean
}

/**
 * generic, minimal Cryptographically-Secure-Random-Key (CSRK) cache interface.
 *
 * @export
 * @interface CsrKeyCache
 * @template V value type
 */
export interface CsrKeyCache<V> {
  /**
   * store the given `val` into the cache,
   * and return the resulting secure-random-key string.
   *
   * @param {V} val
   * @param {number=Infinity} expire
   * @returns {string|false} secure random key, or false when storing fails.
   *
   * @memberOf CsrKeyCache
   */
  set (val: V, expire?: number): string | false
  /**
   * delete the cache entry under the given `key`.
   *
   * @param {string} key
   *
   * @memberOf Cache
   */
  del (key: string): void
  /**
   * retrieve the value stored in the cache
   * under the given secure random key.
   *
   * @param {string} key
   * @returns {V} value stored under the given secure random `key`.
   *
   * @memberOf CsrKeyCache
   */
  get (key: string): V
  /**
   * confirm whether a value is stored
   * under the given secure random `key`.
   *
   * @param {string} key
   * @returns {boolean} true if a value is stored
   * under the given secure random `key`.
   *
   * @memberOf CsrKeyCache
   */
  has (key: string): boolean
}

/**
 * generic, minimal cache interface.
 *
 * @export
 * @interface Cache
 * @template K key type
 * @template V value type
 */
export interface Cache<K, V> {
  /**
   * store the given `val` into the cache under the given `key`.
   *
   * @param {K} key
   * @param {V} val
   * @param {number=} expire
   *
   * @memberOf Cache
   */
  set (key: K, val: V, expire?: number): void
  /**
   * delete the cache entry under the given `key`.
   *
   * @param {string} key
   *
   * @memberOf Cache
   */
  del (key: K): void
  /**
   * retrieve the value stored in the cache
   * under the given key.
   *
   * @param {K} key
   * @returns {V} value stored under the given `key`.
   *
   * @memberOf Cache
   */
  get (key: K): V
  /**
   * confirm whether a value is stored
   * under the given `key`.
   *
   * @param {K} key
   * @returns {boolean} true if a value is stored
   * under the given `key`.
   *
   * @memberOf Cache
   */
  has (key: K): boolean
}

const SPEC_DEFAULTS = {
  keylength: 32
}

/**
 * An implementation of a {CsrKeyCache}.
 *
 * @class CsrKeyCacheClass
 * @implements {CsrKeyCache<V>}
 * @template V
 */
class CsrKeyCacheClass<V> implements CsrKeyCache<V> {
  static readonly getInstance: CsrKeyCacheFactory = function <V>(
    opts?: Partial<CsrKeyCacheFactoryConfig<V>>
  ): CsrKeyCache<V> {
    const specs = { ...SPEC_DEFAULTS, ...opts }
    const cache = isCache<string, V>(specs.cache)
    ? specs.cache
    : getLruCache<V>(specs.cache)
    const getRandomBytes: Csrng = specs.csrng || require('randombytes')

    return new CsrKeyCacheClass<V>(cache, specs.keylength, getRandomBytes)
  }

  set (val: V, expire?: number): string | false {
    const key = this.getNewKey()
    this.cache.set(key, val, expire)
    return this.cache.has(key) && key
  }

  del (key: string): void {
  	return this.cache.del(key)
  }

  get (key: string): V {
    return this.cache.get(key)
  }

  has (key: string): boolean {
    return this.cache.has(key)
  }

  constructor (
    private readonly cache: Cache<string, V>,
    private readonly keylength: number,
    private readonly getRandomBytes: Csrng
  ) {}

  /**
   *
   * @private
   *
   * @returns {string} cryptographically secure random key
   * @memberOf CsrKeyCacheClass
   */
  private getNewKey (): string {
    const rnd = this.getRandomBytes(this.keylength)
    const key = base64.fromByteArray(rnd)
    return !this.cache.has(key) ? key : this.getNewKey() // try another on collision
  }
}

function isCache <K,V> (val: any): val is Cache<K,V> {
  return !!val && [ val.set, val.get, val.del, val.has ].every(isFunction)
}

function isFunction (val: any): val is Function {
  return typeof val === 'function'
}

const LRU_CACHE_DEFAULTS: LruCacheOptions<any> = {
  max: 1024, // max elements
  maxAge: 15 * 60 * 1000 // ms
}

function getLruCache <V> (opts?: LruCacheOptions<V>): Cache<string, V> {
  const newLruCache = require('lru-cache')
  const config = { ...LRU_CACHE_DEFAULTS, ...opts }
  return newLruCache(config)
}

/**
 * factory of {CsrKeyCache} instances.
 *
 * @type {CsrKeyCacheFactory}
 */
const getCsrKeyCache: CsrKeyCacheFactory = CsrKeyCacheClass.getInstance

export default getCsrKeyCache
