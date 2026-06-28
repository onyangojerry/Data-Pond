import { Link } from 'react-router-dom';
import { signOut, useAuth } from '../utils/auth.jsx';
import { THEMES, useTheme } from '../utils/theme.jsx';

function getDisplayName(user, profile) {
  if (profile?.username) {
    return profile.username;
  }

  const metadata = user?.user_metadata || {};
  const name = metadata.username || metadata.full_name || metadata.name;

  if (name) {
    return name;
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  return 'Account';
}

export default function Layout({ children }) {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const displayName = user ? getDisplayName(user, profile) : '';

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
                  {displayName} |{' '}
                  <button type="button" className="link-button" onClick={signOut}>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login">Login</Link>
              )}{' '}
              | Theme:{' '}
              <select className="theme-select" value={theme} onChange={(event) => setTheme(event.target.value)}>
                {THEMES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
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
