import { useState } from 'react';
import { chatWithLocalModel, generateQuestionsWithLocalModel } from '../utils/localQuestionModel.js';
import { makeId } from '../utils/storage.js';

const GOAL_PRESETS = {
  feedback: {
    label: 'General feedback',
    questions: [
      { text: 'What is your overall impression of {topic}?', type: 'long', options: [] },
      { text: 'How would you rate {topic} from 1 to 5?', type: 'rating', options: [] },
      {
        text: 'Which part of {topic} matters most to you?',
        type: 'multiple',
        options: ['Quality', 'Price', 'Ease of use', 'Support', 'Other']
      },
      { text: 'Would you recommend {topic} to someone else?', type: 'yesno', options: [] },
      { text: 'What should be improved first?', type: 'long', options: [] }
    ]
  },
  event: {
    label: 'Event planning',
    questions: [
      { text: 'What is your name?', type: 'short', options: [] },
      { text: 'Will you attend {topic}?', type: 'yesno', options: [] },
      {
        text: 'Which time works best for you?',
        type: 'multiple',
        options: ['Morning', 'Afternoon', 'Evening', 'No preference']
      },
      { text: 'How interested are you in {topic}?', type: 'rating', options: [] },
      { text: 'Do you have any notes for the organizer?', type: 'long', options: [] }
    ]
  },
  customer: {
    label: 'Customer research',
    questions: [
      { text: 'What problem were you trying to solve with {topic}?', type: 'long', options: [] },
      {
        text: 'How often do you use {topic}?',
        type: 'multiple',
        options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never']
      },
      { text: 'Was {topic} easy to use?', type: 'yesno', options: [] },
      { text: 'How satisfied are you with {topic}?', type: 'rating', options: [] },
      { text: 'What would make {topic} more useful?', type: 'long', options: [] }
    ]
  },
  education: {
    label: 'Class or training',
    questions: [
      { text: 'What did you learn from {topic}?', type: 'long', options: [] },
      { text: 'Was the material easy to understand?', type: 'yesno', options: [] },
      {
        text: 'Which format helped you most?',
        type: 'multiple',
        options: ['Reading', 'Video', 'Live discussion', 'Practice exercises', 'Other']
      },
      { text: 'Rate the usefulness of {topic}.', type: 'rating', options: [] },
      { text: 'What topic should be covered next?', type: 'short', options: [] }
    ]
  }
};

function cleanTopic(value) {
  const topic = value.trim();
  return topic || 'this topic';
}

function buildQuestion(template, topic) {
  return {
    id: makeId('question'),
    text: template.text.replaceAll('{topic}', topic),
    type: template.type,
    options: [...template.options]
  };
}

export default function SurveyBot({ surveyTitle, surveyDescription, onAddQuestions }) {
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('feedback');
  const [suggestions, setSuggestions] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatLog, setChatLog] = useState([
    {
      sender: 'bot',
      text: 'Hello. Tell me what kind of survey you are building, and I can suggest or revise questions.'
    }
  ]);
  const [loadingModel, setLoadingModel] = useState(false);
  const [botMessage, setBotMessage] = useState('Enter a topic, choose a purpose, then ask the bot for questions.');

  function generateSuggestions() {
    const sourceTopic = cleanTopic(topic || surveyTitle || surveyDescription);
    const preset = GOAL_PRESETS[goal];
    const nextSuggestions = preset.questions.map((question) => buildQuestion(question, sourceTopic));

    setSuggestions(nextSuggestions);
    setBotMessage(`DataPonder created ${nextSuggestions.length} suggested questions for ${preset.label}.`);
  }

  async function generateWithSmallModel() {
    const sourceTopic = cleanTopic(topic || surveyTitle || surveyDescription);
    const preset = GOAL_PRESETS[goal];

    setLoadingModel(true);
    setBotMessage('DataPonder is waking up.');

    try {
      const nextSuggestions = await generateQuestionsWithLocalModel({
        topic: sourceTopic,
        purpose: preset.label,
        makeId
      });

      setSuggestions(nextSuggestions);
      setBotMessage(`DataPonder is alive ${nextSuggestions.length} suggested questions.`);
    } catch (modelError) {
      setBotMessage(modelError.message);
    } finally {
      setLoadingModel(false);
    }
  }

  async function sendChatMessage(event) {
    event.preventDefault();

    if (!chatText.trim()) {
      return;
    }

    const sourceTopic = cleanTopic(topic || surveyTitle || surveyDescription);
    const preset = GOAL_PRESETS[goal];
    const userEntry = { sender: 'user', text: chatText.trim() };
    const nextLog = [...chatLog, userEntry];

    setChatLog(nextLog);
    setChatText('');
    setLoadingModel(true);
    setBotMessage('DataPonder is reasoning, cleverly.');

    try {
      const result = await chatWithLocalModel({
        topic: sourceTopic,
        purpose: preset.label,
        message: userEntry.text,
        history: chatLog,
        makeId
      });

      setChatLog([...nextLog, { sender: 'bot', text: result.replyText }]);

      if (result.questions.length > 0) {
        setSuggestions(result.questions);
        setBotMessage(`DataPonder found ${result.questions.length} addable question suggestions in its reply.`);
      } else {
        setBotMessage('DataPonder replied. Ask for numbered survey questions if you want addable suggestions.');
      }
    } catch (modelError) {
      setChatLog([...nextLog, { sender: 'bot', text: modelError.message }]);
      setBotMessage(modelError.message);
    } finally {
      setLoadingModel(false);
    }
  }

  function addOneQuestion(question) {
    onAddQuestions([{ ...question, id: makeId('question'), options: [...question.options] }]);
    setBotMessage('Question added. You can edit it below.');
  }

  function addAllQuestions() {
    onAddQuestions(suggestions.map((question) => ({ ...question, id: makeId('question'), options: [...question.options] })));
    setBotMessage('All suggested questions were added. Review them before publishing.');
  }

  return (
    <fieldset className="bot-box">
      <legend>DataPonder 1.0</legend>

      <table className="bot-table">
        <tbody>
          <tr>
            <td className="bot-face" aria-hidden="true">
              [::]
              <br />
              /||\
            </td>
            <td>
              <b>Question helper for publishers</b>
              <div className="bot-message">{botMessage}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <label>
        Topic or product name
        <input
          type="text"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Example: customer checkout experience"
        />
      </label>

      <label>
        Survey purpose
        <select value={goal} onChange={(event) => setGoal(event.target.value)}>
          {Object.entries(GOAL_PRESETS).map(([value, preset]) => (
            <option key={value} value={value}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <p>
        <button type="button" onClick={generateWithSmallModel} disabled={loadingModel}>
          {loadingModel ? 'Model Working...' : 'Use Free Small AI Model'}
        </button>{' '}
        <button type="button" onClick={generateSuggestions}>
          Use Template Bot
        </button>{' '}
        <button type="button" onClick={addAllQuestions} disabled={suggestions.length === 0}>
          Add All Suggestions
        </button>
      </p>

      <div className="bot-chat-box">
        <b>Conversation</b>
        <div className="bot-chat-log">
          {chatLog.map((entry, index) => (
            <div className="bot-chat-line" key={`${entry.sender}-${index}`}>
              <span className="bot-chat-name">{entry.sender === 'user' ? 'Publisher' : 'SurveyBot'}:</span>{' '}
              {entry.text}
            </div>
          ))}
        </div>

        <form onSubmit={sendChatMessage}>
          <label>
            Message the bot
            <textarea
              value={chatText}
              onChange={(event) => setChatText(event.target.value)}
              rows="3"
              placeholder="Example: Make these questions better for a restaurant customer survey."
            />
          </label>
          <button type="submit" disabled={loadingModel || !chatText.trim()}>
            {loadingModel ? 'Waiting...' : 'Send Message'}
          </button>
        </form>
      </div>

      {suggestions.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Suggested Question</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((question) => (
              <tr key={question.id}>
                <td>{question.text}</td>
                <td>{question.type}</td>
                <td>
                  <button type="button" onClick={() => addOneQuestion(question)}>
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </fieldset>
  );
}
