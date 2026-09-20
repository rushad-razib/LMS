type Props = { title: string; children: string };

function StaticPage({ title, children }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-4 whitespace-pre-wrap text-ink-muted">{children}</p>
    </div>
  );
}

export function AboutPage() {
  return (
    <StaticPage title="About">
      {`AR Visionary Academy is part of AR Ventures. We offer practical courses in technology, design, language, and freelancing for learners in Bangladesh.

Full academy story and photos will replace this placeholder.`}
    </StaticPage>
  );
}

export function FaqPage() {
  return (
    <StaticPage title="FAQ">
      {`How do I enroll?
Register, verify your email (when required), then buy a course or ask the office to enroll you.

When do I get batch content?
After an admin assigns you to a batch.

Can I pay in installments?
Installments are available through office enrollment only — not on the public checkout.`}
    </StaticPage>
  );
}

export function PrivacyPage() {
  return (
    <StaticPage title="Privacy">
      {`We collect account and enrollment information to run courses and contact you about your learning. Payment details are handled by SSLCommerz. Contact form submissions are stored as leads for the academy team.

A full privacy policy will replace this placeholder before launch.`}
    </StaticPage>
  );
}

export function TermsPage() {
  return (
    <StaticPage title="Terms">
      {`By using this site you agree to use the student portal for enrolled courses only and to keep your login credentials secure. Course fees and refund policies are confirmed at enrollment.

Full terms will replace this placeholder before launch.`}
    </StaticPage>
  );
}
