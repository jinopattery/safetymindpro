import React from 'react';
import { Link } from 'react-router-dom';
import '../components/Auth/AuthForms.css';
import './PrivacyPolicy.css';

function AITerms() {
  return (
    <div className="privacy-container">
      <div className="privacy-card">
        <div className="auth-header">
          <h1>SafetyMindPro</h1>
          <p>Graph Analysis Platform</p>
        </div>

        <div className="privacy-content">
          <h2>AI Terms of Use</h2>
          <p className="policy-version">Version 1.0 &nbsp;|&nbsp; Last updated: February 2026</p>

          <section>
            <h3>1. Scope</h3>
            <p>
              These AI Terms of Use ("AI Terms") govern your access to and use of any
              artificial-intelligence-powered features within SafetyMindPro, including but not
              limited to AI-assisted graph analysis, automated failure mode suggestions, risk
              scoring, natural-language queries, and AI-generated summaries ("AI Features").
              These AI Terms supplement and are incorporated into the general{' '}
              <Link to="/terms-and-conditions">Terms and Conditions</Link>. In case of conflict,
              these AI Terms take precedence with respect to AI Features.
            </p>
          </section>

          <section>
            <h3>2. Nature of AI Outputs</h3>
            <p>
              AI Features use machine-learning models to generate analytical outputs. You
              expressly acknowledge and agree that:
            </p>
            <ul>
              <li>
                <strong>AI outputs are not authoritative.</strong> Results produced by AI Features
                are probabilistic in nature and may be incomplete, incorrect, or outdated.
              </li>
              <li>
                <strong>No professional advice.</strong> AI outputs do not constitute
                engineering advice, functional-safety certification opinions, financial advice,
                or legal advice. Always consult a qualified professional before making
                safety-critical or financial decisions.
              </li>
              <li>
                <strong>Human review required.</strong> You must critically review and validate
                all AI outputs before incorporating them into any safety case, design document,
                financial analysis, or other deliverable.
              </li>
              <li>
                <strong>Domain limitations.</strong> The AI models have been trained on general
                and domain-specific corpora; they may lack knowledge of proprietary components,
                site-specific regulations, or the latest standards revisions.
              </li>
            </ul>
          </section>

          <section>
            <h3>3. Acceptable Use of AI Features</h3>
            <p>You agree to use AI Features only for legitimate analytical purposes. You must not:</p>
            <ul>
              <li>Submit prompts or data designed to extract training data, model weights, or system prompts.</li>
              <li>Use AI Features to generate, disseminate, or promote misinformation.</li>
              <li>Attempt to circumvent content-safety guardrails or safety filters.</li>
              <li>Submit confidential third-party data without appropriate authorisation.</li>
              <li>Use AI outputs to automate safety-critical decisions without human oversight.</li>
            </ul>
          </section>

          <section>
            <h3>4. Data Processing by AI Features</h3>
            <p>
              When you use AI Features, the graph data, text prompts, and context you submit
              may be processed by underlying AI models. The following applies:
            </p>
            <table className="policy-table">
              <thead>
                <tr>
                  <th>Data submitted</th>
                  <th>Processing purpose</th>
                  <th>Retention</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Graph nodes and edges</td>
                  <td>Generate analysis, identify failure paths, suggest mitigations</td>
                  <td>Used transiently; not stored for model training</td>
                </tr>
                <tr>
                  <td>Natural-language queries</td>
                  <td>Understand analytical intent, produce textual summaries</td>
                  <td>Session duration only</td>
                </tr>
                <tr>
                  <td>Domain context (e.g. component names)</td>
                  <td>Improve relevance of suggestions</td>
                  <td>Not persisted beyond the session</td>
                </tr>
              </tbody>
            </table>
            <p>
              Full details on how personal data is handled are set out in our{' '}
              <Link to="/privacy-policy">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h3>5. Accuracy and Reliability</h3>
            <p>
              SafetyMindPro makes no representations or warranties regarding the accuracy,
              completeness, or fitness for purpose of AI-generated outputs. AI Features are
              provided as decision-support tools only. Reliance on AI outputs for safety-critical
              applications is done entirely at your own risk.
            </p>
            <p>
              Where AI Features reference industry standards (e.g. ISO 26262, IEC 61508,
              IEC 61511), such references are for contextual guidance only and do not replace
              the obligation to obtain and follow the official published standards.
            </p>
          </section>

          <section>
            <h3>6. Intellectual Property in AI Outputs</h3>
            <p>
              Subject to your compliance with these AI Terms, SafetyMindPro grants you a
              limited, non-exclusive, revocable licence to use AI-generated outputs for your
              internal business purposes. You may not represent AI outputs as your own original
              work or sublicense them without disclosure that they were generated with AI
              assistance.
            </p>
          </section>

          <section>
            <h3>7. Feedback and Improvement</h3>
            <p>
              If you voluntarily submit feedback on AI outputs (e.g. rating a suggestion as
              helpful or unhelpful), you grant SafetyMindPro a royalty-free, perpetual licence
              to use that feedback to improve AI models and the Platform. Feedback is
              de-identified before use in model improvement.
            </p>
          </section>

          <section>
            <h3>8. Availability</h3>
            <p>
              AI Features may require an active subscription plan. SafetyMindPro reserves the
              right to modify, throttle, or discontinue AI Features at any time. See our{' '}
              <Link to="/plans">Pricing Plans</Link> for details on AI feature availability
              per subscription tier.
            </p>
          </section>

          <section>
            <h3>9. Limitation of Liability for AI Features</h3>
            <p>
              To the maximum extent permitted by law, SafetyMindPro shall not be liable for
              any loss, damage, harm, or regulatory non-compliance arising from reliance on
              AI-generated outputs. This limitation applies regardless of the form of action,
              whether in contract, tort, strict liability, or otherwise.
            </p>
          </section>

          <section>
            <h3>10. Changes to AI Terms</h3>
            <p>
              We may update these AI Terms as AI technology and regulations evolve. Material
              updates will be communicated by email to registered users. Continued use of AI
              Features after the effective date constitutes acceptance of the revised terms.
            </p>
          </section>

          <div className="policy-footer">
            <Link to="/login" className="btn btn-primary">← Back to Login</Link>
            &nbsp;&nbsp;
            <Link to="/terms-and-conditions" className="btn btn-primary">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AITerms;
