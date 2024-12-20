import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const emailTemplates = {
  CONFIRMATION: 'confirmation',
  WELCOME: 'welcome',
  MAGIC_LINK: 'magic-link',
  PASSWORD_RESET: 'password-reset',
  TEAM_INVITATION: 'team-invitation',
  AUTHENTICATION: 'authentication',
  REAUTHENTICATION: 'reauthentication',
} as const;

export type EmailTemplate = typeof emailTemplates[keyof typeof emailTemplates];

interface SendEmailProps {
  template: EmailTemplate;
  email: string;
  data?: Record<string, any>;
}

export async function sendEmail({ template, email, data }: SendEmailProps) {
  try {
    const { error } = await supabase.auth.admin.sendEmail(email, {
      template,
      subject: getSubjectForTemplate(template),
      data,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

function getSubjectForTemplate(template: EmailTemplate): string {
  switch (template) {
    case emailTemplates.CONFIRMATION:
      return 'Confirm your email address';
    case emailTemplates.WELCOME:
      return 'Welcome to Pathly! 🎉';
    case emailTemplates.MAGIC_LINK:
      return 'Your magic link to sign in';
    case emailTemplates.PASSWORD_RESET:
      return 'Reset your password';
    case emailTemplates.TEAM_INVITATION:
      return 'You\'ve been invited to join a team on Pathly';
    case emailTemplates.AUTHENTICATION:
      return 'Verify your login attempt';
    case emailTemplates.REAUTHENTICATION:
      return 'Action required: Reauthenticate your session';
    default:
      return 'Pathly Notification';
  }
}
