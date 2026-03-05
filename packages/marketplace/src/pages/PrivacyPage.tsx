import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#06070b] text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Link to="/" className="text-sm text-white/60 hover:text-white">
          ← Back
        </Link>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight">
          Privacy Policy
        </h1>

        <p className="mt-4 text-white/60">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/80">
          <section>
            <h2 className="text-lg font-semibold">1. Overview</h2>
            <p className="mt-2">
              Railent is designed to minimize the collection of personal data.
              The interface interacts directly with blockchain networks and
              user wallets without requiring user accounts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Information Collected</h2>
            <p className="mt-2">
              Railent does not collect personal information such as names,
              emails, or identities when using the application.
            </p>
            <p className="mt-2">
              However, certain information may be visible through blockchain
              transactions, including wallet addresses and transaction
              metadata.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Blockchain Data</h2>
            <p className="mt-2">
              Blockchain networks are public and immutable. Any transaction
              submitted through Railent becomes permanently visible on the
              blockchain and may be accessible to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Analytics</h2>
            <p className="mt-2">
              Railent may collect anonymous usage analytics to improve the
              interface and developer tools. This data does not identify
              individual users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Third-Party Services</h2>
            <p className="mt-2">
              Railent may interact with third-party services such as blockchain
              RPC providers, wallet software, or analytics platforms. Their
              respective privacy policies apply to any data processed by those
              services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Contact</h2>
            <p className="mt-2">
              If you have questions regarding this Privacy Policy, please
              contact:
              <br />
              <a
                href="mailto:support@privacyx.tech"
                className="underline"
              >
                support@privacyx.tech
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
