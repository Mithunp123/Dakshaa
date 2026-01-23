import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Lock, FileText, Hotel, Utensils } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <FileText className="w-12 h-12 text-blue-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Terms & Conditions
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Please read these terms carefully before proceeding with your registration, payment, or booking
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last Updated: January 2026 | Effective Date: January 23, 2026
          </p>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Introduction */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 md:p-8"
          >
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Welcome to DaKshaa T26. These Terms and Conditions constitute a legally binding agreement between you (the "User," "Participant," or "you") and DaKshaa T26, organized by KSRCT Students (the "Organizer," "we," "us," or "our"). By accessing our platform, registering for events, making payments, or booking accommodation and dining services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions in their entirety.
              </p>
              <p>
                If you do not agree with any part of these terms, you must not proceed with registration, payment, or use of our services. Your continued use of our services following any modifications to these terms constitutes your acceptance of such changes. We reserve the right to modify these terms at any time without prior notice, and it is your responsibility to review them periodically.
              </p>
            </div>
          </motion.section>

          {/* No Refund Policy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-red-400 mb-4">Strict No Refund Policy</h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    All registration fees, accommodation charges, dining bookings, and any other payments made through our platform are strictly non-refundable and non-transferable under any circumstances whatsoever. This policy applies without exception, regardless of the reason for cancellation, including but not limited to personal emergencies, medical conditions, travel restrictions, schedule conflicts, change of plans, or any force majeure events.
                  </p>
                  <p>
                    Once a payment transaction is successfully completed and confirmed, it is considered final and cannot be reversed, refunded, or credited to another event or participant. We strongly advise you to carefully review your selections, verify all details, and ensure your commitment before proceeding with any payment. By completing the payment process, you explicitly acknowledge and accept this no refund policy and waive any right to claim a refund or chargeback through any payment method or financial institution.
                  </p>
                  <p>
                    This policy is implemented to ensure fair allocation of limited resources, maintain event capacity management, and cover non-recoverable costs associated with your registration and bookings. No exceptions will be made to this policy, and all refund requests, regardless of circumstances, will be declined.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Payment Terms */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Payment Processing and Verification</h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    All payments are processed through our secure third-party payment gateway. The exact registration amount, accommodation fee, or dining charge will be displayed on the payment screen. You are strictly prohibited from modifying, tampering with, or attempting to alter the payment amount at any stage of the transaction. Our system automatically verifies the payment amount received against the amount due, and any discrepancy will result in immediate rejection of your registration or booking.
                  </p>
                  <p>
                    If you intentionally or unintentionally modify the payment amount during the transaction process, your registration will be automatically canceled without any prior notice or opportunity for correction. The amount you paid, even if incorrect, will not be refunded under any circumstances. You will be required to complete a new registration with the correct payment amount if you wish to participate. We implement strict verification protocols to maintain the integrity of our payment system and prevent fraudulent transactions.
                  </p>
                  <p>
                    You are solely responsible for ensuring that you have sufficient funds in your payment account, that your payment method is valid and authorized for online transactions, and that all payment information entered is accurate and complete. Payment failures due to insufficient funds, expired cards, incorrect CVV, network timeouts, bank declines, or any technical issues on your end are entirely your responsibility. We are not liable for any failed transactions, duplicate charges resulting from multiple payment attempts, or any fees imposed by your bank or payment provider.
                  </p>
                  <p>
                    Each payment session is valid for fifteen (15) minutes from initiation. If payment is not completed within this timeframe, your session will automatically expire, and you will need to restart the registration process. We do not hold or reserve spots during incomplete payment sessions. All payments must be completed in Indian Rupees (INR) only, and currency conversion charges, if any, are borne by you.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Accommodation & Dining */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <div className="flex gap-2">
                <Hotel className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
                <Utensils className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-orange-400 mb-4">Accommodation & Dining Services</h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    Accommodation and dining services are provided as supplementary conveniences to enhance your experience during the event. These services are subject to availability and provided on an "as-is" basis. By booking these services, you acknowledge that all accommodation and dining payments are non-refundable and non-transferable, regardless of whether you utilize the services or not.
                  </p>
                  <p>
                    You are solely and entirely responsible for all aspects of your stay, including but not limited to your personal safety, health, belongings, conduct, and compliance with facility rules. We act merely as facilitators connecting you with accommodation and dining providers, and we do not own, operate, or manage these facilities. Therefore, we bear no liability whatsoever for the quality, safety, cleanliness, or suitability of accommodation or food provided.
                  </p>
                  <p>
                    In the unfortunate event of food poisoning, allergic reactions, foodborne illnesses, or any adverse health effects resulting from consumption of food provided during your stay, you acknowledge that this is entirely at your own risk. We are not responsible for any medical expenses, treatments, or consequences arising from such incidents. You are strongly advised to inform us in advance of any dietary restrictions, allergies, or medical conditions, though we cannot guarantee accommodation of all special dietary requirements.
                  </p>
                  <p>
                    You are fully responsible for your conduct and behavior during your accommodation stay. Any damage to property, disturbance to other guests, violation of facility rules, involvement in illegal activities, consumption of prohibited substances, or any form of misconduct will result in immediate termination of your accommodation privileges without refund. You may also be held financially liable for any damages caused and may face legal action as deemed appropriate.
                  </p>
                  <p>
                    We strongly recommend that you obtain comprehensive travel and health insurance covering your entire stay. You acknowledge that you participate in all accommodation and dining services at your own risk and voluntarily assume all risks associated with such participation. You agree to indemnify and hold harmless DaKshaa T26, its organizers, partners, and affiliated entities from any claims, damages, losses, or expenses arising from your use of accommodation and dining services.
                  </p>
                  <p>
                    Payment issues related to accommodation and dining bookings, including but not limited to failed transactions, processing delays, or payment gateway errors, are entirely your responsibility to resolve. We are not obligated to hold your booking pending payment resolution. Check-in procedures, identification requirements, and facility-specific rules must be strictly adhered to, and non-compliance may result in denial of services without refund.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Registration Terms */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <FileText className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-blue-400 mb-4">Event Registration and Participation</h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    Registration for events is open to all eligible participants subject to capacity limits and registration deadlines. By registering, you confirm that all information provided is true, accurate, current, and complete to the best of your knowledge. Providing false, misleading, or inaccurate information may result in immediate cancellation of your registration without refund and potential prohibition from future events.
                  </p>
                  <p>
                    For team-based events, the team leader is responsible for ensuring all team member information is accurate and that all members are aware of and agree to these terms. Team composition must be finalized before payment, and changes to team membership after payment may not be possible or may incur administrative restrictions. All team members must be registered and payment must be completed before the team is considered officially enrolled.
                  </p>
                  <p>
                    Your registration confirmation email contains critical information including your unique QR code, event schedule, venue details, and participation instructions. It is your responsibility to retain this email and present the QR code for event check-in. Lost, deleted, or inaccessible QR codes may result in denial of entry, and we are not obligated to provide replacements, though we may attempt to assist at our discretion.
                  </p>
                  <p>
                    Event schedules, venues, formats, rules, and other details are subject to change at the organizer's discretion without prior notice. While we strive to minimize changes and inform participants promptly, we cannot guarantee that all information will remain unchanged. It is your responsibility to check for updates regularly through official communication channels. We are not liable for any inconvenience, costs, or losses incurred due to such changes.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Liability & Conduct */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-purple-400 mb-4">Limitation of Liability and Participant Conduct</h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    You acknowledge and agree that participation in DaKshaa T26 events, use of facilities, accommodation, and all related activities are entirely at your own risk. To the maximum extent permitted by law, DaKshaa T26, its organizers, staff, volunteers, sponsors, partners, and affiliated entities shall not be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages arising from your participation, including but not limited to personal injury, property damage, financial loss, or emotional distress.
                  </p>
                  <p>
                    You are expected to conduct yourself in a professional, respectful, and law-abiding manner at all times during the event. Any form of harassment, discrimination, violence, theft, vandalism, substance abuse, or behavior that disrupts the event or violates applicable laws will result in immediate expulsion without refund and may be reported to appropriate authorities. You are personally liable for any damages or injuries caused by your actions or negligence.
                  </p>
                  <p>
                    By participating, you grant DaKshaa T26 the irrevocable right to use photographs, videos, audio recordings, or any other media captured during the event featuring your likeness for promotional, educational, or documentary purposes without compensation. If you do not wish to be photographed or recorded, you must inform event staff and avoid areas where media capture is occurring.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Data & Privacy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <Lock className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-green-400 mb-4">Data Protection and Privacy</h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    We are committed to protecting your personal information in accordance with applicable data protection laws and regulations. Personal information collected during registration includes your name, email address, phone number, college name, and payment transaction details. This information is used exclusively for event management, communication, registration verification, and improving our services.
                  </p>
                  <p>
                    All payment transactions are processed through certified third-party payment gateways that comply with industry security standards including PCI DSS. We do not store or have access to your complete credit card numbers, CVV codes, or banking passwords. Payment information is encrypted during transmission and handled by the payment provider according to their security policies.
                  </p>
                  <p>
                    Your personal information will not be sold, rented, or shared with third parties for marketing purposes without your explicit consent. However, we may share necessary information with service providers, accommodation facilities, event partners, or authorities when required for service delivery or legal compliance. By using our services, you consent to such data processing and transfers as necessary for event operations.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Force Majeure */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 md:p-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Force Majeure and Event Cancellation</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  DaKshaa T26 reserves the right to cancel, postpone, or modify the event due to circumstances beyond reasonable control, including but not limited to natural disasters, pandemics, government restrictions, public health emergencies, acts of terrorism, civil unrest, venue unavailability, or any other force majeure events. In such cases, we will make reasonable efforts to notify registered participants through email or other available communication channels.
                </p>
                <p>
                  If the event is canceled entirely due to force majeure, we will endeavor to process refunds or offer transfers to a rescheduled event, subject to recovery of costs already incurred and at the sole discretion of the organizers. However, we are not liable for any travel expenses, accommodation costs booked independently, or any indirect losses incurred by participants. If the event is postponed or modified, no refunds will be provided, and participants may choose to attend the rescheduled event or forfeit their registration.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Intellectual Property */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 md:p-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property Rights</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  All content on the DaKshaa T26 platform, including but not limited to text, graphics, logos, images, videos, software, and compilations, is the property of DaKshaa T26 or its content suppliers and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works, publicly display, or exploit any content without express written permission from the copyright owner.
                </p>
                <p>
                  The DaKshaa name, logo, and all related marks are trademarks of KSRCT Students. Unauthorized use of these marks is strictly prohibited and may constitute trademark infringement. Any projects, code, designs, or creative works submitted or developed during hackathons or competitions remain the intellectual property of the creators, but by participating, you grant DaKshaa T26 a non-exclusive license to showcase and promote such works for event-related purposes.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Governing Law */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 md:p-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Governing Law and Dispute Resolution</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  These Terms and Conditions shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes, controversies, or claims arising out of or relating to these terms, your registration, participation, or use of our services shall be subject to the exclusive jurisdiction of the courts located in Tamil Nadu, India.
                </p>
                <p>
                  Before initiating any legal proceedings, parties agree to attempt resolution through good faith negotiations. If a dispute cannot be resolved amicably within thirty (30) days, either party may pursue legal remedies. You agree to waive any right to trial by jury and to participate in class action lawsuits. Each party shall bear its own costs and legal fees unless otherwise determined by a court of competent jurisdiction.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Contact & Acceptance */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6 md:p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              If you have any questions, concerns, or require clarification regarding these Terms and Conditions, or if you need assistance with registration, payment, or accommodation, please contact us through the following channels:
            </p>
            <div className="space-y-2 text-blue-400 mb-6">
              <p><strong>Email:</strong> <a href="mailto:dakshaa@ksrct.ac.in" className="hover:underline">dakshaa@ksrct.ac.in</a></p>
              <p><strong>Website:</strong> <a href="/" className="hover:underline">www.dakshaa.com</a></p>
              <p><strong>Organization:</strong> KSRCT Students, Tamil Nadu, India</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <p className="text-gray-300 text-lg leading-relaxed">
                <strong className="text-white">By clicking "Accept" or by proceeding with registration, payment, or booking,</strong> you acknowledge that you have read, understood, and agree to be legally bound by these Terms and Conditions in their entirety. You confirm that you are of legal age to enter into this agreement and have the authority to do so. If you are registering on behalf of an organization or institution, you represent that you have the authority to bind that entity to these terms.
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
