import { Service } from "./service";
import { logger } from "./util";

export class Controller {
  private service: Service;

  constructor() {
    this.service = new Service()
  }

  async getFileStream(filename: string) {
    return this.service.getFileStream(filename)
  }

  async handleCommand({ command = "" }) {
    logger.info(`command received: ${command}`)
    const result = {
      result: "ok"
    }
    const cmd = command.toLowerCase()

    if (cmd.includes("start")) {
      this.service.startStreaming()
      return result
    }
    if (cmd.includes("stop")) {
      this.service.stopStreaming()
      return result
    }

    return this.service.startStreaming()
  }

  createClientStream() {
    const { clientStream, id } = this.service.createClientStream()

    const onClose = () => {
      logger.info(`closing connection of ${id}`)
      this.service.removeClientStream(id)
    }

    return {
      stream: clientStream,
      onClose
    }
  }
}