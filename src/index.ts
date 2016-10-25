/*
 * Copyright 2016 Stephane M. Catala
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
;
import * as LRU from 'lru-cache'
const Buffer = require('buffer').Buffer // incomplete type definitions
import { __assign as assign } from 'tslib'

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
  <V>(config?: CsrKeyCacheFactoryConfig<V>): CsrKeyCache<V>
}

export interface CsrKeyCacheFactoryConfig<V> {
  /**
   * default: `lru-cache` module,
   * with the following defauls:
   * * `max: 1024` // max elements
   * * `maxAge: 15 * 60 * 1000 // ms`
   *
   * @type {Cache<string, V>|LRU.Options<V>}
   * @memberOf CsrKeyCacheFactoryConfig
   */
  cache?: Cache<string, V>|LRU.Options<V>
  /**
   * length of generated keys.
   *
   * @type {number=32}
   * @memberOf CsrKeyCacheFactoryConfig
   */
  keylength?: number
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
  csrng?: Csrng
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
  set (val: V, expire?: number): string|false
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

const configDefaults = {
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
  static readonly getInstance: CsrKeyCacheFactory =
  function <V>(config?: CsrKeyCacheFactoryConfig<V>): CsrKeyCache<V> {
    const opts = assign({}, configDefaults, config)
    let cache: Cache<string, V>
    = isCache(opts.cache) ? opts.cache : getLruCache<V>(opts.cache)
    let getRandomBytes: Csrng = opts.csrng || require('crypto').randomBytes

    return new CsrKeyCacheClass<V>(cache, opts.keylength, getRandomBytes)
  }

  set (val: V, expire?: number): string|false {
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
    const key = Buffer.from(rnd).toString('base64')
    return !this.cache.has(key) ? key : this.getNewKey() // try another on collision
  }
}

function isCache <K,V>(val: any): val is Cache<K,V> {
  return !!val && [ val.set, val.get, val.del, val.has ].every(isFunction)
}

function isFunction (val: any): val is Function {
  return typeof val === 'function'
}

const lruDefaults: LRU.Options<any> = {
  max: 1024, // max elements
  maxAge: 15 * 60 * 1000 // ms
}

function getLruCache <V>(opts?: LRU.Options<V>): Cache<string, V> {
  return LRU<V>(assign(lruDefaults, opts))
}

/**
 * factory of {CsrKeyCache} instances.
 *
 * @type {CsrKeyCacheFactory}
 */
const getCsrKeyCache: CsrKeyCacheFactory = CsrKeyCacheClass.getInstance

export default getCsrKeyCache