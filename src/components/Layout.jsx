import { Link } from 'react-router-dom';
import { signOut, useAuth } from '../utils/auth.jsx';

export default function Layout({ children }) {
  const { user } = useAuth();

  return (
    <div className="page-shell">
      <table className="main-table">
        <tbody>
          <tr>
            <td className="site-header">
              <h1>Data Pond</h1>
              <div className="tagline">Build your data points from scratch !</div>
            </td>
          </tr>
          <tr>
            <td className="nav-bar">
              <Link to="/">Home</Link> | <Link to="/create">Create Survey</Link> |{' '}
              <Link to="/admin">Admin</Link> |{' '}
              {user ? (
                <>
                  {user.email} |{' '}
                  <button type="button" className="link-button" onClick={signOut}>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login">Login</Link>
              )}
            </td>
          </tr>
          <tr>
            <td className="content-cell">{children}</td>
          </tr>
          <tr>
            <td className="footer-cell">
              <hr />
              <small>All Rights Reserved @2026.</small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
