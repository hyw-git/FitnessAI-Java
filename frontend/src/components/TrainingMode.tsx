import React from 'react';
import { Play, Target, Clock, CheckCircle, X, Dumbbell, FlaskConical } from 'lucide-react';

interface TrainingModeSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFreeMode: () => void;
    onSelectPlanMode: (difficulty: string) => void;
    onSelectTestMode: () => void;
    getPlanDetail: (difficulty: string) => PlanDetailData;
}

export interface PlanDetailData {
    title: string;
    description: string;
    squat: string;
    pushup: string;
    plank: string;
    jumping_jack: string;
    rest_time: number;
    total_time: string;
    calories: string;
    tips: string[];
}

export const TrainingModeSelector: React.FC<TrainingModeSelectorProps> = ({
    isOpen,
    onClose,
    onSelectFreeMode,
    onSelectPlanMode,
    onSelectTestMode,
    getPlanDetail,
}) => {
    const [previewDifficulty, setPreviewDifficulty] = React.useState<string | null>(null);

    // 重置状态当弹窗关闭时
    React.useEffect(() => {
        if (!isOpen) {
            setPreviewDifficulty(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    if (previewDifficulty) {
        const plan = getPlanDetail(previewDifficulty);
        const difficultyNames = { easy: '初级', medium: '中级', hard: '高级' };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
                <div className="theme-modal border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <Target className="mr-2 text-blue-500" size={24} />
                            {difficultyNames[previewDifficulty as keyof typeof difficultyNames]}计划详情
                        </h2>
                        <button
                            onClick={() => setPreviewDifficulty(null)}
                            className="p-2 rounded-full hover:opacity-70 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* 计划标题和描述 */}
                        <div className="text-center">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">{plan.title}</h3>
                            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">{plan.description}</p>
                        </div>

                        {/* 训练详情 */}
                        <div className="bg-blue-900/20 border border-blue-300/20 rounded-2xl p-5 space-y-5">
                            <h4 className="font-bold text-white border-b border-white/10 pb-3 flex items-center">
                                <Target className="mr-2 text-blue-400" size={18} />
                                训练内容
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-3 rounded-xl border border-blue-300/20">
                                    <div className="text-sm font-medium text-gray-400 mb-1">深蹲</div>
                                    <div className="font-bold text-white">{plan.squat}</div>
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-blue-300/20">
                                    <div className="text-sm font-medium text-gray-400 mb-1">俯卧撑</div>
                                    <div className="font-bold text-white">{plan.pushup}</div>
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-blue-300/20">
                                    <div className="text-sm font-medium text-gray-400 mb-1">平板支撑</div>
                                    <div className="font-bold text-white">{plan.plank}</div>
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-blue-300/20">
                                    <div className="text-sm font-medium text-gray-400 mb-1">开合跳</div>
                                    <div className="font-bold text-white">{plan.jumping_jack}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <div className="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/10 hover:bg-blue-500/20 transition-colors">
                                    <div className="text-blue-400 font-bold mb-1">{plan.rest_time}s</div>
                                    <div className="text-xs text-gray-400">组间休息</div>
                                </div>
                                <div className="text-center p-3 bg-purple-500/10 rounded-xl border border-purple-500/10 hover:bg-purple-500/20 transition-colors">
                                    <div className="text-purple-400 font-bold mb-1">{plan.total_time}</div>
                                    <div className="text-xs text-gray-400">预计时长</div>
                                </div>
                                <div className="text-center p-3 bg-orange-500/10 rounded-xl border border-orange-500/10 hover:bg-orange-500/20 transition-colors">
                                    <div className="text-orange-400 font-bold mb-1">{plan.calories}</div>
                                    <div className="text-xs text-gray-400">消耗热量</div>
                                </div>
                            </div>
                        </div>

                        {/* 训练建议 */}
                        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4">
                            <h4 className="font-bold text-yellow-500 mb-3 flex items-center">
                                <Target className="mr-2" size={18} />
                                训练建议
                            </h4>
                            <div className="text-sm text-gray-300 space-y-2">
                                {plan.tips && plan.tips.map((tip: string, index: number) => (
                                    <div key={index} className="flex items-start">
                                        <span className="text-yellow-500 mr-2 mt-0.5">•</span>
                                        <span>{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex pt-2 space-x-4">
                            <button
                                onClick={() => setPreviewDifficulty(null)}
                                className="flex-1 px-4 py-3 bg-blue-900/30 hover:bg-blue-900/40 text-white rounded-xl transition-all font-medium border border-white/10"
                            >
                                返回
                            </button>
                            <button
                                onClick={() => onSelectPlanMode(previewDifficulty)}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-blue-500/20"
                            >
                                开始训练
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
            <div className="theme-modal border rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center" style={{ color: 'var(--text-primary)' }}>
                        <Target className="mr-2 text-blue-500" size={24} />
                        选择训练模式
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:opacity-70 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* 测试模式 */}
                    <button
                        onClick={onSelectTestMode}
                        className="w-full p-4 rounded-xl border-2 border-transparent hover:border-yellow-500/50 transition-all group"
                        style={{ background: 'var(--btn-secondary-bg)' }}
                    >
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                <FlaskConical className="text-white" size={24} />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>🧪 测试模式</div>
                                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>课堂演示专用，简化训练计划</div>
                            </div>
                        </div>
                    </button>

                    {/* 自由模式 */}
                    <button
                        onClick={onSelectFreeMode}
                        className="w-full p-4 rounded-xl border-2 border-transparent hover:border-blue-500/50 transition-all group"
                        style={{ background: 'var(--btn-secondary-bg)' }}
                    >
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                <Play className="text-white" size={24} />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>🎯 自由模式</div>
                                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>自由练习，不限次数和时间</div>
                            </div>
                        </div>
                    </button>

                    {/* 计划模式 */}
                    <div className="p-4 rounded-xl" style={{ background: 'var(--btn-secondary-bg)' }}>
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mr-4">
                                <Dumbbell className="text-white" size={24} />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>📋 按计划训练</div>
                                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>跟随计划完成训练目标</div>
                            </div>
                        </div>

                        <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>选择难度：</div>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setPreviewDifficulty('easy')}
                                className="py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 transition-all transform hover:-translate-y-0.5 shadow-lg"
                            >
                                初级
                            </button>
                            <button
                                onClick={() => setPreviewDifficulty('medium')}
                                className="py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 transition-all transform hover:-translate-y-0.5 shadow-lg"
                            >
                                中级
                            </button>
                            <button
                                onClick={() => setPreviewDifficulty('hard')}
                                className="py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 transition-all transform hover:-translate-y-0.5 shadow-lg"
                            >
                                高级
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface PlanProgressProps {
    activePlan: {
        difficulty: string;
        exercises: { type: string; sets: number; reps: number; restTime: number }[];
        currentExerciseIndex: number;
        currentSet: number;
        targetReps: number;
    };
    currentCount: number;
    isResting: boolean;
    restCountdown: number;
    onExit: () => void;
    onSkipRest: () => void;
    getExerciseName: (type: string) => string;
}

export const PlanProgress: React.FC<PlanProgressProps> = ({
    activePlan,
    currentCount,
    isResting,
    restCountdown,
    onExit,
    onSkipRest,
    getExerciseName,
}) => {
    const currentExercise = activePlan.exercises[activePlan.currentExerciseIndex];
    const totalSets = activePlan.exercises.reduce((sum, e) => sum + e.sets, 0);
    const completedSets = activePlan.exercises
        .slice(0, activePlan.currentExerciseIndex)
        .reduce((sum, e) => sum + e.sets, 0) + activePlan.currentSet - 1;
    const progress = (completedSets / totalSets) * 100;

    const difficultyColors = {
        easy: 'from-green-400 to-emerald-500',
        medium: 'from-blue-400 to-indigo-500',
        hard: 'from-red-400 to-rose-500',
        test: 'from-yellow-400 to-orange-500',
    };

    const difficultyNames = {
        easy: '初级',
        medium: '中级',
        hard: '高级',
        test: '测试',
    };

    return (
        <div className="theme-card border rounded-2xl p-4 shadow-xl mb-4" style={{ borderColor: 'var(--card-border)' }}>
            {/* 顶部：模式和退出 */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${difficultyColors[activePlan.difficulty as keyof typeof difficultyColors]}`}>
                        📋 {difficultyNames[activePlan.difficulty as keyof typeof difficultyNames]}计划
                    </span>
                </div>
                <button
                    onClick={onExit}
                    className="text-sm px-3 py-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                >
                    退出计划
                </button>
            </div>

            {/* 总进度条 */}
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>总进度</span>
                    <span>{completedSets + (isResting || currentCount >= activePlan.targetReps ? 1 : 0)}/{totalSets} 组</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--btn-secondary-bg)' }}>
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${difficultyColors[activePlan.difficulty as keyof typeof difficultyColors]} transition-all duration-500`}
                        style={{ width: `${Math.min(progress + (isResting ? (100 / totalSets) : 0), 100)}%` }}
                    />
                </div>
            </div>

            {/* 当前状态 */}
            {isResting ? (
                // 休息中状态
                <div className="text-center py-4">
                    <div className="text-4xl mb-2">😮‍💨</div>
                    <div className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>休息中</div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                        {restCountdown}s
                    </div>
                    <button
                        onClick={onSkipRest}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ background: 'var(--btn-secondary-bg)', color: 'var(--text-secondary)' }}
                    >
                        跳过休息
                    </button>
                </div>
            ) : (
                // 训练中状态
                <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <Target className="mr-2 text-purple-500" size={20} />
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            {getExerciseName(currentExercise.type)} - 第 {activePlan.currentSet}/{currentExercise.sets} 组
                        </span>
                    </div>

                    <div className="flex items-center justify-center space-x-2">
                        <span className="text-3xl font-bold" style={{ color: 'var(--text-accent)' }}>{currentCount}</span>
                        <span className="text-xl" style={{ color: 'var(--text-muted)' }}>/</span>
                        <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{activePlan.targetReps}</span>
                        <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
                            {currentExercise.type === 'plank' ? '秒' : '次'}
                        </span>
                    </div>

                    {/* 进度提示 */}
                    {currentCount > 0 && currentCount < activePlan.targetReps && (
                        <div className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                            还剩 {activePlan.targetReps - currentCount} {currentExercise.type === 'plank' ? '秒' : '次'} 💪
                        </div>
                    )}

                    {currentCount >= activePlan.targetReps && (
                        <div className="mt-2 flex items-center justify-center text-green-400">
                            <CheckCircle className="mr-1" size={16} />
                            <span className="font-medium">本组完成！</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface PlanCompletedModalProps {
    isOpen: boolean;
    onClose: () => void;
    difficulty: string;
}

export const PlanCompletedModal: React.FC<PlanCompletedModalProps> = ({
    isOpen,
    onClose,
    difficulty,
}) => {
    if (!isOpen) return null;

    const difficultyNames = {
        easy: '初级',
        medium: '中级',
        hard: '高级',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
            <div className="theme-modal border rounded-2xl p-8 w-full max-w-md shadow-2xl text-center" style={{ borderColor: 'var(--card-border)' }}>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    恭喜完成训练！
                </h2>
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    你已完成 {difficultyNames[difficulty as keyof typeof difficultyNames] || '中级'} 训练计划的全部内容！
                </p>

                <div className="flex items-center justify-center space-x-2 mb-6">
                    <span className="text-4xl">🏆</span>
                    <span className="text-4xl">💪</span>
                    <span className="text-4xl">⭐</span>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg"
                >
                    太棒了！
                </button>
            </div>
        </div>
    );
};

export default { TrainingModeSelector, PlanProgress, PlanCompletedModal };
