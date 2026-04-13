import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sunset, Coffee, Dumbbell, Target, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
    userName: string;
    onDismiss: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ userName, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    // 获取当前时间的问候语
    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 9) {
            return {
                greeting: '早上好',
                icon: <Coffee className="text-orange-400" size={32} />,
                message: '早起运动，活力满满！',
                tip: '建议先做一些轻度拉伸唤醒身体',
                bgGradient: 'from-orange-500/20 via-yellow-500/10 to-transparent',
                accentColor: 'text-orange-400'
            };
        } else if (hour >= 9 && hour < 12) {
            return {
                greeting: '上午好',
                icon: <Sun className="text-yellow-400" size={32} />,
                message: '美好的一天从运动开始！',
                tip: '上午是力量训练的黄金时间',
                bgGradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
                accentColor: 'text-yellow-400'
            };
        } else if (hour >= 12 && hour < 14) {
            return {
                greeting: '中午好',
                icon: <Sun className="text-amber-400" size={32} />,
                message: '午休时间，适当活动一下！',
                tip: '午后运动注意不要过于剧烈',
                bgGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
                accentColor: 'text-amber-400'
            };
        } else if (hour >= 14 && hour < 17) {
            return {
                greeting: '下午好',
                icon: <Target className="text-blue-400" size={32} />,
                message: '下午是肌肉反应最佳时段！',
                tip: '适合进行高强度训练',
                bgGradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
                accentColor: 'text-blue-400'
            };
        } else if (hour >= 17 && hour < 19) {
            return {
                greeting: '傍晚好',
                icon: <Sunset className="text-pink-400" size={32} />,
                message: '下班后来一场酣畅的运动！',
                tip: '傍晚时分体能达到峰值',
                bgGradient: 'from-pink-500/20 via-purple-500/10 to-transparent',
                accentColor: 'text-pink-400'
            };
        } else if (hour >= 19 && hour < 22) {
            return {
                greeting: '晚上好',
                icon: <Moon className="text-indigo-400" size={32} />,
                message: '夜晚运动，释放压力！',
                tip: '晚间运动有助于提高睡眠质量',
                bgGradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
                accentColor: 'text-indigo-400'
            };
        } else {
            return {
                greeting: '夜深了',
                icon: <Sparkles className="text-purple-400" size={32} />,
                message: '注意休息，明天继续加油！',
                tip: '充足睡眠是健身的重要部分',
                bgGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
                accentColor: 'text-purple-400'
            };
        }
    };

    const greetingData = getGreeting();
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    // 自动消失
    useEffect(() => {
        const timer = setTimeout(() => {
            handleDismiss();
        }, 4000); // 4秒后自动消失

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onDismiss();
        }, 500);
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}
            onClick={handleDismiss}
        >
            {/* 背景装饰 */}
            <div className={`absolute inset-0 bg-gradient-to-t ${greetingData.bgGradient}`}></div>
            <div className="absolute inset-0 overflow-hidden">
                {/* 动态光效 */}
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent rounded-full animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/5 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* 主内容 */}
            <div className={`relative text-center px-8 transform transition-all duration-700 ${isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
                {/* Logo/Icon */}
                <div className="mb-8">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 mb-6 animate-bounce" style={{ animationDuration: '2s' }}>
                        <Dumbbell className="text-white" size={40} />
                    </div>
                </div>

                {/* 问候语 */}
                <div className="flex items-center justify-center mb-4">
                    {greetingData.icon}
                    <h1 className={`text-4xl md:text-5xl font-bold ml-3 ${greetingData.accentColor}`}>
                        {greetingData.greeting}
                    </h1>
                </div>

                {/* 用户名 */}
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {userName}
                </h2>

                {/* 日期 */}
                <p className="text-gray-400 text-lg mb-6">{dateStr}</p>

                {/* 励志语 */}
                <div className="max-w-md mx-auto">
                    <p className="text-xl text-gray-300 mb-3">{greetingData.message}</p>
                    <p className="text-sm text-gray-500 italic">💡 {greetingData.tip}</p>
                </div>

                {/* 点击提示 */}
                <div className="mt-12 text-gray-600 text-sm animate-pulse">
                    点击任意处开始
                </div>

                {/* 进度条 */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-48">
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${greetingData.accentColor.replace('text-', 'from-')} to-white/50 rounded-full`}
                            style={{
                                animation: 'progress 4s linear forwards'
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* 进度条动画样式 */}
            <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
        </div>
    );
};

export default WelcomeScreen;
