import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Admin from './pages/Admin.jsx';
import Confirmation from './pages/Confirmation.jsx';
import CreateSurvey from './pages/CreateSurvey.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Responses from './pages/Responses.jsx';
import TakeSurvey from './pages/TakeSurvey.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateSurvey />
            </ProtectedRoute>
          }
        />
        <Route path="/survey/:surveyId" element={<TakeSurvey />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/responses/:surveyId"
          element={
            <ProtectedRoute>
              <Responses />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
