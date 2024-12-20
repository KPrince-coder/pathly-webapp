import { createHash } from 'crypto';

export class BreachMonitor {
  private static readonly HIBP_API_URL = 'https://api.haveibeenpwned.com/v3';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private apiKey: string,
    private supabase: any
  ) {}

  /**
   * Checks if a password has been exposed in known data breaches
   */
  async checkPassword(password: string): Promise<{
    breached: boolean;
    count?: number;
  }> {
    try {
      // Create SHA-1 hash of password
      const hash = createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();

      // Use k-Anonymity model: only send first 5 chars of hash
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);

      // Query the HIBP API
      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        {
          headers: {
            'User-Agent': 'PathlyWebApp-BreachMonitor',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Password breach check failed');
      }

      // Parse response
      const text = await response.text();
      const hashes = text.split('\n');
      
      // Look for our hash suffix
      const match = hashes.find(h => 
        h.split(':')[0].toUpperCase() === suffix
      );

      if (match) {
        const count = parseInt(match.split(':')[1]);
        return { breached: true, count };
      }

      return { breached: false };

    } catch (error) {
      console.error('Password breach check failed:', error);
      throw error;
    }
  }

  /**
   * Monitors an email address for appearances in data breaches
   */
  async monitorEmail(email: string): Promise<void> {
    try {
      // Add email to monitoring list
      const { error } = await this.supabase
        .from('monitored_emails')
        .upsert({
          email,
          last_checked: new Date().toISOString()
        });

      if (error) throw error;

      // Perform initial breach check
      await this.checkEmail(email);

    } catch (error) {
      console.error('Email monitoring setup failed:', error);
      throw error;
    }
  }

  /**
   * Checks if an email appears in known data breaches
   */
  async checkEmail(email: string): Promise<{
    breached: boolean;
    breaches?: any[];
  }> {
    try {
      // Check cache first
      const { data: cached } = await this.supabase
        .from('breach_checks')
        .select('*')
        .eq('email', email)
        .single();

      if (cached && Date.now() - new Date(cached.checked_at).getTime() < BreachMonitor.CACHE_DURATION) {
        return {
          breached: cached.breached,
          breaches: cached.breaches
        };
      }

      // Query HIBP API
      const response = await fetch(
        `${BreachMonitor.HIBP_API_URL}/breachedaccount/${encodeURIComponent(email)}`,
        {
          headers: {
            'hibp-api-key': this.apiKey,
            'User-Agent': 'PathlyWebApp-BreachMonitor'
          }
        }
      );

      if (response.status === 404) {
        // Email not found in any breaches
        await this.updateBreachCheck(email, false);
        return { breached: false };
      }

      if (!response.ok) {
        throw new Error('Email breach check failed');
      }

      const breaches = await response.json();

      // Update cache
      await this.updateBreachCheck(email, true, breaches);

      // Create security events for new breaches
      await this.createBreachEvents(email, breaches);

      return {
        breached: true,
        breaches
      };

    } catch (error) {
      console.error('Email breach check failed:', error);
      throw error;
    }
  }

  /**
   * Updates the breach check cache
   */
  private async updateBreachCheck(
    email: string,
    breached: boolean,
    breaches?: any[]
  ): Promise<void> {
    const { error } = await this.supabase
      .from('breach_checks')
      .upsert({
        email,
        breached,
        breaches,
        checked_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Creates security events for new breaches
   */
  private async createBreachEvents(
    email: string,
    breaches: any[]
  ): Promise<void> {
    // Get existing breach events
    const { data: existing } = await this.supabase
      .from('security_events')
      .select('details->breach_name')
      .eq('event_type', 'data_breach')
      .eq('details->email', email);

    const existingBreaches = new Set(
      existing?.map(e => e.details.breach_name) || []
    );

    // Create events for new breaches
    for (const breach of breaches) {
      if (!existingBreaches.has(breach.Name)) {
        await this.supabase
          .from('security_events')
          .insert({
            event_type: 'data_breach',
            severity: 'high',
            details: {
              email,
              breach_name: breach.Name,
              breach_date: breach.BreachDate,
              compromised_data: breach.DataClasses,
              description: breach.Description
            }
          });
      }
    }
  }

  /**
   * Starts continuous monitoring of all registered emails
   */
  async startMonitoring(intervalMinutes: number = 60): Promise<void> {
    setInterval(async () => {
      try {
        // Get all monitored emails
        const { data: emails } = await this.supabase
          .from('monitored_emails')
          .select('email');

        if (!emails) return;

        // Check each email
        for (const { email } of emails) {
          await this.checkEmail(email);
        }
      } catch (error) {
        console.error('Breach monitoring cycle failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

export default BreachMonitor;
