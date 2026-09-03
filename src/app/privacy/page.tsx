import Link from 'next/link';
import PhoneFrame from '@/components/PhoneFrame';

export const metadata = { title: 'GiGi — Privacy' };

export default function Privacy() {
  return (
    <PhoneFrame>
    <div className="screen pad-bottom-sm">
      <div className="row between" style={{ marginBottom: 20 }}>
        <span className="wordmark" style={{ fontSize: 20 }}>GiGi</span>
        <Link href="/" className="pill">← Back</Link>
      </div>
      <h1>Privacy, in plain words</h1>
      <p className="small muted">Beta draft · not legal advice · v0.1</p>

      <div className="stack" style={{ marginTop: 8 }}>
        <Section title="What we hold">
          Your household profile, the bills you confirm, and the emails you choose to forward to
          your GiGi address. We never connect to your inbox directly and can&apos;t read anything you
          don&apos;t forward.
        </Section>
        <Section title="Where it lives">
          All storage is in the EU/UK. Inference for extraction runs in an EU region. No user
          content is written to logs.
        </Section>
        <Section title="What we never do">
          We never send, delete or modify anything in a connected account. We never store
          information about other families&apos; children. Every external action waits for your tap.
        </Section>
        <Section title="Your controls">
          Disconnect any inbox instantly. One tap deletes everything, completed within 30 days and
          confirmed by email.
        </Section>
        <Section title="Registration">
          Registered with the relevant data-protection authority before beta launch. A full DPIA is
          completed before any household is onboarded, because we process family email content.
        </Section>
      </div>

      <p className="tiny muted center" style={{ marginTop: 24 }}>
        Questions? privacy@getgigiapp.com
      </p>
    </div>
    </PhoneFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="small" style={{ margin: 0 }}>{children}</p>
    </div>
  );
}
