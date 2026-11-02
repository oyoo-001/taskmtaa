import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-600">Last Updated: November 1, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-8 prose prose-blue max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              At TaskMtaa ("we," "us," or "our"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our platform.
            </p>
            <p className="text-gray-600">
              By using TaskMtaa, you consent to the data practices described in this policy. If you do not agree with our practices, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Information You Provide</h3>
            <p className="text-gray-600 mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li><strong>Account Information:</strong> Name, email address, phone number, password, and profile information</li>
              <li><strong>Profile Content:</strong> Profile pictures, bio, skills, languages, and experience</li>
              <li><strong>Task Information:</strong> Task descriptions, locations, budgets, and related details</li>
              <li><strong>Gig Information:</strong> Service listings, pricing, delivery times, and portfolio images</li>
              <li><strong>Communication Data:</strong> Messages sent through our platform's messaging system</li>
              <li><strong>Payment Information:</strong> Payment methods and transaction history (payment card data is handled by secure third-party processors)</li>
              <li><strong>Verification Data:</strong> Identity documents for account verification purposes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-gray-600 mb-4">
              When you use TaskMtaa, we automatically collect:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li><strong>Location Data:</strong> Approximate location based on IP address and precise location when you post tasks or enable location services</li>
              <li><strong>Device Information:</strong> Device type, operating system, browser type, and unique device identifiers</li>
              <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, search queries, and interaction patterns</li>
              <li><strong>Log Data:</strong> IP address, access times, and referring URLs</li>
              <li><strong>Cookies and Tracking:</strong> Information collected through cookies, web beacons, and similar technologies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Information from Third Parties</h3>
            <p className="text-gray-600">
              We may receive information about you from third-party services you connect to your account, such as social media platforms, payment processors, and verification services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Service Provision:</strong> To create and manage your account, process transactions, and facilitate connections between users</li>
              <li><strong>Communication:</strong> To send you service updates, security alerts, support messages, and promotional content (with your consent)</li>
              <li><strong>Personalization:</strong> To customize your experience, show relevant tasks and gigs, and improve our recommendations</li>
              <li><strong>Safety and Security:</strong> To verify identities, detect fraud, prevent abuse, and protect users</li>
              <li><strong>Analytics:</strong> To understand usage patterns, improve our services, and develop new features</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations, enforce our Terms, and respond to legal requests</li>
              <li><strong>Location Services:</strong> To connect you with nearby users and show location-relevant opportunities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-600 mb-4">
              We may share your information in the following circumstances:
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 With Other Users</h3>
            <p className="text-gray-600 mb-4">
              Your public profile information (name, photo, ratings, reviews, and bio) is visible to other users. When you post tasks or create gigs, this information is displayed alongside your listings.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Service Providers</h3>
            <p className="text-gray-600 mb-4">
              We share information with third-party service providers who perform services on our behalf, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li>Payment processors</li>
              <li>Cloud storage providers</li>
              <li>Email and communication services</li>
              <li>Analytics providers</li>
              <li>Customer support tools</li>
              <li>Identity verification services</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Legal Requirements</h3>
            <p className="text-gray-600 mb-4">
              We may disclose your information if required by law, court order, or government request, or if we believe disclosure is necessary to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li>Comply with legal obligations</li>
              <li>Protect our rights and property</li>
              <li>Prevent fraud or abuse</li>
              <li>Protect user safety</li>
              <li>Respond to emergencies</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.4 Business Transfers</h3>
            <p className="text-gray-600">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure data storage and backup procedures</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="text-gray-600 mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights</h2>
            <p className="text-gray-600 mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your information</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
            </ul>
            <p className="text-gray-600 mt-4">
              To exercise these rights, contact us at privacy@taskmtaa.com. We will respond to your request within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-600 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li>Remember your preferences and settings</li>
              <li>Authenticate your account</li>
              <li>Analyze usage patterns and trends</li>
              <li>Provide personalized content</li>
              <li>Measure advertising effectiveness</li>
            </ul>
            <p className="text-gray-600">
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-600">
              We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When you delete your account, we will delete or anonymize your information within 90 days, except where we must retain data for legal or security reasons.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-600">
              TaskMtaa is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will delete it immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-600">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Third-Party Links</h2>
            <p className="text-gray-600">
              Our platform may contain links to third-party websites and services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or platform notification. Your continued use after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">
                Email: privacy@taskmtaa.com<br />
                Data Protection Officer: dpo@taskmtaa.com<br />
                Address: Nairobi, Kenya<br />
                Phone: +254 700 000 000
              </p>
            </div>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              By using TaskMtaa, you acknowledge that you have read and understood this Privacy Policy.
            </p>
            <div className="flex gap-4">
              <Link
                to="/register"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Accept and Continue
              </Link>
              <Link
                to="/contact"
                className="inline-block bg-white text-blue-600 border-2 border-blue-600 px-6 py-2 rounded-lg hover:bg-gray-50 font-medium"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
