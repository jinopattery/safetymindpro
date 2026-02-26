import React from 'react';
import { Link } from 'react-router-dom';
import '../components/Auth/AuthForms.css';
import './PrivacyPolicy.css';

function FinancialDataSources() {
  return (
    <div className="privacy-container">
      <div className="privacy-card" style={{ maxWidth: '860px' }}>
        <div className="auth-header">
          <h1>SafetyMindPro</h1>
          <p>Graph Analysis Platform</p>
        </div>

        <div className="privacy-content">
          <h2>Financial Analysis &amp; Data Sources</h2>
          <p className="policy-version">Last updated: February 2026 &nbsp;|&nbsp; Applies to: Financial &amp; Trading Domains</p>

          <section>
            <h3>Overview</h3>
            <p>
              SafetyMindPro's Financial and Trading domains provide graph-based risk and
              dependency analysis for financial systems. This page describes the data sources
              used to populate financial analyses, explains the methodologies applied, and sets
              out important limitations you should be aware of when interpreting results.
            </p>
          </section>

          <section>
            <h3>1. Financial Market Data</h3>
            <p>
              Market prices, indices, and instrument data displayed within financial analysis
              graphs may be sourced from one or more of the following provider categories:
            </p>
            <table className="policy-table">
              <thead>
                <tr>
                  <th>Data category</th>
                  <th>Typical sources</th>
                  <th>Update frequency</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Equity prices</td>
                  <td>Stock exchange feeds, financial data APIs (e.g. OpenFIGI, Alpha Vantage, Quandl derivatives)</td>
                  <td>End-of-day or delayed (≥15 min)</td>
                </tr>
                <tr>
                  <td>Index data</td>
                  <td>Public index providers (S&amp;P, MSCI, STOXX, etc.) via licensed feeds</td>
                  <td>End-of-day</td>
                </tr>
                <tr>
                  <td>Fundamental data</td>
                  <td>Company filings (SEC EDGAR, Eurozone regulatory filings), data aggregators</td>
                  <td>Quarterly / on filing</td>
                </tr>
                <tr>
                  <td>Macroeconomic indicators</td>
                  <td>Central banks, OECD, World Bank, national statistical offices</td>
                  <td>Monthly / quarterly</td>
                </tr>
                <tr>
                  <td>Credit ratings</td>
                  <td>Major credit rating agencies (Moody's, S&amp;P, Fitch) via public releases</td>
                  <td>On change</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>2. Risk Analysis Methodology</h3>
            <p>
              The Financial domain applies established quantitative risk methodologies to
              model dependencies and propagation of risk through financial networks:
            </p>
            <ul>
              <li>
                <strong>Value at Risk (VaR)</strong> – Parametric and historical simulation
                methods are used to estimate potential portfolio losses at given confidence
                levels (typically 95% and 99%).
              </li>
              <li>
                <strong>Conditional Value at Risk (CVaR / Expected Shortfall)</strong> –
                Captures tail risk beyond the VaR threshold, providing a more conservative
                risk measure.
              </li>
              <li>
                <strong>Correlation and Dependency Graphs</strong> – Assets and entities are
                modelled as nodes; edges represent statistical correlations, ownership
                relationships, or contractual dependencies.
              </li>
              <li>
                <strong>Stress Testing</strong> – Scenario-based stress tests are applied to
                graph nodes to propagate shocks through connected entities.
              </li>
              <li>
                <strong>Fault Tree Analysis (FTA) for Financial Systems</strong> – Boolean
                logic trees model how failure of financial obligations or market conditions
                can lead to systemic risk events.
              </li>
            </ul>
          </section>

          <section>
            <h3>3. Company and Instrument Data</h3>
            <p>
              Fundamental company data (revenue, earnings, balance-sheet figures) is sourced
              from publicly available regulatory filings. SafetyMindPro normalises and
              structures this data to enable graph-based analysis. The following applies:
            </p>
            <ul>
              <li>Data is provided for informational and analytical purposes only.</li>
              <li>
                Figures may differ slightly from primary sources due to normalisation,
                currency conversion, or rounding.
              </li>
              <li>
                Restated figures in company filings may not be reflected immediately.
              </li>
              <li>
                Coverage and timeliness vary by region and data provider availability.
              </li>
            </ul>
          </section>

          <section>
            <h3>4. AI-Assisted Financial Analysis</h3>
            <p>
              Where AI features are enabled (Professional and Enterprise plans), the Financial
              domain uses large-language-model (LLM) and statistical models to:
            </p>
            <ul>
              <li>Suggest relevant risk factors and dependencies for a given portfolio or entity graph.</li>
              <li>Generate narrative summaries of risk analysis results.</li>
              <li>Identify anomalous patterns in financial network graphs.</li>
              <li>Provide context from recent financial news and earnings announcements.</li>
            </ul>
            <p>
              AI-assisted outputs are subject to the{' '}
              <Link to="/ai-terms">AI Terms of Use</Link>. They must not be relied upon
              as investment advice, and SafetyMindPro is not a regulated financial adviser.
            </p>
          </section>

          <section>
            <h3>5. Data Accuracy and Limitations</h3>
            <p>
              SafetyMindPro makes reasonable efforts to ensure data accuracy but cannot
              guarantee that all data is correct, complete, or current. Specific limitations
              include:
            </p>
            <ul>
              <li>Market data may be delayed by 15 minutes or more unless a real-time feed is configured.</li>
              <li>
                Historical data prior to a company's IPO or listing may be unavailable or
                estimated.
              </li>
              <li>Data for smaller-cap or illiquid instruments may be less complete.</li>
              <li>
                Exchange rates used for currency conversion are based on daily closing rates
                and may not reflect intra-day movements.
              </li>
              <li>
                The Platform does not provide real-time trading signals and should not be
                used as the sole basis for trading decisions.
              </li>
            </ul>
          </section>

          <section>
            <h3>6. Regulatory Compliance Notice</h3>
            <p>
              SafetyMindPro is an analytical tool. It is <strong>not</strong> a regulated
              investment firm, financial adviser, broker, or exchange. Information and analysis
              provided through the Financial and Trading domains:
            </p>
            <ul>
              <li>Does not constitute investment advice within the meaning of MiFID II or equivalent legislation.</li>
              <li>Should not be relied upon for decisions about buying, selling, or holding securities.</li>
              <li>Is not a substitute for professional financial, legal, or tax advice.</li>
            </ul>
            <p>
              Users in regulated industries are responsible for ensuring their use of the
              Platform complies with applicable financial regulations.
            </p>
          </section>

          <section>
            <h3>7. Data Updates and Historical Records</h3>
            <p>
              The Platform retains historical snapshots of financial analyses to support
              audit trails and trend comparison. Historical data is stored in accordance with
              our <Link to="/privacy-policy">Privacy Policy</Link>. Raw market data is not
              stored beyond the session unless you explicitly save a project.
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

export default FinancialDataSources;
