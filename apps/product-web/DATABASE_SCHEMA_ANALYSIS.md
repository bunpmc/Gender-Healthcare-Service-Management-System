# Database Schema Analysis 📊

## 🔍 **Schema Analysis từ Migration Files**

### **1. Patients Table Structure**
```sql
CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" NOT NULL,                    -- ← PRIMARY KEY (không phải patient_id!)
    "full_name" "text" NOT NULL,
    "phone" "text",
    "email" character varying(255),
    "date_of_birth" "date",
    "gender" "public"."gender_enum" NOT NULL,
    "allergies" json,
    "chronic_conditions" json,
    "past_surgeries" json,
    "vaccination_status" "public"."vaccination_status_enum" DEFAULT 'not_vaccinated',
    "patient_status" "public"."patient_status" DEFAULT 'active' NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "image_link" "text",
    "bio" "text"
);

-- Primary Key
ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");
```

### **2. Period Tracking Table Structure**
```sql
CREATE TABLE IF NOT EXISTS "public"."period_tracking" (
    "period_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "uuid" NOT NULL,           -- ← Foreign Key to patients.id
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "estimated_next_date" timestamp with time zone,
    "cycle_length" integer,
    "flow_intensity" "text",
    "symptoms" json,
    "period_description" "text",
    "predictions" json,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "period_length" numeric,
    CONSTRAINT "period_tracking_cycle_length_check" CHECK (("cycle_length" > 0)),
    CONSTRAINT "period_tracking_flow_intensity_check" CHECK (("flow_intensity" = ANY (ARRAY['light', 'medium', 'heavy'])))
);

-- Primary Key
ALTER TABLE ONLY "public"."period_tracking"
    ADD CONSTRAINT "period_tracking_pkey" PRIMARY KEY ("period_id");
```

### **3. Foreign Key Relationship**
```sql
-- period_tracking.patient_id REFERENCES patients.id
ALTER TABLE ONLY "public"."period_tracking"
    ADD CONSTRAINT "period_tracking_patient_id_fkey" 
    FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;
```

### **4. RPC Function: create_period_entry**
```sql
CREATE OR REPLACE FUNCTION "public"."create_period_entry"(
    "p_patient_id" "uuid",                  -- Must exist in patients.id
    "p_start_date" timestamp with time zone,
    "p_end_date" timestamp with time zone DEFAULT NULL,
    "p_cycle_length" integer DEFAULT NULL,
    "p_flow_intensity" "text" DEFAULT NULL,
    "p_symptoms" json DEFAULT NULL,
    "p_period_description" "text" DEFAULT NULL,
    "p_predictions" json DEFAULT NULL,
    "p_period_length" numeric DEFAULT NULL
) RETURNS "uuid"
LANGUAGE "plpgsql"
AS $$
declare
  new_period_id uuid;
begin
  insert into public.period_tracking (
    patient_id,      -- ← Must match existing patients.id
    start_date,
    end_date,
    cycle_length,
    flow_intensity,
    symptoms,
    period_description,
    predictions,
    period_length
  )
  values (
    p_patient_id,    -- ← Foreign key constraint enforced here
    p_start_date,
    p_end_date,
    p_cycle_length,
    p_flow_intensity,
    p_symptoms,
    p_period_description,
    p_predictions,
    p_period_length
  )
  returning period_id into new_period_id;

  return new_period_id;
end;
$$;
```

## 🚨 **Key Findings & Issues**

### **1. Column Name Mismatch**
- **Schema**: `patients.id` (primary key)
- **Our Code**: Đang tìm `patients.patient_id` ❌
- **Fix**: Phải sử dụng `patients.id` thay vì `patients.patient_id`

### **2. Foreign Key Constraint**
- **Constraint**: `period_tracking.patient_id` → `patients.id`
- **Error**: `p_patient_id` phải tồn tại trong `patients.id`
- **Current Issue**: Random UUID không match với existing patients

### **3. Function Permissions**
```sql
-- Function có permissions cho tất cả roles
GRANT ALL ON FUNCTION "public"."create_period_entry"(...) TO "anon";
GRANT ALL ON FUNCTION "public"."create_period_entry"(...) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_period_entry"(...) TO "service_role";
```

### **4. Data Validation Constraints**
```sql
-- Cycle length must be positive
CONSTRAINT "period_tracking_cycle_length_check" CHECK (("cycle_length" > 0))

-- Flow intensity must be specific values
CONSTRAINT "period_tracking_flow_intensity_check" CHECK (("flow_intensity" = ANY (ARRAY['light', 'medium', 'heavy'])))
```

## 🔧 **Required Code Fixes**

### **1. Update Patient Query**
```typescript
// ❌ Wrong - patients.patient_id doesn't exist
const { data: existingPatients } = await client
  .from('patients')
  .select('patient_id')  // ← Wrong column name
  .limit(1);

// ✅ Correct - use patients.id
const { data: existingPatients } = await client
  .from('patients')
  .select('id')          // ← Correct column name
  .limit(1);
```

### **2. Update Patient Creation**
```typescript
// ❌ Wrong - using patient_id
const { data: newPatient } = await client
  .from('patients')
  .insert({
    patient_id: testPatientId,  // ← Wrong column name
    full_name: 'Test Patient',
    // ...
  })
  .select('patient_id')         // ← Wrong column name
  .single();

// ✅ Correct - use id
const { data: newPatient } = await client
  .from('patients')
  .insert({
    id: testPatientId,          // ← Correct column name
    full_name: 'Test Patient',
    // ...
  })
  .select('id')                 // ← Correct column name
  .single();
```

### **3. Update Patient Existence Check**
```typescript
// ❌ Wrong
const { data: patientExists } = await this.supabase
  .from('patients')
  .select('patient_id')         // ← Wrong column name
  .eq('patient_id', userId)     // ← Wrong column name
  .single();

// ✅ Correct
const { data: patientExists } = await this.supabase
  .from('patients')
  .select('id')                 // ← Correct column name
  .eq('id', userId)             // ← Correct column name
  .single();
```

## 🎯 **Summary**

**Root Cause**: Column name mismatch
- **Schema**: `patients.id` (primary key)
- **Our Code**: `patients.patient_id` (doesn't exist)

**Foreign Key**: `period_tracking.patient_id` → `patients.id`

**Solution**: Update all references từ `patient_id` thành `id` trong patients table queries.

**Function**: `create_period_entry` works correctly, chỉ cần valid `patients.id`
