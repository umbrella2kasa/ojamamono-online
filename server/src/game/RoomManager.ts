import { Room } from './Room';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();

    constructor() { }

    createRoom(): Room {
        const roomId = Math.floor(1000 + Math.random() * 9000).toString(); // 4桁の数字
        const room = new Room(roomId);
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    deleteRoom(roomId: string) {
        this.rooms.delete(roomId);
    }
}
