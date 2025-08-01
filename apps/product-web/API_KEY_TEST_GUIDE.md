# API Key Test Guide - RPC Functions

## 🔑 Vấn đề: RPC Functions cần API Key

Bạn đúng là **RPC functions** không cần authentication phức tạp, nhưng vẫn cần **valid API key** để:
1. **Authenticate với Supabase API**
2. **Authorize RPC function calls**
3. **Bypass RLS policies** (nếu dùng service_role key)

## 🧪 Test API Keys tự động

Tôi đã thêm **auto-testing** để tìm API key đúng:

### **Bước 1: Test Database Connection**
1. **Mở Period Tracking page** tại `http://localhost:4200`
2. **Mở Developer Console (F12)**
3. **Click "🔗 Test DB Connection"**

### **Bước 2: Xem Console Logs**

Service sẽ **tự động test** 3 loại API keys:

```
🧪 Testing with supabaseServiceKey...
🧪 Testing with supabaseKey (legacy service)...
🧪 Testing with supabaseAnonKey...
```

### **Expected Results:**

#### ✅ **Nếu có key hợp lệ:**
```
✅ supabaseServiceKey SUCCESS! Returned: uuid-here
🧹 Test data cleaned up
🔄 Switching to working key: supabaseServiceKey
```

#### ❌ **Nếu tất cả keys đều fail:**
```
❌ supabaseServiceKey failed: {message: 'Invalid API key'}
❌ supabaseKey failed: {message: 'Invalid API key'}
❌ supabaseAnonKey failed: {message: 'Invalid API key'}
❌ All API keys failed! Check Supabase dashboard for valid keys.
```

## 🔧 Cách lấy API Keys mới

### **1. Truy cập Supabase Dashboard**
- URL: https://supabase.com/dashboard
- Login với account của bạn

### **2. Chọn Project**
- Project: `xzxxodxplyetecrsbxmc` (hoặc project hiện tại)
- Hoặc tạo project mới nếu cần

### **3. Lấy API Keys**
- Vào **Settings > API**
- Copy 2 keys:
  - **anon public**: Cho client-side operations
  - **service_role**: Cho server-side operations (có quyền cao hơn)

### **4. Cập nhật Environment**

```typescript
// apps/product-web/src/app/environments/environment.ts
export const environment = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  
  // Anon key (for client-side)
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  
  // Service role key (for server-side RPC calls)
  supabaseServiceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  
  // Legacy compatibility
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
```

## 🎯 Tại sao RPC cần API Key?

### **1. Supabase Architecture**
```
Frontend → Supabase API Gateway → PostgreSQL RPC Function
           ↑ Cần API Key ở đây
```

### **2. API Key Roles**
- **anon key**: Basic access, subject to RLS
- **service_role key**: Full access, bypass RLS

### **3. RPC Function Security**
```sql
-- Function có thể có SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_period_entry(...)
RETURNS uuid
SECURITY DEFINER  -- Chạy với quyền của owner
LANGUAGE plpgsql;
```

## 🔍 Debug Commands

### **Manual Test trong Console:**
```javascript
// Test với anon key
const anonClient = createClient(
  'https://xzxxodxplyetecrsbxmc.supabase.co',
  'ANON_KEY_HERE'
);

anonClient.rpc('create_period_entry', {
  p_patient_id: 'test-uuid',
  p_start_date: '2024-01-01',
  p_flow_intensity: 'medium'
}).then(console.log);

// Test với service key
const serviceClient = createClient(
  'https://xzxxodxplyetecrsbxmc.supabase.co', 
  'SERVICE_KEY_HERE'
);

serviceClient.rpc('create_period_entry', {
  p_patient_id: 'test-uuid',
  p_start_date: '2024-01-01',
  p_flow_intensity: 'medium'
}).then(console.log);
```

## 🚨 Common Issues

### **1. "Invalid API key"**
- **Nguyên nhân**: Key expired hoặc sai project
- **Giải pháp**: Lấy key mới từ dashboard

### **2. "Function not found"**
- **Nguyên nhân**: RPC function chưa được tạo
- **Giải pháp**: Tạo function trong SQL Editor

### **3. "Permission denied"**
- **Nguyên nhân**: RLS policies block access
- **Giải pháp**: Dùng service_role key hoặc update policies

## 🎯 Quick Fix Steps

1. **Test current keys**: Click "🔗 Test DB Connection"
2. **Check console logs**: Xem key nào work
3. **Update environment**: Nếu cần key mới
4. **Rebuild**: `npm run build`
5. **Test again**: Verify fix

## 📝 Expected Working Flow

```
🔑 Using API key type: {
  hasServiceKey: true,
  usingKey: "service"
}

🧪 Testing with supabaseServiceKey...
✅ supabaseServiceKey SUCCESS! Returned: uuid-123
🔄 Switching to working key: supabaseServiceKey

🧪 Test Period Logging:
✅ Period data saved to database successfully
```

Hãy test và cho tôi biết kết quả console logs!
