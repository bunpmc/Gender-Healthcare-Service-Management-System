import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private labelSubject = new BehaviorSubject<{ [url: string]: string }>({});
  label$ = this.labelSubject.asObservable();

  setLabel(url: string, label: string) {
    const labels = { ...this.labelSubject.value };
    labels[url] = label;
    this.labelSubject.next(labels);
  }

  getLabel(url: string): string | undefined {
    return this.labelSubject.value[url];
  }

  clearLabel(url: string) {
    const labels = { ...this.labelSubject.value };
    delete labels[url];
    this.labelSubject.next(labels);
  }
}
