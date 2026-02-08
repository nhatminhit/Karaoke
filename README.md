# 🎤 Web Karaoke Multi-Room

Ứng dụng Karaoke trực tuyến với nhiều phòng, hỗ trợ YouTube player và điều khiển từ xa qua mobile.

## ✨ Tính năng

- 🎵 **Multi-Room**: Tạo và tham gia nhiều phòng karaoke
- 📱 **Remote Control**: Điều khiển từ xa qua điện thoại
- 🎬 **YouTube Integration**: Phát video karaoke từ YouTube
- 👥 **Real-time Sync**: Đồng bộ player cho tất cả thành viên
- 📋 **Queue Management**: Quản lý hàng đợi bài hát
- 💬 **Live Chat**: Chat trực tiếp trong phòng
- 🖥️ **Fullscreen Mode**: Chế độ toàn màn hình chuyên nghiệp
- 🎨 **Modern UI**: Giao diện đẹp với hiệu ứng cinema mode

## 🚀 Cài đặt

```bash
# Clone repository
git clone <your-repo-url>

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env and add your YOUTUBE_API_KEY (optional)

# Start server
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📁 Cấu trúc Project

```
WEB_Karaoke/
├── public/
│   ├── css/
│   │   ├── style.css          # Base styles
│   │   └── fullscreen.css     # Fullscreen/cinema mode styles
│   ├── js/
│   │   ├── app.js             # Homepage logic
│   │   ├── room.js            # Room/player logic
│   │   └── remote.js          # Remote control logic
│   ├── index.html             # Homepage
│   ├── room.html              # Karaoke room page
│   └── remote.html            # Mobile remote control
├── server.js                  # Express + Socket.io server
├── package.json
└── .env                       # Environment variables
```

## 🎮 Cách sử dụng

### 1. Tạo/Tham gia phòng
- Mở `http://localhost:3000`
- Nhập tên và Room ID (hoặc để trống để tạo phòng mới)
- Click "Tham gia"

### 2. Thêm bài hát
- Quét QR code ở góc trên player
- Hoặc click "📱 Điều Khiển" để mở remote control
- Tìm kiếm và thêm bài hát từ YouTube

### 3. Điều khiển
- **Play/Pause**: ▶️/⏸️
- **Next**: ⏭ (Bỏ qua bài hiện tại)
- **Fullscreen**: 🖥️ (Chế độ toàn màn hình)
- **Volume**: 🔊 (Điều chỉnh âm lượng)

## 🔧 Cấu hình

### YouTube API (Tùy chọn)
Để sử dụng tính năng tìm kiếm tự động:
1. Tạo API key tại [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Thêm key vào `.env`:
   ```
   YOUTUBE_API_KEY=your_api_key_here
   ```

Nếu không có API key, bạn vẫn có thể thêm bài bằng Video ID thủ công.

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Real-time**: Socket.io
- **Video Player**: YouTube IFrame API
- **QR Code**: QRCode.js

## 📝 License

MIT License

## 👨‍💻 Author

Developed with ❤️ for karaoke lovers
