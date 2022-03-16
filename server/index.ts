import config from "./config";
import server from "./server";
import { logger } from './util'

server.listen(config.port)
  .on("listening", () => logger.info (`Server is listening at ${config.port}`))