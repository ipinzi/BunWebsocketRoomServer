import server from "./core/server/server.ts";
import config from './config.json';

export const debug: boolean = process.argv.includes('--debug');

server.StartServer(config.port);

console.log(`HTTP Server: Listening on ${server.get.url}`);
if(debug) console.log(`Server is in DEBUG MODE. Logs will be more verbose.`);