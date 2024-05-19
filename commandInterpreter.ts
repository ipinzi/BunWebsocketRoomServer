import type {ServerWebSocket} from "bun";
import {debug, rooms, server, clients, type WebSocketData} from "./index";

type ServerCommand = (ws: ServerWebSocket<WebSocketData>, roomId: string, data: string) => void;

export class CommandInterpreter {
    private commands: Map<string, ServerCommand>;
    constructor() {
        this.commands = new Map<string, ServerCommand>();

        // Load all commands here
        this.commands.set("JOIN_ROOM", this.JoinRoom);
        this.commands.set("LEAVE_ROOM", this.LeaveRoom);
        this.commands.set("BROADCAST", this.Broadcast);
        this.commands.set("BROADCAST_IN_ROOM", this.BroadcastInRoom);
        this.commands.set("SEND_TO_CONNECTION", this.SendToConnection);
    }

    public Interpret(ws: ServerWebSocket<WebSocketData>, message: string): void {

        const { cmd, roomId, data } = JSON.parse(message);

        if(debug) console.log(`As string: ${message}, As object cmd: ${cmd}, roomId: ${roomId}, data: ${data}`);

        const command = this.commands.get(cmd);
        if (command) {
            command(ws, roomId, data);
        } else {
            console.log(`Command ${cmd} not found`);
        }
    }

    JoinRoom(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        console.log('Executing JoinRoom');
        // Your command logic here
        ws.data.roomId = roomId;
        rooms[roomId] = [...(rooms[roomId] || []), ws];
        console.log(`Connection joined room: ${roomId}`);
    }
    LeaveRoom(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        rooms[roomId] = (rooms[roomId] || []).filter(socket => socket !== ws);
        console.log(`Connection left room: ${roomId}`);
    }
    Broadcast(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        clients.forEach(client => {
            if (client.readyState === 1) {
                if(debug) console.log("Broadcasting data: "+data);
                client.send(data);
            }
        });
        if(debug) console.log('Broadcast message to all connections');
    }
    BroadcastInRoom(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        (rooms[roomId] || []).forEach(socket => {
            if (socket.readyState === 1) {
                socket.send(data);
            }
        });
        if(debug)console.log(`Broadcast message in room: ${roomId} message ${data}`);
        console.log(data.toString());
    }
    SendToConnection(ws: ServerWebSocket<WebSocketData>, roomId: string, data: string): void {
        if (ws.readyState === 1) {
            ws.send(data);
        }
        if(debug) console.log('Sent message to a specific connection');
    }
}