const express = require('express');
const router = express.Router();
const { pdfUpload } = require('../middleware/upload.middleware');
const { analyzeJobOffer } = require('../services/nvidianim.service');
const { verifyCompany } = require('../services/companyVerifier.service');
const { analyzeLinksFromText } = require('../services/urlLinkAnalyzer.service');

// Scan text message
router.post('/scan', pdfUpload.single('file'), async (req, res, next) => {
  try {
    let text = req.body?.text;

    // If PDF uploaded, extract text
    if (req.file) {
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(req.file.buffer);
        text = pdfData.text;
      } catch (pdfErr) {
        return res.status(400).json({ success: false, error: 'Could not parse PDF file' });
      }
    }

    if (!text || text.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Message text is too short (min 10 chars)' });
    }

    // Analyze with NVIDIA NIM (or fallback)
    const analysis = await analyzeJobOffer(text);
    const linkAnalysis = await analyzeLinksFromText(text);

    // Verify company if detected
    let companyVerification = null;
    if (analysis.companyName) {
      companyVerification = await verifyCompany(analysis.companyName);
    }

    // Boost score if company not found
    let adjustedScore = analysis.scamScore;
    if (companyVerification && !companyVerification.found && adjustedScore < 90) {
      adjustedScore = Math.min(adjustedScore + 10, 100);
    }
    if (linkAnalysis && linkAnalysis.hasLinks && typeof linkAnalysis.overallRiskScore === 'number') {
      adjustedScore = Math.min(
        Math.round((adjustedScore * 0.7) + (linkAnalysis.overallRiskScore * 0.3)),
        100
      );
    }

    const responseData = {
      ...analysis,
      scamScore: adjustedScore,
      companyVerification: companyVerification || { found: false, note: 'No company name detected' },
    };

    // Show link analysis only when no-links is explicit or result is genuinely computed.
    if (linkAnalysis && (!linkAnalysis.hasLinks || (Array.isArray(linkAnalysis.results) && linkAnalysis.results.length > 0))) {
      responseData.linkAnalysis = linkAnalysis;
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
