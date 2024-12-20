'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { FiGitBranch, FiGitCommit, FiGitMerge, FiClock } from 'react-icons/fi';
import { diffChars } from 'diff';

interface Version {
  id: string;
  content: string;
  message: string;
  created_at: string;
  branch: string;
  author: {
    name: string;
    avatar_url: string;
  };
}

interface Branch {
  name: string;
  created_at: string;
  last_commit: string;
}

const DocumentVersionControl: React.FC<{ documentId: string }> = ({ documentId }) => {
  const supabase = useSupabaseClient();
  const [versions, setVersions] = useState<Version[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [diffView, setDiffView] = useState<boolean>(false);

  useEffect(() => {
    fetchVersions();
    fetchBranches();
  }, [documentId, currentBranch]);

  const fetchVersions = async () => {
    const { data, error } = await supabase
      .from('document_versions')
      .select(`
        id,
        content,
        message,
        created_at,
        branch,
        author:user_id (
          name,
          avatar_url
        )
      `)
      .eq('document_id', documentId)
      .eq('branch', currentBranch)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching versions:', error);
    else setVersions(data);
  };

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('document_branches')
      .select('*')
      .eq('document_id', documentId);

    if (error) console.error('Error fetching branches:', error);
    else setBranches(data);
  };

  const createBranch = async (branchName: string, fromVersion: string) => {
    const { data: versionData } = await supabase
      .from('document_versions')
      .select('content')
      .eq('id', fromVersion)
      .single();

    if (!versionData) return;

    const { error: branchError } = await supabase
      .from('document_branches')
      .insert({
        document_id: documentId,
        name: branchName,
        created_from: fromVersion
      });

    if (branchError) {
      console.error('Error creating branch:', branchError);
      return;
    }

    const { error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        content: versionData.content,
        message: `Branch created from ${fromVersion}`,
        branch: branchName
      });

    if (versionError) console.error('Error creating version:', versionError);
    else {
      fetchBranches();
      setCurrentBranch(branchName);
    }
  };

  const mergeBranch = async (fromBranch: string, toBranch: string) => {
    // Get latest versions from both branches
    const { data: [fromVersion] } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .eq('branch', fromBranch)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: [toVersion] } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .eq('branch', toBranch)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!fromVersion || !toVersion) return;

    // Create merge version
    const { error } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        content: fromVersion.content,
        message: `Merged ${fromBranch} into ${toBranch}`,
        branch: toBranch,
        merged_from: fromBranch
      });

    if (error) console.error('Error merging branches:', error);
    else {
      fetchVersions();
      setCurrentBranch(toBranch);
    }
  };

  const renderDiff = (oldContent: string, newContent: string) => {
    const diff = diffChars(oldContent, newContent);
    
    return (
      <div className="font-mono text-sm whitespace-pre-wrap">
        {diff.map((part, index) => (
          <span
            key={index}
            className={
              part.added ? 'bg-green-100 text-green-800' :
              part.removed ? 'bg-red-100 text-red-800' :
              ''
            }
          >
            {part.value}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r p-4">
        <div className="mb-6">
          <h3 className="flex items-center text-sm font-semibold text-gray-600 mb-2">
            <FiGitBranch className="mr-2" />
            Branches
          </h3>
          <div className="space-y-2">
            {branches.map(branch => (
              <button
                key={branch.name}
                onClick={() => setCurrentBranch(branch.name)}
                className={`w-full text-left px-2 py-1 rounded text-sm ${
                  currentBranch === branch.name ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                {branch.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="flex items-center text-sm font-semibold text-gray-600 mb-2">
            <FiGitCommit className="mr-2" />
            Versions
          </h3>
          <div className="space-y-2">
            {versions.map(version => (
              <button
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                className={`w-full text-left px-2 py-1 rounded text-sm ${
                  selectedVersion?.id === version.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <img
                    src={version.author.avatar_url}
                    alt={version.author.name}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <div>
                    <div className="font-medium">{version.message}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(version.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedVersion ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedVersion.message}</h2>
                <p className="text-sm text-gray-500">
                  <FiClock className="inline mr-1" />
                  {new Date(selectedVersion.created_at).toLocaleString()}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setDiffView(!diffView)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  {diffView ? 'View Content' : 'View Changes'}
                </button>
                <button
                  onClick={() => {
                    const branchName = prompt('Enter new branch name:');
                    if (branchName) createBranch(branchName, selectedVersion.id);
                  }}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Create Branch
                </button>
                {currentBranch !== 'main' && (
                  <button
                    onClick={() => mergeBranch(currentBranch, 'main')}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <FiGitMerge className="inline mr-1" />
                    Merge to main
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              {diffView && versions.length > 1 ? (
                renderDiff(
                  versions[1].content,
                  selectedVersion.content
                )
              ) : (
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {selectedVersion.content}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a version to view details
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVersionControl;
