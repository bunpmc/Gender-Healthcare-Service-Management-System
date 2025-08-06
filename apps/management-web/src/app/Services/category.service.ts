import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MedicalServiceCategory } from '../models/database.interface';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {

    private categories: MedicalServiceCategory[] = [
        {
            category_id: '1',
            category_name: 'Consultation',
            category_description: 'General medical consultation',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            category_id: '2',
            category_name: 'Emergency',
            category_description: 'Emergency medical services',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            category_id: '3',
            category_name: 'Surgery',
            category_description: 'Surgical procedures',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    getCategories(): Observable<MedicalServiceCategory[]> {
        return of(this.categories);
    }

    getServiceCategories(): Observable<MedicalServiceCategory[]> {
        return this.getCategories();
    }

    getCategoryById(id: string): Observable<MedicalServiceCategory | undefined> {
        const category = this.categories.find(c => c.category_id === id);
        return of(category);
    }

    addCategory(category: Omit<MedicalServiceCategory, 'category_id' | 'created_at' | 'updated_at'>): Observable<MedicalServiceCategory> {
        const newCategory: MedicalServiceCategory = {
            ...category,
            category_id: (this.categories.length + 1).toString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.categories.push(newCategory);
        return of(newCategory);
    }

    updateCategory(id: string, category: Partial<MedicalServiceCategory>): Observable<MedicalServiceCategory | null> {
        const index = this.categories.findIndex(c => c.category_id === id);
        if (index !== -1) {
            this.categories[index] = {
                ...this.categories[index],
                ...category,
                updated_at: new Date().toISOString()
            };
            return of(this.categories[index]);
        }
        return of(null);
    }

    deleteCategory(id: string): Observable<boolean> {
        const index = this.categories.findIndex(c => c.category_id === id);
        if (index !== -1) {
            this.categories.splice(index, 1);
            return of(true);
        }
        return of(false);
    }

    createServiceCategory(category: Omit<MedicalServiceCategory, 'category_id' | 'created_at' | 'updated_at'>): Observable<MedicalServiceCategory> {
        return this.addCategory(category);
    }
}
