import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, Cpu, HardDrive, Clock, X, AlertTriangle, CheckCircle } from 'lucide-react';

const SystemMonitor: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [health, setHealth] = useState<any>(null);
    const [info, setInfo] = useState<any>(null);
    const [memory, setMemory] = useState<{ used: number; max: number } | null>(null);
    const [cpu, setCpu] = useState<number>(0);
    const [uptime, setUptime] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    };

    const fetchData = async () => {
        try {
            setError(null);

            const backendBaseUrl = process.env.REACT_APP_API_URL || '';
            
            // 1. Health - 核心健康检查
            try {
                const healthRes = await fetch(`${backendBaseUrl}/actuator/health`);
                if (healthRes.ok) {
                    const healthData = await healthRes.json();
                    console.log('Health data:', healthData);
                    setHealth(healthData);
                }
            } catch (e) { console.error('Health fetch failed', e); }

            // 2. Info - 应用信息
            try {
                const infoRes = await fetch(`${backendBaseUrl}/actuator/info`);
                if (infoRes.ok) {
                    const infoData = await infoRes.json();
                    setInfo(infoData);
                }
            } catch (e) { console.error('Info fetch failed', e); }

            // 3. Memory - JVM 内存
            try {
                const memUsedRes = await fetch(`${backendBaseUrl}/actuator/metrics/jvm.memory.used`);
                const memMaxRes = await fetch(`${backendBaseUrl}/actuator/metrics/jvm.memory.max`);
                if (memUsedRes.ok && memMaxRes.ok) {
                    const memUsedData = await memUsedRes.json();
                    const memMaxData = await memMaxRes.json();
                    setMemory({
                        used: memUsedData.measurements[0].value,
                        max: memMaxData.measurements[0].value
                    });
                }
            } catch (e) { console.error('Memory fetch failed', e); }

            // 4. CPU - 系统 CPU
            try {
                const cpuRes = await fetch(`${backendBaseUrl}/actuator/metrics/system.cpu.usage`);
                if (cpuRes.ok) {
                    const cpuData = await cpuRes.json();
                    setCpu(cpuData.measurements[0].value * 100);
                }
            } catch (e) { console.error('CPU fetch failed', e); }

            // 5. Uptime - 运行时间
            try {
                const uptimeRes = await fetch(`${backendBaseUrl}/actuator/metrics/process.uptime`);
                if (uptimeRes.ok) {
                    const uptimeData = await uptimeRes.json();
                    setUptime(uptimeData.measurements[0].value);
                }
            } catch (e) { console.error('Uptime fetch failed', e); }

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch monitoring data', error);
            setError('无法连接到后端服务');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    // 获取数据库状态 - 兼容 "db" 或 "database" 两种字段名
    const getDbStatus = () => {
        return health?.components?.db?.status || health?.components?.database?.status || null;
    };

    const getDbDetails = () => {
        return health?.components?.db?.details || health?.components?.database?.details || null;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-white">正在连接后端服务...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center space-x-3">
                        <Activity className="text-green-400 w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-bold text-white">系统监控</h2>
                            <p className="text-xs text-slate-400">Spring Boot Actuator 仪表板</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center text-red-400">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* Status Card */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-300 font-medium flex items-center">
                                <Server className="w-4 h-4 mr-2 text-blue-400" /> 应用状态
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold flex items-center ${health?.status === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {health?.status === 'UP' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {health?.status === 'UP' ? '运行中' : health?.status || '未知'}
                            </span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-400">
                                <span>名称:</span> <span className="text-white">{info?.app?.name || 'FitnessAI'}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>版本:</span> <span className="text-white">{info?.app?.version || '1.0.0'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Database Card */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-300 font-medium flex items-center">
                                <Database className="w-4 h-4 mr-2 text-purple-400" /> 数据库
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold flex items-center ${getDbStatus() === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {getDbStatus() === 'UP' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {getDbStatus() === 'UP' ? '已连接' : getDbStatus() || '未知'}
                            </span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-400">
                                <span>类型:</span> <span className="text-white">{getDbDetails()?.database || 'PostgreSQL'}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>提供商:</span> <span className="text-white">Neon Cloud</span>
                            </div>
                        </div>
                    </div>

                    {/* Uptime Card */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-300 font-medium flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-orange-400" /> 运行时间
                            </h3>
                        </div>
                        <div className="text-2xl font-bold text-white text-center py-2">
                            {formatUptime(uptime)}
                        </div>
                    </div>

                    {/* CPU Usage */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 md:col-span-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-300 font-medium flex items-center">
                                <Cpu className="w-4 h-4 mr-2 text-cyan-400" /> CPU 使用率
                            </h3>
                            <span className="text-cyan-400 font-bold">{cpu.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                            <div className="bg-cyan-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(cpu, 100)}%` }}></div>
                        </div>
                    </div>

                    {/* Memory Usage */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-300 font-medium flex items-center">
                                <HardDrive className="w-4 h-4 mr-2 text-pink-400" /> 内存 (JVM)
                            </h3>
                            <span className="text-pink-400 font-bold">
                                {memory ? `${formatBytes(memory.used)} / ${formatBytes(memory.max)}` : '-'}
                            </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                            <div className="bg-pink-400 h-2.5 rounded-full transition-all duration-500" style={{ width: memory ? `${Math.min((memory.used / memory.max) * 100, 100)}%` : '0%' }}></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SystemMonitor;
