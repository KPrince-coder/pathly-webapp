import { createClient } from '@supabase/supabase-js';
import { CalendarIntegration } from '../integrations/calendar';
import { EmailIntegration } from '../integrations/email';
import { ApiIntegration } from '../integrations/api';

interface Condition {
  type: 'event' | 'schedule' | 'trigger';
  config: {
    eventType?: string;
    schedule?: string;
    triggerType?: string;
    parameters?: Record<string, any>;
  };
}

interface Action {
  type: 'api' | 'email' | 'calendar' | 'notification';
  config: {
    integration?: string;
    endpoint?: string;
    parameters?: Record<string, any>;
    template?: string;
  };
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: Condition[];
  actions: Action[];
  userId: string;
}

export class AutomationRules {
  private supabase;
  private rules: Map<string, AutomationRule> = new Map();
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
    private integrations: {
      calendar?: CalendarIntegration;
      email?: EmailIntegration;
      api?: ApiIntegration;
    }
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Initialize automation rules
   */
  async initialize(userId: string): Promise<void> {
    try {
      // Load rules from database
      const { data: rules } = await this.supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (rules) {
        rules.forEach(rule => {
          this.rules.set(rule.id, rule);
          if (this.hasScheduledCondition(rule)) {
            this.scheduleRule(rule);
          }
        });
      }

      // Subscribe to real-time events
      this.supabase
        .channel('automation_events')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          payload => this.handleDatabaseEvent(payload)
        )
        .subscribe();

    } catch (error) {
      console.error('Automation rules initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new automation rule
   */
  async createRule(rule: Omit<AutomationRule, 'id'>): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('automation_rules')
        .insert({
          name: rule.name,
          description: rule.description,
          enabled: rule.enabled,
          conditions: rule.conditions,
          actions: rule.actions,
          user_id: rule.userId
        })
        .select()
        .single();

      if (error) throw error;

      const newRule = data as AutomationRule;
      this.rules.set(newRule.id, newRule);

      if (this.hasScheduledCondition(newRule)) {
        this.scheduleRule(newRule);
      }

      return newRule.id;

    } catch (error) {
      console.error('Rule creation failed:', error);
      throw error;
    }
  }

  /**
   * Update an existing automation rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<AutomationRule>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('automation_rules')
        .update(updates)
        .eq('id', ruleId);

      if (error) throw error;

      const rule = this.rules.get(ruleId);
      if (rule) {
        const updatedRule = { ...rule, ...updates };
        this.rules.set(ruleId, updatedRule);

        // Update scheduling if needed
        if (this.hasScheduledCondition(updatedRule)) {
          this.unscheduleRule(ruleId);
          this.scheduleRule(updatedRule);
        }
      }

    } catch (error) {
      console.error('Rule update failed:', error);
      throw error;
    }
  }

  /**
   * Delete an automation rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      this.unscheduleRule(ruleId);
      this.rules.delete(ruleId);

    } catch (error) {
      console.error('Rule deletion failed:', error);
      throw error;
    }
  }

  /**
   * Handle database events
   */
  private async handleDatabaseEvent(payload: any): Promise<void> {
    const relevantRules = Array.from(this.rules.values())
      .filter(rule => this.matchesEventCondition(rule, payload));

    for (const rule of relevantRules) {
      await this.executeRule(rule, { event: payload });
    }
  }

  /**
   * Check if a rule has scheduled conditions
   */
  private hasScheduledCondition(rule: AutomationRule): boolean {
    return rule.conditions.some(
      condition => condition.type === 'schedule'
    );
  }

  /**
   * Schedule a rule for execution
   */
  private scheduleRule(rule: AutomationRule): void {
    const scheduleConditions = rule.conditions
      .filter(condition => condition.type === 'schedule');

    for (const condition of scheduleConditions) {
      const interval = this.parseSchedule(condition.config.schedule!);
      const task = setInterval(
        () => this.executeRule(rule, { schedule: condition.config }),
        interval
      );

      this.scheduledTasks.set(`${rule.id}-${condition.config.schedule}`, task);
    }
  }

  /**
   * Unschedule a rule
   */
  private unscheduleRule(ruleId: string): void {
    for (const [key, task] of this.scheduledTasks.entries()) {
      if (key.startsWith(ruleId)) {
        clearInterval(task);
        this.scheduledTasks.delete(key);
      }
    }
  }

  /**
   * Parse schedule string to milliseconds
   */
  private parseSchedule(schedule: string): number {
    const [value, unit] = schedule.split(' ');
    const num = parseInt(value);

    switch (unit) {
      case 'minutes':
        return num * 60 * 1000;
      case 'hours':
        return num * 60 * 60 * 1000;
      case 'days':
        return num * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000; // Default to 1 hour
    }
  }

  /**
   * Check if an event matches rule conditions
   */
  private matchesEventCondition(
    rule: AutomationRule,
    event: any
  ): boolean {
    return rule.conditions.some(condition => {
      if (condition.type !== 'event') return false;

      const { eventType, parameters } = condition.config;
      if (event.type !== eventType) return false;

      if (parameters) {
        return Object.entries(parameters).every(([key, value]) => {
          return event[key] === value;
        });
      }

      return true;
    });
  }

  /**
   * Execute a rule's actions
   */
  private async executeRule(
    rule: AutomationRule,
    context: Record<string, any>
  ): Promise<void> {
    try {
      for (const action of rule.actions) {
        await this.executeAction(rule.userId, action, context);
      }

      // Log rule execution
      await this.supabase
        .from('automation_logs')
        .insert({
          rule_id: rule.id,
          user_id: rule.userId,
          status: 'success',
          context
        });

    } catch (error) {
      console.error('Rule execution failed:', error);
      
      // Log failure
      await this.supabase
        .from('automation_logs')
        .insert({
          rule_id: rule.id,
          user_id: rule.userId,
          status: 'error',
          error: error.message,
          context
        });
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    userId: string,
    action: Action,
    context: Record<string, any>
  ): Promise<void> {
    switch (action.type) {
      case 'api':
        if (!this.integrations.api) {
          throw new Error('API integration not configured');
        }
        await this.integrations.api.call(
          userId,
          action.config.integration!,
          action.config.endpoint!,
          this.interpolateParameters(action.config.parameters!, context)
        );
        break;

      case 'email':
        if (!this.integrations.email) {
          throw new Error('Email integration not configured');
        }
        const emailContent = this.interpolateTemplate(
          action.config.template!,
          context
        );
        await this.integrations.email.sendEmail(userId, {
          to: action.config.parameters!.to,
          subject: action.config.parameters!.subject,
          content: emailContent
        });
        break;

      case 'calendar':
        if (!this.integrations.calendar) {
          throw new Error('Calendar integration not configured');
        }
        await this.integrations.calendar.createEvent(
          userId,
          action.config.integration!,
          this.interpolateParameters(action.config.parameters!, context)
        );
        break;

      case 'notification':
        await this.supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: this.interpolateTemplate(
              action.config.parameters!.title,
              context
            ),
            message: this.interpolateTemplate(
              action.config.parameters!.message,
              context
            ),
            type: 'automation'
          });
        break;
    }
  }

  /**
   * Interpolate parameters with context values
   */
  private interpolateParameters(
    parameters: Record<string, any>,
    context: Record<string, any>
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateTemplate(value, context);
      } else if (typeof value === 'object') {
        result[key] = this.interpolateParameters(value, context);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Interpolate template string with context values
   */
  private interpolateTemplate(
    template: string,
    context: Record<string, any>
  ): string {
    return template.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      const value = path.trim().split('.').reduce(
        (obj: any, key: string) => obj?.[key],
        context
      );
      return value?.toString() || match;
    });
  }
}

export default AutomationRules;
