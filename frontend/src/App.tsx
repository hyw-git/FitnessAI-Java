import React, { useState, useEffect, useCallback } from 'react';
import CameraView from './components/CameraView';
import StatsPanel from './components/StatsPanel';
import ExerciseSelector from './components/ExerciseSelector';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import { TrainingModeSelector, PlanProgress, PlanDetailData } from './components/TrainingMode';
import WelcomeScreen from './components/WelcomeScreen';
import TrainingSummary from './components/TrainingSummary';
import Dashboard from './components/Dashboard';
import { usePoseDetection } from './hooks/usePoseDetection';
import { recordApi, userApi } from './services/api';
import { testAllExerciseTypes } from './utils/apiTest';
import { formatTime as formatRecordedTime } from './utils/dateUtils';
import { Activity, Users, Settings, Edit3, Save, X, Clock, RotateCcw, BarChart3, LayoutDashboard, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import SystemMonitor from './components/SystemMonitor';
import { ToastContainer, useToast } from './components/Toast';
import './App.css';

function App() {
  const [duration, setDuration] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  // 历史记录筛选和排序状态
  const [historyFilters, setHistoryFilters] = useState({
    exerciseType: '',
    minScore: '',
    maxScore: '',
    minAccuracy: '',
    maxAccuracy: '',
    sortBy: 'date'
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false); // System Monitor Dashboard state
  const [showDashboard, setShowDashboard] = useState(false); // Personal Dashboard state
  const [todayTotalCount, setTodayTotalCount] = useState(0);

  // Toast notifications
  const { toasts, addToast, removeToast } = useToast();

  // 开屏欢迎界面状态（每次会话只显示一次）
  const [showWelcome, setShowWelcome] = useState(() => {
    return !sessionStorage.getItem('welcome_shown');
  });

  // 计划模式相关状态
  const [trainingMode, setTrainingMode] = useState<'free' | 'plan' | 'test'>('free'); // 自由模式 or 计划模式 or 测试模式
  const [isTestMode, setIsTestMode] = useState(false); // 测试模式标志
  const [activePlan, setActivePlan] = useState<{
    difficulty: string;
    exercises: {
      type: string;
      sets: number;
      reps: number;
      restTime: number;
    }[];
    currentExerciseIndex: number;
    currentSet: number;
    targetReps: number;
  } | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [restCountdown, setRestCountdown] = useState(0);
  const [showModeSelector, setShowModeSelector] = useState(false);

  // 计划统计数据（用于总结卡片）
  const [planStats, setPlanStats] = useState({
    totalCount: 0,
    totalDuration: 0,
    totalScore: 0,
    exercises: [] as string[],
  });

  // 已完成的计划信息（用于 StatsPanel 显示）
  const [completedPlanInfo, setCompletedPlanInfo] = useState<{
    difficulty: string;
    totalCount: number;
    totalDuration: number;
    completedAt: Date;
  } | null>(null);

  // 新增状态：个人资料弹窗
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: localStorage.getItem('user_name') || '健身达人',
    age: localStorage.getItem('user_age') || '25',
    height: localStorage.getItem('user_height') || '170',
    weight: localStorage.getItem('user_weight') || '65',
    goal: localStorage.getItem('user_goal') || '减脂',
    avatar: localStorage.getItem('user_avatar') || '🏋️'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState(userProfile);

  // 新增状态：设置弹窗
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    soundEnabled: localStorage.getItem('sound_enabled') !== 'false',
    voiceEnabled: localStorage.getItem('voice_enabled') !== 'false',
    language: localStorage.getItem('language') || 'zh-CN',
    theme: localStorage.getItem('theme') || 'dark',
    difficulty: localStorage.getItem('difficulty') || 'medium',
    autoStart: localStorage.getItem('auto_start') === 'true',
    notifications: localStorage.getItem('notifications') !== 'false'
  });

  // 训练总结状态
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState({
    exerciseType: '',
    count: 0,
    duration: 0,
    score: 0,
    accuracy: 0,
  });


  // 主题应用逻辑
  useEffect(() => {
    const applyTheme = (theme: string) => {
      if (theme === 'auto') {
        // 检测系统主题偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    applyTheme(settings.theme);

    // 监听系统主题变化（仅在 auto 模式下）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'auto') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  // 用户ID管理
  const [userId] = useState(() => {
    let uid = localStorage.getItem('user_id');
    if (!uid) {
      uid = `web_user_${Date.now()}`;
      localStorage.setItem('user_id', uid);
    }
    return uid;
  });

  // 只在App顶层调用一次
  const poseDetection = usePoseDetection();

  // 后端健康检查
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const response = await fetch(`${apiUrl}/api`, {
          method: 'GET',
          mode: 'cors',
        });
        setIsBackendConnected(response.ok);

        // 在开发环境下，添加调试功能
        if (process.env.NODE_ENV === 'development' && window.location.search.includes('debug=true')) {
          console.log('=== 开发模式：检测到调试参数 ===');
          await testAllExerciseTypes();
        }
      } catch (error) {
        setIsBackendConnected(false);
      }
    };

    // 立即检查一次
    checkBackendHealth();

    // 每 10 秒检查一次
    const interval = setInterval(checkBackendHealth, 10000);

    return () => clearInterval(interval);
  }, []);

  // 从后端加载用户资料
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isBackendConnected) {
        try {
          const profile = await userApi.getProfile(userId);
          if (profile && profile.name) {
            // 后端有数据，更新本地状态
            setUserProfile({
              name: profile.name || '健身达人',
              age: String(profile.age || 25),
              height: String(profile.height || 170),
              weight: String(profile.weight || 65),
              goal: profile.goal || '减脂',
              avatar: profile.avatar || '🏋️',
            });
            setTempProfile({
              name: profile.name || '健身达人',
              age: String(profile.age || 25),
              height: String(profile.height || 170),
              weight: String(profile.weight || 65),
              goal: profile.goal || '减脂',
              avatar: profile.avatar || '🏋️',
            });
            console.log('✅ 用户资料已从数据库加载');
          }
        } catch (error) {
          console.error('从后端加载用户资料失败:', error);
        }
      }
    };
    loadUserProfile();
  }, [isBackendConnected, userId]);
  const {
    exerciseStats,
    setExerciseStats,
    isActive,
    isInitialized,
    initError,
    currentExercise,
    startDetection: originalStartDetection,
    stopDetection: originalStopDetection,
    resetStats,
    switchExercise: originalSwitchExercise
  } = poseDetection;

  // 辅助函数：获取运动名称（使用useCallback避免重复渲染）
  const getExerciseName = useCallback((id: string) => {
    const exerciseNames: { [key: string]: string } = {
      'squat': '深蹲',
      'pushup': '俯卧撑',
      'plank': '平板支撑',
      'jumping_jack': '开合跳'
    };
    return exerciseNames[id] || '未知运动';
  }, []);

  // 包装 switchExercise 函数，切换运动时同时重置计时器和今日次数
  const handleSwitchExercise = useCallback((exercise: string) => {
    originalSwitchExercise(exercise);
    setDuration(0); // 重置计时器

    // 重新计算该运动类型的今日次数
    const today = new Date().toLocaleDateString('zh-CN');
    const todayCount = historyRecords
      .filter((r: any) => r.date === today && r.exercise_type === getExerciseName(exercise))
      .reduce((sum: number, r: any) => sum + (r.count || 0), 0);
    setTodayTotalCount(todayCount);
  }, [originalSwitchExercise, historyRecords]);

  // 页面加载时获取今日次数
  useEffect(() => {
    const fetchTodayCount = async () => {
      if (isBackendConnected) {
        try {
          const count = await recordApi.getTodayCount(userId, currentExercise);
          setTodayTotalCount(count);
        } catch (error) {
          console.error('获取今日次数失败:', error);
        }
      }
    };
    fetchTodayCount();
  }, [isBackendConnected, userId, currentExercise]);

  // 包装startDetection函数以添加倒计时
  const startDetection = async () => {
    if (!isInitialized) {
      return;
    }

    // 重要：在开始前先重置计数，避免继承之前的数据
    console.log('[开始训练] 重置计数器');
    resetStats();

    // 开始倒计时
    setDuration(0); // 重置计时器
    setIsCountingDown(true);
    setCountdown(3);

    // 倒计时逻辑
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 倒计时结束，开始正式检测
    setIsCountingDown(false);
    await originalStartDetection();
  };

  // 包装stopDetection函数以保存历史记录
  const stopDetection = async () => {
    // 如果正在倒计时，取消倒计时
    if (isCountingDown) {
      setIsCountingDown(false);
      setCountdown(3);
      return;
    }

    // 1. 立即停止 UI 相关的计时器和状态 (提升响应速度)
    setIsTimerActive(false);

    // 2. 立即调用停止检测 (现在是非阻塞的)
    // 注意：这里仍然 await 也可以，因为我们已经修改了 hook 内部逻辑为非阻塞网络请求
    // 但为了保险，我们先更新 UI，再调用这个
    await originalStopDetection();

    // 3. 准备数据并在后台保存 (不阻塞 UI)
    const minValidCount = 3;
    const minValidDuration = 30;

    // 使用当前快照的数据
    const currentStats = { ...exerciseStats };
    const currentDuration = duration;

    const isValidTraining = currentStats.count >= minValidCount ||
      (currentDuration >= minValidDuration && currentStats.count > 0);

    if (isValidTraining) {
      const record = {
        exercise_type: currentExercise,
        duration: currentDuration,
        count: currentStats.count,
        score: currentStats.score,
        accuracy: currentStats.accuracy
      };

      console.log('📝 开始后台保存记录...');
      // 异步保存，不阻塞用户界面
      saveHistoryRecord(record).then(savedRecord => {
        if (savedRecord) {
          console.log('✅ 训练记录已保存 (后台)');
          // 更新今日总次数
          setTodayTotalCount(prev => prev + currentStats.count);
        }
      }).catch(err => {
        console.error('❌ 后台保存记录失败:', err);
      });
    } else {
      console.log('⏭️ 训练不满足最低要求，不保存记录 (次数:', currentStats.count, ', 时长:', currentDuration, '秒)');
    }

    // 注意：不要立即重置 duration，以便用户能看到最终时长
    // setDuration(0) 将在 startDetection 中调用
  };

  // 生成训练计划数据
  const generateTrainingPlan = useCallback((difficulty: string) => {
    const plans = {
      easy: {
        exercises: [
          { type: 'squat', sets: 2, reps: 10, restTime: 60 },
          { type: 'pushup', sets: 2, reps: 8, restTime: 60 },
          { type: 'plank', sets: 2, reps: 20, restTime: 60 }, // plank 用秒数
          { type: 'jumping_jack', sets: 2, reps: 15, restTime: 60 },
        ]
      },
      medium: {
        exercises: [
          { type: 'squat', sets: 3, reps: 15, restTime: 45 },
          { type: 'pushup', sets: 3, reps: 12, restTime: 45 },
          { type: 'plank', sets: 3, reps: 45, restTime: 45 },
          { type: 'jumping_jack', sets: 3, reps: 25, restTime: 45 },
        ]
      },
      hard: {
        exercises: [
          { type: 'squat', sets: 4, reps: 20, restTime: 30 },
          { type: 'pushup', sets: 4, reps: 18, restTime: 30 },
          { type: 'plank', sets: 4, reps: 60, restTime: 30 },
          { type: 'jumping_jack', sets: 4, reps: 40, restTime: 30 },
        ]
      },
      test: {
        exercises: [
          { type: 'squat', sets: 1, reps: 5, restTime: 30 },
          { type: 'pushup', sets: 1, reps: 5, restTime: 30 },
          { type: 'jumping_jack', sets: 1, reps: 5, restTime: 30 },
        ]
      }
    };
    return plans[difficulty as keyof typeof plans] || plans.medium;
  }, []);

  // 开始计划模式训练
  const startPlanTraining = useCallback((difficulty: string) => {
    console.log('[计划模式] 开始初始化计划...');
    const planData = generateTrainingPlan(difficulty);
    const firstExercise = planData.exercises[0];

    // 重要：重置运动计数，避免继承自由模式下的计数
    resetStats();
    setDuration(0);

    console.log('[计划模式] 设置计划数据', {
      difficulty,
      firstExercise: firstExercise.type,
      targetReps: firstExercise.reps,
    });

    setActivePlan({
      difficulty,
      exercises: planData.exercises,
      currentExerciseIndex: 0,
      currentSet: 1,
      targetReps: firstExercise.reps,
    });

    setTrainingMode('plan');
    setIsTestMode(false);
    setShowModeSelector(false);

    // 初始化计划统计数据
    setPlanStats({
      totalCount: 0,
      totalDuration: 0,
      totalScore: 0,
      exercises: [],
    });

    //切换到第一个运动（这也会调用 resetStats）
    handleSwitchExercise(firstExercise.type);

    console.log('[计划模式] 计划初始化完成，等待用户点击开始');
  }, [generateTrainingPlan, handleSwitchExercise, resetStats]);

  // 开始测试模式训练
  const startTestModeTraining = useCallback(() => {
    console.log('[测试模式] 开始初始化测试计划...');
    const planData = generateTrainingPlan('test');
    const firstExercise = planData.exercises[0];

    // 重要：重置运动计数，避免继承自由模式下的计数
    resetStats();
    setDuration(0);

    console.log('[测试模式] 设置测试计划数据', {
      firstExercise: firstExercise.type,
      targetReps: firstExercise.reps,
    });

    setActivePlan({
      difficulty: 'test',
      exercises: planData.exercises,
      currentExerciseIndex: 0,
      currentSet: 1,
      targetReps: firstExercise.reps,
    });

    setTrainingMode('test');
    setIsTestMode(true);
    setShowModeSelector(false);

    // 初始化计划统计数据
    setPlanStats({
      totalCount: 0,
      totalDuration: 0,
      totalScore: 0,
      exercises: [],
    });

    //切换到第一个运动（这也会调用 resetStats）
    handleSwitchExercise(firstExercise.type);

    console.log('[测试模式] 测试计划初始化完成，等待用户点击开始');
  }, [generateTrainingPlan, handleSwitchExercise, resetStats]);

  // 进入下一组或下一个运动
  const goToNextSetOrExercise = useCallback(() => {
    if (!activePlan) return;

    const currentExercise = activePlan.exercises[activePlan.currentExerciseIndex];

    // 重置计数，为新的一组做准备
    resetStats();
    setDuration(0);

    if (activePlan.currentSet < currentExercise.sets) {
      // 还有下一组
      setActivePlan({
        ...activePlan,
        currentSet: activePlan.currentSet + 1,
      });
    } else if (activePlan.currentExerciseIndex < activePlan.exercises.length - 1) {
      // 进入下一个运动
      const nextIndex = activePlan.currentExerciseIndex + 1;
      const nextExercise = activePlan.exercises[nextIndex];

      setActivePlan({
        ...activePlan,
        currentExerciseIndex: nextIndex,
        currentSet: 1,
        targetReps: nextExercise.reps,
      });

      // 切换运动类型（这也会调用 resetStats）
      handleSwitchExercise(nextExercise.type);
    } else {
      // 所有组都完成了！直接显示训练总结，不显示简单的完成提示
      const currentExerciseObj = activePlan.exercises[activePlan.currentExerciseIndex];
      setActivePlan(null);
      setTrainingMode('free');
      // 显示训练总结
      setSummaryData({
        exerciseType: getExerciseName(currentExerciseObj.type),
        count: exerciseStats.count,
        duration: duration,
        score: exerciseStats.score,
        accuracy: exerciseStats.accuracy
      });
      setShowSummary(true);
    }

    setIsResting(false);
    setRestCountdown(0);
  }, [activePlan, handleSwitchExercise, resetStats]);

  // 开始休息倒计时
  const startRestCountdown = useCallback((seconds: number) => {
    setIsResting(true);
    setRestCountdown(seconds);
  }, []);

  // 休息倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isResting && restCountdown > 0) {
      timer = setTimeout(() => {
        setRestCountdown(restCountdown - 1);
      }, 1000);
    } else if (isResting && restCountdown === 0) {
      // 休息结束，自动进入下一组
      goToNextSetOrExercise();
    }

    // 清理函数：确保在组件卸载或状态改变时清除定时器
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isResting, restCountdown, goToNextSetOrExercise]);


  // 监听运动次数，检测是否完成当前组目标（在计划模式和测试模式下）
  useEffect(() => {
    if ((trainingMode === 'plan' || trainingMode === 'test') && activePlan && isActive && !isResting) {
      const currentExercise = activePlan.exercises[activePlan.currentExerciseIndex];

      console.log('[计划模式检测]', {
        count: exerciseStats.count,
        targetReps: activePlan.targetReps,
        isActive,
        currentSet: activePlan.currentSet,
        currentExerciseIndex: activePlan.currentExerciseIndex,
      });

      // 重要：必须实际完成了动作（count > 0）且达到目标才算完成
      // 这样可以避免刚进入计划模式时因为 count 为 0 而立即触发
      if (exerciseStats.count > 0 && exerciseStats.count >= activePlan.targetReps) {
        console.log('[计划模式] 达成目标！停止检测');

        // 累积统计数据
        const exerciseName = getExerciseName(currentExercise.type);
        setPlanStats(prev => ({
          totalCount: prev.totalCount + exerciseStats.count,
          totalDuration: prev.totalDuration + duration,
          totalScore: prev.totalScore + exerciseStats.score,
          exercises: prev.exercises.includes(exerciseName)
            ? prev.exercises
            : [...prev.exercises, exerciseName],
        }));

        // 达成目标！自动停止
        stopDetection();

        // 判断是否还有下一组
        if (activePlan.currentSet < currentExercise.sets ||
          activePlan.currentExerciseIndex < activePlan.exercises.length - 1) {
          // 开始休息倒计时
          startRestCountdown(currentExercise.restTime);
        } else {
          // 整个计划完成 - 直接显示总结卡片，不显示简单的完成提示
          // 准备总结数据
          setTimeout(() => {
            const finalStats = {
              totalCount: planStats.totalCount + exerciseStats.count,
              totalDuration: planStats.totalDuration + duration,
              totalScore: planStats.totalScore + exerciseStats.score,
              exercises: planStats.exercises.includes(exerciseName)
                ? planStats.exercises
                : [...planStats.exercises, exerciseName],
            };

            const avgScore = Math.round(finalStats.totalScore / (activePlan.exercises.reduce((sum, ex) => sum + ex.sets, 0)));

            setSummaryData({
              exerciseType: finalStats.exercises.join(' + '),
              count: finalStats.totalCount,
              duration: finalStats.totalDuration,
              score: avgScore,
              accuracy: avgScore, // 使用平均得分作为准确率
            });
            setShowSummary(true);

            // 设置已完成计划信息（用于 StatsPanel 显示）
            setCompletedPlanInfo({
              difficulty: activePlan.difficulty,
              totalCount: finalStats.totalCount,
              totalDuration: finalStats.totalDuration,
              completedAt: new Date(),
            });
          }, 500);

          setActivePlan(null);
          setTrainingMode('free');
        }
      }
    }
  }, [exerciseStats.count, exerciseStats.score, duration, trainingMode, activePlan, isActive, isResting, stopDetection, startRestCountdown, getExerciseName, planStats]);

  // 退出计划模式
  const exitPlanMode = useCallback(() => {
    // 先停止任何正在进行的检测（会清理相关的定时器）
    if (isActive) {
      originalStopDetection();
    }

    // 重置所有计划模式相关的状态
    setTrainingMode('free');
    setActivePlan(null);
    setIsResting(false);
    setRestCountdown(0);
    setIsTestMode(false);

    // 重置计数器和统计
    resetStats();
    setDuration(0);
    setIsTimerActive(false);

    console.log('[计划模式] 已退出并清理所有状态');
  }, [isActive, originalStopDetection, resetStats]);

  // 处理个人资料保存
  const handleSaveProfile = async () => {
    // 1. 立即更新本地状态和 localStorage（UI 即时响应）
    setUserProfile(tempProfile);
    localStorage.setItem('user_name', tempProfile.name);
    localStorage.setItem('user_age', tempProfile.age);
    localStorage.setItem('user_height', tempProfile.height);
    localStorage.setItem('user_weight', tempProfile.weight);
    localStorage.setItem('user_goal', tempProfile.goal);
    localStorage.setItem('user_avatar', tempProfile.avatar);
    setIsEditingProfile(false);

    // 2. 后台同步到数据库（不阻塞 UI）
    if (isBackendConnected) {
      userApi.updateProfile(userId, {
        name: tempProfile.name,
        age: parseInt(tempProfile.age),
        height: parseInt(tempProfile.height),
        weight: parseInt(tempProfile.weight),
        goal: tempProfile.goal,
        avatar: tempProfile.avatar,
      }).then(success => {
        if (success) {
          console.log('✅ 用户资料已同步到数据库 (后台)');
        }
      }).catch(error => {
        console.error('同步用户资料到后端失败 (后台):', error);
      });
    }
  };

  // 处理设置保存
  const handleSaveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    // 保存到localStorage
    Object.entries(newSettings).forEach(([key, value]) => {
      localStorage.setItem(key.replace(/([A-Z])/g, '_$1').toLowerCase(), String(value));
    });
  };

  // 清除所有本地数据
  const handleClearAllData = useCallback(() => {
    // 清除 localStorage
    localStorage.removeItem('fitness_history');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_age');
    localStorage.removeItem('user_height');
    localStorage.removeItem('user_weight');
    localStorage.removeItem('user_goal');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('sound_enabled');
    localStorage.removeItem('voice_enabled');
    localStorage.removeItem('language');
    localStorage.removeItem('theme');
    localStorage.removeItem('difficulty');
    localStorage.removeItem('auto_start');
    localStorage.removeItem('notifications');

    // 重置状态
    setHistoryRecords([]);
    setTodayTotalCount(0);
    setUserProfile({
      name: '健身达人',
      age: '25',
      height: '170',
      weight: '65',
      goal: '减脂',
      avatar: '🏋️'
    });
    setSettings({
      soundEnabled: true,
      voiceEnabled: true,
      language: 'zh-CN',
      theme: 'dark',
      difficulty: 'medium',
      autoStart: false,
      notifications: true
    });

    // 重置运动统计
    resetStats();
    setDuration(0);

    console.log('✅ 所有数据已清除');
    alert('所有数据已清除！');
  }, [resetStats]);

  // 获取用户统计数据(使用 historyRecords 状态而非异步调用)
  const getUserStats = useCallback(() => {
    const allRecords = historyRecords;
    const totalSessions = allRecords.length;
    const totalTime = allRecords.reduce((sum: number, record: any) => sum + (record.duration || 0), 0);
    const avgAccuracy = allRecords.length > 0
      ? allRecords.reduce((sum: number, record: any) => sum + (record.accuracy || 0), 0) / allRecords.length
      : 0;

    // 计算连续训练天数
    const calculateStreak = () => {
      if (allRecords.length === 0) return 0;

      // 获取所有有训练记录的日期（去重）
      const trainingDates = new Set<string>();
      allRecords.forEach((record: any) => {
        if (record.date) {
          trainingDates.add(record.date);
        }
      });

      if (trainingDates.size === 0) return 0;

      // 将日期字符串转换为可比较的格式（统一为 YYYY-MM-DD）
      const normalizeDate = (dateStr: string): string => {
        // 处理 "2024/1/15" 或 "2024-01-15" 格式
        const parts = dateStr.split(/[-\/]/);
        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return dateStr;
      };

      // 创建标准化的日期集合
      const normalizedDates = new Set<string>();
      trainingDates.forEach(date => {
        normalizedDates.add(normalizeDate(date));
      });

      // 从今天开始往前检查连续天数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let streak = 0;
      let checkDate = new Date(today);
      
      // 检查今天是否有训练
      const todayStr = normalizeDate(today.toLocaleDateString('zh-CN'));
      if (normalizedDates.has(todayStr)) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // 如果今天没有训练，从昨天开始检查
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // 往前检查连续天数（最多检查365天，避免无限循环）
      let daysChecked = 0;
      const maxDays = 365;
      
      while (daysChecked < maxDays) {
        const dateStr = normalizeDate(checkDate.toLocaleDateString('zh-CN'));
        if (normalizedDates.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          daysChecked++;
        } else {
          // 遇到没有训练记录的天，中断连续
          break;
        }
      }

      return streak;
    };

    const streak = calculateStreak();

    return {
      totalSessions,
      totalTime: totalTime < 60 ? `${totalTime}秒` : `${Math.floor(totalTime / 60)}分钟`,
      avgAccuracy: Math.round(avgAccuracy * 100),
      streak
    };
  }, [historyRecords]);

  // 计时器效果
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && isTimerActive) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else if (!isTimerActive) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isTimerActive]);

  useEffect(() => {
    setIsTimerActive(isActive);
  }, [isActive]);

  // 从后端 API 获取历史记录，并备份到 localStorage（用于启动时加载，不使用筛选）
  const loadHistoryRecords = useCallback(async () => {
    try {
      const records = await recordApi.getRecords(userId);
      // 同时备份到 localStorage
      if (records.length > 0) {
        localStorage.setItem('fitness_history', JSON.stringify(records));
      }
      return records;
    } catch (error) {
      console.error('从后端获取历史记录失败，尝试从本地缓存加载:', error);
      // 失败时尝试从 localStorage 获取
      const stored = localStorage.getItem('fitness_history');
      return stored ? JSON.parse(stored) : [];
    }
  }, [userId]);

  // 启动时自动加载历史记录（用于个人资料统计）
  useEffect(() => {
    if (isBackendConnected && userId) {
      loadHistoryRecords().then(records => {
        const formattedRecords = records.map((r: any) => ({
          id: r.id?.toString() || Date.now().toString(),
          date: r.date || r.record_date || new Date().toLocaleDateString('zh-CN'),
          time: r.recorded_at ? formatRecordedTime(r.recorded_at) : '',
          exercise_type: r.exercise_type,
          duration: r.duration || 0, // 后端现在返回秒数
          count: r.count || 0,
          score: r.score || 0,
          accuracy: r.accuracy || 0,
        }));
        setHistoryRecords(formattedRecords);
        console.log('✅ 历史记录已在启动时加载');
      }).catch(err => console.error('启动时加载历史记录失败:', err));
    }
  }, [isBackendConnected, userId, loadHistoryRecords]);

  // 加载历史记录（支持筛选和排序）
  const loadHistoryRecordsWithFilters = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      // 准备筛选参数
      const filters: any = {};
      if (historyFilters.exerciseType) {
        // 将中文运动名称转换为API格式
        const exerciseTypeMap: { [key: string]: string } = {
          '深蹲': 'squat',
          '俯卧撑': 'pushup',
          '平板支撑': 'plank',
          '开合跳': 'jumping_jack'
        };
        filters.exerciseType = exerciseTypeMap[historyFilters.exerciseType] || historyFilters.exerciseType;
      }
      if (historyFilters.minScore) filters.minScore = parseInt(historyFilters.minScore);
      if (historyFilters.maxScore) filters.maxScore = parseInt(historyFilters.maxScore);
      if (historyFilters.minAccuracy) filters.minAccuracy = parseFloat(historyFilters.minAccuracy) / 100;
      if (historyFilters.maxAccuracy) filters.maxAccuracy = parseFloat(historyFilters.maxAccuracy) / 100;
      if (historyFilters.sortBy) filters.sortBy = historyFilters.sortBy;

      const records = await recordApi.getRecords(userId, filters);
      
      // 转换为前端友好的格式
      const formattedRecords = records.map((r: any) => ({
        id: r.id?.toString() || Date.now().toString(),
        date: r.date || r.record_date || new Date().toLocaleDateString('zh-CN'),
        time: r.recorded_at ? formatRecordedTime(r.recorded_at) : '',
        exercise_type: getExerciseName(r.exercise_type),
        duration: r.duration || 0, // 后端现在返回秒数
        count: r.count || 0,
        score: r.score || 0,
        accuracy: r.accuracy || 0,
      }));
      setHistoryRecords(formattedRecords);

      // 计算今日该运动类型的总次数
      const today = new Date().toLocaleDateString('zh-CN');
      const todayCount = formattedRecords
        .filter((r: any) => r.date === today && r.exercise_type === getExerciseName(currentExercise))
        .reduce((sum: number, r: any) => sum + (r.count || 0), 0);
      setTodayTotalCount(todayCount);

      setHistoryLoading(false);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      setHistoryError('获取历史记录失败');
      setHistoryLoading(false);
    }
  }, [userId, historyFilters, getExerciseName, currentExercise]);

  // 保存历史记录到后端 API
  const saveHistoryRecord = useCallback(async (record: any) => {
    try {
      const exerciseTypeMap: { [key: string]: string } = {
        '深蹲': 'squat',
        '俯卧撑': 'pushup',
        '平板支撑': 'plank',
        '开合跳': 'jumping_jack'
      };

      const apiRecord = {
        exercise_type: exerciseTypeMap[record.exercise_type] || record.exercise_type,
        count: record.count || 0,
        duration: record.duration || 0,
        score: record.score || 0,
        accuracy: record.accuracy || 0,
      };

      const savedRecord = await recordApi.saveRecord(userId, apiRecord);

      if (savedRecord) {
        console.log('✅ 运动记录已保存到数据库');
        return savedRecord;
      }
      return null;
    } catch (error) {
      console.error('保存运动记录到后端失败:', error);
      return null;
    }
  }, [userId]);

  // 拉取历史记录（当打开历史记录弹窗或个人资料弹窗时）
  useEffect(() => {
    if (showHistory || showProfile) {
      loadHistoryRecordsWithFilters();
    }
  }, [showHistory, showProfile, loadHistoryRecordsWithFilters]);

  // 根据难度级别生成健身计划
  const generatePlanByDifficulty = React.useCallback((difficulty: string) => {
    // 根据用户资料调整计划
    const userAge = parseInt(userProfile.age);
    const userGoal = userProfile.goal;

    const plans = {
      easy: {
        title: '初级健身计划',
        description: '适合初学者的轻松健身计划，重点培养运动习惯',
        squat: userAge > 50 ? '2组 × 6-8次' : '2组 × 8-10次',
        pushup: userAge > 50 ? '2组 × 3-5次（墙式俯卧撑）' : '2组 × 5-8次（可膝盖着地）',
        plank: userAge > 50 ? '2组 × 10-15秒' : '2组 × 15-20秒',
        jumping_jack: userAge > 50 ? '2组 × 8-12次' : '2组 × 10-15次',
        rest_time: userAge > 50 ? 90 : 60,
        total_time: '15-20分钟',
        calories: '80-120卡路里',
        tips: [
          '动作幅度可以较小，重点是动作标准',
          '感到疲劳时及时休息',
          '每周训练3-4次即可',
          userGoal === '减脂' ? '配合有氧运动效果更佳' : '循序渐进增加强度'
        ]
      },
      medium: {
        title: '中级健身计划',
        description: '适合有一定基础的健身爱好者，平衡力量与耐力',
        squat: userGoal === '增肌' ? '3组 × 15-18次' : '3组 × 12-15次',
        pushup: userGoal === '增肌' ? '3组 × 10-15次' : '3组 × 8-12次',
        plank: userGoal === '塑形' ? '3组 × 45-60秒' : '3组 × 30-45秒',
        jumping_jack: userGoal === '减脂' ? '3组 × 25-30次' : '3组 × 20-25次',
        rest_time: userGoal === '力量' ? 60 : 45,
        total_time: '25-35分钟',
        calories: '150-220卡路里',
        tips: [
          '保持动作节奏稳定，控制动作质量',
          '注意呼吸配合，避免憋气',
          '组间休息不宜过长',
          userGoal === '减脂' ? '可适当增加有氧强度' : userGoal === '增肌' ? '注重力量输出' : '保持训练一致性'
        ]
      },
      hard: {
        title: '高级健身计划',
        description: '适合有经验的健身达人，挑战身体极限',
        squat: userGoal === '力量' ? '4组 × 20-25次' : '4组 × 18-20次',
        pushup: userGoal === '力量' ? '4组 × 18-25次' : '4组 × 15-20次',
        plank: '4组 × 60-90秒',
        jumping_jack: userGoal === '减脂' ? '4组 × 40-50次' : '4组 × 30-40次',
        rest_time: userGoal === '减脂' ? 20 : 30,
        total_time: '40-50分钟',
        calories: '250-350卡路里',
        tips: [
          '追求动作的完美执行，而非数量',
          '严格控制休息时间，保持高强度',
          '可尝试变式动作增加难度',
          userGoal === '减脂' ? '高强度间歇训练模式' : userGoal === '力量' ? '注重爆发力输出' : '全面发展身体素质',
          '训练后充分拉伸放松'
        ]
      }
    };
    return plans[difficulty as keyof typeof plans] || plans.medium;
  }, [userProfile]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30" style={{ color: 'var(--text-primary)' }}>
      {/* 开屏欢迎界面 */}
      {showWelcome && (
        <WelcomeScreen
          userName={userProfile.name}
          onDismiss={() => {
            setShowWelcome(false);
            sessionStorage.setItem('welcome_shown', 'true');
          }}
        />
      )}
      {/* 顶部导航栏 */}
      <Header
        initError={initError}
        isInitialized={isInitialized}
        isBackendConnected={isBackendConnected}
        onOpenProfile={() => setShowProfile(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* 主要内容区域 */}
      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：摄像头和控制 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 标题区域 */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                智能健身助手
              </h1>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                基于MediaPipe的实时姿态识别，科学健身指导
              </p>


              {/* 计时器显示 - 仅在运动时显示 */}
              {isActive && (
                <div className="flex justify-center mt-4">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500 bg-opacity-20 border border-purple-400 backdrop-blur-sm">
                    <Clock className="w-4 h-4 text-purple-300 mr-2" />
                    <span className="text-purple-100 font-mono text-lg">{formatTime(duration)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 计划模式进度显示 */}
            {(trainingMode === 'plan' || trainingMode === 'test') && activePlan && (
              <PlanProgress
                activePlan={activePlan}
                currentCount={exerciseStats.count}
                isResting={isResting}
                restCountdown={restCountdown}
                onExit={exitPlanMode}
                onSkipRest={goToNextSetOrExercise}
                getExerciseName={getExerciseName}
              />
            )}

            {/* 摄像头视图 */}
            <CameraView
              {...poseDetection}
              isCountingDown={isCountingDown}
              countdown={countdown}
              startDetection={startDetection}
              stopDetection={stopDetection}
              isResting={isResting}
            />

            {/* 运动选择器 */}
            <ExerciseSelector
              currentExercise={currentExercise}
              switchExercise={handleSwitchExercise}
              isActive={isActive}
            />
          </div>

          {/* 右侧：统计面板 */}
          <div className="space-y-6">
            <StatsPanel
              exerciseStats={exerciseStats}
              currentExercise={getExerciseName(currentExercise)}
              duration={duration}
              todayTotalCount={todayTotalCount + (isActive ? exerciseStats.count : 0)}
              completedPlan={completedPlanInfo}
              trainingMode={trainingMode}
              isActive={isActive}
              isResting={isResting}
              onShowModeSelector={() => setShowModeSelector(true)}
            />


            {/* 快捷操作面板 */}
            <div className="theme-card border rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                <Settings className="w-5 h-5 mr-2 text-purple-500" />
                快捷操作
              </h3>
              <div className="space-y-3">
                <button
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-violet-500/20 flex items-center justify-center transform hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => setShowHistory(true)}
                >
                  <Activity className="w-5 h-5 mr-2" />
                  查看历史记录
                </button>
                <button
                  className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-rose-500/20 flex items-center justify-center transform hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => {
                    resetStats();
                    setDuration(0);
                    addToast('计数器已重置', 'success');
                  }}
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  重置计数器
                </button>

                {/* Personal Dashboard Button */}
                <button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 flex items-center justify-center transform hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => setShowDashboard(true)}
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  个性化仪表板
                </button>

                {/* System Monitor Button */}
                <button
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center transform hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => setShowMonitor(true)}
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  系统监控
                </button>
              </div>
            </div>

            {/* 历史记录弹窗 */}
            {showHistory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
                <div className="theme-modal border rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center" style={{ color: 'var(--text-primary)' }}>
                      <Activity className="mr-2" size={24} style={{ color: 'var(--text-accent)' }} />
                      历史记录
                    </h2>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="transition-colors p-2 rounded-full hover:opacity-70"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* 筛选和排序面板 */}
                  <div className="mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className="flex items-center px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl transition-all text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        筛选和排序
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        onClick={() => {
                          setHistoryFilters({
                            exerciseType: '',
                            minScore: '',
                            maxScore: '',
                            minAccuracy: '',
                            maxAccuracy: '',
                            sortBy: 'date'
                          });
                          setTimeout(() => loadHistoryRecordsWithFilters(), 100);
                        }}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 rounded-xl transition-all text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        重置
                      </button>
                    </div>

                    {showFilterPanel && (
                      <div className="theme-card border rounded-xl p-4 space-y-4">
                        {/* 运动类型筛选 */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>运动类型</label>
                          <select
                            value={historyFilters.exerciseType}
                            onChange={(e) => setHistoryFilters({ ...historyFilters, exerciseType: e.target.value })}
                            className="theme-input w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <option value="">全部</option>
                            <option value="深蹲">深蹲</option>
                            <option value="俯卧撑">俯卧撑</option>
                            <option value="平板支撑">平板支撑</option>
                            <option value="开合跳">开合跳</option>
                          </select>
                        </div>

                        {/* 分数范围 */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>最低分数</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={historyFilters.minScore}
                              onChange={(e) => setHistoryFilters({ ...historyFilters, minScore: e.target.value })}
                              className="theme-input w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                              style={{ color: 'var(--text-primary)' }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>最高分数</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={historyFilters.maxScore}
                              onChange={(e) => setHistoryFilters({ ...historyFilters, maxScore: e.target.value })}
                              className="theme-input w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                              style={{ color: 'var(--text-primary)' }}
                              placeholder="100"
                            />
                          </div>
                        </div>

                        {/* 准确率范围 */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>最低准确率 (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={historyFilters.minAccuracy}
                              onChange={(e) => setHistoryFilters({ ...historyFilters, minAccuracy: e.target.value })}
                              className="theme-input w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                              style={{ color: 'var(--text-primary)' }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>最高准确率 (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={historyFilters.maxAccuracy}
                              onChange={(e) => setHistoryFilters({ ...historyFilters, maxAccuracy: e.target.value })}
                              className="theme-input w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                              style={{ color: 'var(--text-primary)' }}
                              placeholder="100"
                            />
                          </div>
                        </div>

                        {/* 排序方式 */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>排序方式</label>
                          <select
                            value={historyFilters.sortBy}
                            onChange={(e) => setHistoryFilters({ ...historyFilters, sortBy: e.target.value })}
                            className="theme-input w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <option value="date">日期（最新）</option>
                            <option value="date_asc">日期（最早）</option>
                            <option value="count">次数（最多）</option>
                            <option value="count_asc">次数（最少）</option>
                            <option value="duration">时长（最长）</option>
                            <option value="duration_asc">时长（最短）</option>
                            <option value="score">分数（最高）</option>
                            <option value="score_asc">分数（最低）</option>
                            <option value="accuracy">准确率（最高）</option>
                            <option value="accuracy_asc">准确率（最低）</option>
                          </select>
                        </div>

                        {/* 应用筛选按钮 */}
                        <button
                          onClick={() => loadHistoryRecordsWithFilters()}
                          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all"
                        >
                          应用筛选
                        </button>
                      </div>
                    )}
                  </div>
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : historyError ? (
                    <div className="text-red-400 text-center py-4 bg-red-500/10 rounded-lg">{historyError}</div>
                  ) : historyRecords.length === 0 ? (
                    <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>暂无历史记录</div>
                  ) : (
                    <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {historyRecords.map((rec, idx) => (
                        <div key={rec.id || idx} className="theme-card p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{rec.exercise_type}</div>
                              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{rec.date} {rec.time}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold px-2 py-1 rounded-lg" style={{ color: 'var(--info-text)', background: 'var(--info-bg)' }}>
                                {typeof rec.duration === 'number'
                                  ? (() => {
                                    const min = Math.floor(rec.duration / 60);
                                    const s = rec.duration % 60;
                                    return `${min}分${s}秒`;
                                  })()
                                  : '-'}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3" style={{ borderColor: 'var(--card-border)' }}>
                            <div className="text-center">
                              <div className="font-bold text-base" style={{ color: 'var(--success-text)' }}>{rec.count || 0}</div>
                              <div className="mt-1" style={{ color: 'var(--text-muted)' }}>次数</div>
                            </div>
                            <div className="text-center border-l border-r" style={{ borderColor: 'var(--card-border)' }}>
                              <div className="font-bold text-base" style={{ color: 'var(--warning-text)' }}>{rec.score || 0}</div>
                              <div className="mt-1" style={{ color: 'var(--text-muted)' }}>分数</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-base" style={{ color: '#a855f7' }}>
                                {rec.accuracy ? `${(rec.accuracy * 100).toFixed(1)}%` : '0%'}
                              </div>
                              <div className="mt-1" style={{ color: 'var(--text-muted)' }}>准确率</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 统计信息 */}
                  {historyRecords.length > 0 && (
                    <div className="theme-card p-4 rounded-xl mb-6">
                      <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                        <div className="font-bold mb-2" style={{ color: 'var(--text-accent)' }}>📊 训练统计</div>
                        <div className="flex justify-between">
                          <span>总训练次数:</span>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{historyRecords.length} 次</span>
                        </div>
                        <div className="flex justify-between">
                          <span>累计时长:</span>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{Math.floor(historyRecords.reduce((sum, record) => sum + (record.duration || 0), 0) / 60)} 分钟</span>
                        </div>
                        <div className="flex justify-between">
                          <span>平均准确率:</span>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{historyRecords.length > 0 ? ((historyRecords.reduce((sum, record) => sum + (record.accuracy || 0), 0) / historyRecords.length) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    {historyRecords.length > 0 && (
                      <button
                        className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl transition-all font-medium"
                        onClick={() => {
                          if (window.confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
                            localStorage.removeItem('fitness_history');
                            setHistoryRecords([]);
                          }
                        }}
                      >
                        清空记录
                      </button>
                    )}
                    <button
                      className="flex-1 px-4 py-3 theme-btn-secondary rounded-xl transition-all font-medium border"
                      style={{ borderColor: 'var(--card-border)' }}
                      onClick={() => {
                        setShowHistory(false);
                        setShowFilterPanel(false);
                        setHistoryFilters({
                          exerciseType: '',
                          minScore: '',
                          maxScore: '',
                          minAccuracy: '',
                          maxAccuracy: '',
                          sortBy: 'date'
                        });
                      }}
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            )}



            {/* 个人资料弹窗 */}
            {showProfile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center theme-modal-overlay backdrop-blur-sm">
                <div className="theme-modal border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto custom-scrollbar shadow-2xl" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center" style={{ color: 'var(--text-primary)' }}>
                      <Users className="mr-2 text-green-500" size={24} />
                      个人资料
                    </h2>
                    <button
                      onClick={() => {
                        setShowProfile(false);
                        setIsEditingProfile(false);
                        setTempProfile(userProfile);
                      }}
                      className="transition-colors p-2 rounded-full hover:opacity-70" style={{ color: 'var(--text-secondary)' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {!isEditingProfile ? (
                    <div className="space-y-6">
                      {/* 头像和基本信息 */}
                      <div className="text-center relative">
                        <div className="w-24 h-24 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-6xl shadow-lg relative group">
                          {userProfile.avatar}
                          <div className="absolute inset-0 rounded-full border-4 transition-colors" style={{ borderColor: 'var(--card-border)' }}></div>
                        </div>
                        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{userProfile.name}</h3>
                        <p className="font-medium text-sm mt-1" style={{ color: 'var(--text-accent)' }}>{userProfile.goal} • {userProfile.age}岁</p>
                      </div>

                      {/* 用户信息卡片 */}
                      <div className="theme-card rounded-2xl p-4 space-y-4">
                        <div className="flex justify-between items-center px-2">
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>身高</span>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{userProfile.height} cm</span>
                        </div>
                        <div className="h-px" style={{ background: 'var(--card-border)' }}></div>
                        <div className="flex justify-between items-center px-2">
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>体重</span>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{userProfile.weight} kg</span>
                        </div>
                        <div className="h-px" style={{ background: 'var(--card-border)' }}></div>
                        <div className="flex justify-between items-center px-2">
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>BMI</span>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{(parseFloat(userProfile.weight) / Math.pow(parseFloat(userProfile.height) / 100, 2)).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* 用户统计 */}
                      <div>
                        <h4 className="font-bold mb-3 text-sm uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>运动统计</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="theme-card p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--info-text)' }}>{getUserStats().totalSessions}</div>
                            <div className="text-xs uppercase font-medium" style={{ color: 'var(--text-muted)' }}>训练次数</div>
                          </div>
                          <div className="theme-card p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold mb-1 leading-none pt-1" style={{ color: 'var(--success-text)' }}>{getUserStats().totalTime.toString().replace(/[^0-9]/g, '')}</div>
                            <div className="text-xs mb-1" style={{ color: 'var(--success-text)', opacity: 0.7 }}>{getUserStats().totalTime.toString().replace(/[0-9]/g, '')}</div>
                            <div className="text-xs uppercase font-medium" style={{ color: 'var(--text-muted)' }}>总时长</div>
                          </div>
                          <div className="theme-card p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold mb-1" style={{ color: '#a855f7' }}>{getUserStats().avgAccuracy}%</div>
                            <div className="text-xs uppercase font-medium" style={{ color: 'var(--text-muted)' }}>平均准确率</div>
                          </div>
                          <div className="theme-card p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold mb-1" style={{ color: '#f97316' }}>{getUserStats().streak}</div>
                            <div className="text-xs uppercase font-medium" style={{ color: 'var(--text-muted)' }}>连续天数</div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsEditingProfile(true);
                          setTempProfile(userProfile);
                        }}
                        className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl flex items-center justify-center font-bold shadow-lg transition-all"
                      >
                        <Edit3 size={18} className="mr-2" />
                        编辑资料
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* 编辑表单 */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>头像</label>
                          <div className="flex space-x-2 theme-card p-2 rounded-xl">
                            {['🏋️', '💪', '🤸', '🏃', '⚡', '🔥'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => setTempProfile({ ...tempProfile, avatar: emoji })}
                                className={`text-2xl p-2 rounded-lg transition-all ${tempProfile.avatar === emoji ? 'scale-110 shadow-inner' : 'opacity-70 hover:opacity-100'}`}
                                style={{ 
                                  background: tempProfile.avatar === emoji ? 'var(--info-bg)' : 'transparent'
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>姓名</label>
                          <input
                            type="text"
                            value={tempProfile.name}
                            onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                            className="theme-input w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                            style={{ color: 'var(--text-primary)' }}
                            placeholder="输入您的昵称"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">年龄</label>
                            <input
                              type="number"
                              value={tempProfile.age}
                              onChange={(e) => setTempProfile({ ...tempProfile, age: e.target.value })}
                              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">身高(cm)</label>
                            <input
                              type="number"
                              value={tempProfile.height}
                              onChange={(e) => setTempProfile({ ...tempProfile, height: e.target.value })}
                              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">体重(kg)</label>
                          <input
                            type="number"
                            value={tempProfile.weight}
                            onChange={(e) => setTempProfile({ ...tempProfile, weight: e.target.value })}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>健身目标</label>
                          <div className="relative">
                            <select
                              value={tempProfile.goal}
                              onChange={(e) => setTempProfile({ ...tempProfile, goal: e.target.value })}
                              className="theme-input w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 appearance-none transition-all"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <option value="减脂">减脂</option>
                              <option value="增肌">增肌</option>
                              <option value="塑形">塑形</option>
                              <option value="健康">健康</option>
                              <option value="力量">力量</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button
                          onClick={handleSaveProfile}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl flex items-center justify-center font-bold shadow-lg transition-all"
                        >
                          <Save size={18} className="mr-2" />
                          保存
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setTempProfile(userProfile);
                          }}
                          className="flex-1 px-4 py-3 bg-blue-900/30 hover:bg-blue-900/40 text-white rounded-xl flex items-center justify-center font-medium transition-all"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 设置弹窗 */}
            {/* 设置弹窗 */}
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              settings={settings}
              onSave={(newSettings) => {
                handleSaveSettings(newSettings);
                setShowSettings(false);
              }}
              onClearData={handleClearAllData}
              userId={userId}
              isInitialized={isInitialized}
              isActive={isActive}
            />

            {/* 训练总结卡片 */}
            <TrainingSummary
              isOpen={showSummary}
              onClose={() => setShowSummary(false)}
              exerciseType={summaryData.exerciseType}
              count={summaryData.count}
              duration={summaryData.duration}
              score={summaryData.score}
              accuracy={summaryData.accuracy}
              onRestart={() => {
                // 重新开始训练
                startDetection();
              }}
            />






          </div>
        </div>
      </main>

      {/* 训练模式选择器弹窗 */}
      <TrainingModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelectFreeMode={() => {
          setTrainingMode('free');
          setIsTestMode(false);
          setShowModeSelector(false);
        }}
        onSelectPlanMode={startPlanTraining}
        onSelectTestMode={startTestModeTraining}
        getPlanDetail={(difficulty: string): PlanDetailData => generatePlanByDifficulty(difficulty) as PlanDetailData}
      />

      {/* 底部信息 */}
      <footer className="theme-footer mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            <p>FitnessAI - 让科技赋能健康生活 | 基于MediaPipe姿态识别技术</p>
            {isActive ? (
              <p className="mt-1 text-green-400">
                ✨ AI分析引擎正在为您提供实时指导
              </p>
            ) : initError ? (
              <p className="mt-1 text-red-400">
                ⚠️ AI服务连接异常，请刷新页面重试
              </p>
            ) : !isInitialized ? (
              <p className="mt-1 text-yellow-400">
                🔄 AI服务正在初始化，请稍候...
              </p>
            ) : (
              <p className="mt-1 text-blue-400">
                🚀 AI服务已就绪，开始您的健身之旅
              </p>
            )}
          </div>
        </div>
      </footer>
      {/* Personal Dashboard */}
      <Dashboard 
        userId={userId} 
        isOpen={showDashboard} 
        onClose={() => setShowDashboard(false)} 
      />

      {/* System Monitor Dashboard */}
      {showMonitor && (
        <SystemMonitor onClose={() => setShowMonitor(false)} />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
