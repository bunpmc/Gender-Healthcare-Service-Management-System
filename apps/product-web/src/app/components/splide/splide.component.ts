import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import Splide from '@splidejs/splide';
import { Doctor } from '../../models/doctor.model';
import { DoctorService } from '../../services/doctor.service';

@Component({
  selector: 'app-splide',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './splide.component.html',
  styleUrls: ['./splide.component.css'],
})
export class SplideComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('splideRef') splideRef!: ElementRef;

  // State
  doctors: Doctor[] = [];
  loading = false;
  splide: any;

  // Fallback image
  fallbackImage = 'https://via.placeholder.com/300x400?text=No+Image';

  private doctorService = inject(DoctorService);

  ngOnInit(): void {
    this.fetchDoctors();
  }

  ngAfterViewInit(): void {
    // Initialize Splide only after doctors are loaded
    if (this.doctors.length > 0) {
      this.initializeSplide();
    }
  }

  ngOnDestroy(): void {
    if (this.splide) {
      this.splide.destroy();
    }
  }

  /**
   * Fetch doctors data from service
   */
  fetchDoctors(): void {
    this.loading = true;

    // Fetch featured doctors (you can modify the parameters as needed)
    this.doctorService.getDoctors('', '', '').subscribe({
      next: (data: any) => {
        // Limit to first 8 doctors for homepage display
        this.doctors = data.slice(0, 8);

        // Initialize splide after data is loaded
        setTimeout(() => {
          if (this.splideRef && this.doctors.length > 0) {
            this.initializeSplide();
          }
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load doctors:', err);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  /**
   * Initialize Splide carousel
   */
  initializeSplide(): void {
    if (this.splide) {
      this.splide.destroy();
    }

    this.splide = new Splide(this.splideRef.nativeElement, {
      type: 'loop',
      perPage: 3,
      perMove: 1,
      gap: '1rem',
      arrows: false, // Using custom arrows
      pagination: false,
      autoplay: true,
      interval: 4000,
      pauseOnHover: true,
      focus: 'center',
      trimSpace: false,
      breakpoints: {
        1024: {
          perPage: 2,
        },
        768: {
          perPage: 1,
          gap: '0.5rem',
        },
      },
    }).mount();
  }

  /**
   * Navigate to previous slide
   */
  prev(): void {
    if (this.splide) {
      this.splide.go('<');
    }
  }

  /**
   * Navigate to next slide
   */
  next(): void {
    if (this.splide) {
      this.splide.go('>');
    }
  }

  /**
   * Get formatted image URL
   * @param link - Image link from API
   * @returns Formatted image URL
   */
  getImageUrl(link: string | null): string {
    if (!link) return this.fallbackImage;
    return link.includes('//doctor')
      ? link.replace('//doctor', '/doctor')
      : link;
  }

  /**
   * Format display names for specialty, department, and gender
   * @param name - Raw name from API
   * @returns Formatted display name
   */
  formatDisplayName(name: string | null | undefined): string {
    if (!name) return '';

    // Handle common cases
    const formatted = name
      .replace(/_/g, ' ')           // Replace underscores with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space before capital letters
      .toLowerCase()                // Convert to lowercase first
      .split(' ')                   // Split into words
      .map(word => {
        // Capitalize first letter of each word
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');

    // Handle special cases
    const specialCases: { [key: string]: string } = {
      'Male': 'Male',
      'Female': 'Female',
      'Other': 'Other',
      'Cardiology': 'Cardiology',
      'Dermatology': 'Dermatology',
      'Neurology': 'Neurology',
      'Pediatrics': 'Pediatrics',
      'Orthopedics': 'Orthopedics',
      'General Medicine': 'General Medicine',
      'Internal Medicine': 'Internal Medicine',
      'Emergency Medicine': 'Emergency Medicine'
    };

    return specialCases[formatted] || formatted;
  }
}
