import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Doctor } from '../../models/doctor.model';
import { DoctorService } from '../../services/doctor.service';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { NgClass, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '../../components/breadcrumbs/breadcrumbs.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; // Import TranslateService

@Component({
  selector: 'app-doctors-page',
  standalone: true,
  imports: [
    RouterLink,
    HeaderComponent,
    FooterComponent,
    NgClass,
    FormsModule,
    TitleCasePipe,
    BreadcrumbsComponent,
    TranslateModule,
  ],
  templateUrl: './doctors-page.component.html',
  styleUrls: ['./doctors-page.component.css'],
})
export class DoctorsPageComponent implements OnInit {
  allDoctors: Doctor[] = [];
  paginatedDoctors: Doctor[] = [];
  loading = false;

  // Filter state
  searchValue: string = '';
  selectedSpecialty: string = '';
  selectedGender: string = '';
  specialties: string[] = [];
  genders: string[] = [];

  // Pagination state
  page = 1;
  perPage = 6;
  maxPage = 1;

  showFilter = false;
  isDesktop: boolean = window.innerWidth >= 768;

  fallbackImage = 'https://via.placeholder.com/300x400?text=No+Image';

  private doctorService = inject(DoctorService);
  private translate = inject(TranslateService);

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Initialize translated filter options
    const allText = this.translate.instant('COMMON.ALL');
    this.selectedSpecialty = allText;
    this.selectedGender = allText;
    this.genders = [
      allText,
      this.translate.instant('COMMON.MALE'),
      this.translate.instant('COMMON.FEMALE'),
      this.translate.instant('COMMON.OTHER'),
    ];

    this.fetchDoctors();
  }

  fetchDoctors(): void {
    this.loading = true;
    this.doctorService.getDoctors('', '', '').subscribe({
      next: (data) => {
        // Chuẩn hóa lại gender cho từng staff_members
        data.forEach((doc: any) => {
          console.log(doc);
          if (doc.staff_members?.gender) {
            let g = doc.staff_members.gender.toLowerCase().trim();
            if (g === 'male' || g === 'nam') doc.staff_members.gender = 'MALE';
            else if (g === 'female' || g === 'nữ')
              doc.staff_members.gender = 'FEMALE';
            else doc.staff_members.gender = 'OTHER';
          }
        });
        this.allDoctors = data;
        const uniqueSpecialties = Array.from(
          new Set(data.map((doc) => doc.speciality).filter(Boolean))
        );
        const allText = this.translate.instant('COMMON.ALL');
        this.specialties = [allText, ...uniqueSpecialties];
        this.page = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        // Dùng translate để báo lỗi đa ngôn ngữ
        this.translate.get('DOCTOR.LOAD_ERROR').subscribe((res) => {
          alert(res || 'Không thể tải danh sách bác sĩ');
        });
        this.loading = false;
      },
    });
  }

  @HostListener('window:resize', [])
  onResize() {
    this.isDesktop = window.innerWidth >= 768;
  }

  getImageUrl(link: string | null | undefined): string {
    if (!link) return this.fallbackImage;
    return link.includes('//doctor')
      ? link.replace('//doctor', '/doctor')
      : link;
  }

  // FILTER HANDLERS
  onSearch(event: Event): void {
    this.searchValue = (event.target as HTMLInputElement).value.trim();
    this.page = 1;
    this.updatePagination();
  }

  selectSpecialty(specialty: string): void {
    this.selectedSpecialty = specialty;
    this.page = 1;
    this.updatePagination();
  }

  selectGender(gender: string): void {
    this.selectedGender = gender;
    this.page = 1;
    this.updatePagination();
  }

  // FILTER + PAGINATION
  updatePagination(): void {
    let filtered = this.allDoctors;

    // Filter by specialty
    const allText = this.translate.instant('COMMON.ALL');
    if (this.selectedSpecialty !== allText)
      filtered = filtered.filter(
        (doc) => doc.speciality === this.selectedSpecialty
      );

    // Filter by gender
    if (this.selectedGender !== allText)
      filtered = filtered.filter(
        (doc) => doc.staff_members?.gender === this.selectedGender
      );

    // Filter by search name
    if (this.searchValue)
      filtered = filtered.filter((doc) =>
        doc.staff_members?.full_name
          ?.toLowerCase()
          .includes(this.searchValue.toLowerCase())
      );

    this.maxPage = Math.max(1, Math.ceil(filtered.length / this.perPage));
    const start = (this.page - 1) * this.perPage;
    this.paginatedDoctors = filtered.slice(start, start + this.perPage);
  }

  goToPage(pg: number): void {
    if (pg < 1 || pg > this.maxPage) return;
    this.page = pg;
    this.updatePagination();
  }

  get pageArray(): number[] {
    return Array.from({ length: this.maxPage }, (_, i) => i);
  }
}
