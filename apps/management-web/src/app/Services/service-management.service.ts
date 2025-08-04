import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MedicalService } from '../models/database.interface';

@Injectable({
    providedIn: 'root'
})
export class ServiceManagementService {

    private services: MedicalService[] = [
        {
            service_id: '1',
            service_name: 'General Consultation',
            service_description: 'General medical consultation with physician',
            service_price: 500000,
            category_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            service_id: '2',
            service_name: 'Emergency Care',
            service_description: 'Emergency medical care and treatment',
            service_price: 2000000,
            category_id: '2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            service_id: '3',
            service_name: 'Minor Surgery',
            service_description: 'Minor surgical procedures',
            service_price: 5000000,
            category_id: '3',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    getServices(): Observable<MedicalService[]> {
        return of(this.services);
    }

    getMedicalServices(): Observable<MedicalService[]> {
        return this.getServices();
    }

    getServiceById(id: string): Observable<MedicalService | undefined> {
        const service = this.services.find(s => s.service_id === id);
        return of(service);
    }

    addService(service: Omit<MedicalService, 'service_id' | 'created_at' | 'updated_at'>): Observable<MedicalService> {
        const newService: MedicalService = {
            ...service,
            service_id: (this.services.length + 1).toString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.services.push(newService);
        return of(newService);
    }

    updateService(id: string, service: Partial<MedicalService>): Observable<MedicalService | null> {
        const index = this.services.findIndex(s => s.service_id === id);
        if (index !== -1) {
            this.services[index] = {
                ...this.services[index],
                ...service,
                updated_at: new Date().toISOString()
            };
            return of(this.services[index]);
        }
        return of(null);
    }

    deleteService(id: string): Observable<boolean> {
        const index = this.services.findIndex(s => s.service_id === id);
        if (index !== -1) {
            this.services.splice(index, 1);
            return of(true);
        }
        return of(false);
    }

    getServicesByCategory(categoryId: string): Observable<MedicalService[]> {
        const filteredServices = this.services.filter(s => s.category_id === categoryId);
        return of(filteredServices);
    }

    toggleMedicalServiceStatus(serviceId: string): Observable<MedicalService | null> {
        const service = this.services.find(s => s.service_id === serviceId);
        if (service) {
            service.is_active = !service.is_active;
            service.updated_at = new Date().toISOString();
            return of(service);
        }
        return of(null);
    }

    deleteMedicalService(serviceId: string): Observable<boolean> {
        return this.deleteService(serviceId);
    }

    addMedicalService(service: Omit<MedicalService, 'service_id' | 'created_at' | 'updated_at'>): Observable<MedicalService> {
        return this.addService(service);
    }

    updateMedicalService(service: MedicalService): Observable<MedicalService | null> {
        return this.updateService(service.service_id, service);
    }
}
