import React from 'react';
import { Trophy, Target, Clock, TrendingUp, CheckCircle, Award, Play } from 'lucide-react';

interface StatsPanelProps {
  exerciseStats: {
    count: number;
    isCorrect: boolean;
    feedback: string;
    score: number;
    accuracy: number;
  };
  currentExercise: string;
  duration: number;
  todayTotalCount?: number;
  completedPlan?: {
    difficulty: string;
    totalCount: number;
    totalDuration: number;
    completedAt: Date;
  } | null;
  // 新增：训练模式相关
  trainingMode?: 'free' | 'plan' | 'test';
  isActive?: boolean;
  isResting?: boolean;
  onShowModeSelector?: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  exerciseStats,
  currentExercise,
  duration,
  todayTotalCount,
  completedPlan,
  trainingMode = 'free',
  isActive = false,
  isResting = false,
  onShowModeSelector
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="theme-card border rounded-2xl p-6 space-y-8 shadow-xl">
      {/* 当前运动 */}
      <div className="text-center relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-10 w-24 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
        <h2 className="text-3xl font-bold mb-3 tracking-wide" style={{ color: 'var(--text-primary)' }}>{currentExercise}</h2>

        {/* 根据状态显示不同内容 */}
        {isActive ? (
          // 运动中：显示反馈
          <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 shadow-lg ${exerciseStats.isCorrect
            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/20'
            : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-orange-500/20'
            }`}>
            {exerciseStats.isCorrect ? (
              <span className="flex items-center">✨ {exerciseStats.feedback}</span>
            ) : (
              <span className="flex items-center">⚡ {exerciseStats.feedback}</span>
            )}
          </div>
        ) : (
          // 未运动：显示训练模式选择器
          <div className="space-y-3">
            <div
              className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${trainingMode === 'free'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
            >
              {trainingMode === 'free' ? (
                <><span className="mr-2">🎯</span>自由训练模式</>
              ) : (
                <><span className="mr-2">📋</span>计划训练模式</>
              )}
            </div>

            {trainingMode === 'free' && !isResting && onShowModeSelector && (
              <div>
                <button
                  onClick={onShowModeSelector}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium transition-all transform hover:-translate-y-0.5 shadow-lg text-sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  选择训练模式
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 统计数据网格 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 计数 */}
        <div className="rounded-2xl p-4 text-center transition-colors duration-300 group" style={{ background: 'var(--btn-secondary-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Target className="text-blue-500" size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{exerciseStats.count}</div>
          <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>完成次数</div>
        </div>

        {/* 分数 */}
        <div className="rounded-2xl p-4 text-center transition-colors duration-300 group" style={{ background: 'var(--btn-secondary-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Trophy className="text-yellow-500" size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 group-hover:text-yellow-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{exerciseStats.score}</div>
          <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>总分数</div>
        </div>

        {/* 时间 */}
        <div className="rounded-2xl p-4 text-center transition-colors duration-300 group" style={{ background: 'var(--btn-secondary-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="text-emerald-500" size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 group-hover:text-emerald-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{formatTime(duration)}</div>
          <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>运动时间</div>
        </div>

        {/* 准确率 */}
        <div className="rounded-2xl p-4 text-center transition-colors duration-300 group" style={{ background: 'var(--btn-secondary-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="text-purple-500" size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 group-hover:text-purple-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
            {(exerciseStats.accuracy * 100).toFixed(0)}%
          </div>
          <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>准确率</div>
        </div>
      </div>

      {/* 已完成的训练计划 */}
      {completedPlan && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium flex items-center" style={{ color: 'var(--text-primary)' }}>
              <Award size={14} className="mr-1.5 text-green-500" />
              今日训练计划
            </div>
            <div className="flex items-center text-green-500">
              <CheckCircle size={14} className="mr-1" />
              <span className="text-xs font-bold">已完成</span>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {completedPlan.difficulty === 'easy' ? '🌱 初级计划' : 
                 completedPlan.difficulty === 'medium' ? '💪 中级计划' : 
                 completedPlan.difficulty === 'test' ? '🧪 测试计划' : 
                 '🔥 高级计划'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                {new Date(completedPlan.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>完成 {completedPlan.totalCount} 次动作</span>
              <span>用时 {Math.floor(completedPlan.totalDuration / 60)}分{completedPlan.totalDuration % 60}秒</span>
            </div>
          </div>
        </div>
      )}

      {/* 成就徽章 */}
      <div className="space-y-4 pt-2" style={{ borderTop: '1px solid var(--card-border)' }}>
        <div className="text-sm font-medium flex items-center" style={{ color: 'var(--text-primary)' }}>
          <Trophy size={14} className="mr-1.5 text-yellow-500" />
          获得成就
        </div>
        <div className="flex space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${(todayTotalCount !== undefined ? todayTotalCount : exerciseStats.count) >= 5 ? 'bg-gradient-to-br from-amber-700 to-amber-900 border border-amber-600 shadow-lg shadow-amber-900/50 scale-100 opacity-100' : 'bg-gray-800/50 border border-gray-700 opacity-40 grayscale'}`} title="铜牌：完成5次">
            <span className="text-lg">🥉</span>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${(todayTotalCount !== undefined ? todayTotalCount : exerciseStats.count) >= 10 ? 'bg-gradient-to-br from-slate-400 to-slate-600 border border-slate-400 shadow-lg shadow-slate-600/50 scale-100 opacity-100' : 'bg-gray-800/50 border border-gray-700 opacity-40 grayscale'}`} title="银牌：完成10次">
            <span className="text-lg">🥈</span>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${(todayTotalCount !== undefined ? todayTotalCount : exerciseStats.count) >= 20 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-400 shadow-lg shadow-yellow-600/50 scale-100 opacity-100' : 'bg-gray-800/50 border border-gray-700 opacity-40 grayscale'}`} title="金牌：完成20次">
            <span className="text-lg">🥇</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel; 