import React from 'react';
import { Link } from 'react-router-dom';
import '../components/Auth/AuthForms.css';
import './PrivacyPolicy.css';

function TermsAndConditions() {
  return (
    <div className="privacy-container">
      <div className="privacy-card">
        <div className="auth-header">
          <h1>SafetyMindPro</h1>
          <p>Graph Analysis Platform</p>
        </div>

        <div className="privacy-content">
          <h2>Terms and Conditions</h2>
          <p className="policy-version">Version 1.0 &nbsp;|&nbsp; Last updated: February 2026</p>

          <section>
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing or using SafetyMindPro ("the Platform"), you agree to be bound by
              these Terms and Conditions. If you do not agree to all of these terms, do not use
              the Platform. These terms apply to all domains available in the Platform, including
              Automotive, Process Plant, Financial, and Trading workspaces.
            </p>
          </section>

          <section>
            <h3>2. Description of Service</h3>
            <p>
              SafetyMindPro is a graph-based analysis platform that supports safety and risk
              analysis across multiple engineering and financial domains. The Platform provides
              tools including Fault Tree Analysis (FTA), Failure Mode and Effect Analysis (FMEA),
              risk matrices, structure analysis, and AI-assisted insights.
            </p>
            <p>
              The Platform is intended for use by qualified professionals. Outputs from the
              Platform are analytical aids and do not constitute professional engineering advice,
              financial advice, or legal advice.
            </p>
          </section>

          <section>
            <h3>3. Account Registration</h3>
            <p>
              To access the Platform you must register an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete registration information.</li>
              <li>Verify your email address before first use.</li>
              <li>Keep your password confidential and not share it with others.</li>
              <li>Notify us immediately if you suspect unauthorised use of your account.</li>
              <li>Be responsible for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h3>4. Permitted Use</h3>
            <p>You may use the Platform only for lawful purposes and in accordance with these
            Terms. You agree <strong>not</strong> to:</p>
            <ul>
              <li>Use the Platform to transmit any unlawful, harmful, or offensive content.</li>
              <li>Attempt to gain unauthorised access to any part of the Platform or its systems.</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Platform software.</li>
              <li>Use automated tools (bots, scrapers) to access the Platform without prior written consent.</li>
              <li>Reproduce or redistribute Platform outputs in a manner that misrepresents their origin.</li>
              <li>Use the Platform in any way that violates applicable laws or regulations.</li>
            </ul>
          </section>

          <section>
            <h3>5. Intellectual Property</h3>
            <p>
              All software, algorithms, methodologies, documentation, trademarks, and content
              comprising the Platform are the intellectual property of SafetyMindPro and its
              licensors. Nothing in these Terms grants you any right, title, or interest in the
              Platform beyond the limited licence to use it as described herein.
            </p>
            <p>
              You retain ownership of any data, graphs, and analysis projects you create using
              the Platform. By using the Platform you grant SafetyMindPro a limited, non-exclusive
              licence to process your data solely to provide the service.
            </p>
          </section>

          <section>
            <h3>6. AI-Generated Content</h3>
            <p>
              Certain features of the Platform use artificial intelligence to generate analytical
              insights, suggestions, or recommendations. You acknowledge that:
            </p>
            <ul>
              <li>AI-generated content is provided for informational purposes only.</li>
              <li>AI outputs may contain errors, inaccuracies, or outdated information.</li>
              <li>You are solely responsible for validating AI outputs before relying on them.</li>
              <li>Use of AI features is additionally governed by our <Link to="/ai-terms">AI Terms</Link>.</li>
            </ul>
          </section>

          <section>
            <h3>7. Disclaimer of Warranties</h3>
            <p>
              The Platform is provided on an "as is" and "as available" basis without warranties
              of any kind, either express or implied, including but not limited to implied
              warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p>
              SafetyMindPro does not warrant that: (a) the Platform will be uninterrupted or
              error-free; (b) defects will be corrected; (c) the Platform or its servers are free
              of viruses or other harmful components; or (d) the results obtained from use of the
              Platform will be accurate or reliable.
            </p>
          </section>

          <section>
            <h3>8. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by applicable law, SafetyMindPro shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages,
              including but not limited to loss of profits, data, goodwill, or other intangible
              losses, arising out of or in connection with your use of or inability to use the
              Platform.
            </p>
            <p>
              In no event shall our aggregate liability exceed the amount you paid (if any) for
              access to the Platform in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h3>9. Indemnification</h3>
            <p>
              You agree to defend, indemnify, and hold harmless SafetyMindPro and its affiliates,
              officers, employees, and agents from any claims, damages, liabilities, or expenses
              arising from your use of the Platform, your violation of these Terms, or your
              violation of any third-party rights.
            </p>
          </section>

          <section>
            <h3>10. Third-Party Links and Data</h3>
            <p>
              The Platform may reference or link to third-party websites, standards, or data
              sources (e.g. IEC, ISO standards bodies, financial data providers). Such references
              are for informational purposes; SafetyMindPro does not endorse and is not
              responsible for third-party content.
            </p>
          </section>

          <section>
            <h3>11. Modifications to the Service and Terms</h3>
            <p>
              SafetyMindPro reserves the right to modify or discontinue the Platform at any time.
              We may also update these Terms. Material changes will be communicated to registered
              users by email. Continued use of the Platform after the effective date of updated
              Terms constitutes your acceptance.
            </p>
          </section>

          <section>
            <h3>12. Termination</h3>
            <p>
              SafetyMindPro may suspend or terminate your account at any time for violation of
              these Terms or applicable law. Upon termination you lose the right to access your
              data through the Platform; you may request a data export before termination takes
              effect.
            </p>
          </section>

          <section>
            <h3>13. Governing Law</h3>
            <p>
              These Terms are governed by and construed in accordance with applicable law. Any
              disputes arising under these Terms shall be subject to the exclusive jurisdiction
              of the competent courts of the jurisdiction in which the Platform operator is
              established.
            </p>
          </section>

          <section>
            <h3>14. Contact</h3>
            <p>
              For questions about these Terms, please contact your system administrator or the
              operator of this SafetyMindPro installation.
            </p>
          </section>

          <div className="policy-footer">
            <Link to="/login" className="btn btn-primary">← Back to Login</Link>
            &nbsp;&nbsp;
            <Link to="/privacy-policy" className="btn btn-primary">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
