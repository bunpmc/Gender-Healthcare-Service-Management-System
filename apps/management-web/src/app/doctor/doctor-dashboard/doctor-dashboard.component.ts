import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorHeaderComponent } from '../doctor-header/doctor-header.component';
import { DoctorSidebarComponent } from '../doctor-sidebar/doctor-sidebar.component';
import { RouterOutlet } from '@angular/router';



@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, DoctorHeaderComponent, DoctorSidebarComponent, RouterOutlet],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})

export class DoctorDashboardComponent {}

