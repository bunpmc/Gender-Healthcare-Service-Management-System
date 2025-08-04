import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { SupabaseService } from '../supabase.service';
import { Staff } from '../models/staff.interface';
import { supabase } from '../supabase-client';

export interface StaffFetchOptions {
    role?: 'doctor' | 'receptionist';
    includeUnavailable?: boolean;
    includeInactive?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class StaffDataService {

    constructor(private supabaseService: SupabaseService) { }

    /**
     * Fetch staff members directly from staff_members table
     * with proper avatar URL construction
     */
    async fetchStaff(options: StaffFetchOptions = {}): Promise<{ success: boolean; data?: Staff[]; error?: string }> {
        try {
            // Build query conditions
            let query = supabase
                .from('staff_members')
                .select('*');

            // Filter by role if specified
            if (options.role) {
                query = query.eq('role', options.role);
            }

            // Filter by availability if specified
            if (!options.includeUnavailable) {
                query = query.eq('is_available', true);
            }

            // Filter by status if specified
            if (!options.includeInactive) {
                query = query.neq('staff_status', 'inactive');
            }

            const { data: staffData, error } = await query;

            if (error) {
                console.error('Error fetching staff:', error);
                return { success: false, error: error.message };
            }

            if (!staffData) {
                return { success: true, data: [] };
            }

            // Process staff data with proper avatar URLs
            const processedStaff: Staff[] = await Promise.all(
                staffData.map(async (member: any) => {
                    let avatarUrl = null;

                    // Construct avatar URL from storage if image_link exists
                    if (member.image_link) {
                        const { data: publicData } = await supabase.storage
                            .from('staff-uploads')
                            .getPublicUrl(member.image_link);
                        avatarUrl = publicData.publicUrl;
                        console.log(`Avatar URL for ${member.full_name}:`, avatarUrl); // Debug log
                    }

                    return {
                        // Main properties
                        staff_id: member.staff_id,
                        full_name: member.full_name,
                        working_email: member.working_email,
                        role: member.role,
                        hired_at: member.hired_at,
                        is_available: member.is_available, // Sử dụng đúng giá trị từ database
                        staff_status: member.staff_status,
                        years_experience: member.years_experience,
                        gender: member.gender,
                        languages: member.languages || [],
                        image_link: member.image_link,

                        // Avatar properties
                        avatar_url: avatarUrl || undefined,
                        imageUrl: avatarUrl || undefined, // Legacy compatibility

                        // Enhanced display properties
                        experience_display: member.years_experience
                            ? `${member.years_experience} ${member.years_experience === 1 ? 'year' : 'years'}`
                            : '0 years',

                        // Legacy compatibility properties
                        id: member.staff_id,
                        name: member.full_name,
                        email: member.working_email,
                        status: member.staff_status === 'active' ? 'active' : 'inactive',
                        startDate: member.hired_at,
                        isAvailable: member.is_available, // Sử dụng đúng giá trị từ database
                        department: member.role === 'doctor' ? 'Medical' : 'Administration'
                    } as Staff;
                })
            );

            console.log(`Fetched ${processedStaff.length} staff members successfully`);
            return { success: true, data: processedStaff };

        } catch (error) {
            console.error('Error in fetchStaff:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Fetch doctors only
     */
    async fetchDoctors(includeUnavailable = false, includeInactive = false): Promise<{ success: boolean; data?: Staff[]; error?: string }> {
        return this.fetchStaff({
            role: 'doctor',
            includeUnavailable,
            includeInactive
        });
    }

    /**
     * Fetch receptionists only
     */
    async fetchReceptionists(includeUnavailable = false, includeInactive = false): Promise<{ success: boolean; data?: Staff[]; error?: string }> {
        return this.fetchStaff({
            role: 'receptionist',
            includeUnavailable,
            includeInactive
        });
    }

    /**
     * Fetch all staff members
     */
    async fetchAllStaff(includeUnavailable = false, includeInactive = false): Promise<{ success: boolean; data?: Staff[]; error?: string }> {
        return this.fetchStaff({
            includeUnavailable,
            includeInactive
        });
    }

    /**
     * Fetch a single staff member by ID
     */
    async fetchStaffById(staffId: string): Promise<{ success: boolean; data?: Staff; error?: string }> {
        try {
            const { data: staffData, error } = await supabase
                .from('staff_members')
                .select('*')
                .eq('staff_id', staffId)
                .single();

            if (error) {
                console.error('Error fetching staff by ID:', error);
                return { success: false, error: error.message };
            }

            if (!staffData) {
                return { success: false, error: 'Staff member not found' };
            }

            // Process single staff member
            let avatarUrl = null;
            if (staffData.image_link) {
                const { data: publicData } = await supabase.storage
                    .from('staff-uploads')
                    .getPublicUrl(staffData.image_link);
                avatarUrl = publicData.publicUrl;
            }

            const processedStaff: Staff = {
                // Main properties
                staff_id: staffData.staff_id,
                full_name: staffData.full_name,
                working_email: staffData.working_email,
                role: staffData.role,
                hired_at: staffData.hired_at,
                is_available: staffData.is_available, // Sử dụng đúng giá trị từ database
                staff_status: staffData.staff_status,
                years_experience: staffData.years_experience,
                gender: staffData.gender,
                languages: staffData.languages || [],
                image_link: staffData.image_link,

                // Avatar properties
                avatar_url: avatarUrl || undefined,
                imageUrl: avatarUrl || undefined,

                // Enhanced display properties
                experience_display: staffData.years_experience
                    ? `${staffData.years_experience} ${staffData.years_experience === 1 ? 'year' : 'years'}`
                    : '0 years',

                // Legacy compatibility properties
                id: staffData.staff_id,
                name: staffData.full_name,
                email: staffData.working_email,
                status: staffData.staff_status === 'active' ? 'active' : 'inactive',
                startDate: staffData.hired_at
            };

            return { success: true, data: processedStaff };

        } catch (error) {
            console.error('Error in fetchStaffById:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
