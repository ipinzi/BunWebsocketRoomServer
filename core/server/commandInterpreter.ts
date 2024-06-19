import type {ServerWebSocket} from "bun";
import {rooms, clients, type WebSocketData} from "./server.ts";
import debug from "../debug.ts";

type ServerCommand = (ws: ServerWebSocket<WebSocketData>, roomId: string, data: string) => void;

export class CommandInterpreter {
    private commands = new Map<string, ServerCommand>();
    private testBeginTime = 0;
    constructor() {
        // Load all commands here
        this.commands.set("JOIN_ROOM", this.JoinRoom);
        this.commands.set("LEAVE_ROOM", this.LeaveRoom);
        this.commands.set("BROADCAST", this.Broadcast);
        this.commands.set("BROADCAST_IN_ROOM", this.BroadcastInRoom);
        this.commands.set("SEND_TO_CONNECTION", this.SendToConnection);
        this.commands.set("BeginTest", ()=>{
            this.testBeginTime = Date.now();
            console.log("Begin Test: "+this.testBeginTime);
        })
        this.commands.set("EndTest", ()=>{
            console.log("End Test: "+Date.now());
            console.log("Time to perform requests: "+(Date.now() - this.testBeginTime));
        })
    }

    public Interpret(ws: ServerWebSocket<WebSocketData>, message: string): void {

        const { cmd, roomId, data } = JSON.parse(message);

        debug.log(`As string: ${message}, As object cmd: ${cmd}, roomId: ${roomId}, data: ${data}`);

        const command = this.commands.get(cmd);
        if (command) {
            command(ws, roomId, data);
        } else {
           // console.log(`Command ${cmd} not found`);
        }
    }

    JoinRoom(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        ws.data.roomId = roomId;
        rooms[roomId] = [...(rooms[roomId] || []), ws];
        debug.log(`Connection (ID: ${ws.data.session?.id}) joined room: ${roomId}`);
    }
    LeaveRoom(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        rooms[roomId] = (rooms[roomId] || []).filter(socket => socket !== ws);
        debug.log(`Connection (ID: ${ws.data.session?.id}) left room: ${roomId}`);
    }
    Broadcast(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(data);
            }
        });
        debug.log('Broadcast message to all connections');
    }
    BroadcastInRoom(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        (rooms[roomId] || []).forEach(socket => {
            if (socket.readyState === 1) {
                socket.send(data);
            }
        });
        debug.log(`Broadcast message in room: ${roomId} message: ${data}`);
        console.log(data.toString());
    }
    SendToConnection(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        let obj = JSON.parse(data);
        if (ws.readyState === 1) {
            obj.ws.send(data);
        }
        debug.log('Sent message to a specific connection');
    }
}