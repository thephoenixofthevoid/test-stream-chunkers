# test-stream-chunkers
Streams that split chunks randomly and then randomly join them. Uselful to test binary streams on whether they tolerate raw streams.

# Example 1 (using msgpack5)

```ts
import Duplexify from 'duplexify';
import Msgpack from "msgpack5"
import { Duplex, Transform } from 'stream';
import DuplexPair from 'native-duplexpair';
import { RandomJoiner } from '../test-stream-chunkers/src';

const pack = Msgpack()

export function upgrade(connection: Duplex) {
    var encoder = pack.encoder()
    var decoder = pack.decoder()

    const r1 = new RandomJoiner()
    const r2 = new RandomJoiner()

    encoder.pipe(r1).pipe(connection).pipe(r2).pipe(decoder)

    return Duplexify.obj(encoder, decoder)
}

const pair = new DuplexPair()

console.log(Object.keys(pair))

const s1 = upgrade(pair.socket1)
const s2 = upgrade(pair.socket2)
s2.pipe(s2)

var i = 0;

setInterval(() => {
    console.log(++i)
    s1.write({ i, hi: "dssadasd", df: [ 1, 4, 5,6, [3333]], data: new Date() })
}, 1)

pair.socket1.on("data", console.log)
s1.on("data", console.log)
```


# Example 2 (using msgpack-lite -- faster but has bugs)

```ts 
import Duplexify from 'duplexify';
import msgpack from "msgpack-lite"
import { Duplex, Transform } from 'stream';
import DuplexPair from 'native-duplexpair';

import { RandomJoiner } from "../"

export function upgrade(connection: Duplex) {


    const rnd1 = new RandomJoiner()
    const rnd2 = new RandomJoiner()

    const encode = msgpack.createEncodeStream()
    const decode = msgpack.createDecodeStream()

    // Fix https://github.com/kawanet/msgpack-lite/issues/80
    encode._transform = function(chunk, _enc, callback) {
      encode.encoder.write(chunk);
      encode.encoder.flush();
      if (callback) callback();
    };

    connection.pipe(rnd1).pipe(decode)
    encode.pipe(rnd2).pipe(connection)

    return Duplexify.obj(encode, decode)
}

const pair = new DuplexPair()

console.log(Object.keys(pair))

const s1 = upgrade(pair.socket1)
const s2 = upgrade(pair.socket2)

const tap = new Transform({ 
    objectMode: true, 
    transform(data, enc, callback) {
        console.log(data)
        callback(null, data)
    }
})

s2.pipe(tap).pipe(s2)

var i = 0;

setInterval(() => {
    console.log(++i)
    s1.write({ i, hi: "dssadasd", df: [ 1, 4, 5,6, [3333]], data: new Date() })
}, 1000)

pair.socket1.on("data", console.log)
```

would result in: 


```
516
{ i: 515,
  hi: 'dssadasd',
  df: [ 1, 4, 5, 6, [ 3333 ] ],
  data: 2019-04-21T01:05:46.024Z }
<Buffer 84 a1 69>
<Buffer cd 02>
<Buffer 03 a2 68 69>
<Buffer a8 64 73 73>
<Buffer 61 64>
<Buffer 61 73 64>
<Buffer a2 64 66>
<Buffer 95 01 04>
<Buffer 05>
<Buffer 06 91 cd 0d 05>
<Buffer a4 64 61 74 61>
<Buffer c7 09 0d>
<Buffer cb 42>
<Buffer 76 a3 d6>
<Buffer d7 a2>
<Buffer 80 00>
517
{ i: 516,
  hi: 'dssadasd',
  df: [ 1, 4, 5, 6, [ 3333 ] ],
  data: 2019-04-21T01:05:47.025Z }
<Buffer 84 a1 69>
<Buffer cd 02 04>
<Buffer a2 68 69 a8>
<Buffer 64>
<Buffer 73 73 61 64>
<Buffer 61 73 64 a2 64>
<Buffer 66 95 01>
<Buffer 04 05 06 91>
<Buffer cd 0d>
<Buffer 05>
<Buffer a4 64>
<Buffer 61 74 61 c7>
<Buffer 09 0d cb 42 76>
<Buffer a3>
<Buffer d6 d7 e1>
<Buffer 10 00>
518
{ i: 517,
  hi: 'dssadasd',
  df: [ 1, 4, 5, 6, [ 3333 ] ],
  data: 2019-04-21T01:05:48.030Z }
<Buffer 84 a1 69>
<Buffer cd 02>
<Buffer 05 a2 68 69 a8>
<Buffer 64 73>
<Buffer 73 61 64 61 73>
<Buffer 64>
<Buffer a2 64 66>
<Buffer 95 01 04 05>
<Buffer 06 91 cd 0d>
<Buffer 05 a4>
<Buffer 64 61 74 61>
<Buffer c7 09 0d cb>
<Buffer 42 76 a3 d6>
<Buffer d8>
<Buffer 1f e0 00>

```
