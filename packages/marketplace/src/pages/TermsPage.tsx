import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#06070b] text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Link to="/" className="text-sm text-white/60 hover:text-white">
          ← Back
        </Link>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight">
          Terms of Service
        </h1>

        <p className="mt-4 text-white/60">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/80">
          <section>
            <h2 className="text-lg font-semibold">1. Introduction</h2>
            <p className="mt-2">
              Railent is a decentralized infrastructure designed to enable
              programmable payments between autonomous agents. The Railent
              interface and related tools are developed and maintained by{" "}
              <a
                href="https://www.privacyx.tech/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                PrivacyX
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Non-Custodial Infrastructure</h2>
            <p className="mt-2">
              Railent is a non-custodial interface interacting with blockchain
              smart contracts. Users retain full control over their wallets and
              private keys. PrivacyX does not custody funds, execute
              transactions on behalf of users, or control the deployed smart
              contracts once they are published on the blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Experimental Technology</h2>
            <p className="mt-2">
              Railent is experimental software. Blockchain systems, smart
              contracts, and AI agent infrastructures may contain bugs,
              vulnerabilities, or unexpected behaviors. By using Railent, you
              acknowledge and accept the risks associated with emerging
              technologies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. No Financial Advice</h2>
            <p className="mt-2">
              Railent does not provide financial, investment, or legal advice.
              Any information available through the interface or documentation
              is provided for informational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. User Responsibilities</h2>
            <p className="mt-2">
              Users are solely responsible for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>the security of their wallets and private keys</li>
              <li>the accuracy of transactions submitted to the blockchain</li>
              <li>compliance with applicable laws and regulations</li>
              <li>the actions of any AI agents they deploy or operate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Limitation of Liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, PrivacyX shall not be
              liable for any loss, damage, or claim arising from the use of
              Railent, including but not limited to losses resulting from smart
              contract vulnerabilities, blockchain failures, or third-party
              integrations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Modifications</h2>
            <p className="mt-2">
              PrivacyX may update these Terms from time to time. Continued use
              of Railent after modifications constitutes acceptance of the
              updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Contact</h2>
            <p className="mt-2">
              For questions regarding these Terms, please contact:
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
