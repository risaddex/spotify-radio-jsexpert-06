import { IncomingMessage, ServerResponse } from "http"
import config from "./config";
import { Controller } from "./controller";
import { logger } from "./util"

const { location, pages, constants: { CONTENT_TYPE } } = config

const controller = new Controller()
async function routes(req: IncomingMessage, res: ServerResponse) {
  const { method, url } = req;

  if (method === "GET" && url === "/") {
    res.writeHead(302, {
      "Location": location.home
    })

    return res.end();
  }

  if (method === "GET" && url === "/home") {
    const { stream } = await controller.getFileStream(pages.homeHTML)

    return stream.pipe(res)
  }

  if (method === "GET" && url === "/controller") {
    const { stream } = await controller.getFileStream(pages.controllerHTML)

    return stream.pipe(res)
  }

  if (method === "GET" && url) {
    const { stream, type } = await controller.getFileStream(url)
    const contentType = CONTENT_TYPE[type];

    if (contentType) {
      res.writeHead(200, {
        "Content-Type": contentType
      })
    }

    return stream.pipe(res)
  }

  res.writeHead(404)
  return res.end()
}

function handleError(error: Error, res: ServerResponse) {
  if (error.message.includes("ENOENT")) {
    logger.warn(`asset not found ${error.stack}`)
    res.writeHead(404)
    return res.end
  }

  logger.error(`caught error on API ${error.stack}`)
  res.writeHead(500)
  return res.end();
}

export function handler(req: IncomingMessage, res: ServerResponse) {
  return routes(req, res)
    .catch(error => handleError(error, res))

}