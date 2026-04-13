// 时间格式化工具 - 统一使用北京时间 (UTC+8)

/**
 * 解析后端返回的时间字符串（假设后端返回的是北京时间，格式如 "2025-12-23T10:30:00"）
 * 后端使用LocalDateTime，没有时区信息，我们假设它是北京时间
 */
const parseBeijingTime = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // 如果字符串已经包含时区信息，直接解析
  if (dateString.includes('+') || dateString.includes('Z') || dateString.includes('T') && dateString.length > 19) {
    return new Date(dateString);
  }
  
  // 如果字符串格式是 "2025-12-23T10:30:00" 或 "2025-12-23 10:30:00"
  // 假设这是北京时间，添加时区信息
  const normalized = dateString.replace(' ', 'T');
  if (normalized.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    // 添加 +08:00 时区标识
    return new Date(normalized + '+08:00');
  }
  
  // 其他格式，直接解析
  return new Date(dateString);
};

/**
 * 格式化日期为 YYYY-MM-DD 格式（北京时间）
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? parseBeijingTime(dateString) : dateString;
  
  // 获取北京时间的年月日
  const beijingDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const year = beijingDate.getFullYear();
  const month = String(beijingDate.getMonth() + 1).padStart(2, '0');
  const day = String(beijingDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 格式化时间为 HH:mm:ss 格式（北京时间）
 */
export const formatTime = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? parseBeijingTime(dateString) : dateString;
  
  // 使用北京时区格式化时间
  const beijingTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const hours = String(beijingTime.getHours()).padStart(2, '0');
  const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式（北京时间）
 */
export const formatDateTime = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? parseBeijingTime(dateString) : dateString;
  
  // 使用北京时区格式化日期时间
  const beijingTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const year = beijingTime.getFullYear();
  const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getDate()).padStart(2, '0');
  const hours = String(beijingTime.getHours()).padStart(2, '0');
  const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 获取当前北京时间（UTC+8）
 */
export const getBeijingTime = (): Date => {
  const now = new Date();
  // 获取北京时区的当前时间
  const beijingStr = now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
  return new Date(beijingStr);
};

/**
 * 格式化持续时间为 "X分Y秒" 格式
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0分0秒';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${mins}分${secs}秒`;
};

