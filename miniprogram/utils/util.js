/**
 * 日期格式化工具
 */

/**
 * 格式化日期为 yyyy-MM-dd HH:mm 格式
 * @param {string|Date} date ISO日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  if (!date) return '';
  
  // 如果传入的是字符串，转换为Date对象
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // 处理无效日期
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化日期为 yyyy-MM-dd 格式
 * @param {string|Date} date ISO日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDateShort(date) {
  if (!date) return '';
  
  // 如果传入的是字符串，转换为Date对象
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // 处理无效日期
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  
  return `${year}-${month}-${day}`;
}

// 导出工具函数
module.exports = {
  formatDate,
  formatDateShort
} 