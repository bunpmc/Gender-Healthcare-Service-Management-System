# Environment Configuration Cleanup

## 🎯 Objective
Clean up environment configuration để chỉ giữ lại **4 thứ cần thiết** cho Supabase như bạn yêu cầu:
1. **Supabase URL** with functions endpoint
2. **Storage bucket URL**
3. **Service role key**
4. **Anon key**

## 🧹 Changes Made

### ✅ **Primary Configuration (4 essentials)**
```typescript
export const environment = {
  // 1. Supabase URL with functions endpoint
  supabaseUrl: 'https://xzxxodxplyetecrsbxmc.supabase.co',
  
  // 2. Storage bucket URL
  supabaseStorageUrl: 'https://xzxxodxplyetecrsbxmc.supabase.co/storage/v1/object/public/patient-uploads',
  
  // 3. Service role key (for server-side RPC operations)
  supabaseServiceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  
  // 4. Anon key (for client-side operations)
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
```

### 🔄 **Backward Compatibility**
Kept legacy properties để không break existing services:
```typescript
// Legacy properties for other services
apiEndpoint: 'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1',
supabaseKey: 'service_role_key', // Same as supabaseServiceKey
authCallbackUrl: '/auth/callback',
getCurrentOrigin: () => window.location.origin,
```

### 🗑️ **Removed Properties**
- `authorization` (old auth token)
- `authorizationv2` (another old auth token)
- Duplicate/redundant configurations

## 🔧 **Service Updates**

### **Period Tracking Service**
```typescript
// Updated to prioritize service role key for RPC functions
const apiKey = environment.supabaseServiceKey || environment.supabaseAnonKey;

console.log('🔑 Using API key type:', {
  hasServiceKey: !!environment.supabaseServiceKey,
  hasAnonKey: !!environment.supabaseAnonKey,
  usingKey: environment.supabaseServiceKey ? 'service_role' : 'anon'
});
```

### **Auto-Testing API Keys**
Service sẽ tự động test 2 loại keys:
1. **supabaseServiceKey** (preferred for RPC)
2. **supabaseAnonKey** (fallback)

## 🧪 **Testing Flow**

### **1. Test Database Connection**
```
🧪 Testing with supabaseServiceKey...
✅ supabaseServiceKey SUCCESS! Returned: uuid-123
🔄 Switching to working key: supabaseServiceKey
```

### **2. Expected Console Logs**
```
🔧 Initializing PeriodTrackingService...
📍 Supabase URL: https://xzxxodxplyetecrsbxmc.supabase.co
🗂️ Storage URL: https://xzxxodxplyetecrsbxmc.supabase.co/storage/v1/object/public/patient-uploads
🔑 Service Key (first 20 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6...
🔑 Anon Key (first 20 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6...
🔑 Using API key type: { hasServiceKey: true, hasAnonKey: true, usingKey: "service_role" }
✅ Period tracking service initialized successfully
```

## 🎯 **Key Benefits**

### **1. Simplified Configuration**
- Chỉ 4 properties chính cần thiết
- Clear documentation cho từng property
- Backward compatibility maintained

### **2. Better API Key Management**
- Service role key cho RPC functions (full permissions)
- Anon key cho client operations (limited permissions)
- Auto-fallback nếu service key không work

### **3. Enhanced Debugging**
- Clear logging cho API key usage
- Auto-testing để tìm working key
- Detailed error messages

## 🚨 **Important Notes**

### **API Key Priority**
1. **Service Role Key** (preferred) - Full database access, bypass RLS
2. **Anon Key** (fallback) - Limited access, subject to RLS policies

### **RPC Function Requirements**
- **Service role key** recommended cho period tracking RPC
- **Anon key** có thể work nếu RLS policies allow
- Auto-testing sẽ determine key nào work

### **Storage Access**
- **Storage URL** cho file uploads/downloads
- **Service key** cho admin storage operations
- **Anon key** cho user storage operations

## 🔍 **Debug Commands**

### **Test API Keys**
```javascript
// In browser console
console.log('Environment:', environment);

// Test manual RPC
supabase.rpc('create_period_entry', {
  p_patient_id: 'test-uuid',
  p_start_date: '2024-01-01',
  p_flow_intensity: 'medium'
}).then(console.log);
```

### **Check Current Configuration**
```javascript
// Check what keys are available
console.log({
  hasServiceKey: !!environment.supabaseServiceKey,
  hasAnonKey: !!environment.supabaseAnonKey,
  supabaseUrl: environment.supabaseUrl,
  storageUrl: environment.supabaseStorageUrl
});
```

## ✅ **Next Steps**

1. **Test period tracking** với cleaned environment
2. **Verify API key auto-selection** works
3. **Check console logs** cho proper initialization
4. **Test RPC functions** với service role key
5. **Fallback testing** nếu service key fail

Bây giờ environment đã clean và optimized cho period tracking! 🚀
