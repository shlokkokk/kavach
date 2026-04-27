const express = require('express');
const router = express.Router();
const { pdfUpload } = require('../middleware/upload.middleware');
const { analyzeJobOffer } = require('../services/nvidianim.service');
const { verifyCompany } = require('../services/companyVerifier.service');

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

    res.json({
      success: true,
      data: {
        ...analysis,
        scamScore: adjustedScore,
        companyVerification: companyVerification || { found: false, note: 'No company name detected' },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
