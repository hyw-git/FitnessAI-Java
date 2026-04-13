import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Monitor, Activity, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';

export interface AppSettings {
    soundEnabled: boolean;
    voiceEnabled: boolean;
    theme: string;
    language: string;
    difficulty: string;
    autoStart: boolean;
    notifications: boolean;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
    onClearData: () => void;
    userId: string;
    isInitialized: boolean;
    isActive: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSave,
    onClearData,
    userId,
    isInitialized,
    isActive
}) => {
    const [tempSettings, setTempSettings] = useState<AppSettings>(settings);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // 当弹窗打开或 settings prop 更新时，重置 tempSettings
    useEffect(() => {
        if (isOpen) {
            setTempSettings(settings);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
            <div
                className="theme-modal border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto custom-scrollbar shadow-2xl"
                style={{ borderColor: 'var(--card-border)' }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>系统设置</h2>
                    <button
                        onClick={onClose}
                        className="transition-colors p-2 rounded-full hover:opacity-70" style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* 声音设置 */}
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            {tempSettings.soundEnabled ? <Volume2 size={16} className="mr-2" /> : <VolumeX size={16} className="mr-2" />}
                            声音设置
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={tempSettings.soundEnabled}
                                    onChange={(e) => setTempSettings({ ...tempSettings, soundEnabled: e.target.checked })}
                                    className="mr-2 accent-blue-500"
                                />
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>启用音效</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={tempSettings.voiceEnabled}
                                    onChange={(e) => setTempSettings({ ...tempSettings, voiceEnabled: e.target.checked })}
                                    className="mr-2 accent-blue-500"
                                />
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>语音指导</span>
                            </label>
                        </div>
                    </div>

                    {/* 显示设置 */}
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <Monitor size={16} className="mr-2" />
                            显示设置
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>主题</label>
                                <div className="flex bg-black/10 rounded-xl p-1 border" style={{ borderColor: 'var(--card-border)' }}>
                                    {[
                                        { id: 'dark', label: '深色', icon: '🌙' },
                                        { id: 'light', label: '浅色', icon: '☀️' },
                                        { id: 'auto', label: '自动', icon: '⚙️' }
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setTempSettings({ ...tempSettings, theme: item.id })}
                                            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${tempSettings.theme === item.id
                                                ? 'shadow-md scale-100'
                                                : 'text-gray-500 hover:text-gray-400 hover:bg-white/5'
                                                }`}
                                            style={tempSettings.theme === item.id ? {
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--text-accent)'
                                            } : {}}
                                        >
                                            <span className="mr-1.5">{item.icon}</span>
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 训练设置 */}
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <Activity size={16} className="mr-2" />
                            训练设置
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-black/5 transition-colors">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${tempSettings.autoStart ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                    {tempSettings.autoStart && <CheckCircle size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={tempSettings.autoStart}
                                    onChange={(e) => setTempSettings({ ...tempSettings, autoStart: e.target.checked })}
                                    className="hidden"
                                />
                                <span className="text-sm select-none" style={{ color: 'var(--text-primary)' }}>自动开始下一组</span>
                            </label>

                            <label className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-black/5 transition-colors">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${tempSettings.notifications ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                    {tempSettings.notifications && <CheckCircle size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={tempSettings.notifications}
                                    onChange={(e) => setTempSettings({ ...tempSettings, notifications: e.target.checked })}
                                    className="hidden"
                                />
                                <span className="text-sm select-none" style={{ color: 'var(--text-primary)' }}>启用训练提醒</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 系统信息 */}
                <div className="border-t pt-4" style={{ borderColor: 'var(--card-border)' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>系统信息</h3>
                    <div className="space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <div>版本: 1.0.0</div>
                        <div>用户ID: {userId.substring(0, 8)}...</div>
                        <div>MediaPipe: {isInitialized ? '已加载' : '未加载'}</div>
                        <div>摄像头: {isActive ? '已连接' : '未连接'}</div>
                    </div>
                </div>

                {/* 危险操作 */}
                <div className="border-t pt-4" style={{ borderColor: 'var(--card-border)' }}>
                    <h3 className="font-semibold mb-3 flex items-center text-red-400">
                        <AlertTriangle size={16} className="mr-2" />
                        危险操作
                    </h3>
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className="w-full flex items-center justify-center px-4 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={18} className="mr-2" />
                        清除所有数据
                    </button>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                        此操作将删除本地所有历史记录和设置数据，且无法恢复。
                    </p>
                </div>

                <div className="flex space-x-3 mt-6">
                    <button
                        onClick={() => onSave(tempSettings)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg"
                    >
                        确定
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium border theme-btn-secondary"
                        style={{ borderColor: 'var(--card-border)' }}
                    >
                        取消
                    </button>
                </div>
            </div>

            {/* 清除数据确认弹窗 */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="theme-modal border rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ borderColor: 'var(--card-border)' }}>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                确认清除所有数据？
                            </h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                                此操作将清除所有本地历史记录、设置和用户数据。此操作无法撤销！
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="flex-1 px-4 py-2 rounded-lg font-medium border theme-btn-secondary"
                                    style={{ borderColor: 'var(--card-border)' }}
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        onClearData();
                                        setShowClearConfirm(false);
                                        onClose();
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    确认清除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsModal;
