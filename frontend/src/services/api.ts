// API 服务 - 与后端通信
// 使用相对路径，在Docker环境中通过Nginx代理到后端
const API_BASE_URL = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/api` 
    : '/api';

// 获取后端基础URL（用于Actuator等非/api路径）
export const getBackendBaseUrl = () => {
    return process.env.REACT_APP_API_URL || '';
};

export interface UserProfile {
    name: string;
    age: number;
    height: number;
    weight: number;
    goal: string;
    avatar: string;
}

export interface ExerciseRecordData {
    exercise_type: string;
    count: number;
    duration: number;
    score: number;
    accuracy: number;
}

export interface HistoryRecord {
    id: number;
    exercise_type: string;
    count: number;
    duration: number;
    score: number;
    accuracy: number;
    date: string;
    recorded_at: string;
}

// 用户资料 API
export const userApi = {
    // 获取用户资料
    async getProfile(userId: string): Promise<UserProfile | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/profile`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('获取用户资料失败:', error);
            return null;
        }
    },

    // 更新用户资料
    async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });
            return response.ok;
        } catch (error) {
            console.error('更新用户资料失败:', error);
            return false;
        }
    },
};


// 运动记录 API
export const recordApi = {
    // 保存运动记录
    async saveRecord(userId: string, record: ExerciseRecordData): Promise<HistoryRecord | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record),
            });
            // 204 No Content 表示记录被过滤（无效记录），返回null
            if (response.status === 204) {
                return null;
            }
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('保存运动记录失败:', error);
            return null;
        }
    },

    // 获取历史记录（支持筛选和排序）
    async getRecords(
        userId: string,
        filters?: {
            exerciseType?: string;
            minScore?: number;
            maxScore?: number;
            minAccuracy?: number;
            maxAccuracy?: number;
            sortBy?: string;
        }
    ): Promise<HistoryRecord[]> {
        try {
            const params = new URLSearchParams();
            if (filters) {
                if (filters.exerciseType) params.append('exerciseType', filters.exerciseType);
                if (filters.minScore !== undefined) params.append('minScore', filters.minScore.toString());
                if (filters.maxScore !== undefined) params.append('maxScore', filters.maxScore.toString());
                if (filters.minAccuracy !== undefined) params.append('minAccuracy', filters.minAccuracy.toString());
                if (filters.maxAccuracy !== undefined) params.append('maxAccuracy', filters.maxAccuracy.toString());
                if (filters.sortBy) params.append('sortBy', filters.sortBy);
            }
            
            const url = `${API_BASE_URL}/user/${userId}/records${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('获取历史记录失败:', error);
            return [];
        }
    },

    // 获取今日统计
    async getTodayStats(userId: string): Promise<{ total_count: number; by_exercise: any[] } | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/stats/today`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('获取今日统计失败:', error);
            return null;
        }
    },

    // 获取今日某运动次数
    async getTodayCount(userId: string, exerciseType: string): Promise<number> {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/stats/today/${exerciseType}`);
            if (response.ok) {
                const data = await response.json();
                return data.count || 0;
            }
            return 0;
        } catch (error) {
            console.error('获取今日运动次数失败:', error);
            return 0;
        }
    },
};

// 仪表板数据接口
export interface DashboardData {
    user: {
        name: string;
        weight: number;
        goal: string;
    };
    summary: {
        total_calories: number;
        total_sessions: number;
        total_duration_minutes: number;
        total_count: number;
    };
    daily_data: Array<{
        date: string;
        calories: number;
        count: number;
        duration: number;
    }>;
    exercise_stats: Array<{
        exercise_type: string;
        total_count: number;
        total_duration: number;
        total_calories: number;
        sessions: number;
    }>;
    recent_records: Array<{
        id: number;
        exercise_type: string;
        count: number;
        duration: number;
        date: string;
        calories: number;
    }>;
}

// 仪表板 API
export const dashboardApi = {
    // 获取仪表板数据
    async getDashboard(userId: string): Promise<DashboardData | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/dashboard`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('获取仪表板数据失败:', error);
            return null;
        }
    },
};

export default { userApi, recordApi, dashboardApi };
