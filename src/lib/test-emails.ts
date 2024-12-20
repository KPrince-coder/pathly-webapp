import { sendEmail, emailTemplates } from './emails';

export async function testEmailTemplates(testEmail: string) {
  const currentYear = new Date().getFullYear();
  
  try {
    // Test Welcome Email
    await sendEmail({
      template: emailTemplates.WELCOME,
      email: testEmail,
      data: {
        firstName: 'Test User',
        dashboardURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        docsURL: `${process.env.NEXT_PUBLIC_APP_URL}/docs`,
        tutorialsURL: `${process.env.NEXT_PUBLIC_APP_URL}/tutorials`,
        supportURL: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        communityURL: `${process.env.NEXT_PUBLIC_APP_URL}/community`,
        privacyURL: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
        termsURL: `${process.env.NEXT_PUBLIC_APP_URL}/terms`,
        currentYear,
      },
    });

    // Test Team Invitation
    await sendEmail({
      template: emailTemplates.TEAM_INVITATION,
      email: testEmail,
      data: {
        inviterName: 'Test Inviter',
        teamName: 'Test Team',
        teamDescription: 'This is a test team for template verification',
        teamMembers: 5,
        teamInitials: 'TT',
        acceptURL: `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept/test-id`,
        declineURL: `${process.env.NEXT_PUBLIC_APP_URL}/invite/decline/test-id`,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        currentYear,
      },
    });

    // Test Authentication Email
    await sendEmail({
      template: emailTemplates.AUTHENTICATION,
      email: testEmail,
      data: {
        LogoURL: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
        DeviceType: 'Chrome on Windows',
        Location: 'San Francisco, CA',
        Timestamp: new Date().toLocaleString(),
        IPAddress: '192.168.1.1',
        AuthenticationURL: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify/test-token`,
        PrivacyURL: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
        TermsURL: `${process.env.NEXT_PUBLIC_APP_URL}/terms`,
        currentYear,
      },
    });

    // Test Reauthentication Email
    await sendEmail({
      template: emailTemplates.REAUTHENTICATION,
      email: testEmail,
      data: {
        LogoURL: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
        Email: testEmail,
        DeviceType: 'Chrome on Windows',
        Location: 'San Francisco, CA',
        LastActive: '2 hours ago',
        ReauthURL: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reauth/test-token`,
        LogoutURL: `${process.env.NEXT_PUBLIC_APP_URL}/auth/logout`,
        PrivacyURL: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
        TermsURL: `${process.env.NEXT_PUBLIC_APP_URL}/terms`,
        currentYear,
      },
    });

    console.log('Test emails sent successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error testing emails:', error);
    return { success: false, error };
  }
}
