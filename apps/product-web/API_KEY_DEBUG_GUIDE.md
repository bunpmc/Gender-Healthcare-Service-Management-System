# API Key Debug Guide - Period Tracking

## 🚨 Lỗi "Invalid API Key" - Hướng dẫn Debug

### 🔍 **Bước 1: Kiểm tra API Keys trong Environment**

Mở file `apps/product-web/src/app/environments/environment.ts` và kiểm tra:

```typescript
export const environment = {
  // Supabase Configuration
  supabaseUrl: 'https://xzxxodxplyetecrsbxmc.supabase.co',
  
  // Anon key (for client-side operations)
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  
  // Service role key (for server-side operations)  
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
```

### 🧪 **Bước 2: Test API Key trong Browser**

1. **Mở Period Tracking page** tại `http://localhost:4200`
2. **Click các test buttons** theo thứ tự:
   - 🔑 **Test API Key** - Kiểm tra API key validation
   - 🔗 **Test DB Connection** - Kiểm tra kết nối database
   - 🧪 **Test Period Logging** - Test submit data

3. **Mở Developer Console (F12)** để xem logs chi tiết

### 📊 **Console Logs để theo dõi**

#### ✅ **API Key Valid:**
```
🔍 Environment debug: {
  supabaseUrl: "https://xzxxodxplyetecrsbxmc.supabase.co",
  hasAnonKey: true,
  hasServiceKey: true,
  anonKeyPrefix: "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
}
✅ API key and authentication validated
```

#### ❌ **API Key Invalid:**
```
❌ API KEY/AUTH ERROR: Missing Supabase API keys
❌ AUTH CHECK ERROR: Authentication failed
❌ DATABASE ERROR - Function call failed: {
  message: "Invalid API key",
  code: "PGRST301"
}
```

### 🔧 **Bước 3: Kiểm tra Supabase Dashboard**

1. **Truy cập Supabase Dashboard**: https://supabase.com/dashboard
2. **Chọn project**: `xzxxodxplyetecrsbxmc`
3. **Vào Settings > API**
4. **Copy API keys mới:**
   - **anon public**: Dùng cho client-side
   - **service_role**: Dùng cho server-side (có quyền cao hơn)

### 🛠️ **Bước 4: Cập nhật API Keys**

Nếu API keys bị expired hoặc invalid:

```typescript
// apps/product-web/src/app/environments/environment.ts
export const environment = {
  supabaseUrl: 'https://xzxxodxplyetecrsbxmc.supabase.co',
  
  // CẬP NHẬT KEY MỚI TỪ SUPABASE DASHBOARD
  supabaseAnonKey: 'NEW_ANON_KEY_HERE',
  supabaseKey: 'NEW_SERVICE_ROLE_KEY_HERE',
};
```

### 🔍 **Bước 5: Kiểm tra RPC Function Permissions**

Trong Supabase SQL Editor, chạy query để kiểm tra function:

```sql
-- Kiểm tra function có tồn tại không
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'create_period_entry';

-- Kiểm tra permissions
SELECT * FROM pg_proc 
WHERE proname = 'create_period_entry';

-- Test function trực tiếp
SELECT create_period_entry(
  'test-uuid-here'::uuid,
  '2024-01-01'::timestamp with time zone,
  null,
  28,
  'medium',
  '[]'::json,
  'test',
  null,
  5
);
```

### 🚨 **Các lỗi thường gặp và cách sửa**

#### **1. "Invalid API key" (PGRST301)**
```
❌ Nguyên nhân: API key expired hoặc sai
✅ Giải pháp: Cập nhật API key mới từ Supabase Dashboard
```

#### **2. "Function not found" (42883)**
```
❌ Nguyên nhân: RPC function create_period_entry không tồn tại
✅ Giải pháp: Tạo function trong Supabase SQL Editor
```

#### **3. "Permission denied" (42501)**
```
❌ Nguyên nhân: API key không có quyền gọi function
✅ Giải pháp: Sử dụng service_role key hoặc cập nhật RLS policies
```

#### **4. "Invalid UUID" (22P02)**
```
❌ Nguyên nhân: patient_id không đúng format UUID
✅ Giải pháp: Service tự động generate UUID từ string
```

### 🔄 **Bước 6: Test Flow Hoàn chỉnh**

1. **Test API Key**: Click "🔑 Test API Key"
2. **Test Connection**: Click "🔗 Test DB Connection"  
3. **Test Function**: Click "🧪 Test Period Logging"
4. **Submit Real Data**: Điền form và submit

### 📝 **Debug Commands trong Console**

```javascript
// Kiểm tra environment
console.log('Environment:', environment);

// Kiểm tra Supabase client
console.log('Supabase client:', supabase);

// Test manual RPC call
supabase.rpc('create_period_entry', {
  p_patient_id: 'test-uuid',
  p_start_date: '2024-01-01',
  p_flow_intensity: 'medium'
}).then(console.log);
```

### 🎯 **Expected Success Flow**

```
🔑 Test API Key:
✅ API key and authentication validated

🔗 Test DB Connection:
✅ Database connection successful
✅ Function test successful, returned period_id: uuid
✅ Test data cleaned up successfully

🧪 Test Period Logging:
✅ Period data saved to database successfully
✅ Period ID: uuid-here
```

### 📞 **Nếu vẫn lỗi**

1. **Check network**: Có thể bị block firewall/proxy
2. **Check Supabase status**: https://status.supabase.com/
3. **Regenerate API keys**: Trong Supabase Dashboard
4. **Check project URL**: Đảm bảo đúng project ID

### 🔧 **Quick Fix Commands**

```bash
# Rebuild project
npm run build

# Clear cache
rm -rf .angular/cache
npm start

# Check environment
echo $NODE_ENV
```

Hãy test theo từng bước và báo lại kết quả console logs để tôi có thể hỗ trợ cụ thể hơn!
