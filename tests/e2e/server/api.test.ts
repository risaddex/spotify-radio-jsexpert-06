import { jest } from '@jest/globals';
import config from '../../../server/config';
import supertest, { Request, SuperTest, Test } from 'supertest'
import portfinder from 'portfinder'
import Server from '../../../server/server';
import { Stream, Transform } from 'stream';
import { setTimeout } from 'timers/promises';
import { send } from 'process';

const RETENTION_DATA_PERIOD = 200
const getAvailablePort = portfinder.getPortPromise

describe("API e2e test suite", () => {
  const commandResponse = JSON.stringify({
    result: "ok"
  })
  const possibleCommands = {
    start: "start",
    "stop": "stop"
  }

  function pipeAndReadStreamData(stream: Request, onChunk: (chunk: any) => void) {
    const transform = new Transform({
      transform(chunk, encoding, cb) {
        onChunk(chunk)
        cb(null, chunk)
      }
    })
    return stream.pipe(transform)
  }
  describe("client workflow", () => {

    async function getTestServer() {
      const getSuperTest = (port: number) => supertest(`http://localhost:${port}`)
      const port = await getAvailablePort()
      return new Promise<{
        testServer: supertest.SuperTest<supertest.Test>;
        kill(): void;
      }>((resolve, reject) => {
        const server = Server.listen(port)
          .once("listening", () => {
            const testServer = getSuperTest(port)
            const response = {
              testServer,
              kill() {
                server.close()
              }
            }
            return resolve(response)
          }).once("error", reject)
      })
    }
    function commandSender(testServer: SuperTest<Test>) {
      return {
        async send(command: string) {
          const response = await testServer.post("/controller")
            .send({
              command
            })

          expect(response.text).toEqual(commandResponse)
        }
      }
    }

    test('it should not receive data stream if the process is not playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()
      
      pipeAndReadStreamData(
        server.testServer.get('/stream'),
        onChunk
      )
      await setTimeout(RETENTION_DATA_PERIOD)
      server.kill()
      expect(onChunk).not.toHaveBeenCalled()

    })
    test('it should receive data stream if the process is playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()
      const { send } = commandSender(server.testServer)
      pipeAndReadStreamData(
        server.testServer.get('/stream'),
        onChunk
      )
      await send(possibleCommands.start)
      await setTimeout(RETENTION_DATA_PERIOD)
      await send(possibleCommands.stop)

      const [[buffer]] = onChunk.mock.calls as [[Buffer]]
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(1000)
    

    })
  })
})