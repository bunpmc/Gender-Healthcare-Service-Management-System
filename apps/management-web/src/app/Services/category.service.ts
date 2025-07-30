import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseService } from '../supabase.service';
import { Category } from '../models/category.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private supabaseService: SupabaseService) {}

  async getServiceCategories(): Promise<Category[]> {
    try {
      const result = await this.supabaseService.getServiceCategories();
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error fetching service categories:', result.error);
        throw new Error(result.error || 'Failed to fetch service categories');
      }
    } catch (error) {
      console.error('Error in getServiceCategories:', error);
      throw error;
    }
  }

  async getServiceCategoryById(categoryId: string): Promise<Category> {
    try {
      const result = await this.supabaseService.getServiceCategoryById(categoryId);
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error fetching service category:', result.error);
        throw new Error(result.error || 'Failed to fetch service category');
      }
    } catch (error) {
      console.error('Error in getServiceCategoryById:', error);
      throw error;
    }
  }

  async createServiceCategory(category: Omit<Category, 'category_id'>): Promise<Category> {
    try {
      const result = await this.supabaseService.createServiceCategory(category);
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error creating service category:', result.error);
        throw new Error(result.error || 'Failed to create service category');
      }
    } catch (error) {
      console.error('Error in createServiceCategory:', error);
      throw error;
    }
  }

  async updateServiceCategory(category: Category): Promise<Category> {
    try {
      const result = await this.supabaseService.updateServiceCategory(category);
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error updating service category:', result.error);
        throw new Error(result.error || 'Failed to update service category');
      }
    } catch (error) {
      console.error('Error in updateServiceCategory:', error);
      throw error;
    }
  }

  async deleteServiceCategory(categoryId: string): Promise<void> {
    try {
      const result = await this.supabaseService.deleteServiceCategory(categoryId);
      if (!result.success) {
        console.error('Error deleting service category:', result.error);
        throw new Error(result.error || 'Failed to delete service category');
      }
    } catch (error) {
      console.error('Error in deleteServiceCategory:', error);
      throw error;
    }
  }
}
