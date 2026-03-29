export type ApplicantStatus = 'New' | 'Contacted' | 'Interviewing' | 'Trained' | 'Failed' | 'Hired';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[]; // for select, radio, checkbox
  placeholder?: string;
  step: 1 | 2;
  order: number;
  width: 'half' | 'full';
}

export interface Applicant {
  id?: string;
  status: ApplicantStatus;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  [key: string]: any; // Allow dynamic fields
}

export interface FacebookSettings {
  accessToken: string;
  pageId: string;
  updatedAt: any;
}

export interface Account {
  id?: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: any;
}
