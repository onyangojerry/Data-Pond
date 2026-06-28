const MODEL_ID = 'Xenova/flan-t5-small';

let generatorPromise = null;

function getGenerator() {
  if (!generatorPromise) {
    generatorPromise = import('@huggingface/transformers').then(({ pipeline }) =>
      pipeline('text2text-generation', MODEL_ID, {
        dtype: 'q8'
      })
    );
  }

  return generatorPromise;
}

function buildPrompt({ topic, purpose }) {
  return [
    `Create 5 useful survey questions for: ${topic}.`,
    `Survey purpose: ${purpose}.`,
    'Return only the questions as a numbered list.',
    'Use clear beginner-friendly wording.'
  ].join(' ');
}

function buildChatPrompt({ topic, purpose, message, history }) {
  const recentHistory = history
    .slice(-4)
    .map((entry) => `${entry.sender === 'user' ? 'Publisher' : 'Assistant'}: ${entry.text}`)
    .join('\n');

  return [
    'You are a helpful survey design assistant.',
    `Survey topic: ${topic}.`,
    `Survey purpose: ${purpose}.`,
    'Help the publisher improve or create survey questions.',
    'When useful, include survey questions as a numbered list.',
    recentHistory ? `Conversation so far:\n${recentHistory}` : '',
    `Publisher: ${message}`,
    'Assistant:'
  ]
    .filter(Boolean)
    .join('\n');
}

function parseQuestions(text) {
  return text
    .split(/\n|(?:\d+\.\s*)/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter((line) => line.length > 8)
    .slice(0, 5);
}

function chooseQuestionType(text, index) {
  const lower = text.toLowerCase();

  if (lower.includes('rate') || lower.includes('satisfied') || lower.includes('scale')) {
    return 'rating';
  }

  if (lower.startsWith('would') || lower.startsWith('do ') || lower.startsWith('did ') || lower.startsWith('is ')) {
    return 'yesno';
  }

  if (index === 1) {
    return 'multiple';
  }

  return index === 0 ? 'short' : 'long';
}

function defaultOptions(topic) {
  return [`Very interested in ${topic}`, 'Somewhat interested', 'Not sure', 'Not interested'];
}

export async function generateQuestionsWithLocalModel({ topic, purpose, makeId }) {
  const generator = await getGenerator();
  const output = await generator(buildPrompt({ topic, purpose }), {
    max_new_tokens: 160,
    temperature: 0.7,
    do_sample: true
  });

  const generatedText = output?.[0]?.generated_text || '';
  const parsedQuestions = parseQuestions(generatedText);

  if (parsedQuestions.length === 0) {
    throw new Error('The local model did not return usable questions. Try again or use template suggestions.');
  }

  return parsedQuestions.map((text, index) => {
    const type = chooseQuestionType(text, index);

    return {
      id: makeId('question'),
      text,
      type,
      options: type === 'multiple' ? defaultOptions(topic) : []
    };
  });
}

export async function chatWithLocalModel({ topic, purpose, message, history, makeId }) {
  const generator = await getGenerator();
  const output = await generator(buildChatPrompt({ topic, purpose, message, history }), {
    max_new_tokens: 180,
    temperature: 0.7,
    do_sample: true
  });

  const replyText = output?.[0]?.generated_text?.trim() || 'I could not generate a reply. Try asking again.';
  const parsedQuestions = parseQuestions(replyText);
  const questions = parsedQuestions.map((text, index) => {
    const type = chooseQuestionType(text, index);

    return {
      id: makeId('question'),
      text,
      type,
      options: type === 'multiple' ? defaultOptions(topic) : []
    };
  });

  return { replyText, questions };
}
