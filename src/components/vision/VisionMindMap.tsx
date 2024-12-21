'use client';

import { useEffect, useRef, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  FiPlus,
  FiMinus,
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiSave,
  FiTrash2,
  FiEdit2,
} from 'react-icons/fi';
import {
  VisionLayout,
  VisionCard,
  VisionStack,
  VisionSection,
} from './shared/VisionLayout';
import {
  AnimatedContainer,
  MotionDiv,
  scaleIn,
} from './shared/VisionAnimations';
import { visionTheme } from '@/styles/vision-theme';
import { Button } from '@/components/ui/Button';

interface VisionMindMapProps {
  goalId: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

const nodeTypes = {
  goal: GoalNode,
  milestone: MilestoneNode,
  task: TaskNode,
  note: NoteNode,
};

export function VisionMindMap({
  goalId,
  initialNodes = [],
  initialEdges = [],
  onSave,
}: VisionMindMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const supabase = useSupabase();

  useEffect(() => {
    loadMindMap();
  }, [goalId]);

  const loadMindMap = async () => {
    try {
      const { data: mindMapData, error } = await supabase
        .from('vision_mind_maps')
        .select('nodes, edges')
        .eq('vision_goal_id', goalId)
        .single();

      if (error) throw error;

      if (mindMapData) {
        setNodes(mindMapData.nodes);
        setEdges(mindMapData.edges);
      }
    } catch (error) {
      console.error('Error loading mind map:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('vision_mind_maps').upsert({
        vision_goal_id: goalId,
        nodes,
        edges,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;
      onSave?.(nodes, edges);
    } catch (error) {
      console.error('Error saving mind map:', error);
    }
  };

  const handleAddNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 100, y: 100 },
      data: { label: `New ${type}` },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      reactFlowWrapper.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <VisionLayout>
      <VisionSection>
        <VisionStack space={4}>
          <h3 className="text-lg font-medium text-gray-900">Goal Mind Map</h3>
          <VisionStack space={2}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddNode('goal')}
            >
              Add Goal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddNode('milestone')}
            >
              Add Milestone
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddNode('task')}
            >
              Add Task
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddNode('note')}
            >
              Add Note
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <FiMaximize className="h-4 w-4" />
            </Button>
            <Button onClick={handleSave}>
              <FiSave className="h-4 w-4" />
            </Button>
          </VisionStack>
        </VisionStack>
      </VisionSection>
      <VisionSection>
        <div
          ref={reactFlowWrapper}
          className={`bg-white rounded-lg ${
            isFullscreen ? 'fixed inset-0 z-50' : 'h-[600px]'
          }`}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </VisionSection>
    </VisionLayout>
  );
}

function GoalNode({ data }: { data: any }) {
  return (
    <AnimatedContainer animation="scale">
      <VisionCard
        hover
        interactive
        className="p-4 bg-gradient-to-br from-primary-100 to-primary-50"
      >
        <VisionStack space={2}>
          <h4 className="font-medium text-primary-900">{data.label}</h4>
          {data.description && (
            <p className="text-sm text-primary-700">{data.description}</p>
          )}
        </VisionStack>
      </VisionCard>
    </AnimatedContainer>
  );
}

function MilestoneNode({ data }: { data: any }) {
  return (
    <AnimatedContainer animation="scale">
      <VisionCard
        hover
        interactive
        className="p-4 bg-gradient-to-br from-warning-100 to-warning-50"
      >
        <VisionStack space={2}>
          <h4 className="font-medium text-warning-900">{data.label}</h4>
          {data.date && (
            <p className="text-sm text-warning-700">Due: {data.date}</p>
          )}
        </VisionStack>
      </VisionCard>
    </AnimatedContainer>
  );
}

function TaskNode({ data }: { data: any }) {
  return (
    <AnimatedContainer animation="scale">
      <VisionCard
        hover
        interactive
        className="p-4 bg-gradient-to-br from-success-100 to-success-50"
      >
        <VisionStack space={2}>
          <h4 className="font-medium text-success-900">{data.label}</h4>
          {data.status && (
            <p className="text-sm text-success-700">Status: {data.status}</p>
          )}
        </VisionStack>
      </VisionCard>
    </AnimatedContainer>
  );
}

function NoteNode({ data }: { data: any }) {
  return (
    <AnimatedContainer animation="scale">
      <VisionCard
        hover
        interactive
        className="p-4 bg-gradient-to-br from-gray-100 to-gray-50"
      >
        <p className="text-sm text-gray-700">{data.label}</p>
      </VisionCard>
    </AnimatedContainer>
  );
}
