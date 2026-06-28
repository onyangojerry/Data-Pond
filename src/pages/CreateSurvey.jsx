import { useState } from 'react';
import { Link } from 'react-router-dom';
import QuestionEditor from '../components/QuestionEditor.jsx';
import SurveyBot from '../components/SurveyBot.jsx';
import { addSurvey, makeId } from '../utils/storage.js';

function blankQuestion() {
  return {
    id: makeId('question'),
    text: '',
    type: 'short',
    options: []
  };
}

export default function CreateSurvey() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [error, setError] = useState('');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    setQuestions([...questions, blankQuestion()]);
  }

  function addBotQuestions(nextQuestions) {
    const filledQuestions = questions.filter((question) => question.text.trim());
    setQuestions([...filledQuestions, ...nextQuestions]);
  }

  function updateQuestion(index, nextQuestion) {
    setQuestions(questions.map((question, currentIndex) => (currentIndex === index ? nextQuestion : question)));
  }

  function deleteQuestion(index) {
    setQuestions(questions.filter((_, currentIndex) => currentIndex !== index));
  }

  function validateSurvey(status) {
    if (!title.trim()) {
      return 'Please enter a survey title.';
    }

    if (status === 'published' && questions.length === 0) {
      return 'Please add at least one question before publishing.';
    }

    for (const question of questions) {
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
    const surveyId = makeId('survey');
    const survey = {
      id: surveyId,
      title: title.trim(),
      description: description.trim(),
      status,
      createdAt: new Date().toISOString(),
      questions: questions.map((question) => ({
        ...question,
        text: question.text.trim(),
        options: question.type === 'multiple' ? question.options.map((option) => option.trim()).filter(Boolean) : []
      }))
    };

    try {
      await addSurvey(survey);

      if (status === 'published') {
        setPublishedUrl(`${window.location.origin}/survey/${surveyId}`);
      } else {
        setPublishedUrl('');
        setTitle('');
        setDescription('');
        setQuestions([blankQuestion()]);
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Create Survey</h2>
      <p>Build a new survey, save it as a draft, or publish it right away.</p>
      <hr />

      {error && <div className="error-box">{error}</div>}

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

            <h3>Questions</h3>
            {questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                index={index}
                onChange={(nextQuestion) => updateQuestion(index, nextQuestion)}
                onDelete={() => deleteQuestion(index)}
              />
            ))}

            <p>
              <button type="button" onClick={addQuestion} disabled={saving}>
                Add Question
              </button>{' '}
              <button type="button" onClick={() => saveSurvey('draft')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Draft'}
              </button>{' '}
              <button type="button" onClick={() => saveSurvey('published')} disabled={saving}>
                {saving ? 'Saving...' : 'Publish Survey'}
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
