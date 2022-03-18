import { jest } from '@jest/globals';
import childProcess, { ChildProcess } from 'child_process';
import { Console } from 'console';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { PassThrough } from 'stream';
import config from "../../../server/config";
import { Service } from "../../../server/service";
import TestUtil from '../_util/testUtil';
import Throttle from 'throttle';


jest.setTimeout(10000)
const { dir: { publicDirectory }, constants: { fallbackBitRate } } = config

describe("#Service - test service implementation", () => {
  const getSpawnResponse = ({
    stdout = '',
    stderr = '',
    stdin = () => {}
  }) => ({
    stdout: TestUtil.generateReadableStream([stdout]),
    stderr: TestUtil.generateReadableStream([stderr]),
    stdin: TestUtil.generateWritableStream(stdin),
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test("#createFileStream", async () => {
    const filename = "test.mp3"
    const readableStream = TestUtil.generateReadableStream([filename])

    jest.spyOn(fs, fs.createReadStream.name as "createReadStream").mockReturnValue(readableStream)

    const service = new Service();

    const streamResult = service.createFileStream(filename)

    expect(streamResult).toStrictEqual(readableStream)
    expect(fs.createReadStream).toHaveBeenCalledWith(filename)


  })

  test("#getFileInfo", async () => {
    const filename = "test.png"
    const mockFilePath = `${publicDirectory}/${filename}`

    const service = new Service();

    jest.spyOn(fsPromises, fsPromises.access.name as "access").mockResolvedValue()

    const result = await service.getFileInfo(filename)

    const expectedResult = {
      type: ".png",
      name: mockFilePath
    }

    expect(expectedResult).toStrictEqual(result)



  })

  test("#getFileStream", async () => {
    const filename = "video.mp4"
    const readableStream = TestUtil.generateReadableStream([filename])
    const [, extension] = filename.split(".")

    const mockFilePath = `${publicDirectory}/${filename}`
    const service = new Service();
    jest.spyOn(fsPromises, fsPromises.access.name as "access").mockResolvedValue()
    jest.spyOn(path, path.extname.name as "extname").mockReturnValue(extension)
    jest.spyOn(path, path.join.name as "join").mockReturnValue(mockFilePath)


    jest.spyOn(fs, fs.createReadStream.name as "createReadStream").mockReturnValue(readableStream)

    const expectedResult = {
      stream: readableStream,
      type: extension
    }

    const streamResult = await service.getFileStream(filename)

    expect(streamResult).toStrictEqual(expectedResult)
    expect(fs.createReadStream).toHaveBeenCalledWith(mockFilePath)


  })

  test("#createClientStream", async () => {
    const service = new Service()
    const { clientStream, id } = service.createClientStream()

    const serviceClients = service['clientStreams']

    expect(serviceClients.get(id)).toStrictEqual(clientStream)

  })

  test("#removeClientStream", async () => {
    const service = new Service()
    const { id } = service.createClientStream()

    const serviceClients = service['clientStreams']
    service.removeClientStream(id)

    expect(serviceClients.get(id)).toBeUndefined()

  })

  test("#executeSoxCommand", async () => {
    jest.spyOn(childProcess, childProcess.spawn.name as "spawn").mockReturnValue({} as ChildProcess)
    const service = new Service()
    const commandArgs = ['arg1', 'arg2']
    service['_executeSoxCommand'](commandArgs)

    expect(childProcess.spawn).toHaveBeenLastCalledWith("sox", commandArgs)
  })

  test("#getBitRate success", async () => {
    const readable = TestUtil.generateReadableStream(Buffer.from("127k"))


    jest.spyOn(childProcess, "spawn").mockReturnValue({
      stdout: readable,
      stderr: readable,
      stdin: null
    } as unknown as ChildProcess)

    const service = new Service()
    const result = await service.getBitRate("song.mp3")
    const expectedResult = "127000"
    expect(result).toEqual(expectedResult)

  })

  test("#getBitRate with error fallback", async () => {
    const song = "song.mp3"
    const service = new Service()

    const spawnResponse = getSpawnResponse({
      stderr: 'error'
    })

    jest.spyOn(service, '_executeSoxCommand' as any).mockReturnValue(spawnResponse)


    const promise = service.getBitRate(song)
    const result = await promise;

    expect(result).toEqual(fallbackBitRate)
    expect(service['_executeSoxCommand']).toHaveBeenCalledWith(['--i', '-B', song])


  })

  test("#broadCast", async () => {
    const service = new Service()
    const { id, clientStream } = service.createClientStream()
    jest.spyOn(clientStream, "write").mockReturnValue(true)

    const broadCast = service.broadCast()
    const chunk = Buffer.from('abc')

    broadCast.write(chunk)
    expect(clientStream.write).toHaveBeenCalledWith(chunk)
    expect(service['clientStreams'].get(id)).toStrictEqual(clientStream)


  })

  test("#startStreaming", async () => {
    const readable = TestUtil.generateReadableStream('123')
    const writable = TestUtil.generateWritableStream()

    const mockBitRate = "80"
    const service = new Service()

    jest.spyOn(service, service.getBitRate.name as "getBitRate").mockResolvedValue(mockBitRate)
    jest.spyOn(service, service.broadCast.name as "broadCast").mockReturnValue(writable)
    jest.spyOn(service, service.createFileStream.name as "createFileStream").mockReturnValue(readable)

    expect(service['currentBitRate']).toEqual(0);
    await service.startStreaming()
    // default bitRateDivisor = 8
    expect(service['currentBitRate']).toEqual(10);



  })

  test("#stopStreaming", async () => {
    const service = new Service()
    const throttleTransform = new Throttle(service['currentBitRate'])
    service['throttleTransform'] = throttleTransform;
    jest.spyOn(throttleTransform, "end").mockReturnThis()

    service.stopStreaming()

    expect(throttleTransform.end).toBeCalled()
  })
})