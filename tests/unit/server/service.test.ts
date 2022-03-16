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

  test("#createFileStream", async () => {
    const filename = "test.png"
    const [, extension] = filename.split(".")

    const mockFilePath = `${publicDirectory}/${extension}`
    
    jest.spyOn(fsPromises, fsPromises.access.name as "access").mockResolvedValue()
    jest.spyOn(path, path.extname.name as "extname").mockReturnValue(extension)
    jest.spyOn(path, path.join.name as "join").mockReturnValue(mockFilePath)
    
    const service = new Service();

    const { name, type } = await service.getFileInfo(filename)


    expect(path.extname).toHaveBeenCalledWith(mockFilePath)
    expect(name).toEqual(mockFilePath)
    expect(type).toEqual(extension)


  })
})