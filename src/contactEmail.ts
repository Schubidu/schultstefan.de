const CONTACT_EMAIL_ENDPOINT = '/api/contact-email';
const TURNSTILE_ACTION = 'contact_email_reveal';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  remove(widgetId: string): void;
  render(container: HTMLElement, options: TurnstileOptions): string;
  reset(widgetId: string): void;
}

interface TurnstileOptions {
  action: string;
  callback(token: string): void;
  'error-callback'(): void;
  'expired-callback'(): void;
  sitekey: string;
  theme: 'auto';
}

interface ContactEmailConfig {
  siteKey: string;
}

interface ContactEmailResponse {
  email: string;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstilePromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstilePromise) {
    return turnstilePromise;
  }

  turnstilePromise = new Promise<TurnstileApi>((resolve, reject) => {
    const resolveTurnstile = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error('Turnstile did not initialize.'));
      }
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile-script]');

    if (existingScript) {
      existingScript.addEventListener('load', resolveTurnstile, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Turnstile.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = 'true';
    script.addEventListener('load', resolveTurnstile, { once: true });
    script.addEventListener('error', () => reject(new Error('Unable to load Turnstile.')), { once: true });
    document.head.append(script);
  });

  return turnstilePromise;
}

async function fetchConfiguration(): Promise<ContactEmailConfig> {
  const response = await fetch(CONTACT_EMAIL_ENDPOINT, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Email reveal is unavailable.');
  }

  const payload: ContactEmailConfig = await response.json();

  if (payload.siteKey.trim().length === 0) {
    throw new Error('Email reveal configuration is invalid.');
  }

  return payload;
}

async function fetchEmail(token: string): Promise<ContactEmailResponse> {
  const response = await fetch(CONTACT_EMAIL_ENDPOINT, {
    body: JSON.stringify({ token }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 429) {
    throw new Error('Too many attempts. Please try again in a minute.');
  }

  if (response.status === 403) {
    throw new Error('Verification failed. Please try again.');
  }

  if (!response.ok) {
    throw new Error('Email reveal is temporarily unavailable.');
  }

  const payload: ContactEmailResponse = await response.json();

  if (payload.email.length === 0 || payload.email.length > 254 || !payload.email.includes('@')) {
    throw new Error('Email reveal returned an invalid response.');
  }

  return payload;
}

export default function initializeContactEmail(): void {
  const section = document.querySelector<HTMLElement>('#card-email');
  const button = document.querySelector<HTMLButtonElement>('#email-reveal');
  const challenge = document.querySelector<HTMLElement>('#email-challenge');
  const status = document.querySelector<HTMLElement>('#email-status');
  const result = document.querySelector<HTMLElement>('#email-result');

  if (!section || !button || !challenge || !status || !result) {
    return;
  }

  let turnstile: TurnstileApi | null = null;
  let widgetId: string | null = null;

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const showRetryableError = (message: string) => {
    setStatus(message);

    if (turnstile && widgetId) {
      turnstile.reset(widgetId);
    }
  };

  const revealEmail = async (token: string) => {
    setStatus('Verifying…');

    try {
      const { email } = await fetchEmail(token);
      const link = document.createElement('a');
      const label = document.createElement('strong');
      const address = document.createElement('span');

      label.textContent = 'Email';
      address.className = 'card-profile-address';
      address.textContent = email;
      link.className = 'card-profile card-email-link';
      link.href = `mailto:${email}`;
      link.append(label, address);
      result.replaceChildren(link);
      result.hidden = false;
      section.classList.add('is-revealed');
      setStatus('');
      challenge.hidden = true;

      if (turnstile && widgetId) {
        turnstile.remove(widgetId);
        widgetId = null;
      }
    } catch (error) {
      showRetryableError(error instanceof Error ? error.message : 'Verification failed. Please try again.');
    }
  };

  const startReveal = async () => {
    button.disabled = true;
    setStatus('Loading verification…');

    try {
      const [configuration, turnstileApi] = await Promise.all([fetchConfiguration(), loadTurnstile()]);
      turnstile = turnstileApi;
      challenge.hidden = false;
      button.hidden = true;
      widgetId = turnstile.render(challenge, {
        action: TURNSTILE_ACTION,
        callback: (token) => {
          void revealEmail(token);
        },
        'error-callback': () => {
          setStatus('Verification could not be loaded. Please try again.');
          challenge.hidden = true;
          button.hidden = false;
          button.disabled = false;

          if (turnstile && widgetId) {
            turnstile.remove(widgetId);
            widgetId = null;
          }
        },
        'expired-callback': () => {
          showRetryableError('Verification expired. Please try again.');
        },
        sitekey: configuration.siteKey,
        theme: 'auto',
      });
    } catch {
      setStatus('Email reveal is temporarily unavailable.');
      button.hidden = false;
      button.disabled = false;
    }
  };

  button.addEventListener('click', () => {
    void startReveal();
  });
}
