import React from 'react';
import InfoScreenLayout from './InfoScreenLayout';

export default function PrivacyScreen() {
  return (
    <InfoScreenLayout
      title="Privacy Policy"
      updatedOn="January 2026"
      intro="This Privacy Policy explains how Lead Manager collects, uses, and protects information when you use the application."
      sections={[
        {
          heading: '1. Information We Collect',
          body: 'We collect account details (name, email, phone) provided by your organization, and the lead/customer data you enter while using the app. We also collect basic usage and device information to improve reliability.',
        },
        {
          heading: '2. How We Use Information',
          body: 'Information is used to operate the platform, authenticate users, assign and track leads, send notifications, and provide support. We do not sell your personal information.',
        },
        {
          heading: '3. Data Security',
          body: 'Passwords are encrypted and never stored in plain text. Access is protected using secure tokens. We apply reasonable technical and organizational measures to safeguard your data.',
        },
        {
          heading: '4. Data Sharing',
          body: 'Your data is only accessible to authorized members of your organization. We do not share personal data with third parties except as required to operate the service or comply with the law.',
        },
        {
          heading: '5. Data Retention',
          body: 'We retain data for as long as your account is active or as needed to provide the service. Your organization may request deletion of data in accordance with applicable regulations.',
        },
        {
          heading: '6. Your Rights',
          body: 'You may request access to, correction of, or deletion of your personal information by contacting your administrator or our support team.',
        },
        {
          heading: '7. Contact',
          body: 'For privacy-related questions, please reach out via the Help & Support section in the app.',
        },
      ]}
    />
  );
}
