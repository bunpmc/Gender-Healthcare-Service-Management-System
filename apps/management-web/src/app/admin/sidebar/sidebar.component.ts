import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  private router = inject(Router);
  activeMenu: string = 'dashboard';
  isNavigating: boolean = false;

  overviewItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      iconHover: false,
      route: '/admin/dashboard'
    },
    {
      id: 'analytic',
      label: 'Analytics',
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2',
      iconHover: false,
      route: '/admin/analytic'
    },
  ];

  managementItems = [
    {
      id: 'users',
      label: 'Patient',
      iconPath: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
      iconHover: false,
      route: '/admin/patient'
    },
    {
      id: 'calendar',
      label: 'Appointments',
      iconPath: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
      iconHover: false,
      route: '/admin/appointment'
    },
    {
      id: 'check-badge',
      label: 'Staff',
      iconPath: "M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z",
      iconHover: false,
      route: '/admin/staff'
    },
    {
      id: 'clipboard-document-check',
      label: 'Services',
      iconPath: "M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75",
      iconHover: false,
      route: '/admin/services'
    }
  ];



  ngOnInit() {
    // Track navigation changes to update active menu
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveMenuFromUrl(event.url);
        this.isNavigating = false;
      });

    // Set initial active menu based on current URL
    this.updateActiveMenuFromUrl(this.router.url);
  }

  private updateActiveMenuFromUrl(url: string) {
    if (url.includes('/admin/dashboard')) {
      this.activeMenu = 'dashboard';
    } else if (url.includes('/admin/analytic')) {
      this.activeMenu = 'analytic';
    } else if (url.includes('/admin/patient')) {
      this.activeMenu = 'users';
    } else if (url.includes('/admin/appointment')) {
      this.activeMenu = 'calendar';
    } else if (url.includes('/admin/staff')) {
      this.activeMenu = 'staff';
    } else if (url.includes('/admin/services')) {
      this.activeMenu = 'clipboard-document-check';
    }
  }

  setActiveMenu(menuId: string) {
    this.activeMenu = menuId;
    this.isNavigating = true;

    // Reset navigation state after a short delay
    setTimeout(() => {
      this.isNavigating = false;
    }, 800);
  }

  onNavigate(route: string, menuId: string) {
    this.setActiveMenu(menuId);
    this.router.navigate([route]).then(() => {
      this.isNavigating = false;
    });
  }


}
