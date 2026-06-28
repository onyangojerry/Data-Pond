function makeStructureId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function blankQuestion() {
  return {
    id: makeStructureId('question'),
    text: '',
    type: 'short',
    options: [],
    active: true
  };
}

export function blankSection() {
  return {
    id: makeStructureId('section'),
    title: 'Section 1',
    description: '',
    active: true,
    questions: [blankQuestion()]
  };
}

export function normalizeQuestion(question) {
  return {
    id: question.id || makeStructureId('question'),
    text: question.text || '',
    type: question.type || 'short',
    options: Array.isArray(question.options) ? question.options : [],
    active: question.active !== false,
    deletedAt: question.deletedAt || null
  };
}

export function normalizeSection(section, index = 0) {
  return {
    id: section.id || makeStructureId('section'),
    title: section.title || `Section ${index + 1}`,
    description: section.description || '',
    active: section.active !== false,
    deletedAt: section.deletedAt || null,
    questions: Array.isArray(section.questions) ? section.questions.map(normalizeQuestion) : []
  };
}

export function normalizeSections(survey) {
  if (Array.isArray(survey.sections) && survey.sections.length > 0) {
    return survey.sections.map(normalizeSection);
  }

  return [
    normalizeSection({
      id: 'default-section',
      title: 'Survey Questions',
      description: '',
      questions: Array.isArray(survey.questions) ? survey.questions : []
    })
  ];
}

export function getAllQuestions(survey) {
  return normalizeSections(survey).flatMap((section) => section.questions);
}

export function getActiveSections(survey) {
  return normalizeSections(survey)
    .map((section) => ({
      ...section,
      questions: section.questions.filter((question) => question.active !== false)
    }))
    .filter((section) => section.active !== false && section.questions.length > 0);
}

export function getActiveQuestionCount(survey) {
  return getActiveSections(survey).reduce((total, section) => total + section.questions.length, 0);
}

export function cleanSectionsForSave(sections) {
  return sections.map((section, sectionIndex) => ({
    ...section,
    title: section.title.trim() || `Section ${sectionIndex + 1}`,
    description: section.description.trim(),
    questions: section.questions.map((question) => ({
      ...question,
      text: question.text.trim(),
      active: question.active !== false,
      options: question.type === 'multiple' ? question.options.map((option) => option.trim()).filter(Boolean) : []
    }))
  }));
}
