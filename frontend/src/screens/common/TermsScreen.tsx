import React from 'react';
import InfoScreenLayout from './InfoScreenLayout';

export default function TermsScreen() {
  return (
    <InfoScreenLayout
      title="Terms & Conditions"
      updatedOn="January 2026"
      intro="Please read these Terms & Conditions carefully before using the Lead Manager application. By accessing or using the app, you agree to be bound by these terms."
      sections={[
        {
          heading: '1. Acceptance of Terms',
          body: 'By using Lead Manager, you confirm that you are authorized by your organization to access the platform and that you accept these terms in full. If you do not agree, you must not use the app.',
        },
        {
          heading: '2. Account & Access',
          body: 'Accounts are created and managed by your organization administrator. You are responsible for keeping your login credentials secure and for all activity that occurs under your account.',
        },
        {
          heading: '3. Acceptable Use',
          body: 'You agree to use the app only for legitimate business purposes related to lead management. You must not misuse the platform, attempt unauthorized access, or interfere with its operation.',
        },
        {
          heading: '4. Data Ownership',
          body: 'All lead and customer data entered into the app remains the property of your organization. You agree to handle this data responsibly and in accordance with applicable laws.',
        },
        {
          heading: '5. Service Availability',
          body: 'We strive to keep the service available at all times but do not guarantee uninterrupted access. Maintenance, updates, or unforeseen issues may temporarily affect availability.',
        },
        {
          heading: '6. Changes to Terms',
          body: 'We may update these terms from time to time. Continued use of the app after changes are posted constitutes acceptance of the revised terms.',
        },
        {
          heading: '7. Contact',
          body: 'For any questions regarding these Terms & Conditions, please contact your administrator or reach out via the Help & Support section.',
        },
      ]}
    />
  );
}
