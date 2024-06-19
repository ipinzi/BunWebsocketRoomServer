import type {ServerWebSocket} from "bun";
import {CommandInterpreter} from "./commandInterpreter.ts";
import {SyncSession, Session} from "./session.ts";
import debug from "../debug.ts";

export interface WebSocketData {
    session?: Session;
    isAlive?: boolean;
    roomId?: string;
}

export const rooms: { [key: string]: ServerWebSocket<WebSocketData>[] } = {};
export const clients: Set<ServerWebSocket<WebSocketData>> = new Set();

const commandInterpreter = new CommandInterpreter();

class Server{

    public get: any;

    StartServer(port: number){

        this.get =  Bun.serve<WebSocketData>({

            port: port,
            fetch(req, server) {

                let session = SyncSession(req);
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
                }else if(path === "/sockettest"){
                    const file = Bun.file("pages/sockettest.html");
                    return new Response(file, {headers: headers, status: 200});
                }else{
                    return new Response('404 page not found.', {headers: headers, status: 404 });
                }
            },

            websocket: {
                async open(ws){
                    clients.add(ws);
                    debug.log(`Client connected (ID: ${ws.data.session?.id})`);
                },
                // handler called when a message is received
                async message(ws, message) {
                    debug.log(`Received: ${message}`);
                    commandInterpreter.Interpret(ws, message.toString());
                },
                async close(ws){
                    debug.log(`Client disconnected (ID: ${ws.data.session?.id})`)
                    commandInterpreter.LeaveRoom(ws, ws.data.roomId as string, "");
                    clients.delete(ws)
                }
            },
        });
    }
}
export const server = new Server();

export default server;