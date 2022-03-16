import server from "./server";

server.listen(3000)
  .on("listening", () => console.log("Server is listening on port 3000"))