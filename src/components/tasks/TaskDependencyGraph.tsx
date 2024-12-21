'use client';

import { useEffect, useRef, useState } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';

interface TaskDependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onDependencyClick?: (dependency: TaskDependency) => void;
  className?: string;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  type: string;
}

export function TaskDependencyGraph({
  tasks,
  dependencies,
  onDependencyClick,
  className
}: TaskDependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const updateDimensions = () => {
    if (svgRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Prepare data
    const nodes: Node[] = tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority
    }));

    const links: Link[] = dependencies.map(dep => ({
      source: dep.taskId,
      target: dep.dependsOnTaskId,
      type: dep.type
    }));

    // Create SVG
    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2));

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', theme === 'dark' ? '#4a5568' : '#cbd5e0')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Add arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', theme === 'dark' ? '#4a5568' : '#cbd5e0');

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add circles for nodes
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => getNodeColor(d.priority, d.status))
      .attr('stroke', theme === 'dark' ? '#2d3748' : '#e2e8f0')
      .attr('stroke-width', 2);

    // Add labels
    node.append('text')
      .text(d => d.title.slice(0, 2))
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .style('font-size', '12px');

    // Add tooltips
    node.append('title')
      .text(d => d.title);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [tasks, dependencies, dimensions, theme]);

  const getNodeColor = (priority: string, status: string) => {
    if (status === 'completed') return theme === 'dark' ? '#48bb78' : '#68d391';
    switch (priority) {
      case 'high':
        return theme === 'dark' ? '#f56565' : '#fc8181';
      case 'medium':
        return theme === 'dark' ? '#ed8936' : '#f6ad55';
      default:
        return theme === 'dark' ? '#4299e1' : '#63b3ed';
    }
  };

  return (
    <div className={cn('w-full aspect-video relative', className)}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: theme === 'dark' ? '#1a202c' : '#f7fafc' }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              'absolute p-2 rounded shadow-lg z-10',
              'bg-popover text-popover-foreground',
              'border border-border'
            )}
            style={{
              left: dimensions.width / 2,
              top: dimensions.height / 2
            }}
          >
            {tasks.find(t => t.id === hoveredNode)?.title}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
