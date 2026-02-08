// REMOTE.JS - Mobile Remote Control

// Connect to Socket.io server
const socket = io();

let currentRoom = null;
let currentUser = null;

const remoteRoomCode = document.getElementById('remoteRoomCode');
const remoteRoomName = document.getElementById('remoteRoomName');
const mobileSearchInput = document.getElementById('mobileSearchInput');
const mobileSearchBtn = document.getElementById('mobileSearchBtn');
const mobileSearchResults = document.getElementById('mobileSearchResults');
const mobileQueueCount = document.getElementById('mobileQueueCount');
const mobileQueueList = document.getElementById('mobileQueueList');

const joinScreen = document.getElementById('joinScreen');
const remoteControlScreen = document.getElementById('remoteControlScreen');
const joinRoomId = document.getElementById('joinRoomId');
const joinBtn = document.getElementById('joinBtn');

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get('roomId');

    // Auto-generate user if not exists
    if (!currentUser) {
        const guestNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
        currentUser = {
            userId: 'remote_' + Math.random().toString(36).substr(2, 9),
            userName: `Remote ${guestNumber}`
        };
        localStorage.setItem('karaokeUser', JSON.stringify(currentUser));
    }

    if (roomIdFromUrl) {
        // Direct link - join immediately
        connectToRoom(roomIdFromUrl);
    } else {
        // No room ID - show join screen
        showJoinScreen();
    }
});

function showJoinScreen() {
    joinScreen.style.display = 'flex';
    remoteControlScreen.style.display = 'none';
}

function showRemoteScreen() {
    joinScreen.style.display = 'none';
    remoteControlScreen.style.display = 'flex';
}

joinBtn.addEventListener('click', () => {
    const roomId = joinRoomId.value.trim();

    if (!roomId || roomId.length !== 6) {
        alert('Vui lòng nhập mã phòng 6 số');
        return;
    }

    // Auto-generate user if not exists
    if (!currentUser) {
        const guestNumber = Math.floor(Math.random() * 9000) + 1000;
        currentUser = {
            userId: 'remote_' + Math.random().toString(36).substr(2, 9),
            userName: `Remote ${guestNumber}`
        };
        localStorage.setItem('karaokeUser', JSON.stringify(currentUser));
    }

    connectToRoom(roomId);
});

function connectToRoom(roomId) {
    if (!currentUser) return;

    socket.emit('join-room', {
        roomId,
        userId: currentUser.userId,
        userName: currentUser.userName
    });
}

// SOCKET.IO EVENT HANDLERS

socket.on('room-joined', (data) => {
    currentRoom = data.room;

    remoteRoomCode.textContent = currentRoom.roomId;
    remoteRoomName.textContent = currentRoom.roomName;
    updateQueuePreview();
    showRemoteScreen();

    console.log('Remote joined room:', currentRoom);
});

socket.on('queue-updated', (data) => {
    if (currentRoom) {
        currentRoom.queue = data.queue;
        updateQueuePreview();
    }
});

window.setPriority = function (priority) {
    currentPriority = priority;

    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-priority="${priority}"]`).classList.add('active');
};

mobileSearchBtn.addEventListener('click', searchSongs);

mobileSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchSongs();
    }
});

async function searchSongs() {
    const query = mobileSearchInput.value.trim();
    const karaokeOnlyToggle = document.getElementById('karaokeOnlyToggle');
    const karaokeOnly = karaokeOnlyToggle ? karaokeOnlyToggle.checked : true;

    if (!query) {
        alert('Vui lòng nhập tên bài hát');
        return;
    }

    mobileSearchResults.innerHTML = '<p style="padding: 1rem; text-align: center;">🔍 Đang tìm kiếm...</p>';

    // Add "karaoke" to query if toggle is checked
    const searchQuery = karaokeOnly ? `${query} karaoke` : query;

    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        if (!data.success) {
            mobileSearchResults.innerHTML = '<p style="padding: 1rem; color: var(--danger);">❌ Lỗi tìm kiếm</p>';
            return;
        }

        if (data.results && data.results.length > 0) {
            mobileSearchResults.innerHTML = data.results.map(video => `
                <div class="search-result-item" style="padding: 0.75rem; margin-bottom: 0.75rem; background: var(--bg-input); border-radius: 0.5rem; display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" style="width: 60px; height: 60px; border-radius: 0.25rem; object-fit: cover;">
                    <div style="flex: 1; min-width: 0;">
                        <h4 style="font-size: 0.95rem; margin: 0 0 0.25rem 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(video.title)}</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">${escapeHtml(video.channelTitle || 'YouTube')}</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button onclick="addSongFromSearch('${video.videoId}', '${escapeHtml(video.title).replace(/'/g, "\\'")}', '${video.thumbnail}', 'normal')" 
                            class="btn btn-small btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem; white-space: nowrap;">
                            ➕ Thêm
                        </button>
                        <button onclick="addSongFromSearch('${video.videoId}', '${escapeHtml(video.title).replace(/'/g, "\\'")}', '${video.thumbnail}', 'high')" 
                            class="btn btn-small" style="padding: 0.5rem 0.75rem; font-size: 0.875rem; background: var(--warning); color: white; white-space: nowrap;">
                            ⭐ Ưu Tiên
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            // Fallback: Manual Video ID input
            const searchUrl = data.searchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

            mobileSearchResults.innerHTML = `
                <p style="padding: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
                    ⚠️ YouTube API chưa được cấu hình.<br>
                    Vui lòng tìm kiếm thủ công:
                </p>
                <div style="padding: 0 1rem 1rem 1rem;">
                    <a href="${searchUrl}" target="_blank" class="btn btn-primary" style="width: 100%; display: block; text-align: center; text-decoration: none; margin-bottom: 1rem;">
                        🔍 Mở YouTube
                    </a>
                    <div style="margin-top: 1rem;">
                        <input type="text" id="videoIdInput" placeholder="Nhập Video ID" 
                            style="width: 100%; padding: 0.75rem; background: var(--bg-input); border: 2px solid var(--primary); 
                            border-radius: 0.5rem; color: var(--text-primary); margin-bottom: 0.5rem;">
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="addSongByVideoId('normal')" class="btn btn-primary" style="flex: 1; padding: 0.75rem;">
                                ➕ Thêm Bài
                            </button>
                            <button onclick="addSongByVideoId('high')" class="btn" style="flex: 1; padding: 0.75rem; background: var(--warning); color: white;">
                                ⭐ Ưu Tiên
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        mobileSearchResults.innerHTML = '<p style="padding: 1rem; color: var(--danger);">❌ Không thể kết nối server</p>';
    }
}

window.addSongFromSearch = function (videoId, title, thumbnail, priority) {
    const song = {
        videoId: videoId,
        title: title,
        thumbnail: thumbnail,
        priority: priority // Use priority from button click
    };

    addSongToQueue(song);
    // Stay on results - no popup for faster selection
};

// Add song by Video ID (manual)
window.addSongByVideoId = function (priority) {
    const videoIdInput = document.getElementById('videoIdInput');
    const videoId = videoIdInput.value.trim();

    if (!videoId) {
        alert('Vui lòng nhập Video ID');
        return;
    }

    const song = {
        videoId: videoId,
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        priority: priority
    };

    addSongToQueue(song);

    videoIdInput.value = '';
};

function addSongToQueue(song) {
    socket.emit('add-song', {
        roomId: currentRoom.roomId,
        song: song,
        userId: currentUser.userId,
        priority: song.priority || 'normal' // Send priority to server
    });
}

function updateQueuePreview() {
    mobileQueueCount.textContent = currentRoom.queue.length;

    if (currentRoom.queue.length === 0) {
        mobileQueueList.innerHTML = '<p class="empty-queue">Chưa có bài hát</p>';
        return;
    }

    mobileQueueList.innerHTML = currentRoom.queue.map((song, index) => `
        <div style="padding: 0.75rem; background: var(--bg-input); border-radius: 0.5rem; margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem;">
                        ${index + 1}. ${escapeHtml(song.title)}
                        ${song.priority === 'high' ? ' ⭐' : ''}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                        Bởi @${escapeHtml(song.addedByName)}
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                ${index > 0 ? `
                    <button onclick="prioritizeSong(${index})" 
                        class="btn btn-small" 
                        style="flex: 1; padding: 0.5rem; font-size: 0.8rem; background: var(--warning); color: white;">
                        ⭐ Ưu Tiên
                    </button>
                ` : '<div style="flex: 1;"></div>'}
                <button onclick="removeSongRemote(${index})" 
                    class="btn btn-small btn-danger" 
                    style="flex: 1; padding: 0.5rem; font-size: 0.8rem;">
                    ❌ Xóa
                </button>
            </div>
        </div>
    `).join('');
}

window.remoteControl = function (action) {
    if (!currentRoom) return;

    switch (action) {
        case 'prev':
            socket.emit('play-prev', {
                roomId: currentRoom.roomId,
                userId: currentUser.userId
            });
            break;
        case 'play':
            socket.emit('toggle-play', {
                roomId: currentRoom.roomId,
                userId: currentUser.userId
            });
            break;
        case 'next':
            socket.emit('play-next', {
                roomId: currentRoom.roomId,
                userId: currentUser.userId
            });
            break;
    }
};

// Prioritize song (move to front of queue)
window.prioritizeSong = function (index) {
    if (index === 0) return; // Already at front

    socket.emit('prioritize-song', {
        roomId: currentRoom.roomId,
        songIndex: index,
        userId: currentUser.userId
    });
};

window.removeSongRemote = function (index) {
    socket.emit('remove-song', {
        roomId: currentRoom.roomId,
        songIndex: index,
        userId: currentUser.userId
    });
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    alert('Mất kết nối tới server. Đang thử kết nối lại...');
});

socket.on('error', (data) => {
    console.error('Socket error:', data);
    alert('Lỗi: ' + data.message);
});
