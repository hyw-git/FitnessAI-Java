import React from 'react';
import { Activity, Users, Settings, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
    initError: string | null;
    isInitialized: boolean;
    isBackendConnected: boolean;
    onOpenProfile: () => void;
    onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({
    initError,
    isInitialized,
    isBackendConnected,
    onOpenProfile,
    onOpenSettings
}) => {
    return (
        <nav className="fixed top-0 w-full z-50 theme-nav border-b transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center group cursor-pointer transform hover:scale-105 transition-transform duration-200">
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-3">
                            <span className="block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500" style={{ WebkitBackgroundClip: 'text' }}>FitnessAI</span>
                            <span className="block text-xs font-medium tracking-wider" style={{ color: 'var(--text-accent)' }}>PRO EDITION</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-6">
                        {/* AI状态指示器 */}
                        <div className="hidden md:flex rounded-full px-4 py-1.5 border" style={{ background: 'var(--btn-secondary-bg)', borderColor: 'var(--card-border)' }}>
                            {!isBackendConnected ? (
                                <div className="flex items-center text-rose-400 text-sm font-medium">
                                    <WifiOff size={14} className="mr-2" />
                                    <span>后端未连接</span>
                                </div>
                            ) : initError ? (
                                <div className="flex items-center text-amber-400 text-sm font-medium">
                                    <Wifi size={14} className="mr-2" />
                                    <span>MediaPipe异常</span>
                                </div>
                            ) : !isInitialized ? (
                                <div className="flex items-center text-amber-400 text-sm font-medium">
                                    <Wifi size={14} className="mr-2 animate-pulse" />
                                    <span>AI初始化中</span>
                                </div>
                            ) : (
                                <div className="flex items-center text-emerald-400 text-sm font-medium">
                                    <Wifi size={14} className="mr-2" />
                                    <span>AI已就绪</span>
                                </div>
                            )}
                        </div>

                        <div className="hidden md:block h-6 w-px bg-blue-900/30"></div>

                        <div className="flex items-center space-x-3">
                            <button
                                className="p-2.5 rounded-xl theme-btn-secondary hover:opacity-80 transition-all duration-200 border border-transparent"
                                onClick={onOpenProfile}
                                title="个人资料"
                            >
                                <Users size={20} />
                            </button>
                            <button
                                className="p-2.5 rounded-xl theme-btn-secondary hover:opacity-80 transition-all duration-200 border border-transparent"
                                onClick={onOpenSettings}
                                title="设置"
                            >
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
