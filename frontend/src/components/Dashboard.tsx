import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Flame, Activity, Clock, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardApi, DashboardData } from '../services/api';

interface DashboardProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ userId, isOpen, onClose }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            loadDashboardData();
        }
    }, [isOpen, userId]);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const dashboardData = await dashboardApi.getDashboard(userId);
            if (dashboardData) {
                setData(dashboardData);
            } else {
                setError('无法加载仪表板数据');
            }
        } catch (err) {
            console.error('加载仪表板数据失败:', err);
            setError('加载数据失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const getExerciseName = (type: string) => {
        const names: { [key: string]: string } = {
            'squat': '深蹲',
            'pushup': '俯卧撑',
            'plank': '平板支撑',
            'jumping_jack': '开合跳'
        };
        return names[type] || type;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
            <div className="theme-modal border rounded-2xl p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl" style={{ borderColor: 'var(--card-border)' }}>
                {/* 头部 */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center" style={{ color: 'var(--text-primary)' }}>
                        <Activity className="mr-2 text-purple-500" size={28} />
                        个性化仪表板
                    </h2>
                    <button
                        onClick={onClose}
                        className="transition-colors p-2 rounded-full hover:opacity-70"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <div className="text-red-400 text-lg mb-4">{error}</div>
                        <button
                            onClick={loadDashboardData}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all"
                        >
                            重试
                        </button>
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* 摘要卡片 */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/30 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Flame className="w-5 h-5 text-orange-400" />
                                    <span className="text-xs text-gray-400">总卡路里</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{data.summary.total_calories}</div>
                                <div className="text-xs text-gray-400 mt-1">kcal</div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Activity className="w-5 h-5 text-blue-400" />
                                    <span className="text-xs text-gray-400">训练次数</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{data.summary.total_sessions}</div>
                                <div className="text-xs text-gray-400 mt-1">次</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="w-5 h-5 text-green-400" />
                                    <span className="text-xs text-gray-400">总时长</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{data.summary.total_duration_minutes}</div>
                                <div className="text-xs text-gray-400 mt-1">分钟</div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                                    <span className="text-xs text-gray-400">总动作数</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{data.summary.total_count}</div>
                                <div className="text-xs text-gray-400 mt-1">个</div>
                            </div>
                        </div>

                        {/* 图表区域 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Activity Trends - 活动趋势折线图 */}
                            <div className="bg-black/20 border border-white/10 rounded-xl p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                                    <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                                    活动趋势
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={data.daily_data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return `${date.getMonth() + 1}/${date.getDate()}`;
                                            }}
                                        />
                                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '8px'
                                            }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="count" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2}
                                            dot={{ fill: '#3b82f6', r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* 卡路里消耗 - 柱状图 */}
                            <div className="bg-black/20 border border-white/10 rounded-xl p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                                    <Flame className="w-5 h-5 mr-2 text-orange-400" />
                                    卡路里消耗
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={data.daily_data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return `${date.getMonth() + 1}/${date.getDate()}`;
                                            }}
                                        />
                                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '8px'
                                            }}
                                            labelStyle={{ color: '#fff' }}
                                            formatter={(value: number) => [`${value} kcal`, '卡路里']}
                                        />
                                        <Bar dataKey="calories" fill="#f97316" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 运动类型分布和最近记录 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* 运动类型分布 */}
                            <div className="bg-black/20 border border-white/10 rounded-xl p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                                    <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                                    运动类型分布
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data.exercise_stats.map(stat => ({
                                                name: getExerciseName(stat.exercise_type),
                                                value: stat.total_count
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {data.exercise_stats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-4 space-y-2">
                                    {data.exercise_stats.map((stat, index) => (
                                        <div key={stat.exercise_type} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center">
                                                <div 
                                                    className="w-3 h-3 rounded-full mr-2" 
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    {getExerciseName(stat.exercise_type)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span style={{ color: 'var(--text-primary)' }}>{stat.total_count}次</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{stat.total_calories}kcal</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 最近训练记录 */}
                            <div className="bg-black/20 border border-white/10 rounded-xl p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                                    <Clock className="w-5 h-5 mr-2 text-green-400" />
                                    最近训练记录
                                </h3>
                                <div className="space-y-3 overflow-y-auto" style={{ height: '400px', maxHeight: '400px' }}>
                                    {data.recent_records.length > 0 ? (
                                        data.recent_records.map((record) => (
                                            <div 
                                                key={record.id} 
                                                className="bg-blue-900/20 border border-blue-300/20 hover:bg-blue-900/30 transition-colors p-4 rounded-xl"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-white">{getExerciseName(record.exercise_type)}</div>
                                                        <div className="text-xs text-gray-400 mt-1">{record.date}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-orange-400">
                                                            {record.calories} kcal
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs border-t border-blue-300/20 pt-2">
                                                    <div>
                                                        <span className="text-gray-500">次数:</span>
                                                        <span className="text-green-400 font-bold ml-2">{record.count}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">时长:</span>
                                                        <span className="text-blue-400 font-bold ml-2">
                                                            {Math.floor(record.duration / 60)}分{record.duration % 60}秒
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">暂无训练记录</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Dashboard;



