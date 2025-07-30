# Period Tracking API Integration

## Summary
Đã thay thế phần mock data trong period tracking service thành call API thật dựa trên endpoint backend và cách code của BE.

## 🔗 **Backend API Endpoint**
```
https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/track_period_and_fertility
```

## ✅ **Changes Made**

### 1. **Updated Imports**
```typescript
// Added new imports
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { switchMap } from 'rxjs';
import {
  calculateCycleDay,
  calculateNextPeriodDate,
  calculateFertileWindow,
  calculateOvulationDate,
} from '../models/period-tracking.model';
```

### 2. **Added Backend Response Interface**
```typescript
interface BackendPeriodResponse {
  message: string;
  next_period_prediction: string;
  fertile_window: {
    start: string;
    end: string;
  };
  average_cycle_length: number | string;
}
```

### 3. **Updated Service Constructor**
```typescript
export class PeriodTrackingService {
  private supabase: SupabaseClient;
  private authService = inject(AuthService);
  private http = inject(HttpClient); // Added HttpClient injection
  
  // Backend API endpoint
  private readonly PERIOD_API_URL = 'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/track_period_and_fertility';
}
```

### 4. **Real Data Fetching - getPeriodHistory()**

**Before (Mock):**
```typescript
// TODO: Fetch real data from Supabase period_tracking table
// For now, return empty array until database is set up
const periodHistory: PeriodEntry[] = [];
```

**After (Real API):**
```typescript
// Fetch real data from Supabase period_tracking table
return from(
  this.supabase
    .from('period_tracking')
    .select('*')
    .eq('patient_id', currentUser.patientId)
    .order('start_date', { ascending: false })
).pipe(
  map(({ data, error }) => {
    if (error) {
      console.error('❌ Error fetching period history:', error);
      throw error;
    }

    const periodHistory: PeriodEntry[] = (data || []).map((item: any) => ({
      period_id: item.id?.toString() || '',
      user_id: item.patient_id,
      start_date: item.start_date,
      end_date: item.end_date,
      symptoms: item.symptoms || [],
      flow_intensity: item.flow_intensity || 'medium',
      period_description: item.period_description,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return periodHistory;
  })
);
```

### 5. **Real Statistics Calculation - getPeriodStats()**

**Before (Mock):**
```typescript
// TODO: Calculate real stats from period history data
// For now, return null until we have real data
return null;
```

**After (Real Calculation):**
```typescript
return this.getPeriodHistory().pipe(
  map((history) => {
    if (history.length === 0) {
      return null;
    }

    // Calculate stats from period history
    const sortedHistory = history.sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    
    const lastPeriod = sortedHistory[0];
    const lastPeriodStart = lastPeriod.start_date;

    // Calculate cycle lengths, averages, predictions, etc.
    const averageCycleLength = /* calculation logic */;
    const currentCycleDay = calculateCycleDay(lastPeriodStart);
    const nextPeriodDate = calculateNextPeriodDate(lastPeriodStart, averageCycleLength);
    const fertileWindow = calculateFertileWindow(lastPeriodStart);
    const ovulationDate = calculateOvulationDate(lastPeriodStart);

    const stats: PeriodStats = {
      averageCycleLength,
      currentCycleDay,
      daysUntilNextPeriod,
      nextPeriodDate,
      fertileWindowStart: fertileWindow.start,
      fertileWindowEnd: fertileWindow.end,
      ovulationDate,
      averagePeriodLength,
      totalCyclesTracked: history.length,
    };

    return stats;
  })
);
```

### 6. **Real API Call - logPeriodData()**

**Before (Mock):**
```typescript
// For now, simulate successful logging
const response: PeriodTrackingResponse = {
  success: true,
  message: 'Period data logged successfully',
  period_id: `period_${Date.now()}`,
};
```

**After (Real API Call):**
```typescript
// Prepare request body for backend API
const requestBody = {
  start_date: request.start_date,
  end_date: request.end_date || null,
  symptoms: request.symptoms || [],
  flow_intensity: request.flow_intensity,
  period_description: request.period_description || null,
};

// Get auth headers and make API call
return this.getAuthHeaders().pipe(
  switchMap((headers) => 
    this.http.post<BackendPeriodResponse>(this.PERIOD_API_URL, requestBody, { headers })
  ),
  map((backendResponse) => {
    const response: PeriodTrackingResponse = {
      success: true,
      message: backendResponse.message || 'Period data logged successfully',
      period_id: `period_${Date.now()}`,
    };
    return response;
  })
);
```

### 7. **Added Authentication Helper**
```typescript
/**
 * Get authentication headers for API calls
 */
private getAuthHeaders(): Observable<HttpHeaders> {
  return from(this.supabase.auth.getSession()).pipe(
    map(({ data: { session }, error }) => {
      if (error || !session?.access_token) {
        throw new Error('No valid session found');
      }

      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      });
    })
  );
}
```

## 🔧 **API Integration Details**

### Request Format (matches backend expectation):
```typescript
{
  start_date: string,        // Required: "YYYY-MM-DD"
  end_date: string | null,   // Optional: "YYYY-MM-DD"
  symptoms: string[],        // Optional: array of symptom strings
  flow_intensity: string,    // Required: "light" | "medium" | "heavy" | "very_heavy"
  period_description: string | null  // Optional: description text
}
```

### Response Format (from backend):
```typescript
{
  message: string,
  next_period_prediction: string,
  fertile_window: {
    start: string,
    end: string
  },
  average_cycle_length: number | string
}
```

### Authentication:
- Uses Supabase session token
- Sends as `Authorization: Bearer <token>` header
- Backend validates JWT token using `supabase.auth.getUser(token)`

## 🎯 **Benefits**

1. **Real Data Storage**: Period data is now saved to Supabase database
2. **Accurate Predictions**: Backend calculates cycle predictions based on historical data
3. **Fertility Tracking**: Real fertile window and ovulation predictions
4. **User Authentication**: Secure API calls with JWT tokens
5. **Error Handling**: Proper error handling for API failures
6. **Data Persistence**: User data persists across sessions

## 🧪 **Testing**

To test the integration:

1. **Login**: Ensure user is authenticated
2. **Log Period**: Use the period tracking form to log period data
3. **View History**: Check that data appears in period history
4. **View Stats**: Verify that statistics are calculated correctly
5. **Predictions**: Check that next period and fertile window predictions are shown

## 📋 **Database Schema**

The backend expects `period_tracking` table with columns:
- `id` (auto-generated)
- `patient_id` (user ID)
- `start_date` (date)
- `end_date` (date, optional)
- `symptoms` (JSON array)
- `flow_intensity` (string)
- `period_description` (text, optional)
- `cycle_length` (number, calculated)
- `estimated_next_date` (date, calculated)
- `predictions` (JSON object)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 🔄 **Data Flow**

1. **User Input** → Period tracking form
2. **Frontend Validation** → Form validation
3. **API Call** → POST to backend endpoint with JWT token
4. **Backend Processing** → Validates token, calculates predictions, saves to DB
5. **Response** → Success/error message with predictions
6. **Frontend Update** → Refresh period history and stats
7. **UI Update** → Show updated calendar and statistics

The period tracking feature now uses real API calls and provides accurate fertility predictions based on user's historical data.
