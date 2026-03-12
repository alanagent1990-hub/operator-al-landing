(function () {
  const form = document.getElementById('waitlist-form');
  if (!form) return;

  function track(eventName, params) {
    const payload = Object.assign({ event: eventName, ts: new Date().toISOString() }, params || {});
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === 'function') window.gtag('event', eventName, payload);
  }

  track('lp_visit', { page: location.pathname });
  form.addEventListener('focusin', function onStart() {
    track('lp_form_start', { form_id: 'waitlist-form' });
    form.removeEventListener('focusin', onStart);
  });
  form.addEventListener('submit', function () {
    track('lp_form_submit', { form_id: 'waitlist-form' });
  });
})();
