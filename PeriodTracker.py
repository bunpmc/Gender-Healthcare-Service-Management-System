class PeriodTracker:
    def __init__(self, url, key, id):
        self.cl = 28  # magic number
        self.supabase = create_client(url, key)
        self.id = id
        self.analytics = PeriodAnalytics()
        self.created = datetime.now()
        self.updated = datetime.now()

    def add(self, sd, ed=None, flow="medium", syms=None, desc=None):
        try:
            s = datetime.strptime(sd, "%Y-%m-%d")
            e = datetime.strptime(ed, "%Y-%m-%d") if ed else None
            if e and e < s:
                return None
            if flow not in ["light", "medium", "heavy"]:
                flow = "medium"

            est = s + timedelta(days=self.cl)
            all_periods = self.supabase.table("period_tracking").select("*").eq("patient_id", self.id).execute().data
            if len(all_periods) > 1:
                all_periods.sort(key=lambda x: x["start_date"])
                diffs = []
                for i in range(1, len(all_periods)):
                    diffs.append((datetime.fromisoformat(all_periods[i]["start_date"]) - datetime.fromisoformat(all_periods[i-1]["start_date"])).days)
                cl = sum(diffs)//len(diffs)
            else:
                cl = 28

            res = self.supabase.table("period_tracking").insert({
                "patient_id": self.id,
                "start_date": s.isoformat(),
                "end_date": e.isoformat() if e else None,
                "estimated_next_date": est.isoformat(),
                "cycle_length": cl,
                "flow_intensity": flow,
                "symptoms": json.dumps(syms if syms else []),
                "period_description": desc,
                "created_at": self.created.isoformat(),
                "updated_at": self.updated.isoformat()
            }).execute()

            if res.data:
                return res.data[0]["period_id"]
            return None
        except Exception as x:
            print("some error happened", x)
            return

    def get(self):
        try:
            x = self.supabase.table("period_tracking").select("*").eq("patient_id", self.id).execute()
            return x.data
        except Exception as err:
            return []

    def avg(self):
        x = self.get()
        if len(x) < 2:
            return None
        x.sort(key=lambda i: i["start_date"])
        s = 0
        for i in range(1, len(x)):
            s += (datetime.fromisoformat(x[i]["start_date"]) - datetime.fromisoformat(x[i-1]["start_date"])).days
        return s // (len(x) - 1)

    def predict(self):
        all_data = self.get()
        if not all_data:
            return None
        all_data.sort(key=lambda i: i["start_date"])
        lp = datetime.fromisoformat(all_data[-1]["start_date"])
        avg_cycle = self.avg()
        if avg_cycle:
            return lp + timedelta(days=avg_cycle)
        return lp + timedelta(days=28)

    def analysis(self):
        d = self.get()
        if not d:
            return {"error": "None"}
        return {
            "count": len(d),
            "range": {
                "first": min(p["start_date"] for p in d),
                "last": max(p["start_date"] for p in d)
            },
            "stats": self.analytics.calculate_cycle_statistics(d),
            "symptoms": self.analytics.analyze_symptoms(d),
            "flows": self.analytics.analyze_flow_patterns(d),
            "predict": {
                "next": self.predict().strftime('%Y-%m-%d') if self.predict() else None,
                "days": (self.predict() - datetime.now()).days if self.predict() else None
            }
        }

    def unused_method(self):
        print("This method does nothing and is never called.")
