const DevFixAuth = {
  usersKey: 'devfixhub_users',
  localSessionKey: 'devfixhub_session',
  sessionSessionKey: 'devfixhub_session_temp',

  normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  },

  getUsers() {
    try {
      const stored = localStorage.getItem(this.usersKey);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to read users:', error);
      return [];
    }
  },

  saveUsers(users) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  },

  getSession() {
    try {
      const stored = localStorage.getItem(this.localSessionKey) || sessionStorage.getItem(this.sessionSessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to read session:', error);
      return null;
    }
  },

  saveSession(session, remember) {
    const serialized = JSON.stringify(session);

    if (remember) {
      localStorage.setItem(this.localSessionKey, serialized);
      sessionStorage.removeItem(this.sessionSessionKey);
      return;
    }

    sessionStorage.setItem(this.sessionSessionKey, serialized);
    localStorage.removeItem(this.localSessionKey);
  },

  clearSession() {
    localStorage.removeItem(this.localSessionKey);
    sessionStorage.removeItem(this.sessionSessionKey);
  },

  getCurrentUser() {
    const session = this.getSession();
    if (!session?.email) return null;

    const user = this.getUsers().find(entry => entry.email === session.email) || null;
    if (!user) {
      this.clearSession();
    }

    return user;
  },

  async hashPassword(password) {
    const value = String(password || '');
    const encoded = new TextEncoder().encode(value);

    if (!window.crypto?.subtle) {
      let hash = 0;
      for (let index = 0; index < value.length; index += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(index);
        hash |= 0;
      }

      return `fallback-${Math.abs(hash)}`;
    }

    const digest = await crypto.subtle.digest('SHA-256', encoded);

    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  },

  async signup({ name, role, email, password, remember }) {
    const normalizedEmail = this.normalizeEmail(email);
    const users = this.getUsers();

    if (users.some(user => user.email === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await this.hashPassword(password);
    const user = {
      id: `user-${Date.now()}`,
      name: String(name || '').trim(),
      role: String(role || '').trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    this.saveUsers(users);
    this.saveSession({
      email: user.email,
      createdAt: new Date().toISOString()
    }, remember);

    return user;
  },

  async login({ email, password, remember }) {
    const normalizedEmail = this.normalizeEmail(email);
    const users = this.getUsers();
    const user = users.find(entry => entry.email === normalizedEmail);

    if (!user) {
      throw new Error('No account was found for this email.');
    }

    const passwordHash = await this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    this.saveSession({
      email: user.email,
      createdAt: new Date().toISOString()
    }, remember);

    return user;
  },

  logout() {
    this.clearSession();
  },

  getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (!next) return 'create-post.html';
    return next.endsWith('.html') ? next : 'create-post.html';
  },

  redirectAfterAuth() {
    window.location.href = this.getRedirectTarget();
  }
};

window.DevFixAuth = DevFixAuth;

function setStatus(status, message, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', isError);
  status.classList.toggle('is-success', !isError);
}

function resetPasswordFields(form) {
  form.querySelectorAll('[data-password-toggle]').forEach(toggle => {
    const field = toggle.previousElementSibling;
    if (!field) return;

    field.setAttribute('type', 'password');
    toggle.textContent = 'Show';
    toggle.setAttribute('aria-label', 'Show password');
  });
}

function setupPasswordToggles() {
  document.querySelectorAll('[data-password-toggle]').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const field = toggle.previousElementSibling;
      if (!field) return;

      const isPassword = field.getAttribute('type') === 'password';
      field.setAttribute('type', isPassword ? 'text' : 'password');
      toggle.textContent = isPassword ? 'Hide' : 'Show';
      toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });
}

function setupNavAuth(currentUser) {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;
  document.querySelectorAll('.nav-menu a[href="login.html"], .nav-menu a[href="signup.html"]').forEach(link => {
    link.hidden = Boolean(currentUser);
  });

  const existing = navActions.querySelector('.nav-account');
  if (existing) {
    existing.remove();
  }

  const account = document.createElement('div');
  account.className = 'nav-account';

  if (currentUser) {
    const profile = document.createElement('a');
    profile.className = 'nav-auth-link';
    profile.href = 'create-post.html';
    profile.textContent = currentUser.name || currentUser.email;

    const logout = document.createElement('button');
    logout.type = 'button';
    logout.className = 'nav-auth-button';
    logout.textContent = 'Logout';
    logout.addEventListener('click', () => {
      DevFixAuth.logout();
      window.location.href = 'index.html';
    });

    account.append(profile, logout);
  } else {
    const login = document.createElement('a');
    login.className = 'nav-auth-link';
    login.href = 'login.html';
    login.textContent = 'Login';

    const signup = document.createElement('a');
    signup.className = 'nav-auth-button';
    signup.href = 'signup.html';
    signup.textContent = 'Sign Up';

    account.append(login, signup);
  }

  navActions.prepend(account);
}

function setupAuthForms() {
  document.querySelectorAll('[data-auth-form]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();

      const mode = form.getAttribute('data-auth-form');
      const status = form.querySelector('[data-auth-status]');
      const email = form.elements.email?.value?.trim();
      const password = form.elements.password?.value ?? '';
      const remember = Boolean(form.elements.remember?.checked || mode === 'signup');

      if (!status || !email) return;

      try {
        if (mode === 'signup') {
          const confirmPassword = form.elements.confirmPassword?.value ?? '';

          if (password !== confirmPassword) {
            setStatus(status, 'Passwords do not match. Please re-enter them.', true);
            return;
          }

          await DevFixAuth.signup({
            name: form.elements.name?.value ?? '',
            role: form.elements.role?.value ?? '',
            email,
            password,
            remember
          });

          setStatus(status, 'Account created successfully. Redirecting you now.');
        } else {
          await DevFixAuth.login({
            email,
            password,
            remember
          });

          setStatus(status, 'Login successful. Redirecting you now.');
        }

        form.reset();
        resetPasswordFields(form);
        window.setTimeout(() => DevFixAuth.redirectAfterAuth(), 500);
      } catch (error) {
        setStatus(status, error.message || 'Something went wrong. Please try again.', true);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = DevFixAuth.getCurrentUser();
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  if (document.body.dataset.requiresAuth === 'true' && !currentUser) {
    const target = encodeURIComponent(currentPage);
    window.location.href = `login.html?next=${target}`;
    return;
  }

  setupPasswordToggles();
  setupNavAuth(currentUser);
  setupAuthForms();

  if (currentUser && (currentPage === 'login.html' || currentPage === 'signup.html')) {
    const status = document.querySelector('[data-auth-status]');
    setStatus(status, `You are already signed in as ${currentUser.email}.`);
  }
});
