import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { ASSETS } from "@/lib/assets";

const OPERATOR = "HLM LLC";
const APP_NAME = "Brighter Dayz";
const CONTACT_EMAIL = "support@brighterdayz.faith"; // create this mailbox in Google Workspace
const EFFECTIVE = "June 21, 2026";

function Section({ title, children }) {
  return (
    <section className="mt-7">
      <h2 className="font-fredoka text-xl md:text-2xl font-bold text-[#1D3557] mb-2">{title}</h2>
      <div className="space-y-2 text-[#37475a] leading-relaxed">{children}</div>
    </section>
  );
}

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#eee] bg-white/80 px-4 py-3 backdrop-blur-md md:px-8">
        <button data-testid="terms-back" onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] transition hover:-translate-y-0.5">
          <ArrowLeft className="h-5 w-5 text-[#1D3557]" />
        </button>
        <img src={ASSETS.sunny} alt="" className="h-9 w-9 object-contain" />
        <span className="font-fredoka text-lg font-bold text-[#1D3557]">{APP_NAME}</span>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CDEAFE]"><FileText className="h-7 w-7 text-[#457B9D]" /></div>
          <div>
            <h1 className="font-fredoka text-3xl font-bold text-[#1D3557]">Terms of Service</h1>
            <p className="text-sm text-[#94a3b8]">Effective {EFFECTIVE}</p>
          </div>
        </div>

        <p className="mt-6 text-[#37475a] leading-relaxed">
          Welcome to {APP_NAME}, a faith-based mental-wellness app for children, operated by {OPERATOR} ("we," "us," or
          "our"). By creating an account or using the app, you ("you," the parent/guardian or authorized user) agree to
          these Terms of Service ("Terms"). Please read them carefully. If you do not agree, please do not use the app.
        </p>

        <Section title="1. Who may use Brighter Dayz">
          <p>
            {APP_NAME} is intended to be set up and supervised by a parent or legal guardian who is at least 18 years old.
            A parent/guardian creates the account and any child profiles, and is responsible for supervising their child's
            use of the app. Children under 13 do not create their own accounts. Older children (13+) may use the app where
            permitted, consistent with our Privacy Policy.
          </p>
          <p>By using the app, you confirm you are a parent/guardian (or an authorized user 13+) and have authority to accept these Terms.</p>
        </Section>

        <Section title="2. Not a medical, counseling, or emergency service">
          <p>
            {APP_NAME} provides encouragement, coping tools, and faith-based content for general wellness and emotional
            support. <b>It is not a medical device and does not provide medical, psychological, diagnostic, therapeutic,
            or emergency services.</b> Content (including the AI companion "Sunny," affirmations, stories, and prayers) is
            for supportive and educational purposes only and is not a substitute for professional care or adult supervision.
          </p>
          <p>
            If a child is in crisis or danger, seek help immediately: call 911, call or text 988 (Suicide &amp; Crisis
            Lifeline), text HOME to 741741, or contact Childhelp at 1-800-422-4453.
          </p>
        </Section>

        <Section title="3. Safety monitoring">
          <p>
            To help protect children, messages sent to the AI companion are automatically reviewed for signs of serious
            risk, and a parent/guardian may be notified (for example, by email and in the Parent Dashboard). You understand
            and agree that this automated monitoring may not detect every situation and is not a guarantee of safety. It does
            not replace your responsibility to supervise your child and seek professional help when needed.
          </p>
        </Section>

        <Section title="4. Your account & responsibilities">
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate information and keep your password (and optional Parent PIN) confidential.</li>
            <li>You are responsible for activity that occurs under your account and child profiles.</li>
            <li>Supervise your child's use and review the Parent Dashboard, including any safety alerts.</li>
            <li>Notify us promptly of any unauthorized use of your account.</li>
          </ul>
        </Section>

        <Section title="5. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the app for any unlawful, harmful, or abusive purpose.</li>
            <li>Attempt to disrupt, reverse-engineer, or gain unauthorized access to the app or its systems.</li>
            <li>Upload content that is illegal, hateful, or harmful, or that infringes others' rights.</li>
            <li>Misuse the AI features or attempt to bypass safety protections.</li>
          </ul>
        </Section>

        <Section title="6. AI-generated content">
          <p>
            The app uses third-party AI to generate conversational replies, affirmations, stories, prayers, and read-aloud
            audio. AI output may occasionally be inaccurate or imperfect. We design the experience to be age-appropriate and
            faith-aligned, but we do not guarantee that AI-generated content will always meet your expectations. Use
            discernment and supervise your child's interactions.
          </p>
        </Section>

        <Section title="7. Intellectual property">
          <p>
            The app, including its name, mascot (Sunny), design, text, and features, is owned by {OPERATOR} and protected by
            applicable laws. We grant you a limited, non-exclusive, non-transferable, revocable license to use the app for
            your family's personal, non-commercial use. You may not copy, resell, or redistribute the app or its content.
          </p>
        </Section>

        <Section title="8. Privacy">
          <p>
            Your use of {APP_NAME} is also governed by our{" "}
            <a className="font-semibold text-[#457B9D] underline" href="/privacy">Privacy Policy</a>, which explains how we
            collect, use, and protect information. By using the app, you consent to those practices.
          </p>
        </Section>

        <Section title="9. Subscriptions & payments">
          <p>
            {APP_NAME} may offer free and/or paid features. If paid features are offered, pricing and billing terms will be
            presented at purchase, and any purchases made through an app store are also subject to that store's terms. We
            will clearly disclose any fees before you are charged.
          </p>
        </Section>

        <Section title="10. Disclaimers & limitation of liability">
          <p>
            The app is provided "as is" and "as available" without warranties of any kind, to the fullest extent permitted by
            law. To the maximum extent permitted by law, {OPERATOR} will not be liable for any indirect, incidental, or
            consequential damages arising from your use of (or inability to use) the app. Nothing in these Terms limits
            liability that cannot be limited under applicable law.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            You may stop using the app and delete your account at any time. We may suspend or terminate access if these Terms
            are violated or to protect users. Certain provisions (such as intellectual property, disclaimers, and limitation
            of liability) survive termination.
          </p>
        </Section>

        <Section title="12. Changes to these Terms">
          <p>
            We may update these Terms from time to time. If we make material changes, we will update the "Effective" date and,
            where appropriate, notify parents/guardians. Continued use after changes means you accept the updated Terms.
          </p>
        </Section>

        <Section title="13. Contact us">
          <p>
            Questions about these Terms? Email{" "}
            <a className="font-semibold text-[#457B9D] underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ({OPERATOR}).
          </p>
        </Section>

        <p className="mt-10 rounded-2xl bg-[#FFF6E9] p-4 text-sm text-[#9a5b00]">
          {APP_NAME} is a tool for hope and encouragement — always alongside, never in place of, a caring adult and
          professional help when it's needed. 💛
        </p>

        <div className="py-10 text-center">
          <button data-testid="terms-home" onClick={() => navigate("/")}
            className="rounded-full bg-[#457B9D] px-8 py-3 font-bold text-white transition hover:-translate-y-0.5">Back to {APP_NAME}</button>
        </div>
      </main>
    </div>
  );
}
