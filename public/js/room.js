// ROOM.JS - Room/Karaoke Logic

// Connect to Socket.io server
const socket = io();

let player;
let playerReady = false;

let currentRoom = null;
let currentUser = null;

const roomNameEl = document.getElementById('roomName');
const roomIdDisplay = document.getElementById('roomIdDisplay');
const memberCount = document.getElementById('memberCount');
const membersCount = document.getElementById('membersCount');
const membersList = document.getElementById('membersList');

const shareBtn = document.getElementById('shareBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const openRemoteBtn = document.getElementById('openRemoteBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const shareModal = document.getElementById('shareModal');
const closeShareModal = document.getElementById('closeShareModal');
const shareRoomId = document.getElementById('shareRoomId');
const shareLink = document.getElementById('shareLink');
const copyIdBtn = document.getElementById('copyIdBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');

const queueList = document.getElementById('queueList');
const queueCount = document.getElementById('queueCount');

const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');

const nowPlaying = document.getElementById('nowPlaying');
const currentThumbnail = document.getElementById('currentThumbnail');
const currentTitle = document.getElementById('currentTitle');
const currentAddedBy = document.getElementById('currentAddedBy');
const noSong = document.getElementById('noSong');

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

const upcomingMarquee = document.getElementById('upcomingMarquee');
const marqueeContent = document.getElementById('marqueeContent');
let marqueeInterval;

window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');

    if (!roomId) {
        alert('Room ID không hợp lệ');
        window.location.href = 'index.html';
        return;
    }

    const savedUser = localStorage.getItem('karaokeUser');
    if (!savedUser) {
        alert('Vui lòng nhập tên trước khi tham gia phòng');
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(savedUser);

    // Join room via Socket.io
    socket.emit('join-room', {
        roomId,
        userId: currentUser.userId,
        userName: currentUser.userName
    });

    // Cinema Mode: Auto-dim UI when idle
    let idleTimer;
    const body = document.body;

    function resetIdleTimer() {
        body.classList.remove('cinema-dim');
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            if (currentRoom && currentRoom.currentSong) {
                body.classList.add('cinema-dim');
            }
        }, 5000); // Dim after 5 seconds of idle
    }

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    resetIdleTimer();

    generateQRCode(roomId);
});

function generateQRCode(roomId) {
    const qrCodeCanvas = document.getElementById('qrCodeCanvas');

    if (!qrCodeCanvas) {
        console.error('QR Code canvas element not found');
        return;
    }

    qrCodeCanvas.innerHTML = '';

    const remoteUrl = `${window.location.origin}/remote.html?roomId=${roomId}`;

    try {
        // Create QR code using QRCode.js library
        new QRCode(qrCodeCanvas, {
            text: remoteUrl,
            width: 80,
            height: 80,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        console.log('✅ QR Code generated for:', remoteUrl);
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
        qrCodeCanvas.innerHTML = '<p style="color: red; font-size: 0.8rem;">Lỗi tạo QR</p>';
    }
}


window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            controls: 1,

            rel: 0,                    // Don't show related videos at end
            modestbranding: 1,         // Minimal YouTube branding
            enablejsapi: 1,            // Enable JavaScript API

            // Quality & Display
            iv_load_policy: 3,         // Hide video annotations
            fs: 1,                     // Enable fullscreen button
            playsinline: 1,            // Play inline on mobile

            disablekb: 0,              // Enable keyboard controls
            cc_load_policy: 0,         // Don't show captions by default
            origin: window.location.origin  // Security - specify origin
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
        }
    });
};

function onPlayerReady(event) {
    playerReady = true;
    console.log('✅ YouTube player ready');

    // Don't set quality here - wait until a video is actually loaded
    // This prevents the "Playback ID" error when no video is loaded yet

    // If there's a current song waiting, play it now
    if (currentRoom && currentRoom.currentSong) {
        console.log('Playing waiting song:', currentRoom.currentSong.title);
        playSong(currentRoom.currentSong);
    }
}

function onPlayerStateChange(event) {
    // YT.PlayerState.ENDED = 0
    if (event.data === YT.PlayerState.ENDED) {
        socket.emit('play-next', {
            roomId: currentRoom.roomId,
            userId: currentUser.userId
        });
    }

    // Update play/pause button
    if (event.data === YT.PlayerState.PLAYING) {
        playPauseBtn.textContent = '⏸️';
        document.body.classList.add('song-is-playing'); // Hide UI while playing
        console.log('✅ Video is now playing');
        hideAutoplayPrompt(); // Hide the prompt when video starts
    } else {
        playPauseBtn.textContent = '▶️';
        document.body.classList.remove('song-is-playing'); // Show UI when paused/stopped
    }

    // If video is paused/cued and we have a current song, show hint
    if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
        if (currentRoom && currentRoom.currentSong) {
            console.log('💡 Video paused. Click play button to start.');
        }
    }
}

function onPlayerError(event) {
    console.error('YouTube player error:', event.data);

    // Error codes:
    // 2 – Invalid video ID
    // 5 – HTML5 player error
    // 100 – Video not found or private
    // 101, 150 – Video not allowed to be played in embedded players

    const errorMessages = {
        2: 'Video ID không hợp lệ',
        5: 'Lỗi player',
        100: 'Video không tìm thấy hoặc đã bị xóa',
        101: 'Video không cho phép phát nhúng',
        150: 'Video không cho phép phát nhúng'
    };

    const errorMsg = errorMessages[event.data] || 'Lỗi không xác định';
    addChatMessage('system', `❌ Lỗi phát video: ${errorMsg}. Tự động bỏ qua...`);

    setTimeout(() => {
        socket.emit('play-next', {
            roomId: currentRoom.roomId,
            userId: currentUser.userId
        });
    }, 2000);
}

// SOCKET.IO EVENT HANDLERS

socket.on('room-joined', (data) => {
    currentRoom = data.room;

    updateRoomInfo();
    updateQueue();
    updateMembers();

    console.log('Joined room:', currentRoom);
});

socket.on('member-joined', (data) => {
    addChatMessage('system', `${data.userName} đã tham gia phòng`);
    memberCount.textContent = data.memberCount;
    membersCount.textContent = data.memberCount;
});

socket.on('member-left', (data) => {
    addChatMessage('system', `${data.userName} đã rời phòng`);
    memberCount.textContent = data.memberCount;
    membersCount.textContent = data.memberCount;
});

socket.on('queue-updated', (data) => {
    const wasEmpty = currentRoom.queue.length === 0;
    const hadNoCurrentSong = !currentRoom.currentSong;
    currentRoom.queue = data.queue;
    updateQueue();

    // Auto-play first song if:
    // 1. Queue was empty before AND now has songs
    // 2. OR no song is currently playing AND queue has songs
    if ((wasEmpty && data.queue.length > 0 && hadNoCurrentSong) ||
        (hadNoCurrentSong && data.queue.length > 0)) {
        console.log('🎵 Auto-playing first song from queue');
        setTimeout(() => {
            socket.emit('play-next', {
                roomId: currentRoom.roomId,
                userId: currentUser.userId
            });
        }, 500);
    }
});

socket.on('song-changed', (data) => {
    console.log('🎵 Song changed event:', data.song?.title || 'No song');
    if (data.song) {
        playSong(data.song);
    } else {
        noSong.style.display = 'flex';
        nowPlaying.style.display = 'none';
    }
});

// Remote toggle play/pause
socket.on('remote-toggle-play', (data) => {
    console.log(`⏯️ Remote control: ${data.userName} toggled play/pause`);
    if (!playerReady) return;

    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
    addChatMessage('system', `${data.userName} đã ${state === YT.PlayerState.PLAYING ? 'tạm dừng' : 'phát'} video`);
});

// Restart song (from prev button)
socket.on('restart-song', (data) => {
    console.log(`⏮️ Restart song: ${data.song.title}`);
    if (!playerReady) return;

    player.seekTo(0);
    player.playVideo();

    addChatMessage('system', `${data.userName} đã restart bài hát`);
});

socket.on('player-state', (data) => {
    if (!playerReady) return;

    if (data.state === 'play') {
        player.playVideo();
        if (data.currentTime !== undefined) {
            player.seekTo(data.currentTime, true);
        }
    } else if (data.state === 'pause') {
        player.pauseVideo();
    }
});

socket.on('chat-message', (data) => {
    addChatMessage(data.userName, data.message);
});

socket.on('error', (data) => {
    alert('Lỗi: ' + data.message);
});

leaveRoomBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn rời phòng?')) {
        socket.emit('leave-room', {
            roomId: currentRoom.roomId,
            userId: currentUser.userId
        });
        window.location.href = 'index.html';
    }
});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            fullscreenBtn.innerHTML = '🖥️ Thoát Fullscreen';
            console.log('✅ Entered fullscreen mode');
        }).catch(err => {
            console.error('Error entering fullscreen:', err);
            alert('Không thể vào chế độ fullscreen');
        });
    } else {
        document.exitFullscreen().then(() => {
            fullscreenBtn.innerHTML = '🖥️ Fullscreen';
            console.log('✅ Exited fullscreen mode');
        }).catch(err => {
            console.error('Error exiting fullscreen:', err);
        });
    }
});

// Listen for fullscreen changes (e.g., user presses ESC)
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        fullscreenBtn.innerHTML = '🖥️ Fullscreen';
    } else {
        fullscreenBtn.innerHTML = '🖥️ Thoát Fullscreen';
    }
});

shareBtn.addEventListener('click', () => {
    shareRoomId.textContent = currentRoom.roomId;
    shareLink.value = `${window.location.origin}/room.html?roomId=${currentRoom.roomId}`;
    shareModal.style.display = 'block';
});

closeShareModal.addEventListener('click', () => {
    shareModal.style.display = 'none';
});

copyIdBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentRoom.roomId);
    copyIdBtn.textContent = '✅ Đã copy';
    setTimeout(() => {
        copyIdBtn.textContent = '📋 Copy';
    }, 2000);
});

copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(shareLink.value);
    copyLinkBtn.textContent = '✅ Đã copy';
    setTimeout(() => {
        copyLinkBtn.textContent = '📋 Copy';
    }, 2000);
});

openRemoteBtn.addEventListener('click', () => {
    const remoteUrl = `remote.html?roomId=${currentRoom.roomId}`;
    // Open in new window (simulating mobile device)
    window.open(remoteUrl, 'RemoteControl', 'width=400,height=800,menubar=no,toolbar=no,location=no,status=no');
});

// SEARCH SONGS (YouTube)

searchBtn.addEventListener('click', searchSongs);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchSongs();
    }
});

async function searchSongs() {
    const query = searchInput.value.trim();

    if (!query) {
        alert('Vui lòng nhập tên bài hát');
        return;
    }

    searchResults.innerHTML = '<p style="padding: 1rem; text-align: center;">🔍 Đang tìm kiếm...</p>';

    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!data.success) {
            searchResults.innerHTML = '<p style="padding: 1rem; color: var(--danger);">❌ Lỗi tìm kiếm</p>';
            return;
        }

        if (data.results && data.results.length > 0) {
            searchResults.innerHTML = data.results.map(video => `
                <div class="search-result-item" onclick="addSongFromSearch('${video.videoId}', '${escapeHtml(video.title).replace(/'/g, "\\'")}', '${video.thumbnail}')">
                    <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}">
                    <div class="search-result-info">
                        <h4>${escapeHtml(video.title)}</h4>
                        <p>${escapeHtml(video.channelTitle || 'YouTube')}</p>
                    </div>
                    <button class="btn btn-small btn-primary" style="margin-left: auto;">➕</button>
                </div>
            `).join('');
        } else {
            // Fallback: Manual Video ID input
            const searchUrl = data.searchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' karaoke')}`;

            searchResults.innerHTML = `
                <p style="padding: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
                    ⚠️ YouTube API chưa được cấu hình.<br>
                    Vui lòng tìm kiếm thủ công:
                </p>
                <div style="padding: 0 1rem 1rem 1rem;">
                    <a href="${searchUrl}" target="_blank" class="btn btn-primary" style="width: 100%; display: block; text-align: center; text-decoration: none; margin-bottom: 1rem;">
                        🔍 Mở YouTube
                    </a>
                    <div style="margin-top: 1rem;">
                        <input type="text" id="videoIdInput" placeholder="Nhập Video ID (sau v= trong URL)" 
                            style="width: 100%; padding: 0.75rem; background: var(--bg-input); border: 2px solid var(--primary); 
                            border-radius: 0.5rem; color: var(--text-primary); margin-bottom: 0.5rem;">
                        <button onclick="addSongByVideoId()" class="btn btn-primary" style="width: 100%; padding: 0.75rem;">
                            ➕ Thêm Bài Hát
                        </button>
                    </div>
                    <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
                        💡 VD: youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>
                    </p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<p style="padding: 1rem; color: var(--danger);">❌ Không thể kết nối server</p>';
    }
}

// Add song from search results (clicked from list)
window.addSongFromSearch = function (videoId, title, thumbnail) {
    addSongToQueue({
        videoId: videoId,
        title: title,
        thumbnail: thumbnail
    });

    searchInput.value = '';
    searchResults.innerHTML = '<p style="padding: 1rem; color: var(--success); text-align: center;">✅ Đã thêm vào hàng đợi!</p>';

    setTimeout(() => {
        searchResults.innerHTML = '';
    }, 2000);
};

window.addSongByVideoId = function () {
    const videoIdInput = document.getElementById('videoIdInput');
    const videoId = videoIdInput.value.trim();

    if (!videoId) {
        alert('Vui lòng nhập Video ID');
        return;
    }

    addSongToQueue({
        videoId: videoId,
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    });

    videoIdInput.value = '';
    searchInput.value = '';
    searchResults.innerHTML = '';
};

function addSongToQueue(song) {
    socket.emit('add-song', {
        roomId: currentRoom.roomId,
        song: song,
        userId: currentUser.userId
    });

    // Auto-play is now handled by queue-updated event
}

function updateQueue() {
    queueCount.textContent = currentRoom.queue.length;

    if (currentRoom.queue.length === 0) {
        queueList.innerHTML = '<p class="empty-queue">Chưa có bài hát trong hàng đợi</p>';
        return;
    }

    queueList.innerHTML = currentRoom.queue.map((song, index) => `
    <div class="queue-item">
      <div class="queue-item-info">
        <h4>${index + 1}. ${escapeHtml(song.title)} ${song.priority === 'high' ? '⭐' : ''}</h4>
        <p>Bởi @${escapeHtml(song.addedByName)}</p>
      </div>
      <div class="queue-item-actions">
        <button onclick="removeSong(${index})" title="Xóa">❌</button>
      </div>
    </div>
  `).join('');
}

window.removeSong = function (index) {
    socket.emit('remove-song', {
        roomId: currentRoom.roomId,
        songIndex: index,
        userId: currentUser.userId
    });
};

playPauseBtn.addEventListener('click', () => {
    if (!playerReady) return;

    const state = player.getPlayerState();

    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
        syncPlayerState('pause');
    } else {
        player.playVideo();
        syncPlayerState('play', player.getCurrentTime());
    }
});

prevBtn.addEventListener('click', () => {
    alert('Không thể quay lại bài trước');
});

nextBtn.addEventListener('click', () => {
    socket.emit('play-next', {
        roomId: currentRoom.roomId,
        userId: currentUser.userId
    });
});

volumeSlider.addEventListener('input', (e) => {
    if (playerReady) {
        player.setVolume(e.target.value);
    }
});

function syncPlayerState(state, currentTime) {
    socket.emit('player-state', {
        roomId: currentRoom.roomId,
        state: state,
        currentTime: currentTime,
        userId: currentUser.userId
    });
}

function playSong(song) {
    if (!playerReady) {
        console.error('Player not ready, will retry when ready');
        setTimeout(() => {
            if (playerReady) playSong(song);
        }, 1000);
        return;
    }

    if (!song || !song.videoId) {
        console.error('Invalid song data:', song);
        addChatMessage('system', `❌ Lỗi: Bài hát không hợp lệ`);
        return;
    }

    console.log('Playing song:', song.title, 'Video ID:', song.videoId);

    currentRoom.currentSong = song;

    try {
        player.loadVideoById({
            videoId: song.videoId,
            startSeconds: 0,
            suggestedQuality: 'hd720'  // Suggest HD quality for karaoke
        });

        // Set quality after video starts loading (YouTube API needs time)
        setTimeout(() => {
            try {
                if (!playerReady || !player.getPlayerState) return;

                const playerState = player.getPlayerState();
                // Only set quality if video is loading, buffering, or playing
                if (playerState === -1 || playerState === 1 || playerState === 3) {
                    const availableQualities = player.getAvailableQualityLevels();
                    if (availableQualities && availableQualities.length > 0) {
                        if (availableQualities.includes('hd1080')) {
                            player.setPlaybackQuality('hd1080');
                            console.log('🎬 Set quality: 1080p');
                        } else if (availableQualities.includes('hd720')) {
                            player.setPlaybackQuality('hd720');
                            console.log('🎬 Set quality: 720p');
                        }
                    }
                }

                // Auto-play the video (bypass browser restrictions)
                if (playerState === -1 || playerState === 2) { // Unstarted or Paused
                    console.log('🎵 Auto-playing video...');
                    player.playVideo();
                }
            } catch (e) {
                // Silently fail - quality setting is not critical
                console.debug('Quality setting skipped:', e.message);
            }
        }, 2000);  // Increased delay for better reliability

        document.body.classList.add('song-is-playing');

        nowPlaying.style.display = 'flex';
        noSong.style.display = 'none';
        currentThumbnail.src = song.thumbnail;
        currentTitle.textContent = song.title;
        currentAddedBy.textContent = `Được thêm bởi @${song.addedByName}`;

        addChatMessage('system', `▶️ Đang phát: ${song.title}`);

        setTimeout(() => {
            const playerState = player.getPlayerState();
            if (playerState !== 1) { // Not playing
                showAutoplayPrompt();
            }
        }, 1000);

        startMarqueeTracker();
    } catch (error) {
        console.error('Error playing song:', error);
        addChatMessage('system', `❌ Lỗi phát bài: ${song.title}`);

        setTimeout(() => {
            socket.emit('play-next', {
                roomId: currentRoom.roomId,
                userId: currentUser.userId
            });
        }, 2000);
    }
}

function stopPlayer() {
    if (playerReady) {
        player.stopVideo();
    }

    currentRoom.currentSong = null;
    document.body.classList.remove('song-is-playing');
    nowPlaying.style.display = 'none';
    noSong.style.display = 'flex';

    stopMarqueeTracker();
}

function startMarqueeTracker() {
    if (marqueeInterval) clearInterval(marqueeInterval);
    marqueeInterval = setInterval(updateMarqueeStatus, 1000);
}

function stopMarqueeTracker() {
    if (marqueeInterval) clearInterval(marqueeInterval);
    if (upcomingMarquee) upcomingMarquee.style.display = 'none';
}

function updateMarqueeStatus() {
    if (!playerReady || !currentRoom || !currentRoom.currentSong) {
        if (upcomingMarquee) upcomingMarquee.style.display = 'none';
        return;
    }

    try {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();

        if (duration <= 0) return;

        const remainingTime = duration - currentTime;

        // Show marquee when progress > 50% and queue is not empty
        if (currentTime > (duration / 2) && currentRoom.queue.length > 0) {
            const nextSong = currentRoom.queue[0];
            const songText = `1. ${nextSong.title} (Bởi @${nextSong.addedByName})`;

            if (marqueeContent.textContent !== songText) {
                marqueeContent.textContent = songText;
            }

            if (upcomingMarquee && upcomingMarquee.style.display === 'none') {
                upcomingMarquee.style.display = 'flex';
                console.log('Showing upcoming song marquee (half-way point reached)');
            }
        } else {
            if (upcomingMarquee && upcomingMarquee.style.display !== 'none') {
                upcomingMarquee.style.display = 'none';
            }
        }
    } catch (e) {
    }
}

function updateMembers() {
    membersList.innerHTML = currentRoom.members.map(member => `
    <div class="member-item">
      <span class="member-name">👤 ${escapeHtml(member.userName)}</span>
    </div>
  `).join('');
}

sendChatBtn.addEventListener('click', sendChat);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChat();
    }
});

function sendChat() {
    const message = chatInput.value.trim();

    if (!message) return;

    socket.emit('chat-message', {
        roomId: currentRoom.roomId,
        userId: currentUser.userId,
        message: message
    });

    chatInput.value = '';
}

function addChatMessage(userName, message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';

    if (userName === 'system') {
        messageEl.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">${escapeHtml(message)}</span>`;
    } else {
        messageEl.innerHTML = `
      <span class="chat-message-author">@${escapeHtml(userName)}:</span>
      <span class="chat-message-text">${escapeHtml(message)}</span>
    `;
    }

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateRoomInfo() {
    roomNameEl.textContent = currentRoom.roomName;
    roomIdDisplay.textContent = currentRoom.roomId;
    memberCount.textContent = currentRoom.members.length;
    membersCount.textContent = currentRoom.members.length;

    // If room has current song, play it
    if (currentRoom.currentSong) {
        playSong(currentRoom.currentSong);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAutoplayPrompt() {
    const autoplayPrompt = document.getElementById('autoplayPrompt');
    const autoplayBtn = document.getElementById('autoplayBtn');

    if (!autoplayPrompt || !autoplayBtn) return;

    console.log('💡 Showing autoplay prompt');
    autoplayPrompt.style.display = 'flex';

    autoplayBtn.onclick = () => {
        console.log('🎵 User clicked play button');
        if (playerReady && player.playVideo) {
            player.playVideo();
            hideAutoplayPrompt();
        }
    };
}

function hideAutoplayPrompt() {
    const autoplayPrompt = document.getElementById('autoplayPrompt');
    if (autoplayPrompt) {
        autoplayPrompt.style.display = 'none';
    }
}

if (playPauseBtn) {
    const originalPlayPauseHandler = playPauseBtn.onclick;
    playPauseBtn.addEventListener('click', () => {
        hideAutoplayPrompt();
    });
}

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    alert('Mất kết nối tới server. Đang thử kết nối lại...');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    alert('Mất kết nối. Vui lòng reload trang.');
});

window.addEventListener('beforeunload', () => {
    socket.emit('leave-room', {
        roomId: currentRoom?.roomId,
        userId: currentUser?.userId
    });
});
