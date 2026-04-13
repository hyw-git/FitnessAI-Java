import React from 'react';
import { Play, Pause, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isActive: boolean;
  isInitialized: boolean;
  initError: string | null;
  exerciseStats: any;
  startDetection: () => void;
  stopDetection: () => void;
  isCountingDown: boolean;
  countdown: number;
  isResting?: boolean; // 新增：是否处于休息状态
}

const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  isActive,
  isInitialized,
  initError,
  exerciseStats,
  startDetection,
  stopDetection,
  isCountingDown,
  countdown,
  isResting = false // 默认为 false
}) => {
  // 获取状态指示器信息
  const getStatusInfo = () => {
    if (initError) {
      return {
        color: 'bg-red-500',
        icon: <AlertCircle size={16} />,
        text: '初始化失败',
        pulse: false
      };
    }

    if (!isInitialized) {
      return {
        color: 'bg-yellow-500',
        icon: <Loader size={16} className="animate-spin" />,
        text: '正在初始化',
        pulse: true
      };
    }

    if (isCountingDown) {
      return {
        color: 'bg-orange-500',
        icon: <CheckCircle size={16} />,
        text: '准备开始',
        pulse: true
      };
    }

    if (isActive) {
      return {
        color: 'bg-green-500',
        icon: <CheckCircle size={16} />,
        text: '检测中',
        pulse: true
      };
    }

    return {
      color: 'bg-blue-500',
      icon: <CheckCircle size={16} />,
      text: '已就绪',
      pulse: false
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* 摄像头视频容器 */}
      <div className="camera-frame overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/40 backdrop-blur-sm relative group">
        {/* 装饰性边框光效 */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 pointer-events-none z-30"></div>

        {/* 视频元素 */}
        <video
          ref={videoRef}
          className="w-full h-auto object-cover"
          autoPlay
          playsInline
          muted
          style={{
            transform: 'scaleX(-1)',
            display: isActive ? 'block' : 'block'
          }}
          width={640}
          height={480}
        />

        {/* 姿态检测画布叠加层 */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pose-overlay z-10"
          width={640}
          height={480}
          style={{
            transform: 'scaleX(-1)',
            pointerEvents: 'none'
          }}
        />

        {/* MediaPipe状态指示器 - 仅保留核心反馈 */}
        <div className="absolute top-6 right-6 max-w-xs z-20">
          <div className="bg-black/60 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-lg border border-white/10 transition-all duration-300 hover:bg-black/70">
            <div className={`text-lg font-bold flex items-center ${exerciseStats.isCorrect ? 'text-emerald-400' :
              initError ? 'text-rose-400' :
                !isInitialized ? 'text-amber-400' : 'text-blue-400'
              }`}>
              {exerciseStats.isCorrect && <CheckCircle size={20} className="mr-2" />}
              {exerciseStats.feedback}
            </div>

            {/* 显示初始化错误详情 */}
            {initError && (
              <div className="text-xs text-rose-300 mt-2 flex items-start">
                <AlertCircle size={12} className="mr-1 mt-0.5" />
                错误: {initError}
              </div>
            )}
          </div>
        </div>

        {/* 计数显示 - 简化样式 */}
        <div className="absolute bottom-6 left-6 z-20">
          <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Counts</div>
            <div className="text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent filter drop-shadow-sm">
              {exerciseStats.count}
            </div>
          </div>
        </div>

        {/* 倒计时叠加层 */}
        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-40 transition-all duration-300">
            <div className="text-center text-white transform scale-110">
              <div className="text-9xl font-black mb-6 animate-pulse text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-500 filter drop-shadow-lg">
                {countdown}
              </div>
              <div className="text-2xl font-bold tracking-widest uppercase text-gray-300">Ready to start</div>
            </div>
          </div>
        )}

        {/* 未激活时的提示和开始按钮 */}
        {!isActive && !isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30">
            <div className="text-center text-white max-w-md px-6 py-8 rounded-2xl bg-black/40 border border-white/5 shadow-2xl">
              {!isInitialized ? (
                // 初始化中
                <div>
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="text-xl font-bold mb-2">正在初始化 AI 引擎</div>
                  <div className="text-sm text-gray-400">正在加载 MediaPipe 模型，请稍候...</div>
                </div>
              ) : initError ? (
                // 初始化失败
                <div>
                  <AlertCircle className="w-16 h-16 mx-auto mb-6 text-rose-500" />
                  <div className="text-xl font-bold mb-2 text-rose-400">初始化失败</div>
                  <div className="text-sm text-gray-400 mb-6 px-4 py-2 bg-rose-500/10 rounded-lg border border-rose-500/20">{initError}</div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>• 请尝试刷新页面</div>
                    <div>• 检查摄像头权限</div>
                    <div>• 建议使用 Chrome 浏览器</div>
                  </div>
                </div>
              ) : isResting ? (
                // 休息中 - 禁用开始按钮
                <div>
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 opacity-60 cursor-not-allowed">
                    <Play className="w-12 h-12 text-white ml-2" fill="currentColor" />
                  </div>
                  <div className="text-2xl font-bold mb-2 text-orange-400">休息中...</div>
                  <div className="text-sm text-gray-300">请等待休息倒计时结束</div>
                </div>
              ) : (
                // 就绪状态 - 显示开始按钮
                <div>
                  <button
                    onClick={startDetection}
                    className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-110 transition-all cursor-pointer group"
                  >
                    <Play className="w-12 h-12 text-white ml-2 group-hover:scale-110 transition-transform" fill="currentColor" />
                  </button>
                  <div className="text-2xl font-bold mb-2">AI 助手已就绪</div>
                  <div className="text-sm text-gray-300">点击上方按钮开始训练</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 运动中时显示停止按钮 - 右下角悬浮 */}
        {(isActive || isCountingDown) && (
          <div className="absolute bottom-4 right-4 z-40">
            <button
              onClick={stopDetection}
              className="group flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all transform hover:scale-105"
            >
              <Pause size={24} fill="currentColor" />
              <span>{isCountingDown ? '取消' : '停止'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraView; 