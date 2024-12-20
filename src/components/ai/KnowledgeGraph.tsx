'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import Graph from 'react-graph-vis';
import { FiLink } from 'react-icons/fi';

const KnowledgeGraph: React.FC = () => {
  const supabase = useSupabase();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id, title, related_notes');

      if (notesError) console.error('Error fetching notes:', notesError);
      else {
        const nodes = notes.map(note => ({ 
          id: note.id, 
          label: note.title,
          color: '#97C2FC'  // Default node color
        }));
        const edges = notes.flatMap(note =>
          note.related_notes.map(relatedId => ({ 
            from: note.id, 
            to: relatedId,
            color: '#848484'  // Default edge color
          }))
        );

        setGraphData({ nodes, edges });
      }
    };

    fetchGraphData();
  }, [supabase]);

  const options = {
    layout: {
      hierarchical: false,
      improvedLayout: true,
      randomSeed: 42
    },
    edges: {
      width: 1,
      smooth: {
        type: 'continuous',
        roundness: 0.5
      },
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 }
      }
    },
    nodes: {
      shape: 'dot',
      size: 16,
      font: {
        size: 14,
        color: '#333333'
      },
      borderWidth: 2,
      shadow: true
    },
    physics: {
      stabilization: {
        enabled: true,
        iterations: 1000
      },
      barnesHut: {
        gravitationalConstant: -2000,
        springConstant: 0.04,
        springLength: 95
      }
    },
    interaction: {
      hover: true,
      zoomView: true,
      dragView: true,
      multiselect: true
    }
  };

  const events = {
    select: ({ nodes, edges }) => {
      if (nodes.length) {
        const selectedNode = graphData.nodes.find(n => n.id === nodes[0]);
        if (selectedNode) {
          // Fetch and display related content
          fetchRelatedContent(selectedNode.id);
        }
      }
    },
    hoverNode: (event) => {
      const { node } = event;
      const relatedNodes = graphData.edges
        .filter(edge => edge.from === node || edge.to === node)
        .map(edge => edge.from === node ? edge.to : edge.from);
      
      // Highlight related nodes
      setGraphData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => ({
          ...n,
          color: relatedNodes.includes(n.id) ? '#ff9999' : n.color
        }))
      }));
    }
  };

  const fetchRelatedContent = async (nodeId: string) => {
    const { data: content, error } = await supabase
      .from('notes')
      .select('content, tags, created_at')
      .eq('id', nodeId)
      .single();

    if (error) console.error('Error fetching content:', error);
    else {
      // Update UI with related content
      setSelectedContent(content);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Knowledge Graph</h3>
      <div style={{ height: '500px' }}>
        <Graph
          graph={graphData}
          options={options}
          events={events}
        />
      </div>
      {selectedContent && (
        <div className="mt-2">
          <h4 className="text-lg font-semibold">Related Content</h4>
          <p className="text-gray-600">{selectedContent.content}</p>
          <p className="text-gray-600">Tags: {selectedContent.tags.join(', ')}</p>
          <p className="text-gray-600">Created at: {selectedContent.created_at}</p>
        </div>
      )}
      <div className="mt-2 text-gray-600">
        <FiLink className="inline-block mr-1" />
        Click on nodes to view details.
      </div>
    </div>
  );
};

export default KnowledgeGraph;
