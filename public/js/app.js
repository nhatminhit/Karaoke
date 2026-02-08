// ===================================
// APP.JS - Homepage Logic
// ===================================

// Connect to Socket.io server
const socket = io();

// DOM Elements
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomIdInput = document.getElementById('roomIdInput');
const loading = document.getElementById('loading');

// State
let currentUser = {
    userId: null,
    userName: null
};

// ===================================
// INITIALIZATION
// ===================================

window.addEventListener('DOMContentLoaded', () => {
    // Auto-generate user if not exists
    const savedUser = localStorage.getItem('karaokeUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    } else {
        // Create guest user
        const guestNumber = Math.floor(Math.random() * 9000) + 1000;
        currentUser = {
            userId: 'user_' + Math.random().toString(36).substr(2, 9),
            userName: `Guest ${guestNumber}`
        };
        localStorage.setItem('karaokeUser', JSON.stringify(currentUser));
    }
});

// ===================================
// CREATE ROOM
// ===================================

createRoomBtn.addEventListener('click', () => {
    const roomId = generateRoomId();
    showLoading('Đang tạo phòng...');
    joinRoom(roomId);
});

function generateRoomId() {
    // Generate 6-digit numeric room ID
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===================================
// JOIN ROOM
// ===================================

joinRoomBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim();

    if (!roomId || roomId.length !== 6) {
        alert('Vui lòng nhập Room ID 6 số');
        return;
    }

    showLoading('Đang tham gia phòng...');
    joinRoom(roomId);
});

roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinRoomBtn.click();
    }
});

// Only allow numbers
roomIdInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

async function joinRoom(roomId) {
    try {
        const response = await fetch(`/api/rooms/${roomId}`);
        const data = await response.json();

        if (data.success) {
            // Redirect to room (room will be auto-created if not exists)
            window.location.href = `room.html?roomId=${roomId}`;
        } else {
            alert('Không thể tham gia phòng. Vui lòng thử lại.');
            hideLoading();
        }
    } catch (error) {
        console.error('Error joining room:', error);
        alert('Không thể kết nối server. Vui lòng thử lại.');
        hideLoading();
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function showLoading(message = 'Đang tải...') {
    loading.querySelector('p').textContent = message;
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

// ===================================
// SOCKET.IO ERROR HANDLING
// ===================================

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    hideLoading();
});

socket.on('error', (data) => {
    console.error('Socket error:', data);
    alert('Lỗi: ' + data.message);
});
