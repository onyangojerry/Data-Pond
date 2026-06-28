import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { downloadResponsesCsv } from '../utils/csv.js';
import { getOwnedSurveyById, getResponsesForSurvey } from '../utils/storage.js';
import { normalizeSections } from '../utils/surveyStructure.js';

export default function Responses() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResponses() {
      try {
        const foundSurvey = await getOwnedSurveyById(surveyId);
        setSurvey(foundSurvey);

        if (foundSurvey) {
          setResponses(await getResponsesForSurvey(foundSurvey.id));
        }
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadResponses();
  }, [surveyId]);

  if (loading) {
    return <p>Loading responses...</p>;
  }

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  if (!survey) {
    return (
      <div>
        <h2>Survey Not Found</h2>
        <p>Responses cannot be shown because this survey does not exist.</p>
        <p>
          <Link to="/admin">Back to Admin</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Responses: {survey.title}</h2>
      <p>Total number of responses: {responses.length}</p>
      <p>
        <Link to="/admin">Back to Admin</Link>
        {responses.length > 0 && (
          <>
            {' '}
            |{' '}
            <button type="button" onClick={() => downloadResponsesCsv(survey, responses)}>
              Download CSV
            </button>
          </>
        )}
      </p>
      <hr />

      {responses.length === 0 ? (
        <p>No responses yet. Once people submit this survey, their answers will appear here.</p>
      ) : (
        responses.map((response, responseIndex) => (
          <table className="response-table" key={response.id}>
            <tbody>
              <tr>
                <th colSpan="2">Response {responses.length - responseIndex}</th>
              </tr>
              <tr>
                <td>Submitted</td>
                <td>{new Date(response.submittedAt).toLocaleString()}</td>
              </tr>
              {normalizeSections(survey).map((section) => (
                <Fragment key={section.id}>
                  <tr>
                    <th colSpan="2">{section.title}</th>
                  </tr>
                  {section.questions.map((question) => (
                    <tr key={question.id}>
                      <td>
                        {question.text}
                        {question.active === false && ' (archived)'}
                      </td>
                      <td>{response.answers[question.id] || '(No answer)'}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        ))
      )}
    </div>
  );
}
