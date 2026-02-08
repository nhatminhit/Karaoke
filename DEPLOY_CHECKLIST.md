# 🚀 Checklist Deploy - Đảm bảo không lỗi

## ✅ Trước khi deploy

### 1. Kiểm tra files cần thiết
- [x] `server.js` - Server chính
- [x] `package.json` - Dependencies
- [x] `package-lock.json` - Lock file
- [x] `vercel.json` - Vercel config
- [x] `.env.example` - Template cho env vars
- [x] `.gitignore` - Ignore files
- [x] `public/` - Frontend files
- [x] `README.md` - Documentation
- [x] `DEPLOYMENT.md` - Deploy guide

### 2. Kiểm tra code
```bash
# Test local trước
npm install
npm start
# Mở http://localhost:3000 và test
```

### 3. Chuẩn bị Git
```bash
# Init git (nếu chưa có)
git init

# Add files
git add .

# Commit
git commit -m "Ready for deployment"

# Push lên GitHub
git remote add origin https://github.com/your-username/karaoke.git
git branch -M main
git push -u origin main
```

---

## 🎯 Deploy lên Railway (Khuyến nghị)

### Tại sao Railway?
- ✅ Hỗ trợ Socket.io tốt
- ✅ Free 500 hours/month
- ✅ Tự động deploy khi push code
- ✅ Không giới hạn WebSocket

### Các bước:

**1. Tạo tài khoản:**
- Vào [railway.app](https://railway.app)
- Sign up với GitHub

**2. Deploy:**
```bash
# Cách 1: Qua Web
1. New Project → Deploy from GitHub repo
2. Select repository
3. Deploy! 🎉

# Cách 2: Qua CLI
npm i -g @railway/cli
railway login
railway init
railway up
```

**3. Thêm Environment Variables:**
```
YOUTUBE_API_KEY=your_key_here (nếu có)
```

**4. Lấy URL:**
- Railway sẽ tự tạo URL: `https://your-app.up.railway.app`
- Hoặc custom domain

---

## 🔧 Deploy lên Render

### Các bước:

**1. Tạo tài khoản:**
- Vào [render.com](https://render.com)
- Sign up với GitHub

**2. Deploy:**
1. New → Web Service
2. Connect GitHub repository
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Create Web Service

**3. Environment Variables:**
```
YOUTUBE_API_KEY=your_key_here (nếu có)
```

---

## ⚠️ Lỗi thường gặp và cách fix

### 1. Module not found
```bash
# Fix: Đảm bảo package.json đúng
npm install
```

### 2. Port already in use
```javascript
// server.js đã handle:
const PORT = process.env.PORT || 3000;
```

### 3. Socket.io connection failed
```javascript
// Đảm bảo CORS đã config (đã có trong server.js):
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
```

### 4. Environment variables không load
```bash
# Thêm trong platform dashboard, KHÔNG commit .env
```

### 5. Build failed
```bash
# Kiểm tra Node version
node --version  # Cần >= 18.x
```

---

## 📦 Files KHÔNG được commit

Đã có trong `.gitignore`:
- ❌ `node_modules/`
- ❌ `.env`
- ❌ `*.log`
- ❌ `.vercel/`

---

## ✨ Sau khi deploy thành công

### Test các tính năng:

1. **Homepage:**
   - [ ] Tạo phòng mới
   - [ ] Tham gia phòng

2. **Room:**
   - [ ] QR code hiển thị
   - [ ] Thêm bài hát
   - [ ] Player hoạt động
   - [ ] Auto-play
   - [ ] Fullscreen

3. **Remote Control:**
   - [ ] Quét QR code
   - [ ] Tìm kiếm bài hát
   - [ ] Thêm bài vào queue
   - [ ] Ưu tiên bài hát
   - [ ] Điều khiển player

4. **Real-time:**
   - [ ] Sync giữa nhiều devices
   - [ ] Chat hoạt động
   - [ ] Queue update real-time

---

## 🎉 Deploy thành công!

**URL của bạn:**
- Railway: `https://your-app.up.railway.app`
- Render: `https://your-app.onrender.com`

**Share với bạn bè:**
- QR code tự động tạo
- Copy link từ nút "Chia Sẻ"

---

## 📞 Support

Nếu gặp lỗi:
1. Check logs trên platform dashboard
2. Test lại local: `npm start`
3. Kiểm tra environment variables
4. Đọc error message cẩn thận

**Happy Karaoke! 🎤🎉**
