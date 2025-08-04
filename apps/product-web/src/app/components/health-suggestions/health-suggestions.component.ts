import { Component, Input, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthPredictionService, HealthSuggestion, PredictionResult, ServiceCategory } from '../../services/health-prediction.service';
import { PeriodEntry, PeriodStats } from '../../models/period-tracking.model';

@Component({
  selector: 'app-health-suggestions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-suggestions-container">
      <!-- Predictions Section -->
      <div class="predictions-card">
        <h3 class="section-title">
          <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Your Cycle Predictions
        </h3>
        
        @if (predictions()) {
          <div class="predictions-grid">
            <div class="prediction-item">
              <div class="prediction-label">Next Period</div>
              <div class="prediction-value">{{ formatDate(predictions()!.nextPeriodDate) }}</div>
            </div>
            
            <div class="prediction-item">
              <div class="prediction-label">Fertile Window</div>
              <div class="prediction-value">
                {{ formatDate(predictions()!.fertileWindow.start) }} - 
                {{ formatDate(predictions()!.fertileWindow.end) }}
              </div>
            </div>
            
            <div class="prediction-item">
              <div class="prediction-label">Ovulation</div>
              <div class="prediction-value">{{ formatDate(predictions()!.ovulationDate) }}</div>
            </div>
            
            <div class="prediction-item">
              <div class="prediction-label">Cycle Health</div>
              <div class="prediction-value" [ngClass]="getCycleHealthClass()">
                {{ getCycleHealthText() }}
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Suggestions Section -->
      <div class="suggestions-section">
        <h3 class="section-title">
          <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          Health Recommendations
        </h3>

        @if (predictions()?.suggestions && predictions()!.suggestions.length) {
          <div class="suggestions-grid">
            @for (suggestion of predictions()!.suggestions; track suggestion.id) {
              <div class="suggestion-card" [ngClass]="getSuggestionClass(suggestion)">
                <div class="suggestion-header">
                  <div class="suggestion-category">
                    <span class="category-icon">{{ getCategoryIcon(suggestion.category) }}</span>
                    <span class="category-text">{{ getCategoryText(suggestion.category) }}</span>
                  </div>
                  <div class="suggestion-priority" [ngClass]="'priority-' + suggestion.priority">
                    {{ suggestion.priority.toUpperCase() }}
                  </div>
                </div>
                
                <h4 class="suggestion-title">{{ suggestion.title }}</h4>
                <p class="suggestion-description">{{ suggestion.description }}</p>
                
                @if (suggestion.actionItems.length) {
                  <div class="action-items">
                    <h5 class="action-title">Recommended Actions:</h5>
                    <ul class="action-list">
                      @for (action of suggestion.actionItems; track action) {
                        <li>{{ action }}</li>
                      }
                    </ul>
                  </div>
                }
                
                <div class="suggestion-footer">
                  <div class="confidence-bar">
                    <div class="confidence-label">Confidence: {{ suggestion.confidence }}%</div>
                    <div class="confidence-progress">
                      <div class="confidence-fill" [style.width.%]="suggestion.confidence"></div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="no-suggestions">
            <p>No specific recommendations at this time. Keep tracking your cycle for personalized insights!</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .health-suggestions-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      space-y: 24px;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }

    .predictions-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      margin-bottom: 24px;
    }

    .predictions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .prediction-item {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .prediction-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .prediction-value {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .cycle-excellent { color: #059669; }
    .cycle-good { color: #0891b2; }
    .cycle-concerning { color: #d97706; }
    .cycle-needs_attention { color: #dc2626; }

    .suggestions-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .suggestion-card {
      background: #fafafa;
      border-radius: 12px;
      padding: 20px;
      border: 2px solid #e5e7eb;
      transition: all 0.2s ease;
    }

    .suggestion-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .suggestion-urgent { border-color: #dc2626; background: #fef2f2; }
    .suggestion-high { border-color: #d97706; background: #fffbeb; }
    .suggestion-medium { border-color: #0891b2; background: #f0f9ff; }
    .suggestion-low { border-color: #059669; background: #f0fdf4; }

    .suggestion-header {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 12px;
    }

    .suggestion-category {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .category-icon {
      font-size: 1.25rem;
    }

    .category-text {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    .suggestion-priority {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .priority-urgent { background: #dc2626; color: white; }
    .priority-high { background: #d97706; color: white; }
    .priority-medium { background: #0891b2; color: white; }
    .priority-low { background: #059669; color: white; }

    .suggestion-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .suggestion-description {
      color: #4b5563;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .action-items {
      margin-bottom: 16px;
    }

    .action-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .action-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .action-list li {
      padding: 4px 0;
      padding-left: 16px;
      position: relative;
      color: #4b5563;
      font-size: 0.875rem;
    }

    .action-list li::before {
      content: "•";
      color: #6b7280;
      position: absolute;
      left: 0;
    }

    .suggestion-footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
    }

    .confidence-label {
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .confidence-progress {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #059669, #0891b2);
      transition: width 0.3s ease;
    }

    .no-suggestions {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .health-suggestions-container {
        padding: 16px;
      }
      
      .predictions-grid {
        grid-template-columns: 1fr;
      }
      
      .suggestions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HealthSuggestionsComponent implements OnInit, OnChanges {
  @Input() periodHistory: PeriodEntry[] = [];
  @Input() periodStats: PeriodStats | null = null;

  predictions = signal<PredictionResult | null>(null);

  constructor(private healthPredictionService: HealthPredictionService) { }

  ngOnInit() {
    this.generatePredictions();
  }

  ngOnChanges() {
    this.generatePredictions();
  }

  private generatePredictions() {
    const result = this.healthPredictionService.generatePredictionsAndSuggestions(
      this.periodHistory,
      this.periodStats
    );
    this.predictions.set(result);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getCycleHealthClass(): string {
    const health = this.predictions()?.cycleHealth;
    return `cycle-${health}`;
  }

  getCycleHealthText(): string {
    const health = this.predictions()?.cycleHealth;
    switch (health) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'concerning': return 'Concerning';
      case 'needs_attention': return 'Needs Attention';
      default: return 'Unknown';
    }
  }

  getSuggestionClass(suggestion: HealthSuggestion): string {
    return `suggestion-${suggestion.priority}`;
  }

  getCategoryIcon(category: ServiceCategory): string {
    const icons = {
      mental_health: '🧠',
      gender_support: '🏳️‍⚧️',
      gynecology: '🩺',
      urology: '🫧',
      reproductive_health: '🤱',
      transgender_care: '🏳️‍⚧️',
      education: '📚'
    };
    return icons[category] || '💡';
  }

  getCategoryText(category: ServiceCategory): string {
    const texts = {
      mental_health: 'Mental Health',
      gender_support: 'Gender Support',
      gynecology: 'Gynecology',
      urology: 'Urology',
      reproductive_health: 'Reproductive Health',
      transgender_care: 'Transgender Care',
      education: 'Education'
    };
    return texts[category] || 'General';
  }
}
