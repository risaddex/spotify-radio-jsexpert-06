import { Service } from "./service";

export class Controller {
  private service: Service;

  constructor() {
    this.service = new Service()
  }

  async getFileStream(filename: string) {
    return this.service.getFileStream(filename)
  }
}