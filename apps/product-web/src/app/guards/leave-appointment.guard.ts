import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { AppointmentPageComponent } from '../pages/appointment-page/appointment-page.component';

@Injectable({
  providedIn: 'root',
})
export class LeaveAppointmentGuard
  implements CanDeactivate<AppointmentPageComponent>
{
  canDeactivate(component: AppointmentPageComponent): boolean {
    // Nếu form đã nhập (có dữ liệu), mới cảnh báo
    if (component.hasBookingData()) {
      const confirmLeave = window.confirm(
        'Bạn có chắc muốn rời khỏi trang đặt lịch? Dữ liệu sẽ bị xóa!'
      );
      if (confirmLeave) {
        component.resetForm(); // Dọn sạch form
        return true; // Cho phép rời
      } else {
        return false; // Ở lại
      }
    }
    return true; // Nếu chưa nhập gì thì cho phép đi luôn
  }
}
