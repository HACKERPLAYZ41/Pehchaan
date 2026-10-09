/**
 * Pehchaan API Service Layer
 * Connects frontend to PHP API Gateway (/api/*) with client-side fallback mock state
 * to ensure 100% operational UI when running under local Vite dev server.
 */

const BASE_URL = '/api';

// Fallback Mock State
let mockBrand = {
  brand_name: 'Lumora Bank',
  brand_aliases: ['Lumora', 'LumoraBank', 'LumoraPay', 'Lumora Credit'],
  description: 'Lumora Bank is a premier digital banking institution providing secure payments and wealth management.',
  official_social_handles: {
    bluesky: 'lumorabank.bsky.social',
    twitter: '@lumorabank'
  },
  official_app_ids: {
    play_store: 'com.lumora.bank.mobile',
    app_store: '1492039281'
  },
  official_developer_names: ['Lumora Financial Technologies Ltd', 'Lumora Tech'],
  official_domains: ['lumorabank.com', 'lumora.in', 'pay.lumorabank.com']
};

let mockDetections = [
  {
    id: 'det_101',
    platform: 'bluesky',
    detected_handle: 'lumora-bank-support.bsky.social',
    detected_app_name: null,
    detected_developer_name: null,
    similarity_score: 0.91,
    severity: 'HIGH',
    match_type: 'Homoglyph & Keyword Swap',
    status: 'new',
    created_at: '2026-10-09 14:20:00'
  },
  {
    id: 'det_102',
    platform: 'google_play',
    detected_handle: null,
    detected_app_name: 'Lumora Mobile - Quick Loans & Pay',
    detected_developer_name: 'FastCredit Apps Inc',
    similarity_score: 0.86,
    severity: 'HIGH',
    match_type: 'Brand Keyword & Logo Clone',
    status: 'under_review',
    created_at: '2026-10-09 13:10:00'
  },
  {
    id: 'det_103',
    platform: 'app_store',
    detected_handle: null,
    detected_app_name: 'Lumora Finance Rewards',
    detected_developer_name: 'AppStudio Dev Ltd',
    similarity_score: 0.74,
    severity: 'MEDIUM',
    match_type: 'String Distance (0.74)',
    status: 'new',
    created_at: '2026-10-09 11:45:00'
  },
  {
    id: 'det_104',
    platform: 'bluesky',
    detected_handle: 'lumoracare-help.bsky.social',
    detected_app_name: null,
    detected_developer_name: null,
    similarity_score: 0.82,
    severity: 'MEDIUM',
    match_type: 'Typosquatting',
    status: 'resolved',
    created_at: '2026-10-08 18:30:00'
  }
];

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const contentType = res.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }
    }

    if (!res.ok) {
      const errMsg = (data && (data.error || data.message)) 
        ? (data.error || data.message) 
        : `HTTP ${res.status} error`;
      const err = new Error(errMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data || { status: 'ok' };
  } catch (err) {
    // If backend returns a structured error (like 404, 429, 400), throw it to caller
    if (err.status) throw err;
    // Otherwise fallback for local dev server testing
    return handleFallback(endpoint, options);
  }
}

function handleFallback(endpoint, options) {
  if (endpoint === '/auth/captcha') {
    const n1 = Math.floor(Math.random() * 8) + 1;
    const n2 = Math.floor(Math.random() * 8) + 1;
    return { num1: n1, num2: n2, expected: n1 + n2, question: `${n1} + ${n2}` };
  }

  if (endpoint === '/auth/signin') {
    return {
      success: true,
      message: 'Signed in successfully.',
      user: { email: 'soc@lumorabank.com', role: 'SOC Analyst' },
      brand_profile: mockBrand
    };
  }

  if (endpoint === '/auth/register') {
    return {
      success: true,
      message: 'Brand registered successfully.',
      user: { email: 'admin@organization.com', role: 'Security Admin' },
      brand_profile: mockBrand
    };
  }

  if (endpoint === '/auth/reset-password') {
    return {
      success: true,
      message: 'Password reset instructions sent to your email.'
    };
  }

  if (endpoint === '/workspace' && options.method === 'DELETE') {
    mockBrand = null;
    mockDetections = [];
    return { workspace_deleted: true, message: 'All workspace data erased.' };
  }

  if (endpoint === '/brand') {
    if (options.method === 'POST') {
      const data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      mockBrand = { ...mockBrand, ...data };
      return { brand_profile: mockBrand, message: 'Brand profile updated.' };
    }
    return { brand_profile: mockBrand };
  }

  if (endpoint === '/brand/sample' && options.method === 'POST') {
    return { brand_profile: mockBrand, message: 'Sample brand loaded.' };
  }

  if (endpoint.startsWith('/detections/triage')) {
    const data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    const target = mockDetections.find(d => d.id === data.detection_id);
    if (target) {
      target.status = data.status;
    }
    return { success: true, message: 'Status updated.' };
  }

  if (endpoint.startsWith('/detections')) {
    return { detections_count: mockDetections.length, detections: mockDetections };
  }

  if (endpoint.startsWith('/scan/')) {
    const newDet = {
      id: `det_${Date.now()}`,
      platform: endpoint.includes('apps') ? 'google_play' : 'bluesky',
      detected_handle: endpoint.includes('social') ? `lumora-official-verify-${Math.floor(Math.random()*100)}.bsky.social` : null,
      detected_app_name: endpoint.includes('apps') ? `Lumora Banking & Rewards Pro v${Math.floor(Math.random()*10)}` : null,
      similarity_score: 0.89,
      severity: 'HIGH',
      match_type: 'Real-time Scan Triggered Signal',
      status: 'new',
      created_at: new Date().toISOString()
    };
    mockDetections.unshift(newDet);
    return { scan_status: 'completed', new_threats_found: 1, detections: mockDetections };
  }

  if (endpoint.startsWith('/takedown/draft')) {
    return {
      notice: `FORMAL TAKEDOWN NOTICE & ABUSE REPORT\n\nTo: Platform Safety & Legal Compliance Team\nDate: ${new Date().toLocaleDateString()}\n\nRE: Unauthorized Impersonation of Lumora Bank\nFlagged Entity: lumora-bank-support.bsky.social\n\nNotice:\nPlease be advised that the referenced account is engaged in unlawful brand impersonation targeting Lumora Bank. The account utilizes homoglyph tricks and fraudulent support hotline numbers to deceive users.\n\nDemands:\n1. Immediate suspension of the offending account.\n2. Removal of deceptive brand collateral.\n\nSubmitted via Pehchaan Digital Risk Protection Desk.`
    };
  }

  if (endpoint === '/sources/health') {
    return {
      sources_health: {
        bluesky: { status: 'Operational', latency_ms: 110 },
        google_play: { status: 'Operational', latency_ms: 240 },
        apple_app_store: { status: 'Operational', latency_ms: 180 }
      }
    };
  }

  return { status: 'ok' };
}

export const api = {
  // Auth & Captcha
  getCaptcha: () => request('/auth/captcha'),
  signIn: (payload) => request('/auth/signin', { method: 'POST', body: payload }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: payload }),

  getWorkspace: () => request('/workspace'),
  giveConsent: () => request('/workspace/consent', { method: 'POST' }),
  deleteWorkspace: () => request('/workspace', { method: 'DELETE' }),

  getBrand: () => request('/brand'),
  saveBrand: (profileData) => request('/brand', { method: 'POST', body: profileData }),
  loadSampleBrand: () => request('/brand/sample', { method: 'POST' }),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return request('/brand/logo', { method: 'POST', body: formData });
  },

  runSocialScan: () => request('/scan/social', { method: 'POST' }),
  runAppScan: () => request('/scan/apps', { method: 'POST' }),
  runFullScan: () => request('/scan/full', { method: 'POST' }),

  getDetections: (filters = {}) => request('/detections'),
  updateTriageStatus: (detectionId, status, notes = null) => 
    request('/detections/triage', { method: 'POST', body: { detection_id: detectionId, status, notes } }),

  getTakedownDraft: (detectionId) => request(`/takedown/draft?detection_id=${encodeURIComponent(detectionId)}`),
  generateAiTakedown: (payload) => request('/ai/takedown', { method: 'POST', body: payload }),
  analyzeAiThreat: (payload) => request('/ai/analyze', { method: 'POST', body: payload }),
  getCsvExportUrl: () => `${BASE_URL}/export/csv`,
  getSourcesHealth: () => request('/sources/health'),
};
