import { useEffect, useRef, useState, useCallback } from 'react';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

// MediaPipe 类型声明
declare global {
  interface Window {
    Pose: any;
    Camera: any;
    POSE_CONNECTIONS: any;
    drawConnectors: any;
    drawLandmarks: any;
  }
}

// 获取API基础URL
const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_URL || '';
};

export interface PoseResults {
  poseLandmarks?: any[];
  poseWorldLandmarks?: any[];
}

export interface ExerciseStats {
  count: number;
  isCorrect: boolean;
  feedback: string;
  score: number;
  accuracy: number;
}

export const usePoseDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any | null>(null);
  const cameraRef = useRef<any | null>(null);
  const isActiveRef = useRef(false);
  const currentExerciseRef = useRef('squat'); // 用于在回调中访问最新的运动类型

  const [isActive, setIsActive] = useState(false);
  const [poseResults, setPoseResults] = useState<PoseResults | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats>({
    count: 0,
    isCorrect: false,
    feedback: '准备开始运动',
    score: 0,
    accuracy: 0
  });
  const [currentExercise, setCurrentExercise] = useState('squat');

  // 检查浏览器支持
  const checkBrowserSupport = useCallback(() => {
    // 检查是否支持getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持摄像头访问，请使用现代浏览器（Chrome、Firefox、Safari、Edge）');
    }

    // 检查是否在HTTPS环境下（本地开发除外）
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.warn('⚠️ 建议在HTTPS环境下使用以确保摄像头正常工作');
    }

    console.log('✅ 浏览器支持检查通过');
    return true;
  }, []);

  // 等待MediaPipe CDN加载
  const waitForMediaPipe = useCallback(async (): Promise<boolean> => {
    let attempts = 0;
    const maxAttempts = 30; // 30秒超时

    while (attempts < maxAttempts) {
      // 检查所有必需的全局对象
      if (window.Pose && window.Camera && window.drawConnectors && window.drawLandmarks) {
        console.log('✅ MediaPipe CDN 加载完成');
        // 设置 POSE_CONNECTIONS
        if (window.Pose && window.Pose.POSE_CONNECTIONS) {
          window.POSE_CONNECTIONS = window.Pose.POSE_CONNECTIONS;
        }
        return true;
      }

      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      if (attempts % 5 === 0) {
        console.log(`⏳ 等待MediaPipe加载... (${attempts}/${maxAttempts})`);
      }
    }

    console.error('❌ MediaPipe加载超时');
    return false;
  }, []);

  // 初始化MediaPipe Pose
  const initializePose = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('❌ 等待DOM元素加载...');
      return;
    }

    try {
      console.log('🔄 开始初始化MediaPipe...');
      setInitError(null);
      setExerciseStats(prev => ({ ...prev, feedback: '正在加载MediaPipe...' }));

      // 检查浏览器支持
      checkBrowserSupport();

      // 等待MediaPipe加载
      const loaded = await waitForMediaPipe();
      if (!loaded) {
        throw new Error('MediaPipe加载失败，请检查网络连接或刷新页面重试');
      }

      console.log('✅ MediaPipe库加载成功，开始初始化Pose实例...');
      setExerciseStats(prev => ({ ...prev, feedback: '正在初始化MediaPipe...' }));

      // 创建Pose实例
      const pose = new window.Pose({
        locateFile: (file: string) => {
          const url = `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          console.log('📦 加载MediaPipe文件:', url);
          return url;
        }
      });

      console.log('🔄 配置MediaPipe Pose选项...');

      // 配置Pose选项
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3
      });

      // 设置结果回调
      pose.onResults(onPoseResults);

      // 初始化Pose
      await pose.initialize();

      poseRef.current = pose;

      console.log('✅ MediaPipe Pose 初始化成功');
      setIsInitialized(true);
      setExerciseStats(prev => ({ ...prev, feedback: 'MediaPipe 初始化成功，准备启动摄像头' }));

    } catch (error) {
      console.error('❌ MediaPipe 初始化失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setInitError(errorMessage);
      setExerciseStats(prev => ({
        ...prev,
        feedback: `初始化失败: ${errorMessage}`
      }));

      // 提供解决方案提示
      setTimeout(() => {
        setExerciseStats(prev => ({
          ...prev,
          feedback: '解决方案: 1) 刷新页面重试 2) 检查网络连接 3) 使用Chrome浏览器 4) 检查控制台错误'
        }));
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkBrowserSupport, waitForMediaPipe]);

  // 初始化摄像头
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current || !poseRef.current || !isInitialized) {
      console.log('MediaPipe未初始化，无法启动摄像头');
      return false;
    }
    console.log('进入摄像头函数');

    try {
      setExerciseStats(prev => ({ ...prev, feedback: '正在启动摄像头...' }));

      // 先尝试获取摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      // 设置视频流
      videoRef.current.srcObject = stream;

      // 等待视频元数据加载
      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = resolve;
        }
      });

      // 确保Camera可用
      if (!window.Camera) {
        throw new Error('Camera模块未加载');
      }

      // 初始化MediaPipe Camera
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          //console.log('videoRef.current:', videoRef.current);
          //console.log('poseRef.current:', poseRef.current);
          console.log('isAcvite', isActive);
          if (videoRef.current && poseRef.current && isActiveRef.current) {
            try {

              await poseRef.current.send({ image: videoRef.current });
            } catch (error) {
              console.error('发送帧到MediaPipe失败:', error);

            }
          }
        },
        width: 640,
        height: 480
      });

      cameraRef.current = camera;

      console.log('✅ 摄像头初始化成功');
      setExerciseStats(prev => ({ ...prev, feedback: '摄像头已启动，开始姿态检测' }));

      return true;
    } catch (error) {
      console.error('❌ 摄像头初始化失败:', error);

      let errorMessage = '摄像头启动失败';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = '请允许摄像头访问权限';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '未找到摄像头设备';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '摄像头被其他应用占用';
        } else {
          errorMessage = error.message;
        }
      }

      setExerciseStats(prev => ({ ...prev, feedback: errorMessage }));
      return false;
    }
  }, [isInitialized, isActive]);

  // 处理姿态识别结果
  const onPoseResults = useCallback((results: any) => {
    if (!canvasRef.current) {
      console.log('❌ Canvas未准备好');
      return;
    }

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) {
      console.log('❌ 无法获取Canvas上下文');
      return;
    }

    // 清除画布
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // 绘制姿态关键点和连接线
    if (results.poseLandmarks) {
      console.log('✅ 检测到姿态关键点:', results.poseLandmarks.length);
      try {
        // 使用全局的drawConnectors和drawLandmarks或本地导入的
        const drawConnectorsFn = window.drawConnectors || drawConnectors;
        const drawLandmarksFn = window.drawLandmarks || drawLandmarks;
        const connections = window.POSE_CONNECTIONS || (window.Pose && window.Pose.POSE_CONNECTIONS);

        // 绘制连接线
        if (connections && drawConnectorsFn) {
          drawConnectorsFn(canvasCtx, results.poseLandmarks, connections, {
            color: '#00FF00',
            lineWidth: 2
          });
        } else {
          console.warn('POSE_CONNECTIONS 或 drawConnectors 未加载');
        }

        // 绘制关键点
        if (drawLandmarksFn) {
          drawLandmarksFn(canvasCtx, results.poseLandmarks, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 3
          });
        }

        // 更新姿态结果
        setPoseResults({
          poseLandmarks: results.poseLandmarks,
          poseWorldLandmarks: results.poseWorldLandmarks
        });

        // 发送数据到后端分析
        console.log('🔄 发送姿态数据到后端分析...');
        analyzePoseData(results.poseLandmarks);
      } catch (error) {
        console.error('❌ 绘制姿态点失败:', error);
      }
    } else {
      console.log('⚠️ 未检测到姿态关键点');
      // 没有检测到姿态时显示提示
      setExerciseStats(prev => ({
        ...prev,
        feedback: prev.feedback.includes('初始化') ? prev.feedback : '请站在摄像头前，确保全身可见'
      }));
    }

    canvasCtx.restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise]);

  // 追踪上一次提交的计数，避免重复提交
  const lastSubmittedCountRef = useRef(0);

  // 发送姿态数据到后端分析
  const analyzePoseData = useCallback(async (landmarks: any[]) => {
    try {
      // 使用 ref 获取最新的运动类型
      const exerciseType = currentExerciseRef.current;

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/analytics/pose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pose_landmarks: landmarks,
          exercise_type: exerciseType
        }),
      });

      if (response.ok) {
        const analysisResult = await response.json();
        const currentCount = analysisResult.count !== undefined ? analysisResult.count : 0;

        // 更新统计数据
        setExerciseStats(prev => {
          const newCount = currentCount > prev.count ? currentCount : prev.count;
          return {
            count: newCount,
            isCorrect: analysisResult.is_correct || false,
            feedback: analysisResult.feedback || '正在分析动作...',
            score: analysisResult.score !== undefined ? analysisResult.score : prev.score,
            accuracy: analysisResult.accuracy !== undefined ? analysisResult.accuracy : prev.accuracy
          };
        });

        // 注意：运动数据现在直接通过 App.tsx 的 saveHistoryRecord 保存
        // 这里不再需要提交到 session
      }
    } catch (error) {
      // 网络错误忽略，避免刷屏
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise]);



  // 开始检测
  const startDetection = useCallback(async () => {
    console.log('1前端用户点击开始运动按钮');
    if (!isInitialized) {
      setExerciseStats(prev => ({ ...prev, feedback: 'MediaPipe未初始化，请等待...' }));
      await initializePose();
      return;
    }
    console.log('开始初始化摄像头');

    // 每次开始检测前重置统计数据，防止历史数据残留
    resetStats();

    const cameraStarted = await initializeCamera();
    if (cameraStarted) {
      setIsActive(true);
      isActiveRef.current = true;

      // 重置后端分析器（不阻塞摄像头启动）
      const exerciseType = currentExerciseRef.current;
      const apiBaseUrl = getApiBaseUrl();
      fetch(`${apiBaseUrl}/api/analyzer/reset/${exerciseType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(() => console.log('✅ 后端分析器已重置')).catch(() => { });

      // 启动摄像头
      if (cameraRef.current) {
        console.log('当前摄像头可用，开始调用 cameraRef.current.start()');
        await cameraRef.current.start();
        console.log('调用 cameraRef.current.start()成功');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, initializeCamera]);

  // 停止检测
  const stopDetection = useCallback(async () => {
    // 1. 立即停止本地硬件和状态 (UI 响应优先)
    setIsActive(false);
    isActiveRef.current = false;

    // 停止摄像头
    if (cameraRef.current) {
      cameraRef.current.stop();
    }

    // 停止视频流
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // 清除画布
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    setExerciseStats(prev => ({ ...prev, feedback: '检测已停止' }));
    setPoseResults(null);

  }, []);

  // 重置统计数据
  const resetStats = useCallback(() => {
    // 前端重置
    setExerciseStats({
      count: 0,
      isCorrect: false,
      feedback: '统计数据已重置',
      score: 0,
      accuracy: 0
    });
    setPoseResults(null);
    lastSubmittedCountRef.current = 0; // 重置提交计数

    // 重置后端分析器
    const exerciseType = currentExerciseRef.current;
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/api/analyzer/reset/${exerciseType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(() => console.log('✅ 后端分析器已重置')).catch(() => { });
  }, []);

  // 切换运动类型
  const switchExercise = useCallback((exercise: string) => {
    console.log('[运动切换] 切换到运动类型:', exercise);
    setCurrentExercise(exercise);
    currentExerciseRef.current = exercise; // 同步更新 ref，确保回调能访问最新值
    resetStats();
    setExerciseStats(prev => ({
      ...prev,
      feedback: `已切换到 ${exercise} 模式`
    }));
    // 重置后端分析器
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/api/analyzer/reset/${exercise}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (response.ok) {
          console.log(`✅ 后端分析器已重置: ${exercise}`);
        } else {
          console.error(`❌ 重置后端分析器失败: ${exercise}`);
        }
      })
      .catch(error => {
        console.error('❌ 重置分析器请求失败:', error);
      });
  }, [resetStats]);

  // 组件挂载时初始化
  useEffect(() => {
    console.log('🚀 usePoseDetection mounted, starting initialization...');
    const timer = setTimeout(() => {
      console.log('⏰ Timer fired, calling initializePose...');
      initializePose();
    }, 500); // 增加延迟到500ms确保DOM和CDN完全加载

    return () => {
      console.log('🧹 usePoseDetection unmounting, clearing timer...');
      clearTimeout(timer);
    };
  }, [initializePose]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (isActive) {
        stopDetection();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    canvasRef,
    isActive,
    isInitialized,
    initError,
    poseResults,
    exerciseStats,
    setExerciseStats,
    currentExercise,
    startDetection,
    stopDetection,
    resetStats,
    switchExercise
  };
}; 