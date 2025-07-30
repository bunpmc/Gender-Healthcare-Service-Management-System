import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from './supabase-client';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-debug-supabase',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Supabase Debug Console</h1>
        
        <!-- Connection Test -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">Connection Test</h2>
          <button 
            (click)="testConnection()" 
            [disabled]="testing"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
            {{ testing ? 'Testing...' : 'Test Connection' }}
          </button>
          <div *ngIf="connectionResult" class="mt-4 p-4 rounded" 
               [class]="connectionResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
            {{ connectionResult.message }}
          </div>
        </div>

        <!-- Table Checks -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">Table Structure Check</h2>
          <button 
            (click)="checkTables()" 
            [disabled]="checking"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
            {{ checking ? 'Checking...' : 'Check Tables' }}
          </button>
          <div *ngIf="tableResults.length > 0" class="mt-4">
            <div *ngFor="let result of tableResults" class="mb-2 p-2 rounded"
                 [class]="result.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
              {{ result.table }}: {{ result.exists ? 'EXISTS' : 'NOT FOUND' }}
              <span *ngIf="result.count !== undefined"> ({{ result.count }} records)</span>
            </div>
          </div>
        </div>

        <!-- Service Test -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">Service Methods Test</h2>
          <button 
            (click)="testServiceMethods()" 
            [disabled]="testingService"
            class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400">
            {{ testingService ? 'Testing...' : 'Test Service Methods' }}
          </button>
          <div *ngIf="serviceResults.length > 0" class="mt-4">
            <div *ngFor="let result of serviceResults" class="mb-2 p-2 rounded"
                 [class]="result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
              <strong>{{ result.method }}:</strong> {{ result.message }}
              <pre *ngIf="result.data" class="mt-2 text-xs bg-gray-100 p-2 rounded">{{ result.data | json }}</pre>
            </div>
          </div>
        </div>

        <!-- Raw Query Test -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Raw Query Test</h2>
          <button 
            (click)="testRawQueries()" 
            [disabled]="testingRaw"
            class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400">
            {{ testingRaw ? 'Testing...' : 'Test Raw Queries' }}
          </button>
          <div *ngIf="rawResults.length > 0" class="mt-4">
            <div *ngFor="let result of rawResults" class="mb-4 p-4 border rounded">
              <h4 class="font-semibold">{{ result.query }}</h4>
              <div [class]="result.success ? 'text-green-600' : 'text-red-600'">
                {{ result.message }}
              </div>
              <pre *ngIf="result.data" class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">{{ result.data | json }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DebugSupabaseComponent implements OnInit {
  testing = false;
  checking = false;
  testingService = false;
  testingRaw = false;
  
  connectionResult: any = null;
  tableResults: any[] = [];
  serviceResults: any[] = [];
  rawResults: any[] = [];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    console.log('Debug component initialized');
    console.log('Supabase client:', supabase);
  }

  async testConnection() {
    this.testing = true;
    this.connectionResult = null;
    
    try {
      console.log('Testing Supabase connection...');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('patients')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Connection error:', error);
        this.connectionResult = {
          success: false,
          message: `Connection failed: ${error.message}`
        };
      } else {
        console.log('Connection successful:', data);
        this.connectionResult = {
          success: true,
          message: `Connection successful! Found ${data} patients.`
        };
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      this.connectionResult = {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    } finally {
      this.testing = false;
    }
  }

  async checkTables() {
    this.checking = true;
    this.tableResults = [];
    
    const tables = [
      'patients', 'staff_members', 'appointments', 'service_categories', 
      'medical_services', 'doctor_details', 'notifications', 'blog_posts'
    ];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          this.tableResults.push({
            table,
            exists: false,
            message: error.message
          });
        } else {
          this.tableResults.push({
            table,
            exists: true,
            count
          });
        }
      } catch (error: any) {
        this.tableResults.push({
          table,
          exists: false,
          message: error.message
        });
      }
    }
    
    this.checking = false;
  }

  async testServiceMethods() {
    this.testingService = true;
    this.serviceResults = [];
    
    // Test getAdminDashboardStats
    try {
      const stats = await this.supabaseService.getAdminDashboardStats();
      this.serviceResults.push({
        method: 'getAdminDashboardStats',
        success: true,
        message: 'Success',
        data: stats
      });
    } catch (error: any) {
      this.serviceResults.push({
        method: 'getAdminDashboardStats',
        success: false,
        message: error.message
      });
    }

    // Test getRecentActivities
    try {
      const activities = await this.supabaseService.getRecentActivities();
      this.serviceResults.push({
        method: 'getRecentActivities',
        success: true,
        message: 'Success',
        data: activities
      });
    } catch (error: any) {
      this.serviceResults.push({
        method: 'getRecentActivities',
        success: false,
        message: error.message
      });
    }

    // Test getPatients
    try {
      const patients = await this.supabaseService.getPatients(1, 10);
      this.serviceResults.push({
        method: 'getPatients',
        success: true,
        message: 'Success',
        data: patients
      });
    } catch (error: any) {
      this.serviceResults.push({
        method: 'getPatients',
        success: false,
        message: error.message
      });
    }
    
    this.testingService = false;
  }

  async testRawQueries() {
    this.testingRaw = true;
    this.rawResults = [];
    
    const queries = [
      {
        name: 'Select all patients',
        query: async () => await supabase.from('patients').select('*').limit(5)
      },
      {
        name: 'Select all staff',
        query: async () => await supabase.from('staff_members').select('*').limit(5)
      },
      {
        name: 'Select all appointments',
        query: async () => await supabase.from('appointments').select('*').limit(5)
      },
      {
        name: 'Select service categories',
        query: async () => await supabase.from('service_categories').select('*')
      }
    ];
    
    for (const test of queries) {
      try {
        const result = await test.query();
        this.rawResults.push({
          query: test.name,
          success: !result.error,
          message: result.error ? result.error.message : `Found ${result.data?.length || 0} records`,
          data: result.data
        });
      } catch (error: any) {
        this.rawResults.push({
          query: test.name,
          success: false,
          message: error.message
        });
      }
    }
    
    this.testingRaw = false;
  }
}
