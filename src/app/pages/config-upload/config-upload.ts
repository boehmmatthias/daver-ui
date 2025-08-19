import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { DaverApi } from '../../services/daver-api';
import { HttpEvent, HttpEventType } from '@angular/common/http';

@Component({
  selector: 'daver-config-upload',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './config-upload.html',
  styleUrl: './config-upload.scss'
})
export class ConfigUpload {
  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  isUploading = signal(false);
  isAnalyzing = signal(false);
  errorMessage = signal<string | null>(null);
  private daverApi = inject(DaverApi)
  private router = inject(Router)

  constructor() {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    // Check if file type is supported
    const supportedTypes = ['.yaml'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (supportedTypes.includes(fileExtension)) {
      this.selectedFile.set(file);
    } else {
      // You might want to show an error message here
      console.error('Unsupported file type');
    }
  }

  removeFile(): void {
    this.selectedFile.set(null);
  }

  uploadConfig(): void {
    const file = this.selectedFile();
    if (!file) return;
    
    // Clear any previous errors
    this.errorMessage.set(null);
    this.isUploading.set(true);
    
    this.daverApi.uploadConfig(file).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percentDone = Math.round(100 * event.loaded / (event.total || 1));
          console.log(`File is ${percentDone}% uploaded.`);
          
          // When upload is complete, switch to analyzing mode
          if (percentDone === 100) {
            this.isUploading.set(false);
            this.isAnalyzing.set(true);
          }
        } else if (event.type === HttpEventType.Response) {
          // Analysis is complete, navigate to chat
          this.isAnalyzing.set(false);
          this.router.navigate(['/chat']);
        }
      },
      error: (error: any) => {
        console.error('File upload failed:', error);
        this.isUploading.set(false);
        this.isAnalyzing.set(false);
        
        // Set user-friendly error message
        let message = 'Upload failed. Please try again.';
        if (error.status === 413) {
          message = 'File too large. Please select a smaller configuration file.';
        } else if (error.status === 400) {
          message = 'Invalid configuration file. Please check your YAML format.';
        } else if (error.status === 0) {
          message = 'Network error. Please check your connection and try again.';
        } else if (error.status >= 500) {
          message = 'Server error. Please try again later.';
        }
        
        this.errorMessage.set(message);
      }
    });
  }
}
