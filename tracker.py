from datetime import datetime, timedelta
from typing import List, Dict, Optional
from supabase import create_client, Client
import os
import json

class Tracker:
    def __init__(self, supabase_url: str, supabase_key: str, patient_id: str):
        self.cycle_length = 28  # Default cycle length
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.patient_id = patient_id  # UUID from patients table

    def add_period(self, start_date: str, end_date: str = None, flow_intensity: str = "medium", symptoms: List[str] = None, description: str = None) -> Optional[str]:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
            if end and end < start:
                return None

            # Validate flow_intensity
            if flow_intensity not in ["light", "medium", "heavy"]:
                return None

            # Predict next period
            estimated_next = start + timedelta(days=self.cycle_length)
            cycle_length = self.average_cycle_length() or self.cycle_length

            # Prepare symptoms as JSON
            symptoms_json = json.dumps(symptoms or [])

            # Insert into period_tracking
            response = self.supabase.table("period_tracking").insert({
                "patient_id": self.patient_id,
                "start_date": start.isoformat(),
                "end_date": end.isoformat() if end else None,
                "estimated_next_date": estimated_next.isoformat(),
                "cycle_length": cycle_length,
                "flow_intensity": flow_intensity,
                "symptoms": symptoms_json,
                "period_description": description
            }).execute()

            return response.data[0]["period_id"] if response.data else None
        except (ValueError, Exception):
            return None

    def get_periods(self) -> List[Dict]:
        response = self.supabase.table("period_tracking").select("*").eq("patient_id", self.patient_id).execute()
        return response.data

    def average_cycle_length(self) -> Optional[int]:
        periods = sorted(
            [(datetime.fromisoformat(p["start_date"]), p["cycle_length"]) for p in self.get_periods()],
            key=lambda x: x[0]
        )
        if len(periods) < 2:
            return None
        cycles = [(periods[i][0] - periods[i-1][0]).days for i in range(1, len(periods))]
        return sum(cycles) // len(cycles) if cycles else self.cycle_length

    def predict_next_period(self) -> Optional[datetime]:
        periods = self.get_periods()
        if not periods:
            return None
        last_period = max([datetime.fromisoformat(p["start_date"]) for p in periods])
        cycle_length = self.average_cycle_length() or self.cycle_length
        return last_period + timedelta(days=cycle_length)

    def update_predictions(self, period_id: str, predictions: Dict):
        try:
            self.supabase.table("period_tracking").update({
                "predictions": json.dumps(predictions),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("period_id", period_id).eq("patient_id", self.patient_id).execute()
            return True
        except Exception:
            return False