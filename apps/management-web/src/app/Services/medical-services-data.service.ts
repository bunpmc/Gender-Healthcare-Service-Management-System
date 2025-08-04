import { Injectable } from '@angular/core';
import { supabase } from '../supabase-client';
import { Service } from '../models/service.interface';
import { Logger } from '../utils/logger.util';

export interface MedicalServiceFetchOptions {
    includeInactive?: boolean;
    categoryId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class MedicalServicesDataService {

    constructor() { }

    /**
     * Fetch medical services directly from medical_services table
     * with proper image URL construction from service-uploads bucket
     */
    async fetchServices(options: MedicalServiceFetchOptions = {}): Promise<{ success: boolean; data?: Service[]; error?: string }> {
        try {
            // Build query with JOIN to get category names
            let query = supabase
                .from('medical_services')
                .select(`
                    service_id,
                    category_id,
                    service_name,
                    service_cost,
                    duration_minutes,
                    is_active,
                    image_link,
                    service_description,
                    excerpt,
                    service_categories(category_name)
                `);

            // Filter by active status if specified
            if (!options.includeInactive) {
                query = query.eq('is_active', true);
            }

            // Filter by category if specified
            if (options.categoryId) {
                query = query.eq('category_id', options.categoryId);
            }

            const { data: servicesData, error } = await query;

            if (error) {
                console.error('Error fetching medical services:', error);
                return { success: false, error: error.message };
            }

            if (!servicesData) {
                return { success: true, data: [] };
            }

            // Process services data with proper image URLs
            const processedServices: Service[] = servicesData.map((service: any) => {
                let imageUrl = null;

                // Construct image URL from storage if image_link exists
                if (service.image_link) {
                    const { data: publicData } = supabase.storage
                        .from('service-uploads')
                        .getPublicUrl(service.image_link);
                    imageUrl = publicData.publicUrl;
                    Logger.log(`Service image URL for ${service.service_name}:`, imageUrl);
                }

                return {
                    service_id: service.service_id,
                    category_id: service.category_id,
                    service_name: service.service_name,
                    service_cost: service.service_cost,
                    duration_minutes: service.duration_minutes,
                    is_active: service.is_active,
                    image_link: service.image_link,
                    service_description: service.service_description,
                    excerpt: service.excerpt,
                    // Add category name from joined data
                    category_name: (service.service_categories as any)?.category_name || 'Unknown Category',
                    // Add computed image URL
                    imageUrl: imageUrl || undefined
                };
            });

            return { success: true, data: processedServices };

        } catch (error) {
            console.error('Error in fetchServices:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Fetch service by ID with proper image URL construction
     */
    async fetchServiceById(serviceId: string): Promise<{ success: boolean; data?: Service; error?: string }> {
        try {
            const { data: serviceData, error } = await supabase
                .from('medical_services')
                .select(`
                    service_id,
                    category_id,
                    service_name,
                    service_cost,
                    duration_minutes,
                    is_active,
                    image_link,
                    service_description,
                    excerpt,
                    service_categories(category_name)
                `)
                .eq('service_id', serviceId)
                .single();

            if (error) {
                console.error('Error fetching service by ID:', error);
                return { success: false, error: error.message };
            }

            if (!serviceData) {
                return { success: false, error: 'Service not found' };
            }

            // Construct image URL from storage if image_link exists
            let imageUrl = null;
            if (serviceData.image_link) {
                const { data: publicData } = supabase.storage
                    .from('service-uploads')
                    .getPublicUrl(serviceData.image_link);
                imageUrl = publicData.publicUrl;
            }

            const processedService: Service = {
                service_id: serviceData.service_id,
                category_id: serviceData.category_id,
                service_name: serviceData.service_name,
                service_cost: serviceData.service_cost,
                duration_minutes: serviceData.duration_minutes,
                is_active: serviceData.is_active,
                image_link: serviceData.image_link,
                service_description: serviceData.service_description,
                excerpt: serviceData.excerpt,
                category_name: (serviceData.service_categories as any)?.category_name || 'Unknown Category',
                imageUrl: imageUrl || undefined
            };

            return { success: true, data: processedService };

        } catch (error) {
            console.error('Error in fetchServiceById:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Update medical service directly in medical_services table
     * Excludes image_link from updates for security
     */
    async updateService(serviceId: string, serviceData: Partial<Service>): Promise<{ success: boolean; data?: Service; error?: string }> {
        try {
            // Remove image_link and computed properties from update data for security
            const { image_link, imageUrl, category_name, service_id, ...updateData } = serviceData;

            const { data: updatedData, error } = await supabase
                .from('medical_services')
                .update(updateData)
                .eq('service_id', serviceId)
                .select(`
                    service_id,
                    category_id,
                    service_name,
                    service_cost,
                    duration_minutes,
                    is_active,
                    image_link,
                    service_description,
                    excerpt,
                    service_categories(category_name)
                `)
                .single();

            if (error) {
                console.error('Error updating service:', error);
                return { success: false, error: error.message };
            }

            // Process the updated data with image URL
            let constructedImageUrl = null;
            if (updatedData.image_link) {
                const { data: publicData } = supabase.storage
                    .from('service-uploads')
                    .getPublicUrl(updatedData.image_link);
                constructedImageUrl = publicData.publicUrl;
            }

            const processedService: Service = {
                service_id: updatedData.service_id,
                category_id: updatedData.category_id,
                service_name: updatedData.service_name,
                service_cost: updatedData.service_cost,
                duration_minutes: updatedData.duration_minutes,
                is_active: updatedData.is_active,
                image_link: updatedData.image_link,
                service_description: updatedData.service_description,
                excerpt: updatedData.excerpt,
                category_name: (updatedData.service_categories as any)?.category_name || 'Unknown Category',
                imageUrl: constructedImageUrl || undefined
            };

            return { success: true, data: processedService };

        } catch (error) {
            console.error('Error in updateService:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Create new medical service
     */
    async createService(serviceData: Omit<Service, 'service_id'>): Promise<{ success: boolean; data?: Service; error?: string }> {
        try {
            // Remove computed properties from create data
            const { imageUrl, category_name, ...createData } = serviceData;

            // If no image_link provided, use default image
            if (!createData.image_link) {
                createData.image_link = 'default-service.png';
            }

            const { data: newServiceData, error } = await supabase
                .from('medical_services')
                .insert([createData])
                .select(`
                    service_id,
                    category_id,
                    service_name,
                    service_cost,
                    duration_minutes,
                    is_active,
                    image_link,
                    service_description,
                    excerpt,
                    service_categories(category_name)
                `)
                .single();

            if (error) {
                console.error('Error creating service:', error);
                return { success: false, error: error.message };
            }

            // Process the new data with image URL
            let constructedImageUrl = null;
            if (newServiceData.image_link) {
                const { data: publicData } = supabase.storage
                    .from('service-uploads')
                    .getPublicUrl(newServiceData.image_link);
                constructedImageUrl = publicData.publicUrl;
            }

            const processedService: Service = {
                service_id: newServiceData.service_id,
                category_id: newServiceData.category_id,
                service_name: newServiceData.service_name,
                service_cost: newServiceData.service_cost,
                duration_minutes: newServiceData.duration_minutes,
                is_active: newServiceData.is_active,
                image_link: newServiceData.image_link,
                service_description: newServiceData.service_description,
                excerpt: newServiceData.excerpt,
                category_name: (newServiceData.service_categories as any)?.category_name || 'Unknown Category',
                imageUrl: constructedImageUrl || undefined
            };

            return { success: true, data: processedService };

        } catch (error) {
            console.error('Error in createService:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Delete medical service
     */
    async deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('medical_services')
                .delete()
                .eq('service_id', serviceId);

            if (error) {
                console.error('Error deleting service:', error);
                return { success: false, error: error.message };
            }

            return { success: true };

        } catch (error) {
            console.error('Error in deleteService:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Fetch service categories for dropdown/selection
     */
    async fetchCategories(): Promise<{ success: boolean; data?: any[]; error?: string }> {
        try {
            const { data: categoriesData, error } = await supabase
                .from('service_categories')
                .select('*')
                .order('category_name');

            if (error) {
                console.error('Error fetching categories:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: categoriesData || [] };

        } catch (error) {
            console.error('Error in fetchCategories:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Create new service category
     */
    async createCategory(categoryData: { category_name: string; description?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const { data: newCategoryData, error } = await supabase
                .from('service_categories')
                .insert([{
                    category_name: categoryData.category_name,
                    category_description: categoryData.description || null
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating category:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: newCategoryData };

        } catch (error) {
            console.error('Error in createCategory:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Upload image to service-uploads bucket
     */
    async uploadServiceImage(file: File): Promise<{ success: boolean; data?: string; error?: string }> {
        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `service_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('service-uploads')
                .upload(fileName, file);

            if (error) {
                console.error('Error uploading file:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: data.path };

        } catch (error) {
            console.error('Error in uploadServiceImage:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Delete image from service-uploads bucket
     */
    async deleteServiceImage(imagePath: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase.storage
                .from('service-uploads')
                .remove([imagePath]);

            if (error) {
                console.error('Error deleting file:', error);
                return { success: false, error: error.message };
            }

            return { success: true };

        } catch (error) {
            console.error('Error in deleteServiceImage:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Get default image URL for services
     */
    getDefaultServiceImageUrl(): string {
        const { data } = supabase.storage
            .from('service-uploads')
            .getPublicUrl('default-service.png');

        return data.publicUrl;
    }

    /**
     * Check if default image exists, if not, create a placeholder
     */
    async ensureDefaultImageExists(): Promise<boolean> {
        try {
            // Check if default image exists
            const { data, error } = await supabase.storage
                .from('service-uploads')
                .list('', {
                    search: 'default-service.png'
                });

            if (error) {
                console.error('Error checking default image:', error);
                return false;
            }

            // If file exists, return true
            if (data && data.length > 0) {
                return true;
            }

            // If file doesn't exist, we'll log it but continue
            // The admin should upload a default-service.png file to the bucket
            console.warn('Default service image (default-service.png) not found in service-uploads bucket. Please upload a default image.');
            return false;

        } catch (error) {
            console.error('Error ensuring default image exists:', error);
            return false;
        }
    }
}
