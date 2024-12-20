import { google } from 'googleapis';
import { Credentials } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import { MicrosoftGraph } from '@microsoft/microsoft-graph-client';

export class CalendarIntegration {
  private googleAuth;
  private graphClient;
  private supabase;

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
    private config: {
      google?: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
      };
      microsoft?: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
      };
    }
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);

    if (config.google) {
      this.googleAuth = new google.auth.OAuth2(
        config.google.clientId,
        config.google.clientSecret,
        config.google.redirectUri
      );
    }
  }

  /**
   * Initialize Google Calendar integration
   */
  async initializeGoogle(userId: string): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = this.googleAuth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    // Store state for verification
    await this.supabase
      .from('calendar_integrations')
      .upsert({
        user_id: userId,
        provider: 'google',
        status: 'pending'
      });

    return authUrl;
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(
    code: string,
    userId: string
  ): Promise<void> {
    try {
      const { tokens } = await this.googleAuth.getToken(code);
      await this.storeTokens(userId, 'google', tokens);

      this.googleAuth.setCredentials(tokens);
    } catch (error) {
      console.error('Google Calendar auth failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Microsoft Calendar integration
   */
  async initializeMicrosoft(userId: string): Promise<string> {
    if (!this.config.microsoft) {
      throw new Error('Microsoft Calendar not configured');
    }

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?
      client_id=${this.config.microsoft.clientId}
      &response_type=code
      &redirect_uri=${encodeURIComponent(this.config.microsoft.redirectUri)}
      &scope=Calendars.ReadWrite offline_access`;

    await this.supabase
      .from('calendar_integrations')
      .upsert({
        user_id: userId,
        provider: 'microsoft',
        status: 'pending'
      });

    return authUrl;
  }

  /**
   * Handle Microsoft OAuth callback
   */
  async handleMicrosoftCallback(
    code: string,
    userId: string
  ): Promise<void> {
    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.microsoft!.clientId,
          client_secret: this.config.microsoft!.clientSecret,
          code,
          redirect_uri: this.config.microsoft!.redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const tokens = await response.json();
      await this.storeTokens(userId, 'microsoft', tokens);

      this.graphClient = MicrosoftGraph.Client.init({
        authProvider: done => done(null, tokens.access_token)
      });
    } catch (error) {
      console.error('Microsoft Calendar auth failed:', error);
      throw error;
    }
  }

  /**
   * Store OAuth tokens securely
   */
  private async storeTokens(
    userId: string,
    provider: 'google' | 'microsoft',
    tokens: Credentials
  ): Promise<void> {
    await this.supabase
      .from('calendar_integrations')
      .update({
        status: 'connected',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expiry_date || 3600 * 1000)).toISOString()
      })
      .match({ user_id: userId, provider });
  }

  /**
   * Sync calendar events
   */
  async syncEvents(
    userId: string,
    provider: 'google' | 'microsoft',
    options: {
      startTime?: Date;
      endTime?: Date;
    } = {}
  ): Promise<void> {
    const { data: integration } = await this.supabase
      .from('calendar_integrations')
      .select('*')
      .match({ user_id: userId, provider })
      .single();

    if (!integration || integration.status !== 'connected') {
      throw new Error(`${provider} calendar not connected`);
    }

    const events = await this.fetchEvents(provider, integration, options);
    await this.saveEvents(userId, events);
  }

  /**
   * Fetch events from calendar provider
   */
  private async fetchEvents(
    provider: 'google' | 'microsoft',
    integration: any,
    options: {
      startTime?: Date;
      endTime?: Date;
    }
  ): Promise<any[]> {
    if (provider === 'google') {
      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: options.startTime?.toISOString() || new Date().toISOString(),
        timeMax: options.endTime?.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } else {
      const response = await this.graphClient
        .api('/me/calendar/events')
        .select('subject,start,end,location,attendees')
        .filter(`start/dateTime ge '${options.startTime?.toISOString() || new Date().toISOString()}'`)
        .get();

      return response.value || [];
    }
  }

  /**
   * Save events to database
   */
  private async saveEvents(
    userId: string,
    events: any[]
  ): Promise<void> {
    const formattedEvents = events.map(event => ({
      user_id: userId,
      external_id: event.id,
      title: event.summary || event.subject,
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      location: event.location?.displayName || event.location,
      attendees: (event.attendees || []).map((a: any) => a.email),
      metadata: event
    }));

    // Use upsert to handle both new and updated events
    await this.supabase
      .from('calendar_events')
      .upsert(formattedEvents, {
        onConflict: 'external_id'
      });
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    userId: string,
    provider: 'google' | 'microsoft',
    event: {
      title: string;
      startTime: Date;
      endTime: Date;
      description?: string;
      location?: string;
      attendees?: string[];
    }
  ): Promise<void> {
    const { data: integration } = await this.supabase
      .from('calendar_integrations')
      .select('*')
      .match({ user_id: userId, provider })
      .single();

    if (!integration || integration.status !== 'connected') {
      throw new Error(`${provider} calendar not connected`);
    }

    if (provider === 'google') {
      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });
      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.title,
          description: event.description,
          location: event.location,
          start: {
            dateTime: event.startTime.toISOString()
          },
          end: {
            dateTime: event.endTime.toISOString()
          },
          attendees: event.attendees?.map(email => ({ email }))
        }
      });
    } else {
      await this.graphClient
        .api('/me/calendar/events')
        .post({
          subject: event.title,
          body: {
            content: event.description
          },
          start: {
            dateTime: event.startTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: event.endTime.toISOString(),
            timeZone: 'UTC'
          },
          location: {
            displayName: event.location
          },
          attendees: event.attendees?.map(email => ({
            emailAddress: {
              address: email
            }
          }))
        });
    }
  }
}

export default CalendarIntegration;
