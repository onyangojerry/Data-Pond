import { missingSupabaseConfig, supabase } from './supabaseClient.js';
import { getAllQuestions, normalizeSections } from './surveyStructure.js';

function requireSupabase() {
  if (missingSupabaseConfig) {
    throw new Error('Supabase is not configured. Copy .env.example to .env and fill in your project URL and anon key.');
  }
}

function toSurvey(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    slug: row.slug || '',
    createdAt: row.created_at,
    sections: normalizeSections(row),
    questions: Array.isArray(row.questions) && row.questions.length > 0 ? row.questions : getAllQuestions(row)
  };
}

function toResponse(row) {
  return {
    id: row.id,
    surveyId: row.survey_id,
    submittedAt: row.submitted_at,
    answers: row.answers || {}
  };
}

function getErrorMessage(error) {
  return error?.message || 'Something went wrong while talking to Supabase.';
}

async function getCurrentUser() {
  requireSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  if (!data.user) {
    throw new Error('You must be signed in to do that.');
  }

  return data.user;
}

export async function getSurveys() {
  requireSupabase();
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data.map(toSurvey);
}

export async function getPublishedSurveys() {
  requireSupabase();
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data.map(toSurvey);
}

export async function getSurveyById(id) {
  requireSupabase();
  const { data, error } = await supabase.from('surveys').select('*').eq('id', id).maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ? toSurvey(data) : null;
}

export async function getOwnedSurveyById(id) {
  requireSupabase();
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ? toSurvey(data) : null;
}

export async function addSurvey(survey) {
  requireSupabase();
  const user = await getCurrentUser();
  const { error } = await supabase.from('surveys').insert({
    id: survey.id,
    owner_id: user.id,
    title: survey.title,
    description: survey.description,
    status: survey.status,
    slug: survey.slug,
    created_at: survey.createdAt,
    sections: survey.sections,
    questions: survey.questions
  });

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateSurvey(survey) {
  requireSupabase();
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('surveys')
    .update({
      title: survey.title,
      description: survey.description,
      status: survey.status,
      slug: survey.slug,
      sections: survey.sections,
      questions: survey.questions
    })
    .eq('id', survey.id)
    .eq('owner_id', user.id)
    .select('id')
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getSurveyBySlug(slug) {
  requireSupabase();
  const { data, error } = await supabase.from('surveys').select('*').eq('slug', slug).maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ? toSurvey(data) : null;
}

export async function deleteSurvey(id) {
  requireSupabase();
  const { error } = await supabase.from('surveys').delete().eq('id', id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getResponsesForSurvey(surveyId) {
  requireSupabase();
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data.map(toResponse);
}

export async function getResponseCountsBySurvey() {
  requireSupabase();
  const { data, error } = await supabase.from('responses').select('survey_id');

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data.reduce((counts, response) => {
    counts[response.survey_id] = (counts[response.survey_id] || 0) + 1;
    return counts;
  }, {});
}

export async function addResponse(response) {
  requireSupabase();
  const { error } = await supabase.from('responses').insert({
    id: response.id,
    survey_id: response.surveyId,
    submitted_at: response.submittedAt,
    answers: response.answers
  });

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
