import server from "./core/server/server.ts";
import config from './config.json';
import debug from "./core/debug.ts";

server.StartServer(config.port);

console.log(`HTTP Server: Listening on ${server.get.url}`);
debug.log(`Server is in DEBUG MODE. Logs will be more verbose.`);