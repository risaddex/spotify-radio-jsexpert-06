import fs from 'fs'
import fsPromises from 'fs/promises'
import config from './config'
import path from 'path'

const { dir: { publicDirectory } } = config
export class Service {
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
}