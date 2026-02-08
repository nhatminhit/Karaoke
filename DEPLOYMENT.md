# Vercel Deployment Guide

## 🚀 Deploy lên Vercel

### Bước 1: Chuẩn bị

1. Tạo tài khoản tại [vercel.com](https://vercel.com)
2. Cài đặt Vercel CLI (tùy chọn):
   ```bash
   npm i -g vercel
   ```

### Bước 2: Deploy

**Cách 1: Deploy qua Web (Đơn giản nhất)**

1. Push code lên GitHub
2. Vào [vercel.com/new](https://vercel.com/new)
3. Import repository của bạn
4. Vercel sẽ tự động detect và deploy!

**Cách 2: Deploy qua CLI**

```bash
# Login
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

### Bước 3: Cấu hình Environment Variables

Trong Vercel Dashboard:
1. Vào **Settings** → **Environment Variables**
2. Thêm các biến:
   - `YOUTUBE_API_KEY` = your_api_key (nếu có)
   - `PORT` = 3000

### ⚠️ Lưu ý quan trọng

**Socket.io trên Vercel:**
- Vercel hỗ trợ WebSocket nhưng có giới hạn
- Mỗi request timeout sau 10 giây (Hobby plan)
- Không hỗ trợ long-lived connections tốt như dedicated server

**Giải pháp tốt hơn cho production:**
- **Railway.app** - Tốt hơn cho Socket.io
- **Render.com** - Free tier với WebSocket support
- **Heroku** - Stable cho real-time apps

### 🎯 Deploy lên Railway (Khuyến nghị)

Railway tốt hơn cho Socket.io apps:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Init project
railway init

# Deploy
railway up
```

### 📝 Files đã tạo

- `vercel.json` - Vercel configuration
- `DEPLOYMENT.md` - Hướng dẫn này

### 🔧 Troubleshooting

**Nếu Socket.io không hoạt động trên Vercel:**
1. Kiểm tra logs: `vercel logs`
2. Thử deploy lên Railway/Render thay thế
3. Enable WebSocket polling fallback

**CORS issues:**
- Đảm bảo `cors` được config đúng trong `server.js`
- Thêm domain của bạn vào CORS whitelist

### 🌐 Sau khi deploy

URL của bạn sẽ là: `https://your-project.vercel.app`

Hoặc custom domain: `https://karaoke.yourdomain.com`

---

**Lưu ý:** Với Socket.io và real-time features, khuyến nghị dùng **Railway** hoặc **Render** thay vì Vercel!
