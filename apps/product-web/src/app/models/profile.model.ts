export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  created_at?: string;
  updated_at?: string;
}

export interface CreateProfileRequest {
  full_name: string;
  email?: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
}

export interface ProfileSaveDialogData {
  profileData: CreateProfileRequest;
  onSave: (save: boolean) => void;
}
