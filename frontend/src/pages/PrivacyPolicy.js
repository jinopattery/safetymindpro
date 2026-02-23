import React from 'react';
import { Link } from 'react-router-dom';
import '../components/Auth/AuthForms.css';
import './PrivacyPolicy.css';

function PrivacyPolicy() {
  return (
    <div className="privacy-container">
      <div className="privacy-card">
        <div className="auth-header">
          <h1>SafetyMindPro</h1>
          <p>Graph Analysis Platform</p>
        </div>

        <div className="privacy-content">
          <h2>Privacy Policy</h2>
          <p className="policy-version">Version 1.0 &nbsp;|&nbsp; Last updated: February 2026</p>

          <section>
            <h3>1. Data Controller</h3>
            <p>
              The data controller for SafetyMindPro is the operator of this installation.
              Contact your system administrator for the controller's full contact details.
            </p>
          </section>

          <section>
            <h3>2. What data we collect and why</h3>
            <table className="policy-table">
              <thead>
                <tr><th>Data</th><th>Purpose</th><th>Legal basis (GDPR)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Email address</td>
                  <td>Account creation, email verification, password recovery</td>
                  <td>Art. 6(1)(b) – contract performance</td>
                </tr>
                <tr>
                  <td>Username &amp; full name</td>
                  <td>Identification inside the platform</td>
                  <td>Art. 6(1)(b) – contract performance</td>
                </tr>
                <tr>
                  <td>Hashed password</td>
                  <td>Authentication</td>
                  <td>Art. 6(1)(b) – contract performance</td>
                </tr>
                <tr>
                  <td>Last login timestamp</td>
                  <td>Security monitoring, account management</td>
                  <td>Art. 6(1)(f) – legitimate interest</td>
                </tr>
                <tr>
                  <td>Activity log (action, IP address, timestamp)</td>
                  <td>Audit trail, fraud prevention, legal compliance</td>
                  <td>Art. 6(1)(c) – legal obligation; Art. 6(1)(f) – legitimate interest</td>
                </tr>
                <tr>
                  <td>GDPR consent timestamp</td>
                  <td>Documenting consent</td>
                  <td>Art. 7(1) GDPR</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>3. Cookies &amp; local storage</h3>
            <p>
              SafetyMindPro stores a JSON Web Token (JWT) in your browser's{' '}
              <code>localStorage</code> solely to maintain your login session. This is
              strictly necessary for the service to function and does not constitute
              tracking within the meaning of the ePrivacy Directive or TTDSG (Germany).
            </p>
            <p>
              We do <strong>not</strong> use any third-party analytics, advertising, or
              tracking cookies.
            </p>
          </section>

          <section>
            <h3>4. Data retention</h3>
            <p>
              Personal data is retained for as long as your account is active. Activity
              logs older than 12 months are deleted automatically. You may delete your
              account at any time (see Section 6).
            </p>
          </section>

          <section>
            <h3>5. Data sharing</h3>
            <p>
              We do not sell or rent your personal data. Data may be disclosed to
              authorities if required by law.
            </p>
          </section>

          <section>
            <h3>6. Your rights (GDPR)</h3>
            <ul>
              <li>
                <strong>Right of access (Art. 15)</strong> – Download all data we hold about you
                via <em>Dashboard → My Privacy Data → Export my data</em>.
              </li>
              <li>
                <strong>Right to rectification (Art. 16)</strong> – Update your profile in the
                Dashboard.
              </li>
              <li>
                <strong>Right to erasure (Art. 17)</strong> – Delete your account permanently via{' '}
                <em>Dashboard → My Privacy Data → Delete my account</em>.
              </li>
              <li>
                <strong>Right to data portability (Art. 20)</strong> – Included in the data
                export (JSON format).
              </li>
              <li>
                <strong>Right to object (Art. 21)</strong> – Contact your system administrator.
              </li>
              <li>
                <strong>Right to lodge a complaint</strong> – You may complain to the supervisory
                authority, e.g. the{' '}
                <a
                  href="https://www.bfdi.bund.de"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)
                </a>{' '}
                in Germany.
              </li>
            </ul>
          </section>

          <section>
            <h3>7. Security</h3>
            <p>
              Passwords are hashed with bcrypt (12 rounds). All communication should be
              served over HTTPS in production. Access tokens expire after 8 hours.
            </p>
          </section>

          <section>
            <h3>8. Changes to this policy</h3>
            <p>
              We will notify registered users by email if we make material changes to this
              policy. Continued use of the platform after such notification constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <div className="policy-footer">
            <Link to="/login" className="btn btn-primary">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
