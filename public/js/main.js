/* LocalFix – client-side behaviour (vanilla ES6+) */
(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menu-toggle');
  const menu = $('#mobile-menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      const open = menu.classList.toggle('hidden') === false;
      menuBtn.setAttribute('aria-expanded', String(open));
      $('.menu-open', menuBtn).classList.toggle('hidden', open);
      $('.menu-close', menuBtn).classList.toggle('hidden', !open);
    });
  }

  /* ---------- Toasts ---------- */
  const dismissToast = (el) => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 300);
  };
  const showToast = (message, type = 'success') => {
    let stack = $('#toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toast-stack';
      stack.className = 'pointer-events-none fixed right-4 top-20 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3';
      document.body.appendChild(stack);
    }
    const colors = { success: 'border-emerald-200', error: 'border-rose-200', info: 'border-sky-200' };
    const toast = document.createElement('div');
    toast.className = `toast pointer-events-auto flex animate-slide-in items-start gap-3 rounded-2xl border bg-white p-4 shadow-lift ${colors[type] || colors.info}`;
    const p = document.createElement('p');
    p.className = 'flex-1 text-sm font-medium text-ink-800';
    p.textContent = message;
    toast.appendChild(p);
    stack.appendChild(toast);
    setTimeout(() => dismissToast(toast), 4000);
  };
  $$('.toast').forEach((t, i) => setTimeout(() => dismissToast(t), 5000 + i * 600));
  $$('.toast-close').forEach((b) => b.addEventListener('click', () => dismissToast(b.closest('.toast'))));

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Pincode / city input helper ---------- */
  $$('[data-digits-only]').forEach((input) => {
    input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 6); });
  });
  $$('[data-pincode-hint]').forEach((input) => {
    const msg = $('#pincode-hint-msg');
    if (!msg) return;
    const base = msg.textContent;
    input.addEventListener('input', () => {
      const v = input.value.trim();
      const numeric = /^\d+$/.test(v);
      if (numeric && v.length < 6) {
        msg.textContent = `Pincode needs 6 digits (${v.length}/6)`;
        msg.classList.remove('hidden');
      } else if (numeric && !/^[1-9]/.test(v)) {
        msg.textContent = 'Indian pincodes cannot start with 0';
        msg.classList.remove('hidden');
      } else if (numeric) {
        msg.textContent = '✓ Searching by pincode';
        msg.classList.remove('hidden');
      } else if (v) {
        msg.textContent = 'Searching by city / area name';
        msg.classList.remove('hidden');
      } else {
        msg.textContent = base;
        if (input.id === 'hero-location') msg.classList.add('hidden');
      }
    });
  });

  /* ---------- Directory: auto-submit filters ---------- */
  $$('[data-autosubmit]').forEach((el) => {
    el.addEventListener('change', () => el.form && el.form.submit());
  });
  const filterForm = $('#filter-form');
  if (filterForm) {
    const cat = $('#f-category', filterForm);
    if (cat) cat.addEventListener('change', () => filterForm.submit());
  }

  /* ---------- Role toggle (login / register) ---------- */
  const toggle = $('[data-role-toggle]');
  if (toggle) {
    const roleInput = $('#role-input');
    const workerFields = $('#worker-fields');
    const phone = $('#phone');
    const styleBtns = (role) => {
      $$('.role-btn', toggle).forEach((b) => {
        const active = b.dataset.role === role;
        b.setAttribute('aria-selected', String(active));
        b.classList.toggle('bg-white', active);
        b.classList.toggle('shadow-soft', active);
        b.classList.toggle('text-ink-900', active);
        b.classList.toggle('text-ink-500', !active);
      });
    };
    const apply = (role) => {
      roleInput.value = role;
      styleBtns(role);
      const label = $('#role-label'); // login page
      if (label) label.textContent = role === 'worker' ? 'Worker' : 'Customer';
      const regLabel = $('#register-label'); // register page
      if (regLabel) regLabel.textContent = role === 'worker' ? 'Create worker account' : 'Create customer account';
      if (workerFields) {
        const isWorker = role === 'worker';
        workerFields.disabled = !isWorker; // disabled fields skip validation + submission
        workerFields.hidden = !isWorker;
      }
      if (phone) {
        phone.required = role === 'worker';
        $('#phone-optional')?.classList.toggle('hidden', role === 'worker');
        $('#phone-required')?.classList.toggle('hidden', role !== 'worker');
      }
    };
    $$('.role-btn', toggle).forEach((b) => b.addEventListener('click', () => {
      apply(b.dataset.role);
      if (b.dataset.role === 'worker' && workerFields) workerFields.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }));
    apply(roleInput.value || 'customer');
  }

  /* ---------- Password show/hide ---------- */
  $$('[data-toggle-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = $(btn.dataset.togglePassword);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
    });
  });

  /* ---------- Photo preview ---------- */
  const photo = $('#photo');
  if (photo) {
    photo.addEventListener('change', () => {
      const file = photo.files[0];
      const preview = $('#photo-preview');
      const ph = $('#photo-placeholder');
      const name = $('#photo-name');
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast('Photo must be smaller than 2 MB.', 'error');
        photo.value = '';
        return;
      }
      name.textContent = file.name;
      preview.src = URL.createObjectURL(file);
      preview.classList.remove('hidden');
      ph?.classList.add('hidden');
    });
  }

  /* ---------- Worker availability switch (AJAX with form fallback) ---------- */
  const availForm = $('#availability-form');
  if (availForm) {
    const sw = $('#availability-switch');
    const valueInput = $('#availability-value');
    const text = $('#availability-text');
    availForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      sw.disabled = true;
      try {
        const res = await fetch(availForm.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
          body: new URLSearchParams({ available: valueInput.value }),
        });
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        sw.setAttribute('aria-checked', String(data.isAvailable));
        valueInput.value = String(!data.isAvailable);
        text.textContent = data.isAvailable ? 'Available' : 'Busy';
        text.className = `text-sm font-bold ${data.isAvailable ? 'text-emerald-600' : 'text-amber-600'}`;
        showToast(`You are now marked as ${data.isAvailable ? 'Available' : 'Busy'}.`);
      } catch (err) {
        showToast('Could not update availability. Please try again.', 'error');
      } finally {
        sw.disabled = false;
      }
    });
  }

  /* ---------- Confirm dialogs for destructive forms ---------- */
  $$('form[data-confirm]').forEach((f) => {
    f.addEventListener('submit', (e) => { if (!window.confirm(f.dataset.confirm)) e.preventDefault(); });
  });

  /* ---------- Prevent double submits ---------- */
  $$('form[method="POST"]').forEach((f) => {
    f.addEventListener('submit', (e) => {
      if (e.defaultPrevented) return;
      const btn = $('button[type="submit"]:not([role="switch"])', f);
      if (btn) setTimeout(() => { btn.disabled = true; btn.classList.add('opacity-70'); }, 0);
    });
  });
})();
