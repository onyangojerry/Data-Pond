import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SurveyQuestion from '../components/SurveyQuestion.jsx';
import { addResponse, getSurveyById, getSurveyBySlug, makeId } from '../utils/storage.js';
import { getActiveSections } from '../utils/surveyStructure.js';

export default function TakeSurvey() {
  const { surveyId, surveySlug } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [missing, setMissing] = useState(false);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSurvey() {
      try {
        const foundSurvey = surveySlug ? await getSurveyBySlug(surveySlug) : await getSurveyById(surveyId);
        if (!foundSurvey || foundSurvey.status !== 'published') {
          setMissing(true);
          return;
        }
        setSurvey(foundSurvey);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadSurvey();
  }, [surveyId, surveySlug]);

  function updateAnswer(questionId, answer) {
    setAnswers({ ...answers, [questionId]: answer });
  }

  async function submitSurvey(event) {
    event.preventDefault();
    const activeQuestions = getActiveSections(survey).flatMap((section) => section.questions);
    const unanswered = activeQuestions.find((question) => !String(answers[question.id] || '').trim());

    if (unanswered) {
      setError('Please answer every question before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addResponse({
        id: makeId('response'),
        surveyId: survey.id,
        submittedAt: new Date().toISOString(),
        answers
      });

      navigate('/confirmation');
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  }

  if (missing) {
    return (
      <div>
        <h2>Survey Not Found</h2>
        <p>This survey link does not exist or the survey has not been published.</p>
        <p>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return <p>Loading survey...</p>;
  }

  if (error && !survey) {
    return (
      <div>
        <h2>Survey Error</h2>
        <div className="error-box">{error}</div>
        <p>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div>
        <h2>Survey Not Found</h2>
        <p>This survey link does not exist or the survey has not been published.</p>
        <p>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>{survey.title}</h2>
      <p>{survey.description}</p>
      <hr />

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={submitSurvey}>
        {getActiveSections(survey).map((section) => (
          <fieldset className="survey-section" key={section.id}>
            <legend>{section.title}</legend>
            {section.description && <p>{section.description}</p>}
            {section.questions.map((question) => (
              <SurveyQuestion
                key={question.id}
                question={question}
                value={answers[question.id] || ''}
                onAnswer={updateAnswer}
              />
            ))}
          </fieldset>
        ))}

        <p>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </p>
      </form>
    </div>
  );
}
