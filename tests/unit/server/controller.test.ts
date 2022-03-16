import { jest } from '@jest/globals';
import { Controller } from "../../../server/controller";
import { Service } from "../../../server/service";
import TestUtil from '../_util/testUtil';


describe("#Controller - test controller implementation", () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test("#getFileStream", async () => {
    const filename = "controller_test.mp3"
    const readableStream = TestUtil.generateReadableStream([filename])
    const [, extension] = filename.split(".")

    const fileStreamOutput = {
      stream: readableStream,
      type: extension
    }
    jest.spyOn(Service.prototype, Service.prototype.getFileStream.name as "getFileStream").mockResolvedValue(fileStreamOutput)

    const controller = new Controller();

    const result = await controller.getFileStream(filename)

    expect(result).toStrictEqual(fileStreamOutput)


  })

})