const QUESTION_TYPES = [
  { value: 'short', label: 'Short text' },
  { value: 'long', label: 'Long text' },
  { value: 'multiple', label: 'Multiple choice' },
  { value: 'yesno', label: 'Yes/No' },
  { value: 'rating', label: 'Rating from 1 to 5' }
];

export default function QuestionEditor({ question, index, onChange, onDelete }) {
  function updateQuestion(field, value) {
    const nextQuestion = { ...question, [field]: value };

    if (field === 'type' && value !== 'multiple') {
      nextQuestion.options = [];
    }

    if (field === 'type' && value === 'multiple' && nextQuestion.options.length === 0) {
      nextQuestion.options = ['Option 1'];
    }

    onChange(nextQuestion);
  }

  function updateOption(optionIndex, value) {
    const options = question.options.map((option, currentIndex) =>
      currentIndex === optionIndex ? value : option
    );
    onChange({ ...question, options });
  }

  function addOption() {
    onChange({ ...question, options: [...question.options, `Option ${question.options.length + 1}`] });
  }

  function deleteOption(optionIndex) {
    onChange({
      ...question,
      options: question.options.filter((_, currentIndex) => currentIndex !== optionIndex)
    });
  }

  return (
    <fieldset className="question-editor">
      <legend>Question {index + 1}</legend>

      <label>
        Question Text
        <input
          type="text"
          value={question.text}
          onChange={(event) => updateQuestion('text', event.target.value)}
        />
      </label>

      <label>
        Question Type
        <select value={question.type} onChange={(event) => updateQuestion('type', event.target.value)}>
          {QUESTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      {question.type === 'multiple' && (
        <div className="options-box">
          <b>Multiple Choice Options</b>
          {question.options.map((option, optionIndex) => (
            <div className="option-row" key={`${question.id}-option-${optionIndex}`}>
              <input
                type="text"
                value={option}
                onChange={(event) => updateOption(optionIndex, event.target.value)}
              />
              <button type="button" onClick={() => deleteOption(optionIndex)}>
                Delete Option
              </button>
            </div>
          ))}
          <button type="button" onClick={addOption}>
            Add Option
          </button>
        </div>
      )}

      <button type="button" onClick={onDelete}>
        Delete Question
      </button>
    </fieldset>
  );
}
