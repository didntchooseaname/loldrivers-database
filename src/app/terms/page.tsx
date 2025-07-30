import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - LOLDrivers Database',
  description: 'Terms of Service and Legal Notices for the LOLDrivers Database interface',
};

export default function TermsPage() {
  return (
    <div className="container">
      <div className="terms-container">
        <a href="/" className="back-button-top">
          <i className="fas fa-arrow-left"></i>
        </a>
        
        <header className="terms-header">
          <h1>Terms of Service</h1>
          <p className="terms-subtitle">
            Legal notices and terms of use for the LOLDrivers Database interface
          </p>
          <p className="last-updated">
            Last updated: July 30, 2025
          </p>
        </header>

        <div className="terms-content">
          <section className="terms-section">
            <h2>1. Introduction and Acceptance</h2>
            <p>
              Welcome to the LOLDrivers Database interface ("Service"). This Service provides 
              an independent web interface to access and search the LOLDrivers database, which 
              catalogs vulnerable and malicious Windows drivers. By accessing or using this Service, 
              you agree to be bound by these Terms of Service ("Terms").
            </p>
            <p>
              This Service is provided for educational and research purposes only. If you do not 
              agree with any part of these Terms, you must not use this Service.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Data Source and Attribution</h2>
            <p>
              This Service utilizes data from the LOLDrivers project, originally created and 
              maintained by Michael Haag, Jose Hernandez, Nasreddine Bencherchali, and other 
              contributors. The original project is available at:
            </p>
            <ul>
              <li>Website: <a href="https://loldrivers.io" target="_blank" rel="noopener noreferrer">https://loldrivers.io</a></li>
              <li>GitHub Repository: <a href="https://github.com/magicsword-io/LOLDrivers" target="_blank" rel="noopener noreferrer">https://github.com/magicsword-io/LOLDrivers</a></li>
            </ul>
            <p>
              We acknowledge and respect the intellectual property rights of the original creators. 
              This Service is an independent interface and is not officially affiliated with or 
              endorsed by the original LOLDrivers project.
            </p>
          </section>

          <section className="terms-section">
            <h2>3. Permitted Use</h2>
            <p>You may use this Service for the following purposes:</p>
            <ul>
              <li>Security research and analysis</li>
              <li>Educational purposes and learning</li>
              <li>Legitimate cybersecurity investigations</li>
              <li>Academic research and study</li>
              <li>System administration and security hardening</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>4. Prohibited Use</h2>
            <p>You are strictly prohibited from using this Service for:</p>
            <ul>
              <li>Any illegal activities or purposes</li>
              <li>Malicious attacks, unauthorized access, or harmful activities</li>
              <li>Distribution of malware or malicious software</li>
              <li>Violation of any applicable laws or regulations</li>
              <li>Circumventing security measures of any system</li>
              <li>Any activity that could harm individuals, organizations, or systems</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>5. Disclaimer of Warranties</h2>
            <p>
              This Service is provided "AS IS" and "AS AVAILABLE" without any warranties of any kind, 
              either express or implied. We do not warrant that:
            </p>
            <ul>
              <li>The Service will be uninterrupted or error-free</li>
              <li>The information provided is accurate, complete, or current</li>
              <li>The Service will meet your specific requirements</li>
              <li>Any defects will be corrected</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any direct, 
              indirect, incidental, special, consequential, or punitive damages arising from or 
              related to your use of this Service, including but not limited to:
            </p>
            <ul>
              <li>Loss of data or information</li>
              <li>Business interruption</li>
              <li>Security breaches or incidents</li>
              <li>Any damages resulting from misuse of the information provided</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>7. User Responsibilities</h2>
            <p>By using this Service, you agree to:</p>
            <ul>
              <li>Use the Service only for lawful purposes</li>
              <li>Respect the intellectual property rights of others</li>
              <li>Not attempt to gain unauthorized access to any systems</li>
              <li>Take appropriate security measures when handling sensitive information</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>8. Privacy and Data Collection</h2>
            <p>
              We respect your privacy. This Service may collect minimal technical information 
              such as:
            </p>
            <ul>
              <li>IP addresses for security and analytics purposes</li>
              <li>Browser information and usage patterns</li>
              <li>Search queries and filter preferences</li>
            </ul>
            <p>
              We do not collect personal information unless explicitly provided by you. 
              We do not sell, share, or distribute your information to third parties.
            </p>
          </section>

          <section className="terms-section">
            <h2>9. Intellectual Property</h2>
            <p>
              The original LOLDrivers data is subject to the licensing terms of the original 
              project. This interface and its design are independently created. Users are 
              responsible for respecting all applicable intellectual property rights.
            </p>
          </section>

          <section className="terms-section">
            <h2>10. Security Notice</h2>
            <p>
              The information provided through this Service relates to potentially dangerous 
              software drivers. Users must exercise extreme caution and implement appropriate 
              security measures. We strongly recommend:
            </p>
            <ul>
              <li>Using isolated environments for any testing</li>
              <li>Following responsible disclosure practices</li>
              <li>Implementing proper security controls</li>
              <li>Consulting with cybersecurity professionals when appropriate</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>11. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be effective 
              immediately upon posting. Your continued use of the Service after any changes 
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="terms-section">
            <h2>12. Termination</h2>
            <p>
              We may terminate or suspend access to our Service immediately, without prior 
              notice or liability, for any reason, including breach of these Terms.
            </p>
          </section>

          <section className="terms-section">
            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable 
              international laws and conventions regarding cybersecurity, data protection, 
              and digital rights.
            </p>
          </section>

          <section className="terms-section">
            <h2>14. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please refer to the 
              original LOLDrivers project documentation or contact the appropriate authorities 
              for legal guidance regarding cybersecurity research in your jurisdiction.
            </p>
          </section>

          <section className="terms-section">
            <h2>15. Compliance Notice</h2>
            <p>
              This Service is designed to comply with international standards for cybersecurity 
              research platforms and educational resources. Users are responsible for ensuring 
              their use complies with local laws and regulations, including but not limited to:
            </p>
            <ul>
              <li>Data protection and privacy laws (GDPR, CCPA, etc.)</li>
              <li>Cybersecurity and computer crime laws</li>
              <li>Export control and international trade regulations</li>
              <li>Professional and ethical guidelines for security research</li>
            </ul>
          </section>
        </div>

        <div className="terms-footer">
          <p>
            <strong>Educational Use Only:</strong> This Service is intended for educational 
            and research purposes. Users assume full responsibility for their use of this 
            information and any consequences thereof.
          </p>
        </div>
      </div>
    </div>
  );
}
