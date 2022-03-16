import { IncomingMessage, ServerResponse } from "http";
import * as internal from "stream";
import config from "../../../server/config"
import { Service } from "../../../server/service";
import { handler } from "../../../server/routes"
import TestUtil from '../_util/testUtil';
import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

const { pages, location, constants: { CONTENT_TYPE }, dir: { publicDirectory } } = config

describe("#Service - test service implementation", () => {
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
      stream:readableStream,
      type: extension
    }

    const streamResult = await service.getFileStream(filename)

    expect(streamResult).toStrictEqual(expectedResult)
    expect(fs.createReadStream).toHaveBeenCalledWith(mockFilePath)


  })
})