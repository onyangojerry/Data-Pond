import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QuestionEditor from '../components/QuestionEditor.jsx';
import SurveyBot from '../components/SurveyBot.jsx';
import { getSurveyUrl, makeSurveySlug } from '../utils/shareLinks.js';
import { addSurvey, getOwnedSurveyById, makeId, updateSurvey } from '../utils/storage.js';
import {
  blankQuestion,
  blankSection,
  cleanSectionsForSave,
  getActiveQuestionCount,
  getAllQuestions,
  normalizeSections
} from '../utils/surveyStructure.js';

export default function CreateSurvey() {
  const { surveyId: draftSurveyId } = useParams();
  const isEditing = Boolean(draftSurveyId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState([blankSection()]);
  const [loadedStatus, setLoadedStatus] = useState('draft');
  const [loadedSlug, setLoadedSlug] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDraft() {
      if (!isEditing) {
        return;
      }

      try {
        const survey = await getOwnedSurveyById(draftSurveyId);

        if (!survey) {
          setError('Draft survey not found.');
          return;
        }

        setTitle(survey.title);
        setDescription(survey.description);
        setLoadedStatus(survey.status);
        setLoadedSlug(survey.slug || '');
        setSections(normalizeSections(survey));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadDraft();
  }, [isEditing, draftSurveyId]);

  function addQuestion() {
    addQuestionToSection(0);
  }

  function addBotQuestions(nextQuestions) {
    setSections((currentSections) => {
      const targetIndex = currentSections.findIndex((section) => section.active !== false);
      const index = targetIndex === -1 ? 0 : targetIndex;
      return currentSections.map((section, sectionIndex) =>
        sectionIndex === index
          ? {
              ...section,
              questions: [
                ...section.questions.filter((question) => question.text.trim() || question.active === false),
                ...nextQuestions.map((question) => ({ ...question, active: true }))
              ]
            }
          : section
      );
    });
  }

  function addSection() {
    setSections([...sections, { ...blankSection(), title: `Section ${sections.length + 1}` }]);
  }

  function updateSection(index, field, value) {
    setSections(sections.map((section, currentIndex) => (currentIndex === index ? { ...section, [field]: value } : section)));
  }

  function addQuestionToSection(sectionIndex) {
    if (sections.length === 0) {
      setSections([{ ...blankSection(), questions: [blankQuestion()] }]);
      return;
    }

    setSections(
      sections.map((section, currentIndex) =>
        currentIndex === sectionIndex ? { ...section, questions: [...section.questions, blankQuestion()] } : section
      )
    );
  }

  function updateQuestion(sectionIndex, questionIndex, nextQuestion) {
    setSections(
      sections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((question, currentQuestionIndex) =>
                currentQuestionIndex === questionIndex ? nextQuestion : question
              )
            }
          : section
      )
    );
  }

  function deleteQuestion(sectionIndex, questionIndex) {
    setSections(
      sections.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) {
          return section;
        }

        if (loadedStatus === 'published') {
          return {
            ...section,
            questions: section.questions.map((question, currentQuestionIndex) =>
              currentQuestionIndex === questionIndex
                ? { ...question, active: false, deletedAt: new Date().toISOString() }
                : question
            )
          };
        }

        return {
          ...section,
          questions: section.questions.filter((_, currentQuestionIndex) => currentQuestionIndex !== questionIndex)
        };
      })
    );
  }

  function deleteSection(sectionIndex) {
    if (loadedStatus === 'published') {
      setSections(
        sections.map((section, currentIndex) =>
          currentIndex === sectionIndex
            ? {
                ...section,
                active: false,
                deletedAt: new Date().toISOString(),
                questions: section.questions.map((question) => ({
                  ...question,
                  active: false,
                  deletedAt: question.deletedAt || new Date().toISOString()
                }))
              }
            : section
        )
      );
      return;
    }

    setSections(sections.filter((_, currentIndex) => currentIndex !== sectionIndex));
  }

  function validateSurvey(status) {
    if (!title.trim()) {
      return 'Please enter a survey title.';
    }

    if (status === 'published' && getActiveQuestionCount({ sections }) === 0) {
      return 'Please add at least one question before publishing.';
    }

    for (const question of getAllQuestions({ sections }).filter((item) => item.active !== false)) {
      if (!question.text.trim()) {
        return 'Please enter text for every question.';
      }

      if (question.type === 'multiple') {
        const filledOptions = question.options.filter((option) => option.trim());
        if (filledOptions.length < 2) {
          return 'Multiple choice questions need at least two options.';
        }
      }
    }

    return '';
  }

  async function saveSurvey(status) {
    const validationError = validateSurvey(status);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    const nextSurveyId = isEditing ? draftSurveyId : makeId('survey');
    const nextSlug = status === 'published' ? loadedSlug || makeSurveySlug(title, nextSurveyId) : null;
    const cleanedSections = cleanSectionsForSave(sections);
    const flattenedQuestions = getAllQuestions({ sections: cleanedSections });
    const survey = {
      id: nextSurveyId,
      title: title.trim(),
      description: description.trim(),
      status,
      slug: nextSlug,
      createdAt: new Date().toISOString(),
      sections: cleanedSections,
      questions: flattenedQuestions
    };

    try {
      if (isEditing) {
        await updateSurvey(survey);
      } else {
        await addSurvey(survey);
      }

      if (status === 'published') {
        setPublishedUrl(getSurveyUrl(survey));
      } else {
        setPublishedUrl('');
        setNotice('Draft saved.');

        if (!isEditing) {
          setTitle('');
          setDescription('');
          setSections([blankSection()]);
        }
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading draft...</p>;
  }

  return (
    <div>
      <h2>{isEditing ? 'Edit Draft Survey' : 'Create Survey'}</h2>
      <p>
        {isEditing
          ? 'Edit sections and questions. Published question deletes are archived to protect old responses.'
          : 'Build a new survey, save it as a draft, or publish it right away.'}
      </p>
      <hr />

      {error && <div className="error-box">{error}</div>}
      {notice && <div className="notice-box">{notice}</div>}

      {publishedUrl && (
        <div className="notice-box">
          Survey published. Public URL:{' '}
          <a href={publishedUrl} target="_blank" rel="noreferrer">
            {publishedUrl}
          </a>
          <br />
          <Link to="/admin">Go to Admin / Manage Surveys</Link>
        </div>
      )}

      <form onSubmit={(event) => event.preventDefault()}>
        <div className="create-layout">
          <div className="create-main">
            <label>
              Survey Title
              <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <label>
              Survey Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="4" />
            </label>

            <h3>Sections</h3>
            {sections
              .map((section, sectionIndex) => ({ section, sectionIndex }))
              .filter(({ section }) => section.active !== false)
              .map(({ section, sectionIndex }) => (
                <fieldset className="section-editor" key={section.id}>
                  <legend>Section {sectionIndex + 1}</legend>

                  <label>
                    Section Title
                    <input
                      type="text"
                      value={section.title}
                      onChange={(event) => updateSection(sectionIndex, 'title', event.target.value)}
                    />
                  </label>

                  <label>
                    Section Description
                    <textarea
                      value={section.description}
                      onChange={(event) => updateSection(sectionIndex, 'description', event.target.value)}
                      rows="3"
                    />
                  </label>

                  {section.questions
                    .map((question, questionIndex) => ({ question, questionIndex }))
                    .filter(({ question }) => question.active !== false)
                    .map(({ question, questionIndex }) => (
                      <QuestionEditor
                        key={question.id}
                        question={question}
                        index={questionIndex}
                        onChange={(nextQuestion) => updateQuestion(sectionIndex, questionIndex, nextQuestion)}
                        onDelete={() => deleteQuestion(sectionIndex, questionIndex)}
                        deleteLabel={loadedStatus === 'published' ? 'Archive Question' : 'Delete Question'}
                      />
                    ))}

                  <p>
                    <button type="button" onClick={() => addQuestionToSection(sectionIndex)} disabled={saving}>
                      Add Question to Section
                    </button>{' '}
                    <button type="button" onClick={() => deleteSection(sectionIndex)} disabled={saving}>
                      {loadedStatus === 'published' ? 'Archive Section' : 'Delete Section'}
                    </button>
                  </p>
                </fieldset>
              ))}

            <p>
              <button type="button" onClick={addSection} disabled={saving}>
                Add Section
              </button>{' '}
              <button type="button" onClick={addQuestion} disabled={saving}>
                Add Question to First Section
              </button>{' '}
              {loadedStatus !== 'published' && (
                <>
                  <button type="button" onClick={() => saveSurvey('draft')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>{' '}
                </>
              )}
              <button type="button" onClick={() => saveSurvey('published')} disabled={saving}>
                {saving ? 'Saving...' : loadedStatus === 'published' ? 'Save Published Changes' : 'Publish Survey'}
              </button>
            </p>
          </div>

          <div className="create-side">
            <SurveyBot surveyTitle={title} surveyDescription={description} onAddQuestions={addBotQuestions} />
          </div>
        </div>
      </form>
    </div>
  );
}
