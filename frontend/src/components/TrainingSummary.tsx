import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Clock, Target, TrendingUp, Share2, RotateCcw, X } from 'lucide-react';

interface TrainingSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseType: string;
    count: number;
    duration: number;
    score: number;
    accuracy: number;
    onRestart?: () => void;
}

const TrainingSummary: React.FC<TrainingSummaryProps> = ({
    isOpen,
    onClose,
    exerciseType,
    count,
    duration,
    score,
    accuracy,
    onRestart,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // 计算消耗卡路里（简化估算）
    const calculateCalories = () => {
        const caloriesMap: { [key: string]: number } = {
            '深蹲': 0.5,
            '俯卧撑': 0.6,
            '平板支撑': 0.3, // 每秒
            '开合跳': 0.8,
        };
        const rate = caloriesMap[exerciseType] || 0.5;
        return Math.round(count * rate);
    };

    const calories = calculateCalories();

    // 获取评价
    const getPerformanceRating = () => {
        if (score >= 90) return { text: '完美！', color: 'text-yellow-400', emoji: '🏆' };
        if (score >= 80) return { text: '优秀！', color: 'text-green-400', emoji: '🌟' };
        if (score >= 70) return { text: '良好！', color: 'text-blue-400', emoji: '👍' };
        if (score >= 60) return { text: '不错！', color: 'text-purple-400', emoji: '💪' };
        return { text: '继续加油！', color: 'text-gray-400', emoji: '🔥' };
    };

    const rating = getPerformanceRating();

    // 格式化时间
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return minutes > 0
            ? `${minutes}分${remainingSeconds}秒`
            : `${remainingSeconds}秒`;
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setIsVisible(true), 100);
            if (score >= 80) {
                setTimeout(() => setShowConfetti(true), 500);
            }
        } else {
            setIsVisible(false);
            setShowConfetti(false);
        }
    }, [isOpen, score]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            {/* 五彩纸屑效果 */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10%',
                                backgroundColor: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 5)],
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${2 + Math.random()}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            <div
                className={`relative theme-modal border-2 rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all duration-500 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                style={{ borderColor: 'var(--card-border)' }}
            >
                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <X size={20} />
                </button>

                {/* 标题区域 */}
                <div className="text-center mb-6">
                    <div className="text-6xl mb-3 animate-bounce">{rating.emoji}</div>
                    <h2 className={`text-3xl font-bold ${rating.color} mb-2`}>
                        {rating.text}
                    </h2>
                    <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                        训练完成
                    </p>
                </div>

                {/* 运动类型标签 */}
                <div className="flex justify-center mb-6">
                    <div className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                        <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                            {exerciseType}
                        </span>
                    </div>
                </div>

                {/* 数据卡片 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* 完成次数 */}
                    <div className="theme-card border rounded-2xl p-4 text-center transform hover:scale-105 transition-transform">
                        <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-accent)' }}>
                            {count}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {exerciseType === '平板支撑' ? '秒数' : '次数'}
                        </div>
                    </div>

                    {/* 训练时长 */}
                    <div className="theme-card border rounded-2xl p-4 text-center transform hover:scale-105 transition-transform">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <div className="text-3xl font-bold mb-1 text-green-400">
                            {formatTime(duration)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            用时
                        </div>
                    </div>

                    {/* 消耗卡路里 */}
                    <div className="theme-card border rounded-2xl p-4 text-center transform hover:scale-105 transition-transform">
                        <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                        <div className="text-3xl font-bold mb-1 text-orange-400">
                            {calories}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            卡路里
                        </div>
                    </div>

                    {/* 准确率 */}
                    <div className="theme-card border rounded-2xl p-4 text-center transform hover:scale-105 transition-transform">
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                        <div className="text-3xl font-bold mb-1 text-purple-400">
                            {Math.round(accuracy)}%
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            准确率
                        </div>
                    </div>
                </div>

                {/* 得分进度条 */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                        <span>综合得分</span>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{score}/100</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--btn-secondary-bg)' }}>
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${score >= 90 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                    score >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                        score >= 70 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                                            'bg-gradient-to-r from-purple-400 to-pink-500'
                                }`}
                            style={{ width: isVisible ? `${score}%` : '0%' }}
                        />
                    </div>
                </div>

                {/* 鼓励语 */}
                <div className="text-center mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-300">
                        {count >= 50 ? '🔥 今天状态爆棚！' :
                            count >= 30 ? '💪 坚持就是胜利！' :
                                count >= 20 ? '👏 很好的开始！' :
                                    '💫 每一次都是进步！'}
                    </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                    {onRestart && (
                        <button
                            onClick={() => {
                                onRestart();
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center transform hover:-translate-y-0.5"
                        >
                            <RotateCcw size={18} className="mr-2" />
                            再来一组
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl font-medium border transition-all theme-btn-secondary flex items-center justify-center"
                        style={{ borderColor: 'var(--card-border)' }}
                    >
                        完成
                    </button>
                </div>

                {/* 分享提示（可选） */}
                <div className="mt-4 text-center">
                    <button className="text-xs flex items-center justify-center mx-auto transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                        <Share2 size={14} className="mr-1" />
                        分享成绩
                    </button>
                </div>
            </div>

            {/* 五彩纸屑动画样式 */}
            <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-in-out forwards;
        }
      `}</style>
        </div>
    );
};

export default TrainingSummary;
