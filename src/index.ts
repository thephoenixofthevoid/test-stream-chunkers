import { Duplex, Transform } from 'stream';

/**
 * Randomly chunks the stream for testing purposes
 */
export class RandomChunkerTransformer extends Transform {

    temp = []

    _transform(data, enc, cb) {
        this.temp.push(...data.values());

        const length = Math.floor(this.temp.length * Math.random())
        this.push(Buffer.from(this.temp.slice(0, length)))
        this.temp = this.temp.slice(length);

        cb()
    }


}

/**
 * Randomly chunks the stream for testing purposes
 */
export class RandomJoiner extends Duplex {

    temp = []

    _step() {
        const length = Math.min(Math.round(5 * Math.random()), this.temp.length)
        const chunk = Buffer.from(this.temp.slice(0, length))
        this.temp = this.temp.slice(length);
        return this.push(chunk)
    }

    _write(data, enc, cb) {
        this.temp.push(...data.values());
        while (this.temp.length > 20 && this._step()) {};
        cb()
    }

    _read() {
        while (this.temp.length && this._step()) {};
    }


}
