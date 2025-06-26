class PeriodTracker:
    def __init__(self, supabase_url: str, supabase_key: str, patient_id: str):
        self.cycle_length = 28
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.patient_id = patient_id
        self.analytics = PeriodAnalytics()

    def add_period(self, start_date: str, end_date: str = None, flow_intensity: str = "medium",
                   symptoms: List[str] = None, description: str = None) -> Optional[str]:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
            
            if end and end < start:
                return None

            if flow_intensity not in ["light", "medium", "heavy"]:
                flow_intensity = "medium"

            estimated_next = start + timedelta(days=self.cycle_length)
            cycle_length = self.average_cycle_length() or self.cycle_length
            symptoms_json = json.dumps(symptoms or [])

            response = self.supabase.table("period_tracking").insert({
                "patient_id": self.patient_id,
                "start_date": start.isoformat(),
                "end_date": end.isoformat() if end else None,
                "estimated_next_date": estimated_next.isoformat(),
                "cycle_length": cycle_length,
                "flow_intensity": flow_intensity,
                "symptoms": symptoms_json,
                "period_description": description,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }).execute()

            return response.data[0]["period_id"] if response.data else None
        except Exception as e:
            print(f"Error adding period: {e}")
            return None

    def get_periods(self) -> List[Dict]:
        try:
            response = self.supabase.table("period_tracking").select("*").eq("patient_id", self.patient_id).execute()
            return response.data
        except:
            return []

    def average_cycle_length(self) -> Optional[int]:
        periods = self.get_periods()
        if len(periods) < 2:
            return None
        
        periods_sorted = sorted(
            [(datetime.fromisoformat(p["start_date"]), p["cycle_length"]) for p in periods],
            key=lambda x: x[0]
        )
        
        cycles = [(periods_sorted[i][0] - periods_sorted[i-1][0]).days for i in range(1, len(periods_sorted))]
        return sum(cycles) // len(cycles) if cycles else self.cycle_length

    def predict_next_period(self) -> Optional[datetime]:
        periods = self.get_periods()
        if not periods:
            return None
        
        last_period = max([datetime.fromisoformat(p["start_date"]) for p in periods])
        cycle_length = self.average_cycle_length() or self.cycle_length
        return last_period + timedelta(days=cycle_length)

    def get_comprehensive_analysis(self) -> Dict[str, Any]:
        """Get comprehensive period analysis"""
        periods = self.get_periods()
        
        if not periods:
            return {"error": "No period data available"}
        
        analysis = {
            "total_periods": len(periods),
            "date_range": {
                "first_period": min(p["start_date"] for p in periods),
                "last_period": max(p["start_date"] for p in periods)
            },
            "cycle_analysis": self.analytics.calculate_cycle_statistics(periods),
            "symptom_analysis": self.analytics.analyze_symptoms(periods),
            "flow_analysis": self.analytics.analyze_flow_patterns(periods)
        }
        
        # Add prediction
        next_period = self.predict_next_period()
        if next_period:
            analysis["prediction"] = {
                "next_period_date": next_period.strftime('%Y-%m-%d'),
                "days_until": (next_period - datetime.now()).days
            }
        
        return analysis
