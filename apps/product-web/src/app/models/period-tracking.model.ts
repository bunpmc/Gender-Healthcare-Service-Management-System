// ========== PERIOD TRACKING INTERFACES ==========

export interface PeriodEntry {
  period_id: string;
  patient_id: string;
  start_date: string;
  cycle_length?: number | null;
  period_length?: number | null;
  estimated_next_date?: string | null;
  flow_intensity?: FlowIntensity | null;
  symptoms?: PeriodSymptom[] | null;
  period_description?: string | null;
  predictions?: any | null;
  created_at: string;
  updated_at?: string;
}

export interface PeriodStats {
  averageCycleLength: number;
  currentCycleDay: number;
  daysUntilNextPeriod: number;
  nextPeriodDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDate: string;
  averagePeriodLength: number;
  totalCyclesTracked: number;
  // Enhanced fertility analysis
  fertilityAnalysis?: FertilityAnalysis;
  conceptionTiming?: ConceptionTiming;
  periodStatus?: PeriodStatus;
}

export interface FertilityAnalysis {
  isPeakFertility: boolean;
  fertilityScore: number; // 0-100
  bestConceptionDays: string[];
  currentPhase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
  phaseDescription: string;
  daysToOvulation: number;
  daysSinceOvulation: number;
}

export interface ConceptionTiming {
  optimalWindow: {
    start: string;
    end: string;
    daysFromToday: number;
  };
  chanceOfConception: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
  recommendedActions: string[];
  nextOptimalWindow: {
    start: string;
    end: string;
    cycleDay: number;
  };
}

export interface PeriodStatus {
  isLate: boolean;
  daysLate: number;
  expectedDate: string;
  actualDate?: string;
  status: 'on_time' | 'early' | 'late' | 'very_late' | 'missed';
  possibleReasons: string[];
  shouldTestPregnancy: boolean;
}

export interface PeriodTrackingRequest {
  patient_id: string;
  start_date: string;
  cycle_length?: number | null;
  period_length?: number | null;
  flow_intensity: FlowIntensity;
  symptoms?: PeriodSymptom[] | null;
  period_description?: string | null;
}

export interface PeriodTrackingResponse {
  success: boolean;
  message: string;
  period_id?: string;
  period_details?: PeriodEntry;
}

export interface PeriodFormValidation {
  isValid: boolean;
  errors: {
    start_date?: string;
    cycle_length?: string;
    period_length?: string;
    flow_intensity?: string;
    symptoms?: string;
    period_description?: string;
  };
}

export interface PeriodFormState {
  isSubmitting: boolean;
  isDirty: boolean;
  validation: PeriodFormValidation;
}

export interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPeriodDay: boolean;
  isFertileDay: boolean;
  isOvulationDay: boolean;
  isPredictedPeriod: boolean;
  dayNumber: number;
  status: 'period' | 'fertile' | 'ovulation' | 'predicted' | 'normal';
  // Enhanced fertility indicators
  fertilityLevel?: 'none' | 'low' | 'moderate' | 'high' | 'peak';
  cyclePhase?: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
  conceptionChance?: number; // 0-100
  isOptimalConception?: boolean;
  isPeakFertility?: boolean;
  isLatePeriod?: boolean;
  daysLate?: number;
}

// ========== TYPES ==========

export type PeriodSymptom =
  | 'cramps'
  | 'headache'
  | 'mood_swings'
  | 'bloating'
  | 'breast_tenderness'
  | 'fatigue'
  | 'nausea'
  | 'back_pain'
  | 'acne'
  | 'food_cravings';

export type FlowIntensity = 'light' | 'medium' | 'heavy' | 'very_heavy';

// ========== CONSTANTS ==========

export const PERIOD_SYMPTOMS: PeriodSymptom[] = [
  'cramps',
  'headache',
  'mood_swings',
  'bloating',
  'breast_tenderness',
  'fatigue',
  'nausea',
  'back_pain',
  'acne',
  'food_cravings',
];

export const FLOW_INTENSITIES: {
  value: FlowIntensity;
  label: string;
  color: string;
}[] = [
  { value: 'light', label: 'Light', color: '#fecaca' },
  { value: 'medium', label: 'Medium', color: '#f87171' },
  { value: 'heavy', label: 'Heavy', color: '#dc2626' },
  { value: 'very_heavy', label: 'Very Heavy', color: '#991b1b' },
];

// ========== HELPER FUNCTIONS ==========

export function calculateCycleDay(lastPeriodStart: string): number {
  const startDate = new Date(lastPeriodStart);
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export function calculateNextPeriodDate(
  lastPeriodStart: string,
  averageCycleLength: number = 28
): string {
  const startDate = new Date(lastPeriodStart);
  const nextPeriodDate = new Date(startDate);
  nextPeriodDate.setDate(startDate.getDate() + averageCycleLength);
  return nextPeriodDate.toISOString().split('T')[0];
}

export function calculateFertileWindow(lastPeriodStart: string): {
  start: string;
  end: string;
} {
  const startDate = new Date(lastPeriodStart);

  // Fertile window typically starts around day 10 and ends around day 17
  const fertileStart = new Date(startDate);
  fertileStart.setDate(startDate.getDate() + 9); // Day 10

  const fertileEnd = new Date(startDate);
  fertileEnd.setDate(startDate.getDate() + 16); // Day 17

  return {
    start: fertileStart.toISOString().split('T')[0],
    end: fertileEnd.toISOString().split('T')[0],
  };
}

export function calculateOvulationDate(lastPeriodStart: string): string {
  const startDate = new Date(lastPeriodStart);
  const ovulationDate = new Date(startDate);
  ovulationDate.setDate(startDate.getDate() + 13); // Day 14
  return ovulationDate.toISOString().split('T')[0];
}

// ========== ENHANCED FERTILITY ANALYSIS FUNCTIONS ==========

export function calculateFertilityAnalysis(
  lastPeriodStart: string,
  averageCycleLength: number = 28
): FertilityAnalysis {
  const startDate = new Date(lastPeriodStart);
  const today = new Date();
  const currentCycleDay =
    Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) +
    1;

  // Calculate ovulation day (typically 14 days before next period)
  const ovulationDay = averageCycleLength - 14;
  const daysToOvulation = ovulationDay - currentCycleDay;
  const daysSinceOvulation = currentCycleDay - ovulationDay;

  // Determine cycle phase
  let currentPhase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
  let phaseDescription: string;

  if (currentCycleDay <= 5) {
    currentPhase = 'menstrual';
    phaseDescription = 'Menstrual phase - period is occurring';
  } else if (currentCycleDay <= ovulationDay - 2) {
    currentPhase = 'follicular';
    phaseDescription = 'Follicular phase - preparing for ovulation';
  } else if (
    currentCycleDay >= ovulationDay - 1 &&
    currentCycleDay <= ovulationDay + 1
  ) {
    currentPhase = 'ovulatory';
    phaseDescription = 'Ovulatory phase - peak fertility window';
  } else {
    currentPhase = 'luteal';
    phaseDescription = 'Luteal phase - post-ovulation';
  }

  // Calculate fertility score (0-100)
  let fertilityScore = 0;
  const isPeakFertility = Math.abs(daysToOvulation) <= 1;

  if (
    currentCycleDay >= ovulationDay - 5 &&
    currentCycleDay <= ovulationDay + 1
  ) {
    // Fertile window: 5 days before ovulation + ovulation day
    const distanceFromOvulation = Math.abs(currentCycleDay - ovulationDay);
    fertilityScore = Math.max(0, 100 - distanceFromOvulation * 20);
  }

  // Best conception days (5 days before ovulation + ovulation day)
  const bestConceptionDays: string[] = [];
  for (let i = -5; i <= 1; i++) {
    const conceptionDate = new Date(startDate);
    conceptionDate.setDate(startDate.getDate() + ovulationDay - 1 + i);
    bestConceptionDays.push(conceptionDate.toISOString().split('T')[0]);
  }

  return {
    isPeakFertility,
    fertilityScore,
    bestConceptionDays,
    currentPhase,
    phaseDescription,
    daysToOvulation,
    daysSinceOvulation,
  };
}

export function calculateConceptionTiming(
  lastPeriodStart: string,
  averageCycleLength: number = 28
): ConceptionTiming {
  const startDate = new Date(lastPeriodStart);
  const today = new Date();
  const currentCycleDay =
    Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) +
    1;

  // Calculate ovulation day
  const ovulationDay = averageCycleLength - 14;

  // Current optimal window (5 days before ovulation + ovulation day)
  const optimalStart = new Date(startDate);
  optimalStart.setDate(startDate.getDate() + ovulationDay - 6);
  const optimalEnd = new Date(startDate);
  optimalEnd.setDate(startDate.getDate() + ovulationDay);

  const daysFromToday = Math.ceil(
    (optimalStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine conception chance
  let chanceOfConception:
    | 'very_high'
    | 'high'
    | 'moderate'
    | 'low'
    | 'very_low';
  const daysToOvulation = ovulationDay - currentCycleDay;

  if (Math.abs(daysToOvulation) <= 1) {
    chanceOfConception = 'very_high';
  } else if (Math.abs(daysToOvulation) <= 2) {
    chanceOfConception = 'high';
  } else if (Math.abs(daysToOvulation) <= 3) {
    chanceOfConception = 'moderate';
  } else if (Math.abs(daysToOvulation) <= 5) {
    chanceOfConception = 'low';
  } else {
    chanceOfConception = 'very_low';
  }

  // Recommended actions based on current phase
  const recommendedActions: string[] = [];
  if (daysToOvulation > 5) {
    recommendedActions.push(
      'Track ovulation signs (cervical mucus, temperature)'
    );
    recommendedActions.push('Maintain healthy lifestyle');
  } else if (daysToOvulation > 0) {
    recommendedActions.push('Increase intimacy frequency');
    recommendedActions.push('Monitor ovulation symptoms');
    recommendedActions.push('Consider ovulation predictor kits');
  } else if (daysToOvulation >= -1) {
    recommendedActions.push(
      'Peak fertility window - optimal time for conception'
    );
    recommendedActions.push('Daily intimacy recommended');
  } else {
    recommendedActions.push('Post-ovulation - wait for next cycle');
    recommendedActions.push('Continue healthy habits');
  }

  // Next optimal window (next cycle)
  const nextCycleStart = new Date(startDate);
  nextCycleStart.setDate(startDate.getDate() + averageCycleLength);
  const nextOptimalStart = new Date(nextCycleStart);
  nextOptimalStart.setDate(nextCycleStart.getDate() + ovulationDay - 6);
  const nextOptimalEnd = new Date(nextCycleStart);
  nextOptimalEnd.setDate(nextCycleStart.getDate() + ovulationDay);

  return {
    optimalWindow: {
      start: optimalStart.toISOString().split('T')[0],
      end: optimalEnd.toISOString().split('T')[0],
      daysFromToday,
    },
    chanceOfConception,
    recommendedActions,
    nextOptimalWindow: {
      start: nextOptimalStart.toISOString().split('T')[0],
      end: nextOptimalEnd.toISOString().split('T')[0],
      cycleDay: ovulationDay - 5,
    },
  };
}

export function calculatePeriodStatus(
  periodHistory: PeriodEntry[],
  averageCycleLength: number = 28
): PeriodStatus {
  if (periodHistory.length === 0) {
    return {
      isLate: false,
      daysLate: 0,
      expectedDate: '',
      status: 'on_time',
      possibleReasons: [],
      shouldTestPregnancy: false,
    };
  }

  const lastPeriod = periodHistory[0];
  const lastPeriodStart = new Date(lastPeriod.start_date);
  const today = new Date();

  // Calculate expected next period date
  const expectedDate = new Date(lastPeriodStart);
  expectedDate.setDate(lastPeriodStart.getDate() + averageCycleLength);

  // Calculate days late/early
  const daysDifference = Math.ceil(
    (today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let status: 'on_time' | 'early' | 'late' | 'very_late' | 'missed';
  let isLate = false;
  let daysLate = 0;
  let possibleReasons: string[] = [];
  let shouldTestPregnancy = false;

  if (daysDifference < -3) {
    status = 'early';
  } else if (daysDifference >= -3 && daysDifference <= 3) {
    status = 'on_time';
  } else if (daysDifference > 3 && daysDifference <= 7) {
    status = 'late';
    isLate = true;
    daysLate = daysDifference;
    possibleReasons = [
      'Stress or lifestyle changes',
      'Hormonal fluctuations',
      'Changes in weight or exercise',
      'Illness or medication',
    ];
  } else if (daysDifference > 7 && daysDifference <= 14) {
    status = 'very_late';
    isLate = true;
    daysLate = daysDifference;
    shouldTestPregnancy = true;
    possibleReasons = [
      'Possible pregnancy',
      'Hormonal imbalance',
      'Significant stress',
      'Medical conditions (PCOS, thyroid)',
      'Medication side effects',
    ];
  } else if (daysDifference > 14) {
    status = 'missed';
    isLate = true;
    daysLate = daysDifference;
    shouldTestPregnancy = true;
    possibleReasons = [
      'Pregnancy (most likely)',
      'Hormonal disorders',
      'Menopause (if age appropriate)',
      'Severe stress or trauma',
      'Eating disorders',
      'Medical conditions requiring evaluation',
    ];
  }

  return {
    isLate,
    daysLate,
    expectedDate: expectedDate.toISOString().split('T')[0],
    status: status!,
    possibleReasons,
    shouldTestPregnancy,
  };
}

export function isDateInRange(
  date: string,
  startDate: string,
  endDate: string
): boolean {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return checkDate >= start && checkDate <= end;
}

export function formatDateForDisplay(
  dateString: string,
  locale: string = 'en-GB'
): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getSymptomDisplayName(symptom: PeriodSymptom): string {
  const symptomNames: Record<PeriodSymptom, string> = {
    cramps: 'Cramps',
    headache: 'Headache',
    mood_swings: 'Mood Swings',
    bloating: 'Bloating',
    breast_tenderness: 'Breast Tenderness',
    fatigue: 'Fatigue',
    nausea: 'Nausea',
    back_pain: 'Back Pain',
    acne: 'Acne',
    food_cravings: 'Food Cravings',
  };

  return symptomNames[symptom] || symptom;
}

export function getFlowIntensityColor(intensity: FlowIntensity): string {
  const colors: Record<FlowIntensity, string> = {
    light: '#fecaca', // light red
    medium: '#f87171', // medium red
    heavy: '#dc2626', // dark red
    very_heavy: '#991b1b', // very dark red
  };

  return colors[intensity] || colors.medium;
}

// ========== FORM VALIDATION FUNCTIONS ==========

export function validatePeriodForm(
  form: PeriodTrackingRequest
): PeriodFormValidation {
  const errors: PeriodFormValidation['errors'] = {};
  let isValid = true;

  // Validate start date
  if (!form.start_date || form.start_date.trim() === '') {
    errors.start_date = 'Start date is required';
    isValid = false;
  } else {
    const startDate = new Date(form.start_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (isNaN(startDate.getTime())) {
      errors.start_date = 'Invalid start date format';
      isValid = false;
    } else if (startDate > today) {
      errors.start_date = 'Start date cannot be in the future';
      isValid = false;
    }
  }

  // Validate cycle length if provided
  if (form.cycle_length !== null && form.cycle_length !== undefined) {
    if (form.cycle_length < 21 || form.cycle_length > 35) {
      errors.cycle_length = 'Cycle length must be between 21 and 35 days';
      isValid = false;
    }
  }

  // Validate period length if provided
  if (form.period_length !== null && form.period_length !== undefined) {
    if (form.period_length < 1 || form.period_length > 10) {
      errors.period_length = 'Period length must be between 1 and 10 days';
      isValid = false;
    }
  }

  // Validate flow intensity
  if (
    !form.flow_intensity ||
    !['light', 'medium', 'heavy', 'very_heavy'].includes(form.flow_intensity)
  ) {
    errors.flow_intensity = 'Please select a valid flow intensity';
    isValid = false;
  }

  // Validate symptoms (optional but if provided, should be valid)
  if (form.symptoms && form.symptoms.length > 0) {
    const invalidSymptoms = form.symptoms.filter(
      (symptom) => !PERIOD_SYMPTOMS.includes(symptom)
    );
    if (invalidSymptoms.length > 0) {
      errors.symptoms = 'Invalid symptoms selected';
      isValid = false;
    }
  }

  // Validate description length
  if (form.period_description && form.period_description.length > 500) {
    errors.period_description = 'Description cannot exceed 500 characters';
    isValid = false;
  }

  return { isValid, errors };
}

export function createEmptyPeriodForm(
  patientId: string = ''
): PeriodTrackingRequest {
  return {
    patient_id: patientId,
    start_date: '',
    cycle_length: 28,
    period_length: 5,
    flow_intensity: 'medium',
    symptoms: [],
    period_description: null,
  };
}

export function isFormDirty(
  form: PeriodTrackingRequest,
  originalForm: PeriodTrackingRequest
): boolean {
  return (
    form.start_date !== originalForm.start_date ||
    form.cycle_length !== originalForm.cycle_length ||
    form.period_length !== originalForm.period_length ||
    form.flow_intensity !== originalForm.flow_intensity ||
    form.period_description !== originalForm.period_description ||
    JSON.stringify(form.symptoms?.sort()) !==
      JSON.stringify(originalForm.symptoms?.sort())
  );
}

export function sanitizePeriodForm(
  form: PeriodTrackingRequest
): PeriodTrackingRequest {
  return {
    patient_id: form.patient_id || '',
    start_date: form.start_date?.trim() || '',
    cycle_length: form.cycle_length || null,
    period_length: form.period_length || null,
    symptoms:
      form.symptoms?.filter((symptom) => PERIOD_SYMPTOMS.includes(symptom)) ||
      [],
    flow_intensity: (['light', 'medium', 'heavy'] as const).includes(
      form.flow_intensity as any
    )
      ? (form.flow_intensity as FlowIntensity)
      : 'medium',
    period_description:
      form.period_description?.trim().substring(0, 500) || null,
  };
}
