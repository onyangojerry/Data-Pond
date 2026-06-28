export default function SurveyQuestion({ question, value, onAnswer }) {
  const inputName = `answer-${question.id}`;

  return (
    <div className="survey-question">
      <p>
        <b>{question.text}</b>
      </p>

      {question.type === 'short' && (
        <input type="text" value={value} onChange={(event) => onAnswer(question.id, event.target.value)} />
      )}

      {question.type === 'long' && (
        <textarea value={value} onChange={(event) => onAnswer(question.id, event.target.value)} rows="5" />
      )}

      {question.type === 'multiple' && (
        <div>
          {question.options.map((option) => (
            <label className="choice-line" key={option}>
              <input
                type="radio"
                name={inputName}
                value={option}
                checked={value === option}
                onChange={(event) => onAnswer(question.id, event.target.value)}
              />
              {option}
            </label>
          ))}
        </div>
      )}

      {question.type === 'yesno' && (
        <div>
          {['Yes', 'No'].map((option) => (
            <label className="choice-line" key={option}>
              <input
                type="radio"
                name={inputName}
                value={option}
                checked={value === option}
                onChange={(event) => onAnswer(question.id, event.target.value)}
              />
              {option}
            </label>
          ))}
        </div>
      )}

      {question.type === 'rating' && (
        <select value={value} onChange={(event) => onAnswer(question.id, event.target.value)}>
          <option value="">Select rating</option>
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
