import { Shell } from '@zavlio/ui';
import { ContactForm } from '../../components/lead-intake-form';

export default function ContactPage() {
  return (
    <Shell>
      <main className="zavlio-intake-page" aria-labelledby="contact-title">
        <p>ZAVLIO · FUNCTIONAL INTAKE</p>
        <h1 id="contact-title">Contact us</h1>
        <p>Tell us what you need and the team will review your message.</p>
        <ContactForm />
      </main>
    </Shell>
  );
}
