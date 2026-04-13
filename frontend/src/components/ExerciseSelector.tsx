import React from 'react';
import { Activity, Target, Timer, Zap } from 'lucide-react';

interface ExerciseSelectorProps {
  currentExercise: string;
  switchExercise: (id: string) => void;
  isActive: boolean;
}

const exercises = [
  {
    id: 'squat',
    name: '深蹲',
    icon: <Activity className="w-6 h-6" />,
    description: '训练大腿和臀部肌肉',
    difficulty: 'easy',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'pushup',
    name: '俯卧撑',
    icon: <Target className="w-6 h-6" />,
    description: '锻炼胸部和手臂肌肉',
    difficulty: 'medium',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'plank',
    name: '平板支撑',
    icon: <Timer className="w-6 h-6" />,
    description: '增强核心稳定性',
    difficulty: 'medium',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'jumping_jack',
    name: '开合跳',
    icon: <Zap className="w-6 h-6" />,
    description: '全身有氧运动',
    difficulty: 'hard',
    color: 'from-red-500 to-red-600'
  }
];

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ currentExercise, switchExercise, isActive }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'hard': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {exercises.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => switchExercise(exercise.id)}
            disabled={isActive}
            className={`exercise-card relative p-6 rounded-xl transition-all duration-200 ${currentExercise === exercise.id
              ? `selected bg-gradient-to-r ${exercise.color} text-white transform scale-105 shadow-lg`
              : 'hover:shadow-md border-2'
              } ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            style={currentExercise !== exercise.id ? {
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              color: 'var(--text-primary)'
            } : undefined}
          >
            {/* 选中指示器 */}
            {currentExercise === exercise.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}

            {/* 图标 */}
            <div className="flex justify-center mb-3">
              {exercise.icon}
            </div>

            {/* 名称 */}
            <h3 className="text-lg font-semibold mb-2">{exercise.name}</h3>

            {/* 描述 */}
            <p className={`text-sm mb-3 ${currentExercise === exercise.id ? 'text-white/90' : ''
              }`} style={currentExercise !== exercise.id ? { color: 'var(--text-secondary)' } : undefined}>
              {exercise.description}
            </p>

            {/* 难度标签 */}
            <div className="flex justify-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentExercise === exercise.id
                ? 'bg-white/20 text-white'
                : getDifficultyColor(exercise.difficulty)
                }`}>
                {exercise.difficulty === 'easy' ? '简单' :
                  exercise.difficulty === 'medium' ? '中等' : '困难'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExerciseSelector; 