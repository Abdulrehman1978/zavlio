'use client';

import { useMemo, useState } from 'react';
import {
  SERVICE_LABELS,
  SERVICE_KEYS,
  type ServiceKey,
  type SourceKey,
  type TimingKey,
  type BudgetKey,
} from '@zavlio/validation/lead-intake';
import { useAnalytics } from './analytics-provider';

type StartValues = {
  idempotencyKey: string;
  formVersion: 'START_PROJECT_V1';
  name: string;
  email: string;
  company: string;
  website: string;
  role: string;
  services: ServiceKey[];
  goal: string;
  budget: BudgetKey | '';
  timing: TimingKey | '';
  source: SourceKey | '';
  honeypot: string;
};
type ContactValues = {
  idempotencyKey: string;
  formVersion: 'CONTACT_V1';
  name: string;
  email: string;
  company: string;
  website: string;
  role: string;
  message: string;
  honeypot: string;
};
type ContactPatch = Partial<Pick<StartValues, 'name' | 'email' | 'company' | 'website' | 'role'>>;

const budgets: Array<[BudgetKey, string]> = [
  ['EXPLORING', 'Exploring'],
  ['INR_1_3_LAKH', '₹1L–₹3L'],
  ['INR_3_7_LAKH', '₹3L–₹7L'],
  ['INR_7_15_LAKH', '₹7L–₹15L'],
  ['INR_15_PLUS', '₹15L+'],
  ['DISCUSS', "Let's discuss"],
];
const timings: Array<[TimingKey, string]> = [
  ['ASAP', 'ASAP'],
  ['ONE_TO_TWO_MONTHS', '1–2 months'],
  ['THREE_TO_SIX_MONTHS', '3–6 months'],
  ['EXPLORING', 'Exploring'],
];
const sources: Array<[SourceKey, string]> = [
  ['INSTAGRAM', 'Instagram'],
  ['LINKEDIN', 'LinkedIn'],
  ['GOOGLE', 'Google'],
  ['REFERRAL', 'Referral'],
  ['FRIEND_COLLEAGUE', 'Friend / colleague'],
  ['EVENT', 'Event'],
  ['OTHER', 'Other'],
  ['PREFER_NOT_TO_SAY', 'Prefer not to say'],
];

function newKey(): string {
  return crypto.randomUUID();
}

function FieldError({ message, id }: { message?: string; id: string }) {
  return message ? (
    <span id={id} className="zavlio-field-error" role="alert">
      {message}
    </span>
  ) : null;
}

function ContactFields({
  values,
  setValues,
  errors,
}: {
  values: StartValues | ContactValues;
  setValues: (patch: ContactPatch) => void;
  errors: Record<string, string>;
}) {
  return (
    <fieldset>
      <legend>Contact details</legend>
      <p>
        <label htmlFor="lead-name">Name</label>
        <input
          id="lead-name"
          value={values.name}
          onChange={(event) => setValues({ name: event.target.value })}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'error-name' : undefined}
          required
        />
        <FieldError id="error-name" message={errors.name} />
      </p>
      <p>
        <label htmlFor="lead-email">Work email</label>
        <input
          id="lead-email"
          type="email"
          value={values.email}
          onChange={(event) => setValues({ email: event.target.value })}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'error-email' : undefined}
          required
        />
        <FieldError id="error-email" message={errors.email} />
      </p>
      <p>
        <label htmlFor="lead-company">
          Company <small>(optional)</small>
        </label>
        <input
          id="lead-company"
          value={values.company}
          onChange={(event) => setValues({ company: event.target.value })}
          autoComplete="organization"
        />
      </p>
      <p>
        <label htmlFor="lead-website">
          Website <small>(optional)</small>
        </label>
        <input
          id="lead-website"
          type="url"
          value={values.website}
          onChange={(event) => setValues({ website: event.target.value })}
          autoComplete="url"
          aria-invalid={Boolean(errors.website)}
          aria-describedby={errors.website ? 'error-website' : undefined}
        />
        <FieldError id="error-website" message={errors.website} />
      </p>
      <p>
        <label htmlFor="lead-role">
          Role <small>(optional)</small>
        </label>
        <input
          id="lead-role"
          value={values.role}
          onChange={(event) => setValues({ role: event.target.value })}
          autoComplete="organization-title"
        />
      </p>
    </fieldset>
  );
}

export function StartProjectForm() {
  const analytics = useAnalytics();
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValuesState] = useState<StartValues>(() => ({
    idempotencyKey: newKey(),
    formVersion: 'START_PROJECT_V1',
    name: '',
    email: '',
    company: '',
    website: '',
    role: '',
    services: [],
    goal: '',
    budget: '',
    timing: '',
    source: '',
    honeypot: '',
  }));
  const setValues = (patch: Partial<StartValues>) =>
    setValuesState((current) => ({ ...current, ...patch }));
  const stepTitle = useMemo(
    () => ['Services', 'Contact details', 'Goal', 'Budget', 'Timing', 'Source'][step - 1],
    [step],
  );
  const validateStep = () => {
    const next: Record<string, string> = {};
    if (step === 1 && values.services.length === 0) next.services = 'Choose at least one service.';
    if (step === 2) {
      if (values.name.trim().length < 2) next.name = 'Please enter your name.';
      if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = 'Enter a valid email address.';
      if (values.website && !/^https?:\/\//i.test(values.website))
        next.website = 'Use an http(s) website URL.';
    }
    if (step === 3 && values.goal.trim().length < 10)
      next.goal = 'Tell us a little more about what you want to achieve.';
    if (step === 4 && !values.budget) next.budget = 'Choose an approximate budget.';
    if (step === 5 && !values.timing) next.timing = 'Choose a timing.';
    if (step === 6 && !values.source) next.source = 'Choose an option.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = async () => {
    if (!validateStep()) return;
    setPending(true);
    setServerError('');
    try {
      const response = await fetch('/api/forms/start-project', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as { ok?: boolean };
      if (!response.ok || !body.ok) throw new Error('submit');
      setSuccess(true);
      analytics?.track('project_form_submitted', { formId: 'start-a-project' });
    } catch {
      setServerError("We couldn't submit your enquiry. Please try again.");
    } finally {
      setPending(false);
    }
  };
  if (success)
    return (
      <p className="zavlio-form-success" role="status" tabIndex={-1}>
        Thanks — we received your project enquiry and will review it shortly.
      </p>
    );
  return (
    <form
      className="zavlio-lead-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (step < 6) {
          if (validateStep()) setStep((current) => current + 1);
        } else void submit();
      }}
      noValidate
      aria-labelledby="start-project-form-title"
    >
      <input
        className="zavlio-honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={values.honeypot}
        onChange={(event) => setValues({ honeypot: event.target.value })}
      />
      <p aria-live="polite">
        Step {step} of 6: {stepTitle}
      </p>
      <h2 id="start-project-form-title" tabIndex={-1}>
        {stepTitle}
      </h2>
      {Object.keys(errors).length > 0 && (
        <p className="zavlio-form-errors" role="alert">
          Please fix the highlighted fields before continuing.
        </p>
      )}
      {step === 1 && (
        <fieldset>
          <legend>What can we help you with?</legend>
          {SERVICE_KEYS.map((service) => (
            <label key={service} className="zavlio-check">
              <input
                type="checkbox"
                checked={values.services.includes(service)}
                onChange={(event) =>
                  setValues({
                    services: event.target.checked
                      ? [...values.services, service]
                      : values.services.filter((item) => item !== service),
                  })
                }
              />
              {SERVICE_LABELS[service]}
            </label>
          ))}
          <FieldError id="error-services" message={errors.services} />
        </fieldset>
      )}
      {step === 2 && <ContactFields values={values} setValues={setValues} errors={errors} />}
      {step === 3 && (
        <p>
          <label htmlFor="lead-goal">What are you trying to achieve?</label>
          <textarea
            id="lead-goal"
            rows={8}
            maxLength={5000}
            value={values.goal}
            onChange={(event) => setValues({ goal: event.target.value })}
            aria-invalid={Boolean(errors.goal)}
            aria-describedby={errors.goal ? 'error-goal' : undefined}
            required
          />
          <FieldError id="error-goal" message={errors.goal} />
        </p>
      )}
      {step === 4 && (
        <fieldset>
          <legend>Approximate budget</legend>
          {budgets.map(([key, label]) => (
            <label key={key} className="zavlio-check">
              <input
                type="radio"
                name="budget"
                checked={values.budget === key}
                onChange={() => setValues({ budget: key })}
              />
              {label}
            </label>
          ))}
          <FieldError id="error-budget" message={errors.budget} />
        </fieldset>
      )}
      {step === 5 && (
        <fieldset>
          <legend>When are you hoping to start?</legend>
          {timings.map(([key, label]) => (
            <label key={key} className="zavlio-check">
              <input
                type="radio"
                name="timing"
                checked={values.timing === key}
                onChange={() => setValues({ timing: key })}
              />
              {label}
            </label>
          ))}
          <FieldError id="error-timing" message={errors.timing} />
        </fieldset>
      )}
      {step === 6 && (
        <fieldset>
          <legend>How did you hear about Zavlio?</legend>
          {sources.map(([key, label]) => (
            <label key={key} className="zavlio-check">
              <input
                type="radio"
                name="source"
                checked={values.source === key}
                onChange={() => setValues({ source: key })}
              />
              {label}
            </label>
          ))}
          <FieldError id="error-source" message={errors.source} />
        </fieldset>
      )}
      {serverError && <p role="alert">{serverError}</p>}
      <div className="zavlio-form-actions">
        {step > 1 && (
          <button
            type="button"
            onClick={() => {
              setErrors({});
              setStep((current) => current - 1);
            }}
            disabled={pending}
          >
            Back
          </button>
        )}
        <button type="submit" disabled={pending}>
          {pending ? 'Sending…' : step < 6 ? 'Continue' : 'Submit enquiry'}
        </button>
      </div>
    </form>
  );
}

export function ContactForm() {
  const analytics = useAnalytics();
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValuesState] = useState<ContactValues>(() => ({
    idempotencyKey: newKey(),
    formVersion: 'CONTACT_V1',
    name: '',
    email: '',
    company: '',
    website: '',
    role: '',
    message: '',
    honeypot: '',
  }));
  const setValues = (patch: Partial<ContactValues>) =>
    setValuesState((current) => ({ ...current, ...patch }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (values.name.trim().length < 2) next.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if (values.message.trim().length < 3) next.message = 'Please add a message.';
    if (values.website && !/^https?:\/\//i.test(values.website))
      next.website = 'Use an http(s) website URL.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    setServerError('');
    try {
      const response = await fetch('/api/forms/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as { ok?: boolean };
      if (!response.ok || !body.ok) throw new Error('submit');
      setSuccess(true);
      analytics?.track('contact_form_submitted', { formId: 'contact' });
    } catch {
      setServerError("We couldn't submit your enquiry. Please try again.");
    } finally {
      setPending(false);
    }
  };
  if (success)
    return (
      <p className="zavlio-form-success" role="status" tabIndex={-1}>
        Thanks — your message has been received.
      </p>
    );
  return (
    <form
      className="zavlio-lead-form"
      onSubmit={submit}
      noValidate
      aria-labelledby="contact-form-title"
    >
      <input
        className="zavlio-honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={values.honeypot}
        onChange={(event) => setValues({ honeypot: event.target.value })}
      />
      <h2 id="contact-form-title" tabIndex={-1}>
        Contact Zavlio
      </h2>
      <ContactFields values={values} setValues={setValues} errors={errors} />
      <p>
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          rows={8}
          maxLength={5000}
          value={values.message}
          onChange={(event) => setValues({ message: event.target.value })}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'error-message' : undefined}
          required
        />
        <FieldError id="error-message" message={errors.message} />
      </p>
      {Object.keys(errors).length > 0 && (
        <p className="zavlio-form-errors" role="alert">
          Please fix the highlighted fields before sending.
        </p>
      )}
      {serverError && <p role="alert">{serverError}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
