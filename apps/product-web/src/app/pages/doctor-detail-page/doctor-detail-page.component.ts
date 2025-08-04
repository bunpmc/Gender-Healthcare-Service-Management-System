import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DoctorDetail } from '../../models/doctor.model';
import { DoctorService } from '../../services/doctor.service';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { DatePipe, NgClass, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '../../components/breadcrumbs/breadcrumbs.component';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    NgClass,
    FormsModule,
    RouterLink,
    DatePipe,
    BreadcrumbsComponent,
    TranslateModule,
    UpperCasePipe,
  ],
  templateUrl: './doctor-detail-page.component.html',
})
export class DoctorDetailComponent implements OnInit, OnDestroy {
  doctor = signal<DoctorDetail | null>(null);
  loading = signal(true);
  errorMsg = signal('');
  activeTab = 'about';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private doctorService = inject(DoctorService);
  private breadcrumbService = inject(BreadcrumbService);
  private translate = inject(TranslateService);

  private doctorId: string | null = null;
  private breadcrumbSub?: Subscription;

  fallbackImage = 'https://via.placeholder.com/300x400?text=No+Image';

  // ngOnInit(): void {
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  //   this.doctorId = this.route.snapshot.paramMap.get('id');
  //   if (!this.doctorId) {
  //     this.errorMsg.set('Doctor not found');
  //     this.loading.set(false);
  //     return;
  //   }
  //   this.fetchDoctor(this.doctorId);
  // }
 ngOnInit(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  this.route.paramMap.subscribe(paramMap => {
    const id = paramMap.get('id'); // 👉 đây
    if (!id) {
      this.errorMsg.set('Doctor not found');
      this.loading.set(false);
      return;
    }
    this.doctorId = id;
    this.fetchDoctor(id); // ✅ gọi API khi có ID
  });
}

  fetchDoctor(doctor_id: string): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.doctorService.getDoctorById(doctor_id).subscribe({
      next: (doctor: any) => {
        this.doctor.set(doctor);
        this.loading.set(false);
        const breadcrumbPath = `/doctor/${doctor_id}`;
        const label = doctor?.staff_members?.full_name || 'Doctor Detail';
        this.breadcrumbService.setLabel(breadcrumbPath, label);
      },
      error: () => {
        this.errorMsg.set('Failed to load doctor data');
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy() {
    if (this.doctorId) {
      const breadcrumbPath = `/doctor/${this.doctorId}`;
      this.breadcrumbService.clearLabel(breadcrumbPath);
    }
    this.breadcrumbSub?.unsubscribe();
  }

  getImageUrl(link?: string | null): string {
    if (!link) return this.fallbackImage;
    return link.includes('//doctor')
      ? link.replace('//doctor', '/doctor')
      : link;
  }

  get doctorName(): string {
    return this.doctor()?.staff_members?.full_name || 'Dr. [unknown]';
  }

  get doctorAvatar(): string {
    const link = this.doctor()?.staff_members?.image_link;
    if (!link) return this.fallbackImage;
    return link.includes('//doctor')
      ? link.replace('//doctor', '/doctor')
      : link;
  }

  get staffLanguages(): string[] {
    return this.doctor()?.staff_members?.languages ?? [];
  }

  get educationDegrees() {
    return this.doctor()?.educations?.degrees ?? [];
  }

  get certificationList() {
    return this.doctor()?.certifications?.certifications ?? [];
  }

  get specialty(): string {
    return this.doctor()?.speciality?.replaceAll('_', ' ') ?? '';
  }

  get licenseNo(): string {
    return this.doctor()?.license_no ?? '';
  }

  get doctorBlogs() {
    return this.doctor()?.blogs ?? [];
  }

  setTab(tab: string) {
    this.activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToList() {
    this.router.navigate(['/doctor']);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }
}
