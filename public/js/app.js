// ===================================
// APP.JS - Auto Join Room Logic
// ===================================

// Connect to Socket.io server
const socket = io();

// DOM Elements
const userNameInput = document.getElementById('userNameInput');
const setNameBtn = document.getElementById('setNameBtn');
const userInfo = document.getElementById('userInfo');
const mainActions = document.getElementById('mainActions');

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

// Check if user already has a name in localStorage
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('karaokeUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        currentUser = user;

        // Auto-join room
        autoJoinRoom();
    }
});

// ===================================
// USER SETUP
// ===================================

setNameBtn.addEventListener('click', () => {
    const userName = userNameInput.value.trim();

    if (!userName || userName.length < 2) {
        alert('Vui lòng nhập tên của bạn (ít nhất 2 ký tự)');
        return;
    }

    // Generate unique user ID
    currentUser.userId = generateUserId();
    currentUser.userName = userName;

    // Save to localStorage
    localStorage.setItem('karaokeUser', JSON.stringify(currentUser));

    // Auto-join room immediately
    autoJoinRoom();
});

userNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        setNameBtn.click();
    }
});

// ===================================
// AUTO JOIN ROOM
// ===================================

function generateRoomId() {
    // Generate 6-digit numeric room ID
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function autoJoinRoom() {
    // Check if user already has a room (from localStorage)
    let roomId = localStorage.getItem('currentRoomId');

    // If no saved room or want to create new, generate 6-digit ID
    if (!roomId) {
        roomId = generateRoomId();
        localStorage.setItem('currentRoomId', roomId);
    }

    showLoading('Đang tạo phòng...');
    joinRoom(roomId);
}

// Manual join (if user wants to change room)
joinRoomBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim().toUpperCase();

    if (!roomId || roomId.length < 3) {
        alert('Vui lòng nhập Room ID hợp lệ (ít nhất 3 ký tự)');
        return;
    }

    joinRoom(roomId);
});

roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinRoomBtn.click();
    }
});

// Auto-uppercase room ID input
roomIdInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

async function joinRoom(roomId) {
    showLoading('Đang tham gia phòng...');

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

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
    userInfo.style.display = 'block';
});

socket.on('error', (data) => {
    console.error('Socket error:', data);
    alert('Lỗi: ' + data.message);
});
