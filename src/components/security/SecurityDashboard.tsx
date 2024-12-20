'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import {
  FiShield,
  FiAlertTriangle,
  FiLock,
  FiKey,
  FiActivity,
  FiRefreshCw
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface SecurityMetric {
  category: string;
  score: number;
  maxScore: number;
  issues: string[];
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  created_at: string;
}

const SecurityDashboard: React.FC = () => {
  const supabase = useSupabase();
  const [overallScore, setOverallScore] = useState<number>(0);
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [historicalScores, setHistoricalScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setIsLoading(true);
    try {
      // Fetch security metrics
      await Promise.all([
        fetchMetrics(),
        fetchRecentEvents(),
        fetchHistoricalScores()
      ]);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    const metrics: SecurityMetric[] = [
      await evaluateAuthenticationSecurity(),
      await evaluateEncryptionSecurity(),
      await evaluateBackupSecurity(),
      await evaluateAccessControlSecurity()
    ];

    setMetrics(metrics);
    
    // Calculate overall score
    const totalScore = metrics.reduce((sum, metric) => sum + metric.score, 0);
    const totalMaxScore = metrics.reduce((sum, metric) => sum + metric.maxScore, 0);
    setOverallScore(Math.round((totalScore / totalMaxScore) * 100));
  };

  const evaluateAuthenticationSecurity = async (): Promise<SecurityMetric> => {
    const { data: profile } = await supabase.auth.getUser();
    const issues: string[] = [];
    let score = 0;
    const maxScore = 25;

    if (profile) {
      // Check 2FA
      if (profile.user?.factors?.length) score += 10;
      else issues.push('Two-factor authentication is not enabled');

      // Check biometric
      const { data: biometric } = await supabase
        .from('profiles')
        .select('biometric_enabled')
        .single();

      if (biometric?.biometric_enabled) score += 10;
      else issues.push('Biometric authentication is not enabled');

      // Check password strength
      const { data: pwdStrength } = await supabase
        .rpc('check_password_strength');
      
      if (pwdStrength >= 80) score += 5;
      else issues.push('Password strength could be improved');
    }

    return {
      category: 'Authentication',
      score,
      maxScore,
      issues
    };
  };

  const evaluateEncryptionSecurity = async (): Promise<SecurityMetric> => {
    const issues: string[] = [];
    let score = 0;
    const maxScore = 25;

    // Check if zero-knowledge encryption is enabled
    const { data: encryption } = await supabase
      .from('encryption_settings')
      .select('*')
      .single();

    if (encryption?.zero_knowledge_enabled) score += 15;
    else issues.push('Zero-knowledge encryption is not enabled');

    // Check encryption key rotation
    if (encryption?.last_key_rotation) {
      const daysSinceRotation = (Date.now() - new Date(encryption.last_key_rotation).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRotation <= 90) score += 10;
      else issues.push('Encryption keys should be rotated every 90 days');
    }

    return {
      category: 'Encryption',
      score,
      maxScore,
      issues
    };
  };

  const evaluateBackupSecurity = async (): Promise<SecurityMetric> => {
    const issues: string[] = [];
    let score = 0;
    const maxScore = 25;

    // Check backup frequency
    const { data: backups } = await supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (backups?.length) {
      const lastBackup = new Date(backups[0].created_at);
      const daysSinceBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceBackup <= 1) score += 15;
      else if (daysSinceBackup <= 7) score += 10;
      else issues.push('Regular backups are recommended');
    } else {
      issues.push('No backups found');
    }

    // Check backup encryption
    const { data: backupConfig } = await supabase
      .from('backup_settings')
      .select('*')
      .single();

    if (backupConfig?.encryption_enabled) score += 10;
    else issues.push('Backup encryption is not enabled');

    return {
      category: 'Backup',
      score,
      maxScore,
      issues
    };
  };

  const evaluateAccessControlSecurity = async (): Promise<SecurityMetric> => {
    const issues: string[] = [];
    let score = 0;
    const maxScore = 25;

    // Check role-based access control
    const { data: rbacEnabled } = await supabase
      .from('workspace_settings')
      .select('rbac_enabled')
      .single();

    if (rbacEnabled?.rbac_enabled) score += 10;
    else issues.push('Role-based access control is not enabled');

    // Check session management
    const { data: sessions } = await supabase
      .from('active_sessions')
      .select('*');

    if (sessions) {
      const suspiciousSessions = sessions.filter(session => 
        session.ip_address_changed || session.unusual_activity
      );

      if (suspiciousSessions.length === 0) score += 15;
      else issues.push('Suspicious session activity detected');
    }

    return {
      category: 'Access Control',
      score,
      maxScore,
      issues
    };
  };

  const fetchRecentEvents = async () => {
    const { data } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setRecentEvents(data);
  };

  const fetchHistoricalScores = async () => {
    const { data } = await supabase
      .from('security_scores')
      .select('score, recorded_at')
      .order('recorded_at', { ascending: true })
      .limit(30);

    if (data) {
      setHistoricalScores(data.map(item => ({
        date: new Date(item.recorded_at).toLocaleDateString(),
        score: item.score
      })));
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="animate-spin text-blue-500 text-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Overall Score */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Security Score</h1>
        <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
          {overallScore}
        </div>
      </div>

      {/* Score History Chart */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Score History</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalScores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3B82F6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{metric.category}</h3>
              <span className={`text-2xl font-bold ${
                getScoreColor((metric.score / metric.maxScore) * 100)
              }`}>
                {metric.score}/{metric.maxScore}
              </span>
            </div>
            {metric.issues.length > 0 && (
              <ul className="text-sm text-gray-600 space-y-2">
                {metric.issues.map((issue, i) => (
                  <li key={i} className="flex items-center">
                    <FiAlertTriangle className="text-yellow-500 mr-2" />
                    {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Recent Security Events */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Security Events</h2>
        <div className="space-y-4">
          {recentEvents.map(event => (
            <div
              key={event.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded"
            >
              <div className="flex items-center">
                <span className={`mr-3 ${getSeverityColor(event.severity)}`}>
                  <FiActivity className="text-xl" />
                </span>
                <div>
                  <div className="font-medium">{event.event_type}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <span className={`text-sm font-medium ${getSeverityColor(event.severity)}`}>
                {event.severity.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
