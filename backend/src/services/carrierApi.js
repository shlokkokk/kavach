const axios = require('axios');

function normalizePhone(phoneNumber) {
  const clean = String(phoneNumber || '').replace(/\D/g, '');
  if (!clean) return { clean: '', e164: '' };
  if (clean.length === 10) return { clean, e164: `+91${clean}` };
  if (clean.startsWith('91') && clean.length === 12) return { clean, e164: `+${clean}` };
  return { clean, e164: clean.startsWith('+') ? clean : `+${clean}` };
}

async function lookupViaVeriphone(phoneNumber, apiKey) {
  if (!apiKey) return { ok: false, code: 'VERIPHONE_KEY_MISSING', message: 'Veriphone key missing' };
  try {
    const { e164 } = normalizePhone(phoneNumber);
    const resp = await axios.get('https://api.veriphone.io/v2/verify', {
      params: { key: apiKey, phone: e164 },
      timeout: 10000,
    });
    const data = resp.data || {};
    if (data.success === false || data.status === 'error') {
      return { ok: false, code: 'VERIPHONE_ERROR', message: data.message || 'Veriphone error', raw: data };
    }

    const valid = !!data.phone_valid; // Use Veriphone's phone_valid field
    const fraudScore = valid ? 5 : 75;   // Low score for valid numbers, high for invalid
    return {
      ok: true,
      data: {
        valid,
        carrier: data.carrier || 'Unknown Carrier',
        carrier_display: data.carrier || 'Unknown Carrier',
        line_type: data.line_type || data.type || 'Unknown',
        mcc: data.mcc || 'N/A',
        mnc: data.mnc || 'N/A',
        sim_changed: false,
        last_sim_swap: 'Unavailable via Veriphone',
        fraud_score: fraudScore,
        risky: fraudScore > 75,
        isMock: false,
        provider: 'veriphone',
        provider_display: 'Veriphone',
        carrier_source: 'veriphone-api',
        carrier_confidence: valid ? 85 : 45,
        e164_number: data.international_number || e164,
        local_number: data.local_number || null,
        country: data.country || null,
        country_code: data.country_code || null,
        note: 'Carrier metadata from Veriphone',
        raw: data,
      },
    };
  } catch (error) {
    return { ok: false, code: 'VERIPHONE_NETWORK_ERROR', message: error.message, raw: error.response?.data || null };
  }
}

/**
 * Perform phone lookup: Veriphone (primary) > IPQS (fallback) > session-network (final fallback)
 */
async function lookupPhone(phoneNumber, apiKey, options = {}) {
  // Try Veriphone first (primary provider)
  const veriphoneKey = process.env.VERIPHONE_API_KEY;
  if (veriphoneKey) {
    try {
      const v = await lookupViaVeriphone(phoneNumber, veriphoneKey);
      if (v.ok) {
        console.log(`[CarrierAPI] Veriphone lookup succeeded: ${v.data.carrier}`);
        return v.data;
      }
      console.warn('[CarrierAPI] Veriphone lookup failed:', v.message || v.code);
    } catch (e) {
      console.warn('[CarrierAPI] Veriphone network error:', e.message || e);
    }
  }

  // Try IPQS as secondary fallback
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
          provider: 'ipqs',
          provider_display: 'IPQualityScore',
          raw: data
        };
      } else {
        console.warn(`[CarrierAPI] IPQS API returned error: ${data.message}`);
      }
    } catch (error) {
      console.error('[CarrierAPI] IPQS Network Error:', error.message);
    }
  }

  if (apiWorked) {
    console.log(`[CarrierAPI] IPQS lookup succeeded: ${apiResponse.carrier}`);
    return apiResponse;
  }

  // --- FINAL FALLBACK: Session-network lookup ---
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
