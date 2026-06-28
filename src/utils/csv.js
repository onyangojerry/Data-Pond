function escapeCsvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function makeFileName(title) {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${safeTitle || 'survey'}-responses.csv`;
}

export function downloadResponsesCsv(survey, responses) {
  const headers = ['Response ID', 'Submitted At', ...survey.questions.map((question) => question.text)];
  const rows = responses.map((response) => [
    response.id,
    response.submittedAt,
    ...survey.questions.map((question) => response.answers[question.id] || '')
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = makeFileName(survey.title);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
