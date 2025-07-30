import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { BreadcrumbService } from '../../services/breadcrumb.service';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.css',
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  breadcrumbs: Breadcrumb[] = [];

  private labelSub?: Subscription;
  private navSub?: Subscription;
  private labels: { [url: string]: string } = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit() {
    // Lắng nghe label động từ service
    this.labelSub = this.breadcrumbService.label$.subscribe((labels) => {
      this.labels = labels;
      this.updateBreadcrumbs();
    });

    // Lắng nghe chuyển route
    this.navSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updateBreadcrumbs());

    // Chạy lần đầu
    this.updateBreadcrumbs();
  }

  ngOnDestroy() {
    this.labelSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  updateBreadcrumbs() {
    const breadcrumbs: Breadcrumb[] = [];

    // Lấy URL hiện tại
    const currentUrl = this.router.url;
    const urlSegments = currentUrl
      .split('/')
      .filter((segment) => segment !== '');

    // Build breadcrumbs từ URL segments
    let currentPath = '';

    for (let i = 0; i < urlSegments.length; i++) {
      currentPath += '/' + urlSegments[i];

      // Tìm label từ route config hoặc dynamic label
      let label = this.getLabelForPath(currentPath, urlSegments[i]);

      if (label) {
        breadcrumbs.push({
          label: label,
          url: currentPath,
        });
      }
    }

    this.breadcrumbs = breadcrumbs;
  }

  private getLabelForPath(path: string, segment: string): string | null {
    if (this.labels[path]) {
      return this.labels[path];
    }
    switch (path) {
      case '/':
        return 'Home';
      case '/blog':
        return 'Blogs';
      case '/doctor':
        return 'Doctors';
      case '/appointment':
        return 'Appointment';
      case '/service':
        return 'Services';
      default:
        if (path.startsWith('/blog/') && path !== '/blog') {
          return this.labels[path] || '...';
        }
        if (path.startsWith('/doctor/') && path !== '/doctor') {
          return this.labels[path] || '...';
        }
        if (path.startsWith('/service/') && path !== '/service') {
          return this.labels[path] || '...';
        }
        return null;
    }
  }
}
