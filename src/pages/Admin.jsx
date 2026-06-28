import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteSurvey, getResponseCountsBySurvey, getSurveys } from '../utils/storage.js';

export default function Admin() {
  const [surveys, setSurveys] = useState([]);
  const [responseCounts, setResponseCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadSurveys() {
    try {
      const [loadedSurveys, counts] = await Promise.all([getSurveys(), getResponseCountsBySurvey()]);
      setSurveys(loadedSurveys);
      setResponseCounts(counts);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSurveys();
  }, []);

  async function handleDelete(survey) {
    const confirmed = window.confirm(`Delete "${survey.title}" and all of its responses?`);
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      await deleteSurvey(survey.id);
      await loadSurveys();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div>
      <h2>Admin / Manage Surveys</h2>
      <p>
        <Link to="/create">Create Survey</Link>
      </p>
      <hr />

      {error && <div className="error-box">{error}</div>}
      {loading ? (
        <p>Loading surveys...</p>
      ) : surveys.length === 0 ? (
        <p>No surveys have been created yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Questions</th>
              <th>Responses</th>
              <th>Public Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((survey) => {
              const publicPath = `/survey/${survey.id}`;

              return (
                <tr key={survey.id}>
                  <td>{survey.title}</td>
                  <td>{survey.status}</td>
                  <td>{survey.questions.length}</td>
                  <td>{responseCounts[survey.id] || 0}</td>
                  <td>
                    {survey.status === 'published' ? (
                      <Link to={publicPath}>{window.location.origin + publicPath}</Link>
                    ) : (
                      'Not published'
                    )}
                  </td>
                  <td>
                    {survey.status === 'published' && (
                      <>
                        <Link to={publicPath}>take survey</Link> |{' '}
                      </>
                    )}
                    <Link to={`/responses/${survey.id}`}>view responses</Link> |{' '}
                    <button type="button" className="link-button" onClick={() => handleDelete(survey)}>
                      delete survey
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
