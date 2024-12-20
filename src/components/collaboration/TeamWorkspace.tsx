'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import RealTimeEditor from './RealTimeEditor';
import { FiUsers, FiFolder, FiPlus, FiSettings } from 'react-icons/fi';

interface TeamMember {
  id: string;
  name: string;
  avatar_url: string;
  role: 'admin' | 'member';
  status: 'online' | 'offline' | 'away';
}

interface Document {
  id: string;
  title: string;
  last_modified: string;
  created_by: string;
}

const TeamWorkspace: React.FC<{ workspaceId: string }> = ({ workspaceId }) => {
  const supabase = useSupabaseClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      setLoading(true);
      try {
        // Fetch team members
        const { data: membersData } = await supabase
          .from('workspace_members')
          .select('*, profiles(*)')
          .eq('workspace_id', workspaceId);

        // Fetch documents
        const { data: docsData } = await supabase
          .from('workspace_documents')
          .select('*')
          .eq('workspace_id', workspaceId);

        if (membersData) setMembers(membersData.map(m => ({
          id: m.profiles.id,
          name: m.profiles.name,
          avatar_url: m.profiles.avatar_url,
          role: m.role,
          status: m.status
        })));

        if (docsData) setDocuments(docsData);
      } catch (error) {
        console.error('Error fetching workspace data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();

    // Set up real-time subscriptions
    const membersSubscription = supabase
      .channel('workspace_members')
      .on('presence', { event: 'sync' }, () => {
        // Update members' online status
        const presenceState = supabase.channel('workspace_members').presenceState();
        updateMembersStatus(presenceState);
      })
      .subscribe();

    const documentsSubscription = supabase
      .channel('workspace_documents')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_documents',
        filter: `workspace_id=eq.${workspaceId}`
      }, payload => {
        // Update documents list
        handleDocumentChange(payload);
      })
      .subscribe();

    return () => {
      membersSubscription.unsubscribe();
      documentsSubscription.unsubscribe();
    };
  }, [workspaceId, supabase]);

  const updateMembersStatus = (presenceState: any) => {
    setMembers(prev => prev.map(member => ({
      ...member,
      status: presenceState[member.id] ? 'online' : 'offline'
    })));
  };

  const handleDocumentChange = (payload: any) => {
    const { eventType, new: newDoc, old: oldDoc } = payload;
    
    setDocuments(prev => {
      switch (eventType) {
        case 'INSERT':
          return [...prev, newDoc];
        case 'UPDATE':
          return prev.map(doc => doc.id === newDoc.id ? newDoc : doc);
        case 'DELETE':
          return prev.filter(doc => doc.id !== oldDoc.id);
        default:
          return prev;
      }
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading workspace...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r p-4">
        {/* Team Members */}
        <div className="mb-6">
          <h3 className="flex items-center text-sm font-semibold text-gray-600 mb-2">
            <FiUsers className="mr-2" />
            Team Members
          </h3>
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center">
                <div className="relative">
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
                    member.status === 'online' ? 'bg-green-400' :
                    member.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                  }`} />
                </div>
                <span className="ml-2 text-sm">{member.name}</span>
                {member.role === 'admin' && (
                  <span className="ml-auto text-xs text-gray-500">Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div>
          <h3 className="flex items-center text-sm font-semibold text-gray-600 mb-2">
            <FiFolder className="mr-2" />
            Documents
          </h3>
          <button className="flex items-center text-sm text-blue-600 mb-2">
            <FiPlus className="mr-1" />
            New Document
          </button>
          <div className="space-y-1">
            {documents.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc.id)}
                className={`w-full text-left px-2 py-1 rounded text-sm ${
                  selectedDoc === doc.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                {doc.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedDoc ? (
          <RealTimeEditor
            documentId={selectedDoc}
            initialContent={documents.find(d => d.id === selectedDoc)?.content}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a document to start editing
          </div>
        )}
      </div>

      {/* Settings Button */}
      <button className="fixed bottom-4 right-4 p-2 bg-white rounded-full shadow-lg hover:shadow-xl">
        <FiSettings className="w-6 h-6 text-gray-600" />
      </button>
    </div>
  );
};

export default TeamWorkspace;
