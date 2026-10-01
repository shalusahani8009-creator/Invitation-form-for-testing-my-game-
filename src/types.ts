export type QuestionType =
  | 'SHORT_ANSWER'
  | 'PARAGRAPH'
  | 'MULTIPLE_CHOICE'
  | 'CHECKBOXES'
  | 'SCALE';

export interface FormQuestion {
  id: string;
  number: number;
  sectionId: string;
  title: string;
  type: QuestionType;
  required: boolean;
  description?: string;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  placeholder?: string;
  notes?: string;
}

export interface FormSection {
  id: string;
  title: string;
  badge: string;
  icon: string;
  description?: string;
  questions: FormQuestion[];
}

export interface FormDataState {
  // Section 1
  name: string;
  ageGroup: string;
  country: string;

  // Section 2
  googlePlayEmail: string;
  willingToInstallGooglePlay: string;

  // Section 3
  phoneBrand: string;
  phoneBrandOther?: string;
  phoneModel: string;
  androidVersion: string;

  // Section 4
  gamingFrequency: string;
  gameTypes: string[];
  gameTypesOther?: string;
  testingInterest: number;

  // Section 5
  testingAspects: string[];
  testingDuration: string;
  reportBugsWillingness: string;

  // Section 6
  rateGameplay?: number;
  rateControls?: number;
  rateGraphics?: number;
  ratePerformance?: number;
  encounteredBugs?: string;
  bugDescription?: string;
  likedMost?: string;
  improvements?: string;
  otherSuggestions?: string;

  // Agreement
  agreementChecks: {
    isBeta: boolean;
    provideFeedback: boolean;
    unfinishedFeatures: boolean;
    voluntary: boolean;
  };
}

export interface CreatedGoogleFormInfo {
  formId: string;
  title: string;
  responderUri: string;
  editUri: string;
  createdAt: string;
  type: 'unified' | 'registration' | 'feedback';
}

export interface GoogleFormsResponseItem {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers: Record<string, {
    questionId: string;
    textAnswers?: {
      answers: { value: string }[];
    };
  }>;
}
