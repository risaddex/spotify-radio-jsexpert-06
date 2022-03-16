import { IncomingMessage, ServerResponse } from "http"
export function handler(_req: IncomingMessage, resp: ServerResponse) {

  return resp.end('Hello World!')
}