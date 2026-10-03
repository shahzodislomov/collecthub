import { Server } from "socket.io"

let io;
export function initSocket(server, corsOrigin) {
    io = new Server(server, {
        cors: {
            origin: corsOrigin,
            credentials: true
        }
    })
    io.on("connection", (socket) => {
        console.log("New client connected",socket.id)
        socket.on("join_collection", (collectionId)=>{
            socket.join(collectionId)
        })
        socket.on("disconnect",()=>{
            console.log("Client disconnected",socket.id)
        })
    })
    return io
}

export function getIO(){
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io
}