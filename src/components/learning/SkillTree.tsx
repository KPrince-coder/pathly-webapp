'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForceGraph2D } from 'react-force-graph';
import * as d3 from 'd3';
import useFeatureStore from '@/store/features';
import {
  FiBook,
  FiAward,
  FiTrendingUp,
  FiClock,
  FiTarget,
  FiBrain,
  FiStar,
} from 'react-icons/fi';

interface Skill {
  id: string;
  name: string;
  level: number;
  experience: number;
  nextLevel: number;
  dependencies: string[];
  children: string[];
  status: 'locked' | 'available' | 'in-progress' | 'mastered';
  category: string;
  resources: Array<{
    type: 'video' | 'article' | 'quiz' | 'exercise';
    title: string;
    url: string;
    completed: boolean;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    unlockedAt?: Date;
  }>;
  practiceHistory: Array<{
    timestamp: Date;
    duration: number;
    performance: number;
  }>;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  progress: number;
}

const SkillTree: React.FC = () => {
  const [skills, setSkills] = useState<Record<string, Skill>>({});
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const graphRef = useRef<any>(null);

  // Initialize skill tree
  useEffect(() => {
    const initializeSkillTree = async () => {
      // Fetch skills and learning paths
      const fetchedSkills = await fetchSkills();
      const fetchedPaths = await fetchLearningPaths();

      setSkills(fetchedSkills);
      setPaths(fetchedPaths);

      // Generate graph data
      const nodes = Object.values(fetchedSkills).map(skill => ({
        id: skill.id,
        name: skill.name,
        level: skill.level,
        status: skill.status,
        val: calculateNodeSize(skill),
      }));

      const links = Object.values(fetchedSkills).flatMap(skill =>
        skill.dependencies.map(dep => ({
          source: dep,
          target: skill.id,
        }))
      );

      setGraphData({ nodes, links });
    };

    initializeSkillTree();
  }, []);

  // Handle skill progression
  const progressSkill = async (skillId: string) => {
    const skill = skills[skillId];
    if (!skill || skill.status === 'locked') return;

    // Update experience and check for level up
    const newExperience = skill.experience + 10;
    const leveledUp = newExperience >= skill.nextLevel;

    const updatedSkill = {
      ...skill,
      experience: leveledUp ? newExperience - skill.nextLevel : newExperience,
      level: leveledUp ? skill.level + 1 : skill.level,
      nextLevel: leveledUp ? calculateNextLevel(skill.level + 1) : skill.nextLevel,
      status: leveledUp && skill.level + 1 >= 10 ? 'mastered' : 'in-progress',
    };

    // Update skills
    setSkills(prev => ({
      ...prev,
      [skillId]: updatedSkill,
    }));

    // Update graph
    if (graphRef.current) {
      const node = graphRef.current.graphData().nodes.find((n: any) => n.id === skillId);
      if (node) {
        node.level = updatedSkill.level;
        node.val = calculateNodeSize(updatedSkill);
        graphRef.current.refresh();
      }
    }

    // Check for unlocked achievements
    checkAchievements(updatedSkill);
  };

  // Helper functions
  const calculateNodeSize = (skill: Skill) => {
    return 5 + skill.level * 2;
  };

  const calculateNextLevel = (currentLevel: number) => {
    return Math.floor(100 * Math.pow(1.5, currentLevel));
  };

  const checkAchievements = (skill: Skill) => {
    const newAchievements = [];

    // Level-based achievements
    if (skill.level >= 5 && !skill.achievements.some(a => a.id === 'level-5')) {
      newAchievements.push({
        id: 'level-5',
        title: 'Intermediate',
        description: 'Reached level 5 in a skill',
        unlockedAt: new Date(),
      });
    }

    // Mastery achievement
    if (skill.status === 'mastered' && !skill.achievements.some(a => a.id === 'mastery')) {
      newAchievements.push({
        id: 'mastery',
        title: 'Master',
        description: 'Mastered a skill',
        unlockedAt: new Date(),
      });
    }

    if (newAchievements.length > 0) {
      setSkills(prev => ({
        ...prev,
        [skill.id]: {
          ...skill,
          achievements: [...skill.achievements, ...newAchievements],
        },
      }));
    }
  };

  // Mock data fetching
  const fetchSkills = async (): Promise<Record<string, Skill>> => {
    // Implement actual data fetching
    return {};
  };

  const fetchLearningPaths = async (): Promise<LearningPath[]> => {
    // Implement actual data fetching
    return [];
  };

  return (
    <div className="flex h-screen">
      {/* Skill Tree Visualization */}
      <div className="flex-1 relative">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node: any) => {
            switch (node.status) {
              case 'locked': return '#9CA3AF';
              case 'available': return '#60A5FA';
              case 'in-progress': return '#34D399';
              case 'mastered': return '#FBBF24';
              default: return '#9CA3AF';
            }
          }}
          nodeVal="val"
          linkColor={() => '#E5E7EB'}
          onNodeClick={(node: any) => setSelectedSkill(node.id)}
          d3Force={('link', d3.forceLink().distance(100))}
        />
      </div>

      {/* Skill Details Panel */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="w-96 bg-white border-l overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {skills[selectedSkill].name}
                </h2>
                <div className="flex items-center gap-2">
                  <FiStar className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold">Level {skills[selectedSkill].level}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Experience</span>
                  <span className="text-sm font-medium">
                    {skills[selectedSkill].experience} / {skills[selectedSkill].nextLevel}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${(skills[selectedSkill].experience / skills[selectedSkill].nextLevel) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Resources */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Learning Resources</h3>
                <div className="space-y-2">
                  {skills[selectedSkill].resources.map((resource, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {resource.type === 'video' && <FiBook className="w-5 h-5" />}
                        <div>
                          <div className="font-medium">{resource.title}</div>
                          <div className="text-sm text-gray-600">{resource.type}</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={resource.completed}
                        onChange={() => {
                          // Update resource completion status
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Achievements</h3>
                <div className="grid grid-cols-2 gap-3">
                  {skills[selectedSkill].achievements.map(achievement => (
                    <motion.div
                      key={achievement.id}
                      className="p-3 bg-yellow-50 rounded-lg"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <FiAward className="w-6 h-6 text-yellow-500 mb-2" />
                      <div className="font-medium">{achievement.title}</div>
                      <div className="text-sm text-gray-600">
                        {achievement.description}
                      </div>
                      {achievement.unlockedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Practice History */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Practice History</h3>
                <div className="space-y-3">
                  {skills[selectedSkill].practiceHistory.map((session, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {Math.floor(session.duration / 60)} minutes
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiTrendingUp className="w-4 h-4" />
                        <span>{Math.round(session.performance * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkillTree;
