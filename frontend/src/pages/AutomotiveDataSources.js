import React from 'react';
import { Link } from 'react-router-dom';
import '../components/Auth/AuthForms.css';
import './PrivacyPolicy.css';

function AutomotiveDataSources() {
  return (
    <div className="privacy-container">
      <div className="privacy-card" style={{ maxWidth: '860px' }}>
        <div className="auth-header">
          <h1>SafetyMindPro</h1>
          <p>Graph Analysis Platform</p>
        </div>

        <div className="privacy-content">
          <h2>Automotive Safety Analysis &amp; Data Sources</h2>
          <p className="policy-version">Last updated: February 2026 &nbsp;|&nbsp; Applies to: Automotive Domain</p>

          <section>
            <h3>Overview</h3>
            <p>
              SafetyMindPro's Automotive domain supports functional safety analysis for
              road vehicles and automotive systems in accordance with industry standards
              including ISO 26262 and IEC 61508. This page describes the types of data that
              can be used within automotive analyses, the methodologies supported, and
              important limitations and disclaimers.
            </p>
          </section>

          <section>
            <h3>1. Supported Data Types</h3>
            <p>
              The Automotive domain is designed to ingest and analyse safety-relevant data
              from a variety of sources typical in the automotive supply chain:
            </p>
            <table className="policy-table">
              <thead>
                <tr>
                  <th>Data type</th>
                  <th>Description</th>
                  <th>Typical format</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Component datasheets</td>
                  <td>
                    Technical specifications from component suppliers including electrical
                    ratings, operating conditions, failure-rate data, and qualification
                    test results
                  </td>
                  <td>PDF, XML, CSV</td>
                </tr>
                <tr>
                  <td>FMEDA reports</td>
                  <td>
                    Failure Mode, Effects, and Diagnostic Analysis (FMEDA) documents provided
                    by component suppliers, detailing failure modes, failure rates (FIT),
                    diagnostic coverage (DC), and Safe Failure Fraction (SFF)
                  </td>
                  <td>PDF, Excel, CSV</td>
                </tr>
                <tr>
                  <td>System architecture diagrams</td>
                  <td>
                    Hardware and software architecture descriptions used to model dependencies
                    between system elements
                  </td>
                  <td>SysML, ArchiMate, CSV node/edge lists</td>
                </tr>
                <tr>
                  <td>Fault tree models</td>
                  <td>
                    Existing FTA models imported from external tools or created natively
                    in the Platform
                  </td>
                  <td>CSV, JSON, OpenFTA format</td>
                </tr>
                <tr>
                  <td>FMEA worksheets</td>
                  <td>
                    Design and process FMEA tables including failure modes, effects, causes,
                    detection controls, and Risk Priority Numbers (RPN)
                  </td>
                  <td>Excel, CSV</td>
                </tr>
                <tr>
                  <td>Hazard analysis (HARA)</td>
                  <td>
                    Hazard Analysis and Risk Assessment inputs per ISO 26262 Part 3,
                    including operational situations, hazardous events, severity (S),
                    exposure (E), and controllability (C) classifications
                  </td>
                  <td>CSV, JSON</td>
                </tr>
                <tr>
                  <td>Reliability / failure-rate databases</td>
                  <td>
                    Industry failure-rate databases (e.g. IEC TR 62380, SN 29500, MIL-HDBK-217)
                    used as reference data for quantitative FTA and FMEDA computations
                  </td>
                  <td>Internal database, CSV import</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>2. Functional Safety Standards</h3>
            <p>
              The Automotive domain is aligned with and supports analyses required by the
              following functional safety standards:
            </p>

            <h4>ISO 26262 – Functional Safety of Road Vehicles</h4>
            <p>
              ISO 26262 (2018 edition) is the international standard for functional safety of
              electrical and electronic systems in production road vehicles. SafetyMindPro
              supports the following ISO 26262 activities:
            </p>
            <ul>
              <li><strong>Part 3 – Concept phase:</strong> Hazard Analysis and Risk Assessment (HARA), Automotive Safety Integrity Level (ASIL) determination, Functional Safety Concept (FSC).</li>
              <li><strong>Part 4 – Product development at system level:</strong> Technical Safety Concept, Safety Analysis (FMEA, FTA), hardware-software interface definition.</li>
              <li><strong>Part 5 – Product development at hardware level:</strong> Hardware safety requirements, FMEDA, evaluation of ASIL hardware metrics (SPFM, LFM, PMHF).</li>
              <li><strong>Part 9 – ASIL-oriented and safety-oriented analyses:</strong> Dependent failure analysis, common cause failure analysis.</li>
              <li><strong>Part 10 – Guidelines:</strong> Guidance on the application of ISO 26262 methodologies.</li>
            </ul>

            <h4>IEC 61508 – Functional Safety of E/E/PE Safety-related Systems</h4>
            <p>
              IEC 61508 is the base standard for functional safety, applicable to safety-related
              systems in all sectors. The Automotive domain supports IEC 61508-aligned analyses
              where automotive systems also fall under its scope (e.g. industrial vehicle
              applications, off-highway machinery):
            </p>
            <ul>
              <li><strong>Safety Integrity Level (SIL) determination</strong> via risk graph or LOPA methods.</li>
              <li><strong>Probabilistic Failure on Demand (PFD)</strong> and <strong>Probability of Failure per Hour (PFH)</strong> calculations.</li>
              <li><strong>Hardware Safety Integrity:</strong> Random hardware failure metrics (HFT, SFF, diagnostic coverage).</li>
              <li><strong>Systematic Capability</strong> assessments for software and hardware.</li>
            </ul>

            <h4>Related Standards and Frameworks</h4>
            <ul>
              <li><strong>IEC 61511</strong> – Functional safety for the process industry (also supported in the Process Plant domain).</li>
              <li><strong>SOTIF (ISO 21448)</strong> – Safety of the Intended Functionality, relevant for sensors and perception systems in ADAS/AV applications.</li>
              <li><strong>ISO/SAE 21434</strong> – Automotive cybersecurity engineering (threat analysis and risk assessment).</li>
              <li><strong>AUTOSAR</strong> – Architectural framework for automotive ECU software; component models can be imported as graph nodes.</li>
            </ul>
          </section>

          <section>
            <h3>3. Component Supplier Data</h3>
            <p>
              Suppliers of safety-relevant automotive components typically provide the following
              documents that can be imported into SafetyMindPro:
            </p>
            <ul>
              <li>
                <strong>FMEDA worksheets</strong> – Quantitative failure mode analysis providing
                λ (failure rate), λ<sub>DD</sub> (detected dangerous), λ<sub>DU</sub>
                (undetected dangerous), and diagnostic coverage figures per IEC 61508 / ISO 26262.
              </li>
              <li>
                <strong>Safety Manuals</strong> – Component safety manuals specifying
                assumptions of use, external diagnostic measures, and constraints for
                integration into a safety-related system.
              </li>
              <li>
                <strong>Qualification reports</strong> – AEC-Q100/Q200 automotive qualification
                test reports demonstrating reliability under automotive environmental stress.
              </li>
              <li>
                <strong>Application notes</strong> – Application-specific guidance on fault
                detection, redundancy architectures, and safe-state behaviour.
              </li>
            </ul>
            <p>
              <strong>Note:</strong> Supplier-provided data is the responsibility of the
              component manufacturer. SafetyMindPro does not independently verify supplier
              FMEDA data. Users are responsible for qualifying supplier data and confirming
              it is applicable to their specific use case.
            </p>
          </section>

          <section>
            <h3>4. Analysis Methodologies</h3>
            <p>The Automotive domain supports the following safety analysis techniques:</p>
            <table className="policy-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Standard reference</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fault Tree Analysis (FTA)</td>
                  <td>ISO 26262-9, IEC 61025</td>
                  <td>Top-down deductive analysis of failure event propagation using Boolean logic trees</td>
                </tr>
                <tr>
                  <td>FMEA / DFMEA</td>
                  <td>ISO 26262-4, AIAG-VDA FMEA</td>
                  <td>Bottom-up inductive analysis of failure modes and their effects at system and design level</td>
                </tr>
                <tr>
                  <td>FMEDA</td>
                  <td>IEC 61508-2, ISO 26262-5</td>
                  <td>Quantitative extension of FMEA including failure rates and diagnostic coverage metrics</td>
                </tr>
                <tr>
                  <td>Hazard Analysis and Risk Assessment (HARA)</td>
                  <td>ISO 26262-3</td>
                  <td>Identification and classification of hazardous events; ASIL assignment</td>
                </tr>
                <tr>
                  <td>Dependent Failure Analysis (DFA)</td>
                  <td>ISO 26262-9</td>
                  <td>Analysis of common-cause failures and cascading failure dependencies in redundant architectures</td>
                </tr>
                <tr>
                  <td>PMHF calculation</td>
                  <td>ISO 26262-5 / -10</td>
                  <td>Probabilistic Metric for random Hardware Failures; target values per ASIL (e.g. ASIL D &lt; 10<sup>-8</sup>/h)</td>
                </tr>
                <tr>
                  <td>SIL / ASIL verification</td>
                  <td>IEC 61508, ISO 26262</td>
                  <td>Quantitative verification that hardware metrics meet Safety Integrity Level requirements</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>5. AI-Assisted Automotive Analysis</h3>
            <p>
              Where AI features are enabled (Professional and Enterprise plans), the Automotive
              domain uses AI models to:
            </p>
            <ul>
              <li>Suggest failure modes based on component type, operating environment, and historical data.</li>
              <li>Recommend diagnostic coverage measures aligned with ASIL targets.</li>
              <li>Generate preliminary FMEA entries from system architecture descriptions.</li>
              <li>Identify potential common-cause failure sources in graph-based system models.</li>
              <li>Cross-reference analysis results against applicable clauses of ISO 26262 and IEC 61508.</li>
            </ul>
            <p>
              AI-assisted outputs are informational only and do not constitute a functional
              safety assessment. All AI outputs must be reviewed and validated by a qualified
              functional safety engineer. Use of AI features is governed by the{' '}
              <Link to="/ai-terms">AI Terms of Use</Link>.
            </p>
          </section>

          <section>
            <h3>6. Limitations and Disclaimers</h3>
            <ul>
              <li>
                <strong>Not a certification tool.</strong> SafetyMindPro is an analytical aid
                and does not produce ISO 26262 or IEC 61508 compliance certificates. Formal
                functional safety assessments must be performed by a recognised assessor or
                certification body.
              </li>
              <li>
                <strong>Standards versions.</strong> Analyses reference ISO 26262:2018 (2nd
                edition) and IEC 61508:2010 (2nd edition). Users are responsible for
                identifying if a newer edition or amendment applies to their project.
              </li>
              <li>
                <strong>Supplier data validation.</strong> The Platform does not validate the
                correctness of supplier-provided FMEDA data. Users must perform their own
                validation.
              </li>
              <li>
                <strong>No warranty.</strong> Analysis results are provided as engineering
                support tools. SafetyMindPro makes no warranty that results are accurate,
                complete, or fit for use in a safety case.
              </li>
              <li>
                <strong>User responsibility.</strong> The user is responsible for ensuring
                that analyses performed using the Platform are appropriate for their system,
                application, and regulatory context.
              </li>
            </ul>
          </section>

          <section>
            <h3>7. Further Resources</h3>
            <ul>
              <li>
                <a href="https://www.iso.org/standard/68383.html" target="_blank" rel="noopener noreferrer">
                  ISO 26262:2018 – Road vehicles – Functional safety
                </a>
              </li>
              <li>
                <a href="https://www.iec.ch/functional-safety" target="_blank" rel="noopener noreferrer">
                  IEC 61508 – Functional Safety of E/E/PE Safety-related Systems
                </a>
              </li>
              <li>
                <a href="https://www.iso.org/standard/77490.html" target="_blank" rel="noopener noreferrer">
                  ISO 21448:2022 – SOTIF (Safety of the Intended Functionality)
                </a>
              </li>
              <li>
                <a href="https://www.iso.org/standard/70918.html" target="_blank" rel="noopener noreferrer">
                  ISO/SAE 21434:2021 – Road vehicles – Cybersecurity engineering
                </a>
              </li>
            </ul>
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

export default AutomotiveDataSources;
