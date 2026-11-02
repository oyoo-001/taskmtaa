import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function TermsConditions() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
          </div>
          <p className="text-gray-600">Last Updated: November 1, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-8 prose prose-blue max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using TaskMtaa ("the Platform," "we," "us," or "our"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
            <p className="text-gray-600">
              These terms constitute a legally binding agreement between you and TaskMtaa. We reserve the right to modify these terms at any time, and your continued use of the Platform constitutes acceptance of such modifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="text-gray-600 mb-4">
              To use TaskMtaa, you must:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Not be prohibited from using the service under applicable laws</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Registration</h3>
            <p className="text-gray-600 mb-4">
              You must create an account to use certain features of TaskMtaa. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Account Security</h3>
            <p className="text-gray-600 mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Account Termination</h3>
            <p className="text-gray-600">
              We reserve the right to suspend or terminate your account at any time for violations of these terms, fraudulent activity, or any other reason we deem necessary to protect the Platform and its users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Services Provided</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Platform Services</h3>
            <p className="text-gray-600 mb-4">
              TaskMtaa provides a marketplace platform that connects individuals who need tasks completed ("Task Posters") with individuals who can complete those tasks ("Taskers" or "Service Providers"). We also facilitate service listings through our Gigs feature.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Independent Contractors</h3>
            <p className="text-gray-600">
              TaskMtaa is not a party to the actual service agreements between Task Posters and Taskers. All users are independent contractors, and no employment, partnership, or agency relationship is created through the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Task Posting and Bidding</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Task Posting Guidelines</h3>
            <p className="text-gray-600 mb-4">
              Task Posters must:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li>Provide accurate and complete task descriptions</li>
              <li>Set reasonable budgets and deadlines</li>
              <li>Not post tasks that violate laws or our community guidelines</li>
              <li>Respond to bids in a timely manner</li>
              <li>Pay agreed amounts upon satisfactory task completion</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Bidding Requirements</h3>
            <p className="text-gray-600 mb-4">
              Taskers must:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Only bid on tasks they are qualified to complete</li>
              <li>Provide honest estimates of time and cost</li>
              <li>Complete accepted tasks as agreed</li>
              <li>Maintain professional communication</li>
              <li>Honor their bid commitments</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payments and Fees</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Service Fees</h3>
            <p className="text-gray-600 mb-4">
              TaskMtaa charges service fees on completed transactions. These fees are clearly disclosed before transaction completion and may vary based on transaction type and amount.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Payment Processing</h3>
            <p className="text-gray-600 mb-4">
              All payments are processed securely through our payment partners. We do not store full credit card information. Task Posters agree to pay for completed tasks, and Taskers agree to our fee structure for received payments.
            </p>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.3 Refunds and Disputes</h3>
            <p className="text-gray-600">
              Payment disputes must be reported within 7 days of task completion. We will mediate disputes in good faith but are not obligated to provide refunds. Our decision in disputes is final.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Prohibited Activities</h2>
            <p className="text-gray-600 mb-4">
              Users must not:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, threaten, or harm other users</li>
              <li>Circumvent platform fees or payments</li>
              <li>Use the platform for illegal activities</li>
              <li>Attempt to scrape or copy platform data</li>
              <li>Create multiple accounts to manipulate ratings or reviews</li>
              <li>Share account credentials with others</li>
              <li>Reverse engineer or attempt to access platform source code</li>
              <li>Post spam, advertisements, or solicitations</li>
              <li>Violate intellectual property rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Ratings and Reviews</h2>
            <p className="text-gray-600 mb-4">
              Users may rate and review each other after task completion. Reviews must be honest, factual, and based on actual experience. We reserve the right to remove reviews that violate our guidelines, including those that contain:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Offensive or abusive language</li>
              <li>False or defamatory statements</li>
              <li>Personal information</li>
              <li>Spam or promotional content</li>
              <li>Content unrelated to the actual service provided</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              All content on TaskMtaa, including but not limited to text, graphics, logos, images, and software, is the property of TaskMtaa or its licensors and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-600">
              You grant TaskMtaa a non-exclusive, worldwide, royalty-free license to use, reproduce, and display content you post on the Platform for the purposes of operating and promoting our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TASKMTAA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="text-gray-600">
              We do not guarantee the quality of services provided by Taskers and are not responsible for disputes between users. Our total liability shall not exceed the fees paid by you in the six months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
            <p className="text-gray-600">
              You agree to indemnify and hold harmless TaskMtaa, its officers, directors, employees, and agents from any claims, losses, damages, liabilities, and expenses (including legal fees) arising from your use of the Platform, your violation of these Terms, or your violation of any rights of another.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
            <p className="text-gray-600">
              These Terms shall be governed by and construed in accordance with the laws of Kenya. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of Kenya.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or platform notification. Your continued use of the Platform after such changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">
                Email: legal@taskmtaa.com<br />
                Address: Nairobi, Kenya<br />
                Phone: +254 700 000 000
              </p>
            </div>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              By using TaskMtaa, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
            <Link
              to="/register"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Accept and Continue to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
