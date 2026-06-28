import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSurveyPath } from '../utils/shareLinks.js';
import { getPublishedSurveys } from '../utils/storage.js';
import { getActiveQuestionCount } from '../utils/surveyStructure.js';

export default function Home() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSurveys() {
      try {
        setSurveys(await getPublishedSurveys());
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadSurveys();
  }, []);

  return (
    <div>
      <h2>Enjoy pooling data points</h2>
      <p>
        <Link to="/create">Create Survey</Link> | <Link to="/admin">Admin / Manage Surveys</Link>
      </p>
      <hr />

      <h3>Published Surveys</h3>
      {error && <div className="error-box">{error}</div>}
      {loading ? (
        <p>Loading surveys...</p>
      ) : surveys.length === 0 ? (
        <p>No published surveys are available yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Questions</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((survey) => (
              <tr key={survey.id}>
                <td>{survey.title}</td>
                <td>{survey.description}</td>
                <td>{getActiveQuestionCount(survey)}</td>
                <td>
                  <Link to={getSurveyPath(survey)}>Take Survey</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
