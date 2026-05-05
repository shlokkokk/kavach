const axios = require('axios');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = process.env.GROQ_API_KEY;

/**
 * Call Groq API (OpenAI-compatible) for job offer analysis
 */
async function analyzeJobOffer(text) {
  const systemPrompt = `You are KAVACH, India's fraud detection AI specializing in fake job offer analysis.

Analyze the given job offer message or document text and return ONLY a valid JSON object with this exact structure:
{
  "scamScore": <number 0-100>,
  "verdict": "<SCAM|SUSPICIOUS|LEGITIMATE>",
  "companyName": "<extracted company name or null>",
  "redFlags": [
    {
      "phrase": "<exact suspicious phrase from text>",
      "reason": "<rich, detailed, and professional description (10-15 words) explaining the specific forensic risk of this phrase>",
      "severity": "<HIGH|MEDIUM|LOW>"
    }
  ],
  "greenFlags": ["<any legitimacy signals>"],
  "explanation": "<2-3 sentence high-fidelity plain English explanation of verdict>",
  "recommendedAction": "<specific, actionable steps for the user to stay safe>"
}

Common Indian job scam indicators: upfront fees, no interview, guaranteed salary (40k-2L/month), WhatsApp-only contact, Gmail/Yahoo company emails, urgency pressure, typos in company name, promises of work-from-home with no experience required, asking for Aadhaar/bank details early.

CRITICAL: Do not provide short, 3-word reasons. Ensure every Red Flag has a comprehensive, expert-level forensic explanation.
Return ONLY the JSON. No preamble. No markdown. No backticks.`;

  if (!API_KEY || API_KEY === 'gsk_your_key_here') {
    // Return intelligent fallback analysis
    return generateFallbackAnalysis(text);
  }

  try {
    const response = await axios.post(GROQ_BASE_URL, {
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this job offer:\n\n${text}` },
      ],
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      timeout: 30000,
    });

    const raw = response.data.choices[0].message.content;
    // Clean potential markdown wrapping
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[Groq API Error]', err.response?.data || err.message);
    // Fallback to heuristic analysis
    return generateFallbackAnalysis(text);
  }
}

/**
 * Generate AI explanation for audio analysis results
 */
async function generateAudioExplanation(features, isDeepfake, confidence) {
  if (!API_KEY || API_KEY === 'gsk_your_key_here') {
    return isDeepfake
      ? `This audio shows strong signs of AI synthesis. The spectral patterns are unnaturally consistent, and key human vocal characteristics like natural breathing and pitch micro-variations are absent or diminished. Confidence: ${confidence.toFixed(1)}%.`
      : `This audio appears to be genuine human speech. Natural vocal patterns including breathing, pitch variation, and organic spectral characteristics are present. Confidence: ${confidence.toFixed(1)}%.`;
  }

  try {
    const response = await axios.post(GROQ_BASE_URL, {
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You are KAVACH, an AI audio forensics expert. Given audio analysis features, provide a brief 2-3 sentence explanation of why the audio is classified as real or deepfake. Be technical but understandable.' },
        { role: 'user', content: `Audio classified as: ${isDeepfake ? 'AI-GENERATED (DEEPFAKE)' : 'HUMAN (REAL)'}\nConfidence: ${confidence.toFixed(1)}%\nFeatures: ${JSON.stringify(features)}` },
      ],
    }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      timeout: 15000,
    });

    return response.data.choices[0].message.content.trim();
  } catch {
    return isDeepfake
      ? 'This audio shows signs of AI synthesis with abnormal spectral patterns and absent natural breathing markers.'
      : 'This audio appears genuine with natural vocal characteristics and organic spectral patterns.';
  }
}

/**
 * Heuristic fallback when NVIDIA API is unavailable
 */
function generateFallbackAnalysis(text) {
  const lower = text.toLowerCase();
  let score = 0;
  const redFlags = [];

  const patterns = [
    { regex: /(?:pay|send|transfer|deposit)\s*(?:₹|rs\.?|inr)?\s*\d+/i, phrase: null, reason: 'Requesting upfront payment for registration or tools is a definitive signature of recruitment fraud.', severity: 'HIGH', weight: 25 },
    { regex: /no\s+(?:experience|interview)\s+(?:required|needed)/i, phrase: null, reason: 'Claims of high-paying roles requiring zero experience or formal interviews are used to lure victims into scams.', severity: 'HIGH', weight: 20 },
    { regex: /(?:₹|rs\.?)\s*\d{2,3},?\d{3}\s*(?:\/\s*month|per\s*month|monthly)/i, phrase: null, reason: 'Unrealistic salary promises for entry-level work are designed to bypass critical thinking and exploit financial need.', severity: 'HIGH', weight: 15 },
    { regex: /registration\s+fee/i, phrase: null, reason: 'Legitimate employers never charge candidates for onboarding, training, or mandatory registration fees.', severity: 'HIGH', weight: 25 },
    { regex: /whatsapp\s*(?:us|me|now|immediately)/i, phrase: null, reason: 'Directing candidates exclusively to WhatsApp instead of official HR portals is a tactic used to avoid corporate monitoring.', severity: 'MEDIUM', weight: 10 },
    { regex: /limited\s+(?:seats?|slots?|vacancy)/i, phrase: null, reason: 'Artificial urgency and scarcity tactics are employed to pressure victims into making impulsive financial decisions.', severity: 'MEDIUM', weight: 10 },
    { regex: /(?:gmail|yahoo|hotmail)\.com/i, phrase: null, reason: 'The use of free, public email services instead of verified corporate domains is highly suspicious for any major firm.', severity: 'MEDIUM', weight: 10 },
    { regex: /work\s*from\s*home/i, phrase: null, reason: 'Generic WFH offers with no specific skill requirements are frequently used as bait for sophisticated task-based scams.', severity: 'LOW', weight: 5 },
    { regex: /congratulations/i, phrase: null, reason: 'Unsolicited congratulatory messages for roles not applied for are a hallmark of phishing and data harvesting operations.', severity: 'MEDIUM', weight: 10 },
    { regex: /interview\s+waived/i, phrase: null, reason: 'Waiving the interview process is an extreme red flag; legitimate organizations always conduct thorough competency assessments.', severity: 'HIGH', weight: 15 },
    { regex: /(?:gpay|phonepe|paytm|upi)\s*(?:to|@)/i, phrase: null, reason: 'Requests for payments via consumer UPI apps like GPay suggest an untraceable and non-corporate transaction.', severity: 'HIGH', weight: 20 },
    { regex: /selected\s+(?:for|as)/i, phrase: null, reason: 'Notifying a candidate of their selection without a formal interview or application is a classic "advance-fee" scam pattern.', severity: 'MEDIUM', weight: 10 },
  ];

  patterns.forEach(p => {
    const match = text.match(p.regex);
    if (match) {
      score += p.weight;
      redFlags.push({
        phrase: match[0],
        reason: p.reason,
        severity: p.severity,
      });
    }
  });

  score = Math.min(score, 100);
  const greenFlags = [];
  if (lower.includes('linkedin')) greenFlags.push('Mentions LinkedIn (professional platform)');

  // Extract company name heuristic
  const companyMatch = text.match(/(?:at|for|with|company[:\s]+)\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+(?:Pvt\.?\s*Ltd\.?|Inc\.?|Corp\.?|LLC|Limited|LLP))/);
  const companyName = companyMatch ? companyMatch[1].trim() : null;

  let verdict = 'LEGITIMATE';
  if (score >= 60) verdict = 'SCAM';
  else if (score >= 30) verdict = 'SUSPICIOUS';

  return {
    scamScore: score,
    verdict,
    companyName,
    redFlags,
    greenFlags,
    explanation: score >= 60
      ? `This message exhibits ${redFlags.length} classic scam patterns including ${redFlags.slice(0, 2).map(f => f.reason.toLowerCase()).join(' and ')}. This is almost certainly a fraud attempt.`
      : score >= 30
      ? `This message has some suspicious elements (${redFlags.length} flags detected) but may not be definitively a scam. Proceed with extreme caution.`
      : 'This message does not exhibit common scam patterns. However, always verify independently before sharing personal information.',
    recommendedAction: score >= 60
      ? 'Do not respond. Block this number. Report to cybercrime.gov.in or call 1930.'
      : score >= 30
      ? 'Verify the company independently. Do not share personal details or make any payments.'
      : 'Exercise normal caution. Verify the company and role through official channels.',
  };
}

module.exports = { analyzeJobOffer, generateAudioExplanation };
