import type {ServerWebSocket} from "bun";
import config from './config.json';
import {CommandInterpreter} from "./commandInterpreter.ts";
import {SyncSession, Session} from "./session.ts";

export const debug: boolean = process.argv.includes('--debug');

export interface WebSocketData {
    session?: Session;
    isAlive?: boolean;
    roomId?: string;
}

export let rooms: { [key: string]: ServerWebSocket<WebSocketData>[] } = {};
export let clients: Set<ServerWebSocket<WebSocketData>> = new Set();
let commandInterpreter = new CommandInterpreter();

export const server = Bun.serve<WebSocketData>({
    port: config.port,
    fetch(req, server) {

        let session = SyncSession(req); // Requested path
        // Response headers - A session cookie is added to connect the client with sessions on the server.
        const headers = {"Content-Type": "text/html; charset=utf-8", "Set-Cookie": session.cookie}

        const path = new URL(req.url).pathname

        server.upgrade(req, {
            data: {
                session: session,
                isAlive: true,
            }
        });

        if(path === "/") {
            const file = Bun.file("pages/index.html");
            return new Response(file, {headers: headers, status: 200});
            //return new Response('Bun Websocket Room Server',{ headers, status: 200 });
        }else{
            return new Response('404 page not found.', {headers: headers, status: 404 });
        }
    },
    websocket: {
        async open(ws){
            clients.add(ws);
            console.log(`Websocket Server: Active at ${server.hostname}:${server.port}`);
        },
        // handler called when a message is received
        async message(ws, message) {
            console.log(`Received: ${message}`);
            commandInterpreter.Interpret(ws, message.toString());
        },
        async close(ws){
            console.log(`${ws} client disconnected`)
            clients.delete(ws)
        }
    },
});

console.log(`HTTP Server: Listening on ${server.hostname}:${server.port}`);
if(debug) console.log(`Server is in DEBUG MODE. Logs will be more verbose.`);