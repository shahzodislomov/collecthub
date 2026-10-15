import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "") : "http://localhost:5000");

let socket: Socket | null = null

export const getSocket = (): Socket => {
    if (typeof window === "undefined") {
        return io(SOCKET_URL, { autoConnect: false })
    }
    if (!socket) {
        const token = localStorage.getItem("token")
        socket = io(SOCKET_URL, {
            autoConnect: true,
            withCredentials: true,
            auth: {
                token: token ? `Bearer ${token}` : undefined
            }
        })
    }
    socket.on("connect", () => {
        console.log("connected to websocket", socket?.id)
    })
    socket.on("disconnect", () => {
        console.log("disconnected from websocket server", socket?.id);
    })
    socket.on("connect_error", (err) => {
        console.log("socket connection error", err.message);
    })
    return socket
}

export const joinCollectionRoom = (collectionId: string) => {
    const s = getSocket()
    if (s.connected) {
        s.emit("join_collection", collectionId)
    } else {
        s.once("connect", () => {
            s.emit("join_collection", collectionId)
        })
    }
}
export const leaveCollectionRoom = (collectionId: string) => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}