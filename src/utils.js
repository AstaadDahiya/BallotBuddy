/**
 * Utility functions for BallotBuddy.
 */

/**
 * Detect current step from assistant messages using keyword heuristics.
 * Scans the combined text of all assistant messages and returns the
 * highest-priority step that matches.
 *
 * @param {Array} messages - The chat message history
 * @returns {number} The detected step (1-5)
 */
export function detectStep(messages) {
  const assistantTexts = messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content.toLowerCase())
    .join(' ');

  if (assistantTexts.includes('result') || assistantTexts.includes('after the election'))
    return 5;
  if (assistantTexts.includes('cast') || assistantTexts.includes('evm') || assistantTexts.includes('ballot'))
    return 4;
  if (assistantTexts.includes('polling') || assistantTexts.includes('booth') || assistantTexts.includes('logistics'))
    return 3;
  if (assistantTexts.includes('candidate') || assistantTexts.includes('manifesto') || assistantTexts.includes('research'))
    return 2;
  return 1;
}
