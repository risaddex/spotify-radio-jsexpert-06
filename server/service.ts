import fs from 'fs'
import fsPromises from 'fs/promises'
import config from './config'
import path from 'path'
import streamPromises from 'stream/promises'
import { randomUUID } from 'crypto'
import { PassThrough, Readable, Writable } from 'stream'
import Throttle from 'throttle'
import childProcess from 'child_process'
import { logger } from './util'
import { once } from 'events'

const { dir: { publicDirectory }, constants: { fallbackBitRate, englishConversation, bitRateDivisor } } = config
export class Service {

  private clientStreams: Map<string, PassThrough>;
  private currentSong: string
  private currentBitRate: number
  private throttleTransform?: Throttle

  constructor() {
    this.clientStreams = new Map();
    this.currentSong = englishConversation;
    this.currentBitRate = 0

  }
  createFileStream(filename: string) {
    return fs.createReadStream(filename)
  }

  async getFileInfo(file: string) {
    const fullFilePath = path.join(publicDirectory, file)
    // validar se existe
    await fsPromises.access(fullFilePath)
    const fileType = path.extname(fullFilePath)

    return {
      type: fileType,
      name: fullFilePath
    }
  }

  async getFileStream(file: string) {
    const { name, type } = await this.getFileInfo(file)
    return {
      stream: this.createFileStream(name),
      type
    }
  }

  createClientStream() {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStreams.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  removeClientStream(clientId: string) {
    this.clientStreams.delete(clientId)
  }

  private _executeSoxCommand(args: string[]) {
    return childProcess.spawn("sox", args)
  }

  async getBitRate(song: string) {
    try {
      const args = [
        "--i", //info
        "-B", // bitrate
        song
      ]

      const {
        stderr, // all errors
        stdout, // all logs
        stdin // send stream data
      } = this._executeSoxCommand(args)

      await Promise.all([
        once(stderr, "readable"),
        once(stdout, "readable"),
      ])
      const [success, error]: Readable[] = [stdout, stderr].map(stream => stream.read())
      if (error) return await Promise.reject(error)

      return success
        .toString()
        .trim()
        .replace(/k/, "000")

    } catch (error) {
      logger.error(`Bitrate error:${error}`)
      return fallbackBitRate;
    }
  }

  broadCast() {
    return new Writable({
      write: (chunk, encoding, cb) => {
        for (const [clientId, stream] of this.clientStreams) {
          if (stream.writableEnded) {
            this.clientStreams.delete(clientId)
            continue;
          }
          stream.write(chunk)
        }
        cb()
      }
    })
  }
  async startStreaming() {
    logger.info(`starting with ${this.currentSong}`)
    const bitRate = this.currentBitRate = Number(await this.getBitRate(this.currentSong)) / bitRateDivisor;
    const throttleTransform = this.throttleTransform = new Throttle(bitRate)

    const songReadable = this.createFileStream(this.currentSong)
    return streamPromises.pipeline(
      songReadable,
      throttleTransform,
      this.broadCast()
    )
  }

  stopStreaming() {
    this.throttleTransform?.end?.()
  }

}