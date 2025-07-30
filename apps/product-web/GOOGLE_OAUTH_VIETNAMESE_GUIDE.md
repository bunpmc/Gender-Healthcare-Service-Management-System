# Hướng Dẫn Tích Hợp Google OAuth với Angular và Supabase

## 🎯 Tổng Quan

Hệ thống này cho phép người dùng đăng nhập bằng tài khoản Gmail thông qua Google OAuth, tự động tạo tài khoản trong Supabase và chuyển hướng đến dashboard.

## ✅ Tính Năng

- ✅ Đăng nhập bằng Google OAuth (chỉ Gmail)
- ✅ Tự động tạo tài khoản Supabase
- ✅ Tạo profile bệnh nhân tự động
- ✅ Quản lý session với Supabase
- ✅ UI hiển thị trạng thái loading và error
- ✅ Tích hợp với hệ thống authentication hiện tại

## 🚀 Cách Sử Dụng

### 1. Deploy Supabase Edge Function

```bash
# Deploy function xử lý Google authentication
supabase functions deploy google-auth
```

### 2. Sử Dụng Component

Component Google đã được cập nhật và sẵn sàng sử dụng:

```html
<!-- Trong login page hoặc register page -->
<app-google></app-google>
```

### 3. Luồng Hoạt Động

1. **User click "CONTINUE WITH GOOGLE"**
2. **Google OAuth popup/redirect** → User chọn tài khoản Gmail
3. **Nhận access token** từ Google
4. **Gửi token đến Supabase Edge Function** để xác thực
5. **Tạo/cập nhật user** trong Supabase
6. **Tạo patient profile** tự động
7. **Set session** trong AuthService
8. **Redirect đến dashboard**

## 🔧 Cấu Hình Google Cloud Console

### Bước 1: Tạo OAuth 2.0 Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project hoặc tạo project mới
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Chọn **Web application**
6. Cấu hình:
   - **Name**: "Healthcare System"
   - **Authorized JavaScript origins**:
     - `http://localhost:4200` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:4200` (development)
     - `https://yourdomain.com` (production)

### Bước 2: Cập Nhật Client ID

Client ID hiện tại trong `auth-config.ts`:
```typescript
clientId: '651997387272-28348ornee2vd85ff5clnvsu4038r036.apps.googleusercontent.com'
```

**Lưu ý**: Đây là Client ID thật, hãy đảm bảo domain của bạn được thêm vào authorized origins.

## 📊 Cấu Trúc Database

### Bảng `patients` cần có các cột:

```sql
-- Các cột cần thiết cho Google OAuth
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS image_link TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;
```

## 🔒 Bảo Mật

### 1. Xác Thực Token
- Edge function xác thực Google access token server-side
- Chỉ chấp nhận email @gmail.com
- Tạo session Supabase an toàn

### 2. Quản Lý Session
- Token được lưu trong localStorage
- Session được quản lý bởi AuthService
- Tự động redirect sau khi đăng nhập thành công

## 🎨 UI/UX Features

### Loading States
- Spinner animation khi đang xử lý
- Button disabled khi loading
- Text thay đổi: "CONTINUE WITH GOOGLE" → "SIGNING IN..."

### Error Handling
- Hiển thị error message với icon
- Button để clear error
- Fallback lưu token local nếu Supabase fail

### Success States
- Hiển thị thông tin user khi đã đăng nhập
- Auto redirect đến dashboard

## 🧪 Testing

### Development Testing
1. Start Angular dev server: `ng serve`
2. Mở browser đến `http://localhost:4200`
3. Vào trang login/register
4. Click "CONTINUE WITH GOOGLE"
5. Chọn tài khoản Gmail
6. Kiểm tra redirect đến dashboard

### Production Testing
1. Deploy application
2. Cập nhật Google Cloud Console với production domain
3. Test với real users

## 🐛 Troubleshooting

### Lỗi Thường Gặp

1. **"Invalid Client ID"**
   - Kiểm tra Client ID trong `auth-config.ts`
   - Đảm bảo domain được thêm vào Google Cloud Console

2. **"Popup blocked"**
   - Browser chặn popup
   - Hệ thống sẽ fallback sang redirect flow

3. **"Authentication failed"**
   - Kiểm tra Supabase edge function logs
   - Đảm bảo Google APIs accessible từ Supabase

4. **"Only Gmail addresses are allowed"**
   - User sử dụng email không phải @gmail.com
   - Đây là tính năng bảo mật, chỉ chấp nhận Gmail

### Debug Mode

Bật console logging để debug:
```typescript
// Trong AuthGoogleService
console.log('Google authentication successful:', authResponse);
console.error('Supabase authentication error:', error);
```

## 📱 Responsive Design

Component được thiết kế responsive:
- Button full width
- Icon và text căn giữa
- Hover effects mượt mà
- Loading spinner đẹp mắt

## 🔄 Tích Hợp Với Hệ Thống Hiện Tại

### AuthService Integration
```typescript
// Tự động set session sau khi Google auth thành công
if (authResponse.session) {
  this.authService.setSession(authResponse.session);
}
```

### Router Integration
```typescript
// Tự động redirect đến dashboard
this.router.navigate(['/dashboard']);
```

### Profile Management
```typescript
// Cập nhật profile signal
this.profile.set(authResponse.user);
```

## 📋 Checklist Production

- [ ] Google Cloud Console configured
- [ ] Client ID đúng trong auth-config.ts
- [ ] Edge function deployed
- [ ] Database schema updated
- [ ] Domain added to authorized origins
- [ ] SSL certificate installed
- [ ] Error handling tested
- [ ] User flow tested end-to-end

## 🎉 Kết Quả

Sau khi hoàn thành setup:

1. **User Experience**: 1-click đăng nhập với Google
2. **Security**: Server-side token validation
3. **Integration**: Seamless với hệ thống hiện tại
4. **Automation**: Tự động tạo account và profile
5. **UI/UX**: Loading states và error handling đẹp mắt

Hệ thống Google OAuth đã sẵn sàng sử dụng! 🚀
