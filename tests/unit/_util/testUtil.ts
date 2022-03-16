import { IncomingMessage, ServerResponse } from 'http'
import { Readable, Writable } from 'stream'
import { jest } from '@jest/globals';
import { ReadStream } from 'fs';
export default class TestUtil {

  static generateReadableStream(...data: any[]) {
    return new Readable({
      read() {
        for (const item of data) {
          this.push(item)
        }
        this.push(null)
      }
    }) as ReadStream
  }

  static generateWritableStream(onData = (...data: any[]) => { }) {
    return new Writable({
      write(chunk, enc, cb) {
        onData(chunk)

        cb(null)
      }
    })
  }

  static defaultHandleParams() {
    const requestStream = TestUtil.generateReadableStream(['body da requisição'])
    const response = TestUtil.generateWritableStream(() => { })

    const data = {
      request: {
        ...requestStream,
        headers: {},
        method: "",
        url: ""
      },
      response: Object.assign(response, {
        writeHead: jest.fn(),
        end: jest.fn()
      })
    }

    return {
      values: () => Object.values(data) as unknown as [IncomingMessage, ServerResponse],
      ...data
    }
  }
}