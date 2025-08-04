import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ImageOptimizationService {

    /**
     * Compress image before upload
     */
    async compressImage(file: File, quality: number = 0.8, maxWidth: number = 1920): Promise<File> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                // Draw and compress
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file); // Return original if compression fails
                    }
                }, file.type, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Validate image file
     */
    validateImage(file: File): { valid: boolean; error?: string } {
        const maxSize = environment.production ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB prod, 10MB dev
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, or WebP.' };
        }

        if (file.size > maxSize) {
            return { valid: false, error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.` };
        }

        return { valid: true };
    }

    /**
     * Generate thumbnail
     */
    async generateThumbnail(file: File, size: number = 150): Promise<string> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();

            img.onload = () => {
                canvas.width = size;
                canvas.height = size;

                // Calculate crop area for square thumbnail
                const minSize = Math.min(img.width, img.height);
                const x = (img.width - minSize) / 2;
                const y = (img.height - minSize) / 2;

                ctx.drawImage(img, x, y, minSize, minSize, 0, 0, size, size);
                resolve(canvas.toDataURL());
            };

            img.src = URL.createObjectURL(file);
        });
    }
}
