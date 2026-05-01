const path = require('path');
const { spawn } = require('child_process');

const URL_REGEX = /(https?:\/\/[^\s<>'"()]+|www\.[^\s<>'"()]+)/gi;

function extractUrls(text = '') {
  const raw = text.match(URL_REGEX) || [];
  const cleaned = raw.map((u) => {
    const trimmed = u.trim().replace(/[.,;:!?)\]}]+$/g, '');
    return trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed;
  });
  return [...new Set(cleaned)];
}

function runPythonAnalyzer(payload) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'python', 'link_analyzer.py');
    const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
    const pythonArgs = process.platform === 'win32' ? ['-3', scriptPath] : [scriptPath];
    const child = spawn(pythonCommand, pythonArgs, {
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => reject(error));

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Python analyzer exited with code ${code}`));
      }
      try {
        const lines = (stdout || '')
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        const jsonLine = [...lines].reverse().find((line) => line.startsWith('{') && line.endsWith('}'));
        const parsed = JSON.parse(jsonLine || '{}');
        resolve(parsed);
      } catch {
        reject(new Error('Invalid JSON from Python analyzer'));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

async function analyzeLinksFromText(text) {
  const urls = extractUrls(text);
  if (!urls.length) {
    return {
      hasLinks: false,
      message: 'No links found in input.',
      results: [],
    };
  }

  try {
    const pythonResult = await runPythonAnalyzer({ text, urls });
    if (!pythonResult || !pythonResult.ok) {
      return null;
    }
    return pythonResult;
  } catch (error) {
    console.warn('[Link Analyzer] Skipping link analysis:', error.message);
    return null;
  }
}

module.exports = { analyzeLinksFromText, extractUrls };
