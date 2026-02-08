require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for rooms (sẽ chuyển sang database sau)
const rooms = new Map();

// Helper function: Generate unique Room ID
function generateRoomId() {
    let roomId;
    do {
        roomId = nanoid(6).toUpperCase();
    } while (rooms.has(roomId));
    return roomId;
}

// Helper function: Create new room
function createRoom(roomName, hostId, type = 'public', roomId = null) {
    // Use provided roomId or generate new one
    if (!roomId) {
        roomId = generateRoomId();
    }

    const room = {
        roomId,
        roomName: roomName || `Phòng ${roomId}`,
        type, // 'public' or 'private'
        hostId,
        members: [],
        currentSong: null,
        queue: [],
        settings: {
            maxMembers: 50,
            allowGuestControl: true,
            requireApproval: false,
            autoDelete: true
        },
        stats: {
            totalSongsPlayed: 0,
            totalMembers: 0,
            peakMembers: 0
        },
        createdAt: Date.now(),
        lastActiveAt: Date.now()
    };

    rooms.set(roomId, room);
    return room;
}

// Helper function: Add member to room
function addMemberToRoom(roomId, userId, userName, socketId) {
    const room = rooms.get(roomId);
    if (!room) return false;

    // Check if room is full
    if (room.members.length >= room.settings.maxMembers) {
        return false;
    }

    // Check if user already in room
    const existingMember = room.members.find(m => m.userId === userId);
    if (existingMember) {
        // Update socket ID if reconnecting
        existingMember.socketId = socketId;
        existingMember.lastActiveAt = Date.now();
        return true;
    }

    // No role system - everyone is equal
    const member = {
        userId,
        userName,
        socketId,
        joinedAt: Date.now(),
        lastActiveAt: Date.now()
    };

    room.members.push(member);
    room.stats.totalMembers++;
    room.stats.peakMembers = Math.max(room.stats.peakMembers, room.members.length);
    room.lastActiveAt = Date.now();

    return true;
}

// Helper function: Remove member from room
function removeMemberFromRoom(roomId, userId) {
    const room = rooms.get(roomId);
    if (!room) return false;

    const memberIndex = room.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) return false;

    room.members.splice(memberIndex, 1);

    // Auto-delete room if empty and autoDelete is enabled
    if (room.members.length === 0 && room.settings.autoDelete) {
        rooms.delete(roomId);
    }

    return true;
}

// Helper function: Get public rooms
function getPublicRooms() {
    const publicRooms = [];
    rooms.forEach(room => {
        if (room.type === 'public') {
            publicRooms.push({
                roomId: room.roomId,
                roomName: room.roomName,
                memberCount: room.members.length,
                maxMembers: room.settings.maxMembers,
                currentSong: room.currentSong,
                createdAt: room.createdAt
            });
        }
    });
    return publicRooms.sort((a, b) => b.memberCount - a.memberCount);
}

// REST API Endpoints

// Get room details (or create if not exists)
app.get('/api/rooms/:roomId', (req, res) => {
    const { roomId } = req.params;
    let room = rooms.get(roomId);

    // Auto-create room if not exists
    if (!room) {
        room = createRoom(`Phòng ${roomId}`, 'auto', 'public', roomId);
        console.log(`🆕 Auto-created room: ${roomId}`);
    }

    res.json({ success: true, room });
});

// Search YouTube videos
app.get('/api/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ success: false, error: 'Query is required' });
    }

    try {
        // Using YouTube Data API if API key is available
        const apiKey = process.env.YOUTUBE_API_KEY;

        if (apiKey) {
            // Official YouTube API
            const fetch = (await import('node-fetch')).default;
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' karaoke')}&type=video&maxResults=10&key=${apiKey}`;

            const response = await fetch(searchUrl);
            const data = await response.json();

            if (data.items) {
                const results = data.items.map(item => ({
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    channelTitle: item.snippet.channelTitle
                }));

                return res.json({ success: true, results });
            }
        }

        // Fallback: Simple scraping approach (not recommended for production)
        // For now, return a simple search instruction
        res.json({
            success: true,
            results: [],
            message: 'YouTube API key not configured. Please search manually on YouTube and paste video ID.',
            searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' karaoke')}`
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, error: 'Search failed' });
    }
});

// Socket.io Event Handlers
io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join room
    socket.on('join-room', ({ roomId, userId, userName }) => {
        let room = rooms.get(roomId);

        // Auto-create room if not exists
        if (!room) {
            room = createRoom(`Phòng ${roomId}`, 'auto', 'public', roomId);
            console.log(`🆕 Auto-created room: ${roomId}`);
        }

        const success = addMemberToRoom(roomId, userId, userName, socket.id);

        if (!success) {
            socket.emit('error', { message: 'Cannot join room (room full or error)' });
            return;
        }

        // Join socket room
        socket.join(roomId);

        // Send room data to the user
        socket.emit('room-joined', { room });

        // Notify other members
        socket.to(roomId).emit('member-joined', {
            userId,
            userName,
            memberCount: room.members.length
        });

        console.log(`👤 ${userName} joined room ${roomId}`);
    });

    // Leave room
    socket.on('leave-room', ({ roomId, userId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const member = room.members.find(m => m.userId === userId);
        removeMemberFromRoom(roomId, userId);

        socket.leave(roomId);
        socket.to(roomId).emit('member-left', {
            userId,
            userName: member?.userName,
            memberCount: room.members.length
        });

        console.log(`👋 User ${userId} left room ${roomId}`);
    });

    // Add song to queue
    socket.on('add-song', ({ roomId, song, userId, priority }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const member = room.members.find(m => m.userId === userId);
        if (!member) return;

        const newSong = {
            ...song,
            addedBy: userId,
            addedByName: member.userName,
            addedAt: Date.now(),
            priority: priority || 'normal'
        };

        // If high priority, insert at the beginning of queue
        // Otherwise, add to the end
        if (priority === 'high') {
            room.queue.unshift(newSong); // Add to front
            console.log(`⭐ Priority song added to room ${roomId}: ${song.title}`);
        } else {
            room.queue.push(newSong); // Add to end
            console.log(`➕ Song added to room ${roomId}: ${song.title}`);
        }

        room.lastActiveAt = Date.now();

        // Broadcast updated queue
        io.to(roomId).emit('queue-updated', { queue: room.queue });
    });

    // Remove song from queue
    socket.on('remove-song', ({ roomId, songIndex, userId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const member = room.members.find(m => m.userId === userId);
        if (!member) return;

        // Anyone can remove any song
        const song = room.queue[songIndex];
        if (!song) return;

        room.queue.splice(songIndex, 1);
        room.lastActiveAt = Date.now();

        io.to(roomId).emit('queue-updated', { queue: room.queue });
    });

    // Prioritize song (move to front)
    socket.on('prioritize-song', ({ roomId, songIndex, userId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const member = room.members.find(m => m.userId === userId);
        if (!member) return;

        if (songIndex === 0 || songIndex >= room.queue.length) return;

        // Remove song from current position
        const [song] = room.queue.splice(songIndex, 1);

        // Add to front with high priority marker
        song.priority = 'high';
        room.queue.unshift(song);

        room.lastActiveAt = Date.now();

        console.log(`⭐ Song prioritized in room ${roomId}: ${song.title}`);
        io.to(roomId).emit('queue-updated', { queue: room.queue });
        io.to(roomId).emit('chat-message', {
            userId: 'system',
            userName: 'System',
            message: `⭐ "${song.title}" được ưu tiên bởi ${member.userName}`,
            timestamp: Date.now()
        });
    });

    // Play next song
    socket.on('play-next', ({ roomId, userId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const member = room.members.find(m => m.userId === userId);
        if (!member) return;

        // Anyone can play next song

        if (room.queue.length === 0) {
            room.currentSong = null;
            io.to(roomId).emit('song-changed', { song: null });
            return;
        }

        // Get next song from queue
        const nextSong = room.queue.shift();
        room.currentSong = {
            ...nextSong,
            startedAt: Date.now()
        };
        room.stats.totalSongsPlayed++;
        room.lastActiveAt = Date.now();

        // Broadcast song change
        io.to(roomId).emit('song-changed', { song: room.currentSong });
        io.to(roomId).emit('queue-updated', { queue: room.queue });

        console.log(`▶️ Playing song in room ${roomId}: ${nextSong.title}`);
    });

    // Player state sync (play/pause/seek)
    socket.on('player-state', ({ roomId, state, currentTime, userId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const member = room.members.find(m => m.userId === userId);
        if (!member) return;

        // Anyone can control player

        // Broadcast player state to all except sender
        socket.to(roomId).emit('player-state', { state, currentTime, timestamp: Date.now() });

        room.lastActiveAt = Date.now();
    });

    // Chat message
    socket.on('chat-message', ({ roomId, userId, message }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const member = room.members.find(m => m.userId === userId);
        if (!member) return;

        const chatMessage = {
            userId,
            userName: member.userName,
            message,
            timestamp: Date.now()
        };

        io.to(roomId).emit('chat-message', chatMessage);
        room.lastActiveAt = Date.now();
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);

        // Find and remove user from all rooms
        rooms.forEach((room, roomId) => {
            const member = room.members.find(m => m.socketId === socket.id);
            if (member) {
                removeMemberFromRoom(roomId, member.userId);
                io.to(roomId).emit('member-left', {
                    userId: member.userId,
                    userName: member.userName,
                    memberCount: room.members.length
                });
            }
        });
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`💡 Rooms will be auto-created when users join`);
});

// Cleanup: Remove inactive rooms every 30 minutes
setInterval(() => {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    rooms.forEach((room, roomId) => {
        if (room.settings.autoDelete &&
            room.members.length === 0 &&
            now - room.lastActiveAt > thirtyMinutes) {
            rooms.delete(roomId);
            console.log(`🗑️ Deleted inactive room: ${roomId}`);
        }
    });
}, 30 * 60 * 1000);
