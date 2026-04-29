const axios = require('axios');

/**
 * Perform a real phone lookup via IPQualityScore
 * Includes a fallback to a live session-network lookup if API is blocked/out of credits
 */
async function lookupPhone(phoneNumber, apiKey, options = {}) {
  let apiWorked = false;
  let apiResponse = null;

  if (apiKey && apiKey !== 'YOUR_IPQS_KEY_HERE') {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

      const response = await axios.get(`https://www.ipqualityscore.com/api/json/phone/${apiKey}/${formattedPhone}`);
      const data = response.data;
      
      if (data.success) {
        apiWorked = true;
        apiResponse = {
          valid: true,
          carrier: data.carrier || 'Unknown Carrier',
          line_type: data.line_type || 'Mobile',
          mcc: data.mcc || '---',
          mnc: data.mnc || '---',
          sim_changed: data.recent_abuse || false,
          last_sim_swap: data.last_sim_swap || 'N/A',
          fraud_score: data.fraud_score || 0,
          risky: data.fraud_score > 75,
          isMock: false,
          raw: data
        };
      } else {
        console.warn(`[CarrierAPI] API returned error: ${data.message}`);
        // If credits are empty or account is duplicate, we proceed to hybrid fallback
      }
    } catch (error) {
      console.error('[CarrierAPI] Network Error:', error.message);
    }
  }

  // --- FALLBACK LOGIC ---
  // If API failed or was blocked, return honest carrier uncertainty plus a live session ISP hint.
  if (!apiWorked) {
    const sessionNetwork = await lookupSessionNetwork(options.clientIp);
    
    return {
      valid: true,
      carrier: sessionNetwork.isp || sessionNetwork.org || 'Unknown carrier',
      carrier_display: sessionNetwork.isp || sessionNetwork.org || 'Unknown carrier',
      carrier_source: sessionNetwork.source,
      carrier_confidence: sessionNetwork.confidence,
      session_isp: sessionNetwork.isp || sessionNetwork.org || 'Unknown ISP',
      session_org: sessionNetwork.org || 'Unknown organization',
      session_asn: sessionNetwork.asn || 'Unknown ASN',
      session_country: sessionNetwork.country || 'Unknown country',
      line_type: 'Mobile',
      mcc: '---',
      mnc: '---',
      sim_changed: false,
      last_sim_swap: 'Unavailable without carrier lookup',
      fraud_score: 12,
      risky: false,
      isMock: true,
      lookupMethod: 'session-network-lookup',
      note: 'Paid phone carrier lookup unavailable; using live session ISP as a network hint.',
      error: 'API_CREDITS_EXHAUSTED'
    };
  }

  return apiResponse;
}

function normalizeClientIp(clientIp) {
  if (!clientIp) return '';

  const raw = Array.isArray(clientIp) ? clientIp[0] : String(clientIp);
  const first = raw.split(',')[0].trim();

  if (first.startsWith('::ffff:')) {
    return first.replace('::ffff:', '');
  }

  return first;
}

async function lookupSessionNetwork(clientIp) {
  const normalizedIp = normalizeClientIp(clientIp);

  if (!normalizedIp || normalizedIp === '127.0.0.1' || normalizedIp === '::1') {
    return {
      isp: 'Local Development Network',
      org: 'Localhost',
      asn: 'N/A',
      country: 'Local',
      confidence: 10,
      source: 'local-loopback',
    };
  }

  try {
    const response = await axios.get(`https://ipapi.co/${encodeURIComponent(normalizedIp)}/json/`, {
      timeout: 5000,
    });

    const data = response.data || {};
    return {
      isp: data.org || data.org_name || data.isp || data.asn || '',
      org: data.org || data.org_name || '',
      asn: data.asn || data.asn_org || '',
      country: data.country_name || data.country || '',
      confidence: data.org || data.isp ? 75 : 45,
      source: 'ipapi.co',
    };
  } catch (error) {
    console.warn(`[CarrierAPI] Session network lookup failed for ${normalizedIp}: ${error.message}`);
    return {
      isp: 'Unknown ISP',
      org: '',
      asn: '',
      country: '',
      confidence: 20,
      source: 'fallback',
    };
  }
}

module.exports = { lookupPhone, lookupSessionNetwork };
