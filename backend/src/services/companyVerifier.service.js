const axios = require('axios');

/**
 * Verify company existence using MCA21 public search
 * Falls back gracefully if API is unavailable
 */
async function verifyCompany(companyName) {
  if (!companyName) {
    return { found: false, note: 'No company name detected in the message' };
  }

  try {
    // Attempt MCA21 public API
    const url = `https://efiling.mca.gov.in/eFiling/rest/v1/companySearch?companyName=${encodeURIComponent(companyName)}`;
    const res = await axios.get(url, { timeout: 5000 });
    const companies = res.data?.companyList || [];

    if (companies.length > 0) {
      return {
        found: true,
        registeredName: companies[0].companyName,
        cin: companies[0].cin,
        status: companies[0].companyStatus,
        incorporationDate: companies[0].dateOfIncorporation,
        note: `Company found in MCA21 registry: ${companies[0].companyName}`,
      };
    }
    
    return {
      found: false,
      note: `No company named "${companyName}" found in MCA21 registry. This is a significant red flag.`,
    };
  } catch (err) {
    // MCA21 API is often unreliable — use heuristic verification
    return verifyCompanyHeuristic(companyName);
  }
}

/**
 * Heuristic company verification when MCA21 is unavailable
 */
function verifyCompanyHeuristic(companyName) {
  const lower = companyName.toLowerCase();
  
  // God-tier list of known legitimate companies (partial match)
  const knownCompanies = [
    // IT Giants & Tech MNCs
    'tata', 'infosys', 'wipro', 'hcl', 'tech mahindra', 'ltimindtree', 'cognizant',
    'accenture', 'ibm', 'capgemini', 'mphasis', 'oracle', 'sap', 'microsoft',
    'google', 'amazon', 'meta', 'apple', 'cisco', 'intel', 'adobe', 'salesforce',
    'nvidia', 'qualcomm', 'vmware', 'intuit', 'infobyte solutions',
    
    // Big 4 & Finance / Consulting
    'deloitte', 'pwc', 'kpmg', 'ey', 'ernst & young', 'goldman sachs',
    'jp morgan', 'morgan stanley', 'wells fargo', 'american express', 'barclays',
    'citibank', 'hsbc', 'standard chartered',
    
    // Indian Conglomerates & Top Banks
    'reliance', 'adani', 'mahindra', 'godrej', 'larsen', 'l&t',
    'bajaj', 'hdfc', 'icici', 'sbi', 'state bank of india', 'axis', 'kotak',
    'asian paints', 'hindustan unilever', 'itc', 'nestle', 'maruti suzuki', 'bharti airtel',
    
    // Indian Unicorns & Top Startups
    'flipkart', 'zomato', 'swiggy', 'paytm', 'phonepe', 'ola', 'oyo',
    'cred', 'zerodha', 'groww', 'razorpay', 'pine labs', 'dream11', 'meesho',
    'zoho', 'freshworks', 'postman', 'browserstack', 'policybazaar', 'nykaa',
  ];
  
  // Check against known companies
  const isKnown = knownCompanies.some(k => lower.includes(k));

  if (isKnown) {
    return {
      found: true,
      registeredName: companyName,
      status: 'Active',
      note: `Verified via KAVACH AI Internal Knowledge Base: "${companyName}" is a recognized entity.`,
    };
  }
  
  // Suspicious name patterns
  const suspiciousPatterns = [
    /digital\s*works/i, /online\s*services/i, /global\s*solutions/i,
    /smart\s*(?:tech|work)/i, /easy\s*(?:money|job|work)/i,
  ];
  const isSuspicious = suspiciousPatterns.some(p => p.test(companyName));
  
  // Check if name closely mimics a known brand
  const mimicPatterns = [
    { real: 'Reliance', pattern: /reliance(?!\s+industries)/i },
    { real: 'Tata', pattern: /tata(?!\s+(?:motors|steel|sons|consultancy|power))/i },
  ];
  const isMimic = mimicPatterns.some(m => m.pattern.test(companyName));

  if (isMimic) {
    return {
      found: false,
      note: `"${companyName}" appears to mimic a well-known brand name. This is a common scam tactic.`,
      warning: 'POSSIBLE_BRAND_IMPERSONATION',
    };
  }

  if (isSuspicious) {
    return {
      found: false,
      note: `"${companyName}" has a suspicious name pattern commonly used in scams. Could not verify in MCA21.`,
    };
  }

  return {
    found: false,
    note: `Could not verify "${companyName}" in MCA21 (API unavailable). Please check manually at mca.gov.in.`,
  };
}

module.exports = { verifyCompany };
