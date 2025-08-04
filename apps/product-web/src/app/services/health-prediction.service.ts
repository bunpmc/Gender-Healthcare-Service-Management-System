import { Injectable } from '@angular/core';
import { PeriodEntry, PeriodStats } from '../models/period-tracking.model';

export interface HealthSuggestion {
  id: string;
  category: ServiceCategory;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionItems: string[];
  relatedSymptoms: string[];
  confidence: number; // 0-100
}

export interface PredictionResult {
  nextPeriodDate: string;
  fertileWindow: {
    start: string;
    end: string;
  };
  ovulationDate: string;
  cycleHealth: 'excellent' | 'good' | 'concerning' | 'needs_attention';
  suggestions: HealthSuggestion[];
}

export type ServiceCategory = 
  | 'mental_health'
  | 'gender_support' 
  | 'gynecology'
  | 'urology'
  | 'reproductive_health'
  | 'transgender_care'
  | 'education';

@Injectable({
  providedIn: 'root'
})
export class HealthPredictionService {

  constructor() {}

  /**
   * Generate predictions and suggestions based on period history
   */
  generatePredictionsAndSuggestions(
    periodHistory: PeriodEntry[], 
    periodStats: PeriodStats | null
  ): PredictionResult {
    
    const predictions = this.calculatePredictions(periodHistory, periodStats);
    const cycleHealth = this.assessCycleHealth(periodHistory);
    const suggestions = this.generateSuggestions(periodHistory, cycleHealth);

    return {
      ...predictions,
      cycleHealth,
      suggestions
    };
  }

  /**
   * Calculate basic cycle predictions
   */
  private calculatePredictions(
    periodHistory: PeriodEntry[], 
    periodStats: PeriodStats | null
  ): Omit<PredictionResult, 'cycleHealth' | 'suggestions'> {
    
    if (!periodHistory.length) {
      const today = new Date();
      return {
        nextPeriodDate: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fertileWindow: {
          start: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date(today.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        ovulationDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    }

    const avgCycleLength = periodStats?.averageCycleLength || this.calculateAverageCycleLength(periodHistory);
    const lastPeriod = new Date(periodHistory[0].start_date);
    
    const nextPeriodDate = new Date(lastPeriod.getTime() + avgCycleLength * 24 * 60 * 60 * 1000);
    const ovulationDate = new Date(lastPeriod.getTime() + (avgCycleLength - 14) * 24 * 60 * 60 * 1000);
    const fertileStart = new Date(ovulationDate.getTime() - 5 * 24 * 60 * 60 * 1000);
    const fertileEnd = new Date(ovulationDate.getTime() + 1 * 24 * 60 * 60 * 1000);

    return {
      nextPeriodDate: nextPeriodDate.toISOString().split('T')[0],
      fertileWindow: {
        start: fertileStart.toISOString().split('T')[0],
        end: fertileEnd.toISOString().split('T')[0]
      },
      ovulationDate: ovulationDate.toISOString().split('T')[0]
    };
  }

  /**
   * Assess overall cycle health
   */
  private assessCycleHealth(periodHistory: PeriodEntry[]): 'excellent' | 'good' | 'concerning' | 'needs_attention' {
    if (!periodHistory.length) return 'good';

    const issues = this.identifyHealthIssues(periodHistory);
    const urgentIssues = issues.filter(issue => issue.priority === 'urgent' || issue.priority === 'high');
    
    if (urgentIssues.length > 0) return 'needs_attention';
    if (issues.length > 2) return 'concerning';
    if (issues.length > 0) return 'good';
    return 'excellent';
  }

  /**
   * Generate health suggestions based on period data
   */
  private generateSuggestions(
    periodHistory: PeriodEntry[], 
    cycleHealth: string
  ): HealthSuggestion[] {
    const suggestions: HealthSuggestion[] = [];
    
    // Always add educational suggestions
    suggestions.push(...this.getEducationalSuggestions());
    
    // Add specific suggestions based on identified issues
    const healthIssues = this.identifyHealthIssues(periodHistory);
    suggestions.push(...healthIssues);
    
    // Add general wellness suggestions
    suggestions.push(...this.getWellnessSuggestions(cycleHealth));
    
    // Sort by priority and confidence
    return suggestions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    }).slice(0, 8); // Limit to top 8 suggestions
  }

  /**
   * Identify potential health issues from period data
   */
  private identifyHealthIssues(periodHistory: PeriodEntry[]): HealthSuggestion[] {
    const issues: HealthSuggestion[] = [];
    
    if (!periodHistory.length) return issues;

    // Check for irregular cycles
    const cycleLengths = this.getCycleLengths(periodHistory);
    const avgCycle = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const irregularity = this.calculateIrregularity(cycleLengths);
    
    if (irregularity > 7) {
      issues.push({
        id: 'irregular_cycles',
        category: 'gynecology',
        title: 'Irregular Menstrual Cycles',
        description: 'Your cycles show significant variation. This could be normal or indicate hormonal changes.',
        priority: irregularity > 14 ? 'high' : 'medium',
        actionItems: [
          'Track your cycles for 3-6 months',
          'Consider consulting a gynecologist',
          'Monitor stress levels and lifestyle factors'
        ],
        relatedSymptoms: ['irregular_periods', 'hormonal_changes'],
        confidence: Math.min(95, irregularity * 5)
      });
    }

    // Check for heavy bleeding patterns
    const heavyFlowCount = periodHistory.filter(p => p.flow_intensity === 'heavy').length;
    if (heavyFlowCount > periodHistory.length * 0.5) {
      issues.push({
        id: 'heavy_bleeding',
        category: 'gynecology',
        title: 'Heavy Menstrual Flow',
        description: 'You frequently experience heavy bleeding, which may impact your quality of life.',
        priority: 'medium',
        actionItems: [
          'Discuss with a healthcare provider',
          'Consider iron supplementation',
          'Track bleeding patterns in detail'
        ],
        relatedSymptoms: ['heavy_bleeding', 'fatigue', 'anemia'],
        confidence: 85
      });
    }

    // Check for concerning symptoms
    const allSymptoms = periodHistory.flatMap(p => p.symptoms || []);
    const symptomCounts = this.countSymptoms(allSymptoms);
    
    if (symptomCounts['severe_cramps'] > 2) {
      issues.push({
        id: 'severe_pain',
        category: 'gynecology',
        title: 'Severe Menstrual Pain',
        description: 'Frequent severe cramping may indicate underlying conditions like endometriosis.',
        priority: 'high',
        actionItems: [
          'Consult a gynecologist for evaluation',
          'Consider pain management strategies',
          'Explore hormonal treatment options'
        ],
        relatedSymptoms: ['severe_cramps', 'pelvic_pain'],
        confidence: 90
      });
    }

    return issues;
  }

  /**
   * Get educational suggestions
   */
  private getEducationalSuggestions(): HealthSuggestion[] {
    return [
      {
        id: 'cycle_education',
        category: 'education',
        title: 'Understanding Your Menstrual Cycle',
        description: 'Learn about the phases of your cycle and what to expect.',
        priority: 'low',
        actionItems: [
          'Read about menstrual cycle phases',
          'Understand fertility windows',
          'Learn about normal vs. concerning symptoms'
        ],
        relatedSymptoms: [],
        confidence: 100
      }
    ];
  }

  /**
   * Get general wellness suggestions
   */
  private getWellnessSuggestions(cycleHealth: string): HealthSuggestion[] {
    const suggestions: HealthSuggestion[] = [
      {
        id: 'mental_wellness',
        category: 'mental_health',
        title: 'Menstrual Mental Health Support',
        description: 'Hormonal changes can affect mood and mental well-being.',
        priority: 'medium',
        actionItems: [
          'Practice stress management techniques',
          'Consider counseling if mood changes are severe',
          'Maintain regular exercise and sleep schedule'
        ],
        relatedSymptoms: ['mood_swings', 'anxiety', 'depression'],
        confidence: 75
      }
    ];

    if (cycleHealth === 'excellent') {
      suggestions.push({
        id: 'reproductive_planning',
        category: 'reproductive_health',
        title: 'Reproductive Health Planning',
        description: 'Your cycles are regular - great time to discuss family planning options.',
        priority: 'low',
        actionItems: [
          'Discuss contraception options with your provider',
          'Consider preconception counseling if planning pregnancy',
          'Maintain healthy lifestyle habits'
        ],
        relatedSymptoms: [],
        confidence: 80
      });
    }

    return suggestions;
  }

  // Helper methods
  private calculateAverageCycleLength(periodHistory: PeriodEntry[]): number {
    const cycleLengths = this.getCycleLengths(periodHistory);
    return cycleLengths.length > 0 ? cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length : 28;
  }

  private getCycleLengths(periodHistory: PeriodEntry[]): number[] {
    const lengths: number[] = [];
    for (let i = 0; i < periodHistory.length - 1; i++) {
      const current = new Date(periodHistory[i].start_date);
      const next = new Date(periodHistory[i + 1].start_date);
      const diffDays = Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 15 && diffDays < 45) { // Reasonable cycle length
        lengths.push(diffDays);
      }
    }
    return lengths;
  }

  private calculateIrregularity(cycleLengths: number[]): number {
    if (cycleLengths.length < 2) return 0;
    const avg = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - avg, 2), 0) / cycleLengths.length;
    return Math.sqrt(variance);
  }

  private countSymptoms(symptoms: string[]): Record<string, number> {
    return symptoms.reduce((counts, symptom) => {
      counts[symptom] = (counts[symptom] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }
}
