import { CreatedGoogleFormInfo, GoogleFormsResponseItem } from '../types';
import { FORM_META, FORM_SECTIONS, AGREEMENT_ITEMS } from '../data/formSchema';
import { getAccessToken } from './auth';

const STORAGE_KEY = 'snake_game_google_forms_v1';

export function getSavedForms(): CreatedGoogleFormInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read saved forms from localStorage', e);
    return [];
  }
}

export function saveFormInfo(form: CreatedGoogleFormInfo) {
  const forms = getSavedForms().filter((f) => f.formId !== form.formId);
  forms.unshift(form);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
}

export function deleteSavedForm(formId: string) {
  const forms = getSavedForms().filter((f) => f.formId !== formId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
}

// Convert our schema into Google Forms API createItem requests
function buildBatchRequests(mode: 'unified' | 'registration' | 'feedback') {
  const requests: any[] = [];
  let itemIndex = 0;

  // 1. Update form description
  let description = FORM_META.description;
  if (mode === 'feedback') {
    description =
      '🎮 Snake Game — Beta Tester Post-Play Feedback\n\nPlease share your honest ratings, bug reports, and suggestions after testing the Snake Game beta build. Your feedback directly shapes our official Google Play release!';
  }

  requests.push({
    updateFormInfo: {
      info: {
        description: description,
      },
      updateMask: 'description',
    },
  });

  // Filter sections based on mode
  let targetSections = FORM_SECTIONS;
  if (mode === 'registration') {
    targetSections = FORM_SECTIONS.filter((s) => s.id !== 'section_6');
  } else if (mode === 'feedback') {
    targetSections = FORM_SECTIONS.filter((s) => s.id === 'section_6');
  }

  targetSections.forEach((section, sIdx) => {
    // Add page break or section header
    if (sIdx > 0 || mode === 'feedback') {
      requests.push({
        createItem: {
          item: {
            title: `${section.badge} — ${section.title}`,
            description: section.description || '',
            pageBreakItem: {},
          },
          location: { index: itemIndex++ },
        },
      });
    } else {
      // First section header
      requests.push({
        createItem: {
          item: {
            title: `${section.badge} — ${section.title}`,
            description: section.description || '',
            textItem: {},
          },
          location: { index: itemIndex++ },
        },
      });
    }

    // Add questions in this section
    section.questions.forEach((q) => {
      const questionPayload: any = {
        required: q.required,
      };

      if (q.type === 'SHORT_ANSWER') {
        questionPayload.textQuestion = { paragraph: false };
      } else if (q.type === 'PARAGRAPH') {
        questionPayload.textQuestion = { paragraph: true };
      } else if (q.type === 'MULTIPLE_CHOICE') {
        questionPayload.choiceQuestion = {
          type: 'RADIO',
          options: (q.options || []).map((opt) => ({ value: opt })),
          shuffle: false,
        };
      } else if (q.type === 'CHECKBOXES') {
        questionPayload.choiceQuestion = {
          type: 'CHECKBOX',
          options: (q.options || []).map((opt) => ({ value: opt })),
          shuffle: false,
        };
      } else if (q.type === 'SCALE') {
        questionPayload.scaleQuestion = {
          low: q.scaleMin ?? 1,
          high: q.scaleMax ?? 5,
          lowLabel: q.scaleMinLabel || '',
          highLabel: q.scaleMaxLabel || '',
        };
      }

      let questionTitle = `${q.number}. ${q.title}`;
      let questionDesc = q.description || '';
      if (q.notes) {
        questionDesc = questionDesc ? `${questionDesc}\n\n${q.notes}` : q.notes;
      }

      requests.push({
        createItem: {
          item: {
            title: questionTitle,
            description: questionDesc,
            questionItem: {
              question: questionPayload,
            },
          },
          location: { index: itemIndex++ },
        },
      });
    });
  });

  // If registration or unified mode, add the Tester Agreement section
  if (mode !== 'feedback') {
    requests.push({
      createItem: {
        item: {
          title: '✅ Tester Agreement',
          description: 'Please review and accept our beta testing terms to participate.',
          pageBreakItem: {},
        },
        location: { index: itemIndex++ },
      },
    });

    requests.push({
      createItem: {
        item: {
          title: '24. Beta Testing Agreement',
          description: 'You must agree to all statements to qualify for the Google Play Beta test.',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'CHECKBOX',
                options: AGREEMENT_ITEMS.map((item) => ({ value: item.text })),
                shuffle: false,
              },
            },
          },
        },
        location: { index: itemIndex++ },
      },
    });

    // Thank you message notice
    requests.push({
      createItem: {
        item: {
          title: '🎉 Thank You Message',
          description: FORM_META.thankYouMessage,
          textItem: {},
        },
        location: { index: itemIndex++ },
      },
    });
  }

  return requests;
}

export async function createGoogleForm(
  mode: 'unified' | 'registration' | 'feedback' = 'unified',
  customTitle?: string
): Promise<CreatedGoogleFormInfo> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated with Google. Please sign in first.');
  }

  let title = customTitle || FORM_META.title;
  if (!customTitle) {
    if (mode === 'registration') {
      title = '🎮 Snake Game — Beta Tester Registration (Sections 1–5)';
    } else if (mode === 'feedback') {
      title = '🐛 Snake Game — Post-Test Gameplay Feedback (Section 6)';
    }
  }

  // Step 1: Create base Form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: title,
        documentTitle: title,
      },
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to create form (HTTP ${createRes.status})`
    );
  }

  const newFormData = await createRes.json();
  const formId = newFormData.formId;
  const responderUri = newFormData.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`;
  const editUri = `https://docs.google.com/forms/d/${formId}/edit`;

  // Step 2: Batch update items into form
  const batchRequests = buildBatchRequests(mode);
  const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeFormInResponse: true,
      requests: batchRequests,
    }),
  });

  if (!batchRes.ok) {
    const errorData = await batchRes.json().catch(() => ({}));
    console.error('Batch update failed:', errorData);
    // Still return the created form info so the user has the link
  }

  const resultInfo: CreatedGoogleFormInfo = {
    formId,
    title,
    responderUri,
    editUri,
    createdAt: new Date().toISOString(),
    type: mode,
  };

  saveFormInfo(resultInfo);
  return resultInfo;
}

export async function fetchFormDetails(formId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to get form details (${res.status})`);
  }

  return await res.json();
}

export async function fetchFormResponses(formId: string): Promise<GoogleFormsResponseItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to fetch responses (${res.status})`);
  }

  const data = await res.json();
  return data.responses || [];
}
