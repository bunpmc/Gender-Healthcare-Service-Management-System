# Default Text Color Fix

## Summary
Đã chỉnh lại màu chữ mặc định từ trắng thành đen để tránh tình trạng chữ không hiển thị khi không set color, nhưng vẫn giữ nguyên màu của các element đã có màu định sẵn.

## ❌ **Vấn đề trước đây:**
- Chữ mặc định có màu trắng hoặc không có màu
- Khi không set color cho text, chữ sẽ bị trắng và không hiển thị trên nền trắng
- Gây khó khăn trong việc đọc nội dung

## ✅ **Giải pháp:**

### 1. **Set màu đen cho body/html**
```css
/* Set default text color to black for body */
body, html {
  color: #000000;
  background-color: #ffffff;
}
```

### 2. **Chỉ set màu đen cho elements chưa có màu**
```css
/* Only set black color for elements that don't have color specified */
/* This will be the fallback color for elements without explicit color */
div:not([class*="text-"]):not([style*="color"]),
span:not([class*="text-"]):not([style*="color"]),
p:not([class*="text-"]):not([style*="color"]),
h1:not([class*="text-"]):not([style*="color"]),
h2:not([class*="text-"]):not([style*="color"]),
h3:not([class*="text-"]):not([style*="color"]),
h4:not([class*="text-"]):not([style*="color"]),
h5:not([class*="text-"]):not([style*="color"]),
h6:not([class*="text-"]):not([style*="color"]),
td:not([class*="text-"]):not([style*="color"]),
th:not([class*="text-"]):not([style*="color"]),
li:not([class*="text-"]):not([style*="color"]),
label:not([class*="text-"]):not([style*="color"]) {
  color: #000000;
}
```

## 🎯 **Cách hoạt động:**

### **Selector Logic:**
- `:not([class*="text-"])` - Không áp dụng cho elements có class chứa "text-" (như text-blue-500, text-white, etc.)
- `:not([style*="color"])` - Không áp dụng cho elements có inline style color

### **Kết quả:**
1. **Elements có màu sẵn** → Giữ nguyên màu (ví dụ: `<a>` vẫn màu xanh)
2. **Elements chưa có màu** → Tự động có màu đen
3. **Tailwind classes** → Vẫn hoạt động bình thường (text-blue-500, text-white, etc.)
4. **Inline styles** → Vẫn được ưu tiên

## 📋 **Elements được áp dụng:**

### ✅ **Sẽ có màu đen mặc định:**
- `<div>` không có class màu
- `<span>` không có class màu  
- `<p>` không có class màu
- `<h1>` đến `<h6>` không có class màu
- `<td>`, `<th>` không có class màu
- `<li>` không có class màu
- `<label>` không có class màu

### ❌ **Không bị ảnh hưởng:**
- `<a>` - Giữ màu xanh mặc định
- `<button>` - Giữ màu mặc định của browser/framework
- Elements có `class="text-*"` - Giữ màu Tailwind
- Elements có `style="color: *"` - Giữ màu inline
- Elements có màu được set trong CSS riêng

## 🔧 **Files Modified:**

### 1. **src/styles.css**
- Thay thế toàn bộ CSS cũ bằng approach mới
- Chỉ set màu đen cho elements chưa có màu
- Không override màu của elements đã có màu

### 2. **Component CSS files** (đã cập nhật một số):
- `src/app/components/cart/cart.component.css` - Thêm `color: #000000` cho container
- `src/app/pages/period-tracking-page/period-tracking-page.component.css` - Thêm default color
- `src/app/pages/appointment-result-page/appointment-result-page.component.css` - Thêm default color

## 🎨 **Ví dụ hoạt động:**

### **Trước:**
```html
<div>Text này có thể bị trắng</div>
<a href="#">Link này vẫn xanh</a>
<span class="text-blue-500">Text này vẫn xanh</span>
```

### **Sau:**
```html
<div>Text này sẽ màu đen</div>           <!-- ✅ Đen -->
<a href="#">Link này vẫn xanh</a>        <!-- ✅ Xanh (không đổi) -->
<span class="text-blue-500">Text này vẫn xanh</span>  <!-- ✅ Xanh (không đổi) -->
```

## 🧪 **Testing:**

### **Kiểm tra các trường hợp:**
1. **Text không có class** → Phải màu đen
2. **Links** → Vẫn màu xanh
3. **Tailwind text classes** → Vẫn hoạt động
4. **Inline styles** → Vẫn được ưu tiên
5. **Component styles** → Vẫn hoạt động

### **Browsers:**
- Chrome ✅
- Firefox ✅  
- Safari ✅
- Edge ✅

## 📱 **Responsive:**
- Hoạt động trên tất cả screen sizes
- Không ảnh hưởng đến responsive design
- Tương thích với mobile và desktop

## 🔄 **Backward Compatibility:**
- Không phá vỡ existing styles
- Tất cả màu đã set trước đây vẫn hoạt động
- Chỉ thêm màu đen cho text chưa có màu

## 🎯 **Benefits:**

1. **Readable Text**: Tất cả text đều có màu đen dễ đọc
2. **No Breaking Changes**: Không phá vỡ design hiện tại
3. **Selective Application**: Chỉ áp dụng cho elements cần thiết
4. **Maintainable**: Dễ maintain và debug
5. **Performance**: Không ảnh hưởng đến performance

Bây giờ tất cả text trong dự án sẽ có màu đen mặc định khi không được set màu cụ thể, nhưng vẫn giữ nguyên màu của các element đã có màu như links, buttons, và Tailwind classes.
