import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ASSETS } from "@/lib/assets";

const OPERATOR = "HLM LLC";
const APP_NAME = "Brighter Dayz";
const CONTACT_EMAIL = "privacy@brighterdayz.faith"; // create this mailbox in Google Workspace
const EFFECTIVE = "June 21, 2026";

function Section({ title, children }) {
  return (
    <section className="mt-7">
      <h2 className="font-fredoka text-xl md:text-2xl font-bold text-[#1D3557] mb-2">{title}</h2>
      <div className="space-y-2 text-[#37475a] leading-relaxed">{children}</div>
    </section>
  );
}

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#eee] bg-white/80 px-4 py-3 backdrop-blur-md md:px-8">
        <button data-testid="privacy-back" onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] transition hover:-translate-y-0.5">
          <ArrowLeft className="h-5 w-5 text-[#1D3557]" />
        </button>
        <img src={ASSETS.sunny} alt="" className="h-9 w-9 object-contain" />
        <span className="font-fredoka text-lg font-bold text-[#1D3557]">{APP_NAME}</span>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D8F3DC]"><ShieldCheck className="h-7 w-7 text-[#52b788]" /></div>
          <div>
            <h1 className="font-fredoka text-3xl font-bold text-[#1D3557]">Privacy Policy</h1>
            <p className="text-sm text-[#94a3b8]">Effective {EFFECTIVE}</p>
          </div>
        </div>

        <p className="mt-6 text-[#37475a] leading-relaxed">
          {APP_NAME} ("we," "us," or "our"), operated by {OPERATOR}, is a faith-based mental-wellness app
          designed to help school-age children find comfort, calm, and hope. We care deeply about protecting
          children and their families. This policy explains what we collect, how we use it, and the choices you have.
        </p>

        <Section title="1. Built for children — and managed by grown-ups">
          <p>
            {APP_NAME} is intended to be set up and supervised by a parent or guardian. A parent creates the account
            and adds child profiles. Children under 13 do not create their own accounts; they use profiles created and
            managed by their parent/guardian, consistent with the Children's Online Privacy Protection Act (COPPA).
            Older children (13+) may create their own account where permitted.
          </p>
          <p>
            By creating an account or adding a child profile, a parent/guardian provides verifiable consent for us to
            collect and use the information described below for the child.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Account information (parent/guardian):</b> name, email address, and a securely hashed password.</li>
            <li><b>Child profile information:</b> first name (or nickname), age, and a chosen avatar.</li>
            <li><b>Wellness activity:</b> mood check-ins, breathing/calming sessions, stories, affirmations, prayers
              the child writes, mini-game activity, stars, streaks, and badges.</li>
            <li><b>Messages to "Sunny":</b> the text a child sends to our AI companion, and Sunny's responses.</li>
            <li><b>Technical data:</b> basic, standard information needed to operate the service securely.</li>
          </ul>
          <p>We do not knowingly collect precise location, contacts, photos, or advertising identifiers.</p>
        </Section>

        <Section title="3. How we use information">
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide the app's features (mood tracking, breathing, stories, affirmations, prayer journal, games, rewards).</li>
            <li>To power the friendly AI companion and to generate age-appropriate affirmations, stories, prayers, and read-aloud audio.</li>
            <li>To keep children safe (see "Safety monitoring" below).</li>
            <li>To let a parent/guardian view their own child's mood history and activity.</li>
          </ul>
          <p><b>We never sell children's or parents' personal information, and we do not use it for advertising or behavioral profiling.</b></p>
        </Section>

        <Section title="4. AI features and service providers">
          <p>
            To provide the AI companion, affirmations, stories, and read-aloud voice, message text is processed by
            trusted third-party AI providers (such as Anthropic and OpenAI) through our integration provider. These
            providers process the content solely to generate a response and under their data-processing terms. We share
            only what is needed for the feature to work.
          </p>
        </Section>

        <Section title="5. Safety monitoring & parent alerts">
          <p>
            Because a child's safety comes first, messages a child sends to Sunny are automatically checked for signs of
            serious risk — such as thoughts of self-harm, abuse, danger, or severe distress. If such a sign is detected,
            we will <b>notify the parent/guardian</b> (for example, by email and in the Parent Dashboard) so they can
            check in and help.
          </p>
          <p>
            {APP_NAME} is <b>not</b> a medical, diagnostic, counseling, or emergency service, and our monitoring is not
            guaranteed to catch every situation. It is not a substitute for professional care or adult supervision. In an
            emergency, call 911. You can also call or text 988 (Suicide &amp; Crisis Lifeline), text HOME to 741741, or
            contact Childhelp at 1-800-422-4453.
          </p>
        </Section>

        <Section title="6. How we share information">
          <p>We share personal information only:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>With service providers who help us operate the app (e.g., secure hosting, AI processing, and email delivery), under appropriate confidentiality and data-protection obligations.</li>
            <li>With the child's own parent/guardian.</li>
            <li>When required by law, or to protect the safety of a child or others.</li>
          </ul>
        </Section>

        <Section title="7. Data retention & deletion">
          <p>
            We keep information for as long as the account is active. A parent/guardian can delete a child's profile at
            any time from the Parent Dashboard, which removes that child's associated data (moods, messages, prayers,
            activities, and alerts). To delete an entire account or request a copy of your data, contact us at the email
            below and we will act promptly.
          </p>
        </Section>

        <Section title="8. How we protect information">
          <p>
            Passwords are stored using strong one-way hashing, connections are encrypted in transit, and the optional
            Parent PIN helps keep the monitoring dashboard private from children. No method of storage or transmission is
            100% secure, but we work hard to safeguard your family's information.
          </p>
        </Section>

        <Section title="9. Parental rights & choices">
          <ul className="list-disc pl-5 space-y-1">
            <li>Review the personal information we hold about your child.</li>
            <li>Delete your child's profile or your entire account.</li>
            <li>Withdraw consent and stop further collection by deleting the account.</li>
          </ul>
          <p>To exercise any of these rights, contact us at {CONTACT_EMAIL}.</p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy from time to time. If we make material changes, we will update the "Effective" date
            and, where appropriate, notify parents/guardians.
          </p>
        </Section>

        <Section title="11. Contact us">
          <p>
            Questions or requests? Email <a className="font-semibold text-[#457B9D] underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ({OPERATOR}).
          </p>
        </Section>

        <p className="mt-10 rounded-2xl bg-[#FFF6E9] p-4 text-sm text-[#9a5b00]">
          A gentle reminder: {APP_NAME} offers encouragement and coping tools rooted in faith and hope, but it does not
          provide medical advice or replace care from a doctor, counselor, or trusted adult. 💛
        </p>

        <div className="py-10 text-center">
          <button data-testid="privacy-home" onClick={() => navigate("/")}
            className="rounded-full bg-[#457B9D] px-8 py-3 font-bold text-white transition hover:-translate-y-0.5">Back to {APP_NAME}</button>
        </div>
      </main>
    </div>
  );
}
