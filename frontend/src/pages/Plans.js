import React from 'react';
import { Link } from 'react-router-dom';
import '../components/Auth/AuthForms.css';
import './PrivacyPolicy.css';
import './Plans.css';

function Plans() {
  return (
    <div className="privacy-container">
      <div className="privacy-card plans-card">
        <div className="auth-header">
          <h1>SafetyMindPro</h1>
          <p>Graph Analysis Platform</p>
        </div>

        <div className="privacy-content">
          <h2>Pricing Plans</h2>
          <p className="policy-version">All prices shown are indicative. Contact your system administrator for enterprise licensing.</p>

          <div className="plans-grid">

            {/* Free / Community */}
            <div className="plan-card plan-card--free">
              <div className="plan-header">
                <span className="plan-badge">Community</span>
                <div className="plan-price">
                  <span className="plan-price-amount">Free</span>
                </div>
                <p className="plan-tagline">Perfect for individuals exploring safety analysis</p>
              </div>
              <ul className="plan-features">
                <li>✓ All analysis domains (Automotive, Process Plant, Financial, Trading)</li>
                <li>✓ Fault Tree Analysis (FTA)</li>
                <li>✓ Failure Mode &amp; Effect Analysis (FMEA)</li>
                <li>✓ Risk Matrix</li>
                <li>✓ Structure Analysis</li>
                <li>✓ Up to 5 saved projects</li>
                <li>✓ CSV / JSON export</li>
                <li>✗ AI-assisted analysis</li>
                <li>✗ Priority support</li>
                <li>✗ Team collaboration</li>
              </ul>
              <Link to="/signup" className="btn btn-plan btn-plan--outline">Get Started Free</Link>
            </div>

            {/* Professional */}
            <div className="plan-card plan-card--pro plan-card--featured">
              <div className="plan-header">
                <span className="plan-badge plan-badge--pro">Professional</span>
                <div className="plan-price">
                  <span className="plan-price-currency">€</span>
                  <span className="plan-price-amount">49</span>
                  <span className="plan-price-period">/month</span>
                </div>
                <p className="plan-tagline">For engineers and analysts who need AI power</p>
              </div>
              <ul className="plan-features">
                <li>✓ Everything in Community</li>
                <li>✓ <strong>AI-assisted analysis &amp; suggestions</strong></li>
                <li>✓ <strong>Unlimited saved projects</strong></li>
                <li>✓ Advanced graph algorithms</li>
                <li>✓ FMEDA support (Automotive domain)</li>
                <li>✓ Financial data insights</li>
                <li>✓ PDF export with report templates</li>
                <li>✓ Email support (48 h response)</li>
                <li>✗ Team collaboration</li>
                <li>✗ SSO / SAML</li>
              </ul>
              <Link to="/signup" className="btn btn-plan btn-plan--primary">Start Free Trial</Link>
            </div>

            {/* Enterprise */}
            <div className="plan-card plan-card--enterprise">
              <div className="plan-header">
                <span className="plan-badge plan-badge--enterprise">Enterprise</span>
                <div className="plan-price">
                  <span className="plan-price-amount">Custom</span>
                </div>
                <p className="plan-tagline">For teams and organisations with advanced requirements</p>
              </div>
              <ul className="plan-features">
                <li>✓ Everything in Professional</li>
                <li>✓ <strong>Team workspaces &amp; collaboration</strong></li>
                <li>✓ <strong>Role-based access control</strong></li>
                <li>✓ SSO / SAML integration</li>
                <li>✓ On-premise deployment option</li>
                <li>✓ Custom domain integrations</li>
                <li>✓ Dedicated customer success manager</li>
                <li>✓ SLA-backed uptime guarantee</li>
                <li>✓ Priority support (4 h response)</li>
                <li>✓ Volume licensing</li>
              </ul>
              <a href="mailto:sales@safetymindpro.example.com" className="btn btn-plan btn-plan--outline">Contact Sales</a>
            </div>

          </div>

          <section style={{ marginTop: '36px' }}>
            <h3>Feature Comparison</h3>
            <table className="policy-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Community</th>
                  <th>Professional</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Analysis domains</td>
                  <td>All 4</td>
                  <td>All 4</td>
                  <td>All 4 + custom</td>
                </tr>
                <tr>
                  <td>Saved projects</td>
                  <td>5</td>
                  <td>Unlimited</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>AI features</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>FMEDA (Automotive)</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Financial data insights</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>PDF export</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Team collaboration</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>SSO / SAML</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>On-premise deployment</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Support</td>
                  <td>Community forum</td>
                  <td>Email (48 h)</td>
                  <td>Priority (4 h SLA)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>Frequently Asked Questions</h3>

            <p><strong>Can I change plans at any time?</strong><br />
            Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the
            start of the next billing cycle.</p>

            <p><strong>Is there a free trial for Professional?</strong><br />
            Yes. Professional includes a 14-day free trial with no credit card required.</p>

            <p><strong>What payment methods are accepted?</strong><br />
            Major credit/debit cards (Visa, Mastercard, American Express) and SEPA direct debit
            are supported. Enterprise customers may request invoice-based billing.</p>

            <p><strong>Are prices inclusive of VAT?</strong><br />
            Prices shown are exclusive of VAT (or equivalent local tax). Applicable taxes will
            be added at checkout based on your billing address.</p>

            <p><strong>What happens to my data if I downgrade or cancel?</strong><br />
            Your data remains accessible for 30 days after downgrade or cancellation, during
            which you can export it. After 30 days, projects exceeding the free tier limit may
            be archived.</p>
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

export default Plans;
