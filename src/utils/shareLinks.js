export function makeSurveySlug(title, id) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)
    .replace(/-$/g, '');
  const suffix = id.split('-').slice(-1)[0] || id.slice(-6);

  return `${words || 'survey'}-${suffix}`;
}

export function getSurveyPath(survey) {
  return survey.slug ? `/s/${survey.slug}` : `/survey/${survey.id}`;
}

export function getSurveyUrl(survey) {
  return `${window.location.origin}${getSurveyPath(survey)}`;
}

export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}
