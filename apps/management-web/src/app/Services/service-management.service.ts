import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseService } from '../supabase.service';
import { Service } from '../models/service.interface';

@Injectable({
  providedIn: 'root'
})
export class ServiceManagementService {

  constructor(private supabaseService: SupabaseService) {}

  async getMedicalServices(): Promise<Service[]> {
    try {
      const result = await this.supabaseService.getMedicalServices();
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error fetching medical services:', result.error);
        throw new Error(result.error || 'Failed to fetch medical services');
      }
    } catch (error) {
      console.error('Error in getMedicalServices:', error);
      throw error;
    }
  }

  async getMedicalServiceById(serviceId: string): Promise<Service> {
    try {
      const result = await this.supabaseService.getMedicalServiceById(serviceId);
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error fetching medical service:', result.error);
        throw new Error(result.error || 'Failed to fetch medical service');
      }
    } catch (error) {
      console.error('Error in getMedicalServiceById:', error);
      throw error;
    }
  }

  async addMedicalService(service: Omit<Service, 'service_id'>): Promise<Service> {
    try {
      const result = await this.supabaseService.createMedicalService(service);
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error creating medical service:', result.error);
        throw new Error(result.error || 'Failed to create medical service');
      }
    } catch (error) {
      console.error('Error in addMedicalService:', error);
      throw error;
    }
  }

  async updateMedicalService(service: Service): Promise<Service> {
    try {
      const result = await this.supabaseService.updateMedicalService(service);
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error updating medical service:', result.error);
        throw new Error(result.error || 'Failed to update medical service');
      }
    } catch (error) {
      console.error('Error in updateMedicalService:', error);
      throw error;
    }
  }

  async deleteMedicalService(serviceId: string): Promise<void> {
    try {
      const result = await this.supabaseService.deleteMedicalService(serviceId);
      if (!result.success) {
        console.error('Error deleting medical service:', result.error);
        throw new Error(result.error || 'Failed to delete medical service');
      }
    } catch (error) {
      console.error('Error in deleteMedicalService:', error);
      throw error;
    }
  }

  async toggleMedicalServiceStatus(serviceId: string, isActive: boolean): Promise<void> {
    try {
      const result = await this.supabaseService.toggleMedicalServiceStatus(serviceId, isActive);
      if (!result.success) {
        console.error('Error toggling medical service status:', result.error);
        throw new Error(result.error || 'Failed to toggle service status');
      }
    } catch (error) {
      console.error('Error in toggleMedicalServiceStatus:', error);
      throw error;
    }
  }

  async searchMedicalServices(query: string): Promise<Service[]> {
    try {
      const services = await this.getMedicalServices();
      if (!query.trim()) {
        return services;
      }

      const searchTerm = query.toLowerCase().trim();
      return services.filter(service =>
        service.service_name.toLowerCase().includes(searchTerm) ||
        service.excerpt?.toLowerCase().includes(searchTerm) ||
        (service as any).category_name?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error in searchMedicalServices:', error);
      throw error;
    }
  }
}
