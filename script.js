(function () {
  const cfg = window.LANDING_CONFIG || {};
  const form = document.getElementById('waitlist-form');
  const msg = document.getElementById('form-message');
  const qualifiedField = document.getElementById('qualified');
  if (!form) return;

  const FREE_EMAIL_DOMAINS = new Set([
    'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','proton.me','protonmail.com'
  ]);
  const QUALIFIED_ROLES = new Set(['executive','product_lead','engineering_lead','legal_compliance','security_risk']);
  const QUALIFIED_TEAM = new Set(['50-199','200-999','1000+']);
  const QUALIFIED_TIMELINE = new Set(['0-30','31-90']);

  function getFormDataObj() {
    const fd = new FormData(form);
    return Object.fromEntries(fd.entries());
  }

  function isQualified(data) {
    const email = String(data.work_email || '').trim().toLowerCase();
    const domain = email.includes('@') ? email.split('@')[1] : '';
    const hasWorkEmail = !!domain && !FREE_EMAIL_DOMAINS.has(domain);
    return hasWorkEmail
      && QUALIFIED_ROLES.has(data.role)
      && QUALIFIED_TEAM.has(data.team_size)
      && QUALIFIED_TIMELINE.has(data.timeline);
  }

  function track(eventName, params) {
    const payload = Object.assign({
      event: eventName,
      namespace: cfg.analyticsNamespace || 'landing',
      ts: new Date().toISOString()
    }, params || {});

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  }

  track('lp_visit', { page: location.pathname, env: cfg.environment || 'unknown' });

  form.addEventListener('focusin', function handleStart() {
    track('lp_form_start', { form_id: 'waitlist-form' });
    form.removeEventListener('focusin', handleStart);
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    msg.className = 'form-message';

    if (!form.checkValidity()) {
      msg.textContent = 'Please complete all required fields.';
      msg.classList.add('error');
      form.reportValidity();
      return;
    }

    const data = getFormDataObj();
    const qualified = isQualified(data);
    qualifiedField.value = String(qualified);

    const payload = {
      'form-name': 'waitlist',
      'bot-field': data['bot-field'] || '',
      full_name: data.full_name || '',
      work_email: data.work_email || '',
      company: data.company || '',
      role: data.role || '',
      team_size: data.team_size || '',
      timeline: data.timeline || '',
      qualified: String(qualified),
      source: 'netlify_landing',
      submitted_at: new Date().toISOString(),
      project_id: 'PLAY-2026-03-12-003'
    };

    track('lp_form_submit', { qualified, form_id: 'waitlist-form' });
    if (qualified) track('lp_qualified_submit', { form_id: 'waitlist-form' });

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload).toString()
      });

      if (!res.ok) throw new Error('Submit failed: ' + res.status);

      msg.textContent = 'Thanks — you are on the waitlist.';
      msg.classList.add('success');
      form.reset();
      qualifiedField.value = 'false';
    } catch (err) {
      msg.textContent = 'Submission failed. Please retry in a moment.';
      msg.classList.add('error');
      track('lp_form_error', { message: String(err.message || err) });
    }
  });
})();
