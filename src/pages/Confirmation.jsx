import { Link } from 'react-router-dom';

export default function Confirmation() {
  return (
    <div>
      <h2>Thank you for completing the survey.</h2>
      <p>Your response has been saved.</p>
      <p>
        <Link to="/">Back to Home</Link>
      </p>
    </div>
  );
}
