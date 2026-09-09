import jsPDF from 'jspdf';
import { DataItem } from '../types';
import * as indexedDB from './indexedDB';
import { authUtils } from './auth';

export const exportUtils = {
  // Export to PDF with proper Chinese character support
  exportToPDF: async (data: DataItem[], filename: string = 'data_export.pdf') => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Configure for better text support
      pdf.setFont('helvetica');
      
      let yPosition = 25;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 8;
      const maxWidth = 170;

      // Title
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text('数据导出报告', 20, yPosition);
      yPosition += 12;
      
      // Export info
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const exportDate = new Date().toLocaleString('zh-CN');
      pdf.text(`导出时间: ${exportDate}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`总记录数: ${data.length}`, 20, yPosition);
      yPosition += 15;

      data.forEach((item, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 25;
        }

        // Item header with separate times
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        pdf.text(`${index + 1}.`, margin, yPosition);
        yPosition += lineHeight;

        // Question time
        pdf.setFontSize(9);
        pdf.setTextColor(60, 100, 200);
        if (item.questionTime) {
          const questionDate = new Date(item.questionTime).toLocaleString('zh-CN');
          pdf.text(`问题发送: ${questionDate}`, margin + 5, yPosition);
        } else {
          pdf.text('问题发送: 未知时间', margin + 5, yPosition);
        }
        yPosition += lineHeight;

        // Answer time  
        pdf.setTextColor(60, 150, 100);
        if (item.answerTime) {
          const answerDate = new Date(item.answerTime).toLocaleString('zh-CN');
          pdf.text(`回复时间: ${answerDate}`, margin + 5, yPosition);
        } else {
          pdf.text('回复时间: 未知时间', margin + 5, yPosition);
        }
        yPosition += lineHeight + 2;

        // Item type
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        if (item.type === 'audio') {
          const duration = item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : '未知';
          pdf.text(`类型: 音频文件 (时长: ${duration})`, margin + 5, yPosition);
        } else {
          pdf.text('类型: 文本内容', margin + 5, yPosition);
        }
        yPosition += lineHeight;

        // Labels - show actual Chinese labels
        if (item.labels.length > 0) {
          pdf.setFontSize(9);
          pdf.setTextColor(80, 120, 200);
          const labelsText = `标签: ${item.labels.join(', ')}`;
          // Handle long label text by wrapping
          const labelLines = pdf.splitTextToSize(labelsText, maxWidth - 10);
          labelLines.forEach((line: string) => {
            if (yPosition > pageHeight - 40) {
              pdf.addPage();
              yPosition = 25;
            }
            pdf.text(line, margin + 5, yPosition);
            yPosition += lineHeight;
          });
        }

        // Content - show question and answer separately
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        
        // 显示问题
        if (item.questionContent && item.questionContent.trim()) {
          pdf.setTextColor(60, 100, 200);
          pdf.text('问题:', margin + 5, yPosition);
          yPosition += lineHeight;
          
          pdf.setTextColor(40, 40, 40);
          const questionLines = pdf.splitTextToSize(item.questionContent, maxWidth - 10);
          questionLines.forEach((line: string) => {
            if (yPosition > pageHeight - 35) {
              pdf.addPage();
              yPosition = 25;
            }
            pdf.text(line, margin + 5, yPosition);
            yPosition += lineHeight;
          });
          yPosition += 3; // 额外间距
        }
        
        // 显示回答
        if (item.answerContent && item.answerContent.trim()) {
          pdf.setTextColor(60, 150, 100);
          if (item.type === 'audio') {
            pdf.text('音频回答:', margin + 5, yPosition);
          } else if (item.type === 'video') {
            pdf.text('视频回答:', margin + 5, yPosition);
          } else {
            pdf.text('回答:', margin + 5, yPosition);
          }
          yPosition += lineHeight;
          
          pdf.setTextColor(40, 40, 40);
          const answerLines = pdf.splitTextToSize(item.answerContent, maxWidth - 10);
          answerLines.forEach((line: string) => {
            if (yPosition > pageHeight - 35) {
              pdf.addPage();
              yPosition = 25;
            }
            pdf.text(line, margin + 5, yPosition);
            yPosition += lineHeight;
          });
        } else {
          // 如果没有分离的内容，使用原有的content
          if (item.content && item.content.trim()) {
            pdf.text('内容:', margin + 5, yPosition);
            yPosition += lineHeight;
            
            const contentLines = pdf.splitTextToSize(item.content, maxWidth - 10);
            contentLines.forEach((line: string) => {
              if (yPosition > pageHeight - 35) {
                pdf.addPage();
                yPosition = 25;
              }
              pdf.text(line, margin + 5, yPosition);
              yPosition += lineHeight;
            });
          } else {
            pdf.setTextColor(150, 150, 150);
            pdf.text('(无内容)', margin + 5, yPosition);
            yPosition += lineHeight;
            pdf.setTextColor(40, 40, 40);
          }
        }

        // Add separator
        yPosition += 8;
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, yPosition, margin + maxWidth, yPosition);
        yPosition += 12;
      });

      // Add footer to all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`第 ${i} 页，共 ${totalPages} 页`, margin, pageHeight - 10);
        pdf.text('翻牌导出', pdf.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
      }

      // Save the PDF
      pdf.save(filename);
      return true;
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('PDF导出失败');
    }
  },

  // Export to CSV format (unchanged - works perfectly for Chinese)
  exportToCSV: async (data: DataItem[], filename: string = 'data_export.csv') => {
    try {
      // CSV headers
      const headers = ['序号', '问题发送时间', '回复时间', '类型', '状态', '问题内容', '回答内容', '标签', '音频时长', '多媒体链接', '消费鸡腿'];
      
      // Convert data to CSV format
      const csvData = data.map((item, index) => {
        const formatDate = (timestamp: string) => {
          if (!timestamp) return '未知';
          try {
            // 处理多种时间戳格式
            let date: Date;
            
            // 如果是13位数字字符串（Unix毫秒时间戳）
            if (/^\d{13}$/.test(timestamp)) {
              date = new Date(parseInt(timestamp));
            } else if (/^\d{10}$/.test(timestamp)) {
              // 如果是10位数字字符串（Unix秒时间戳）
              date = new Date(parseInt(timestamp) * 1000);
            } else if (/^\d+$/.test(timestamp)) {
              // 其他数字格式
              const ts = parseInt(timestamp);
              date = new Date(ts < 10000000000 ? ts * 1000 : ts);
            } else {
              // 字符串格式的时间
              date = new Date(timestamp);
            }
            
            // 检查日期是否有效
            if (isNaN(date.getTime())) {
              return '无效日期';
            }
            
            return date.toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
          } catch (error) {
            console.error('Date formatting error:', error, 'timestamp:', timestamp);
            return '日期格式错误';
          }
        };

        const formatDuration = (duration?: number) => {
          if (!duration) return '';
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        const getTypeLabel = () => {
          if (item.type === 'audio') return '音频';
          if (item.type === 'video') return '视频';
          return '文本';
        };

        const getStatusLabel = () => {
          return item.isPublic ? '公开' : '私密';
        };

        return [
          index + 1,
          item.questionTime ? formatDate(item.questionTime) : '未知',
          item.answerTime ? formatDate(item.answerTime) : '暂无',
          getTypeLabel(),
          getStatusLabel(),
          `"${(item.questionContent || '').replace(/"/g, '""')}"`, // 问题内容
          `"${(item.answerContent || item.content || '').replace(/"/g, '""')}"`, // 回答内容
          `"${item.labels.join(', ')}"`,
          (item.type === 'audio' || item.type === 'video') ? formatDuration(item.duration) : '',
          item.audioUrl || item.videoUrl || '',
          item.cost || 0
        ];
      });

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      // Add BOM for proper UTF-8 encoding in Excel
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create and download the file - use simple blob creation for better emoji support
      const blob = new Blob([csvWithBOM], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('CSV export failed:', error);
      throw new Error('CSV导出失败');
    }
  },

  // Export to JSON format
  exportToJSON: async (data: DataItem[], filename: string = 'data_export.json') => {
    try {
      // Clean data to handle potential date issues
      const cleanedData = data.map(item => ({
        ...item,
        createdAt: item.createdAt && !isNaN(item.createdAt.getTime()) ? item.createdAt.toISOString() : null
      }));

      const exportData = {
        exportTime: new Date().toISOString(),
        totalRecords: data.length,
        data: cleanedData
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('JSON export failed:', error);
      throw new Error('JSON导出失败');
    }
  },

  // Export to SQLite format
  exportToSQLite: async (data: DataItem[], filename: string = 'data_export.sqlite') => {
    try {
      // Create SQL CREATE TABLE statement
      const createTableSQL = `
CREATE TABLE IF NOT EXISTS flipcard_data (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  questionTime TEXT,
  answerTime TEXT,
  content TEXT,
  questionContent TEXT,
  answerContent TEXT,
  labels TEXT,
  type TEXT,
  userName TEXT,
  userAvatar TEXT,
  idolAvatar TEXT,
  idolId TEXT,
  idolNickname TEXT,
  starName TEXT,
  cost INTEGER,
  status INTEGER,
  questionId TEXT,
  isPublic INTEGER,
  audioUrl TEXT,
  videoUrl TEXT,
  duration INTEGER,
  previewImg TEXT,
  height INTEGER,
  width INTEGER,
  createdAt TEXT
);
`;

      // Create SQL INSERT statements
      const insertStatements = data.map(item => {
        // Helper function to safely format timestamps
        const safeTimestamp = (timestamp: string) => {
          if (!timestamp) return '';
          try {
            // Handle Unix timestamps
            if (/^\d{13}$/.test(timestamp)) {
              const date = new Date(parseInt(timestamp));
              return !isNaN(date.getTime()) ? date.toISOString() : '';
            } else if (/^\d{10}$/.test(timestamp)) {
              const date = new Date(parseInt(timestamp) * 1000);
              return !isNaN(date.getTime()) ? date.toISOString() : '';
            } else {
              const date = new Date(timestamp);
              return !isNaN(date.getTime()) ? date.toISOString() : '';
            }
          } catch {
            return '';
          }
        };

        const values = [
          item.id || '',
          safeTimestamp(item.timestamp || ''),
          safeTimestamp(item.questionTime || ''),
          safeTimestamp(item.answerTime || ''),
          item.content || '',
          item.questionContent || '',
          item.answerContent || '',
          JSON.stringify(item.labels || []),
          item.type || 'text',
          item.userName || '',
          item.userAvatar || '',
          item.idolAvatar || '',
          item.idolId || '',
          item.idolNickname || '',
          item.starName || '',
          item.cost || 0,
          item.status || 0,
          item.questionId || '',
          item.isPublic ? 1 : 0,
          item.audioUrl || '',
          item.videoUrl || '',
          item.duration || 0,
          item.previewImg || '',
          item.height || 0,
          item.width || 0,
          item.createdAt && !isNaN(item.createdAt.getTime()) ? item.createdAt.toISOString() : ''
        ].map(val => {
          if (typeof val === 'string') {
            return `'${val.replace(/'/g, "''")}'`;
          }
          return val;
        });

        return `INSERT OR REPLACE INTO flipcard_data VALUES (${values.join(', ')});`;
      });

      // Combine all SQL statements
      const sqlContent = [
        '-- 翻牌数据导出',
        `-- 导出时间: ${new Date().toLocaleString('zh-CN')}`,
        `-- 总记录数: ${data.length}`,
        '',
        createTableSQL,
        '',
        ...insertStatements
      ].join('\n');

      // Create and download the file
      const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('SQLite export failed:', error);
      throw new Error('SQLite导出失败');
    }
  },

  // Import from JSON format
  importFromJSON: async (file: File): Promise<number> => {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      let dataToImport: DataItem[];
      
      // Handle different JSON formats
      if (Array.isArray(importData)) {
        dataToImport = importData;
      } else if (importData.data && Array.isArray(importData.data)) {
        dataToImport = importData.data;
      } else {
        throw new Error('不支持的JSON格式');
      }

      // Get current user ID
      const currentUser = authUtils.getCurrentUser();
      const currentUserId = currentUser?.userId;

      // Validate and process data
      const processedData = dataToImport.map(item => {
        // Ensure required fields exist
        const processedItem: DataItem = {
          id: item.id || `imported_${Date.now()}_${Math.random()}`,
          timestamp: item.timestamp || new Date().toISOString(),
          questionTime: item.questionTime || item.timestamp,
          answerTime: item.answerTime || item.timestamp,
          content: item.content || '',
          questionContent: item.questionContent || '',
          answerContent: item.answerContent || '',
          labels: Array.isArray(item.labels) ? item.labels : [],
          type: item.type || 'text',
          userName: item.userName || '',
          userAvatar: item.userAvatar || '',
          idolAvatar: item.idolAvatar || '',
          idolId: typeof item.idolId === 'number' ? item.idolId : (typeof item.idolId === 'string' ? parseInt(item.idolId) || undefined : undefined),
          idolNickname: item.idolNickname || '',
          starName: item.starName || '',
          cost: item.cost || 0,
          status: item.status || 0,
          questionId: item.questionId || item.id,
          isPublic: Boolean(item.isPublic),
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          // Optional fields
          ...(item.audioUrl && { audioUrl: item.audioUrl }),
          ...(item.videoUrl && { videoUrl: item.videoUrl }),
          ...(item.duration && { duration: typeof item.duration === 'number' ? item.duration : (typeof item.duration === 'string' ? parseInt(item.duration) || 0 : 0) }),
          ...(item.previewImg && { previewImg: item.previewImg }),
          ...(item.height && { height: item.height }),
          ...(item.width && { width: item.width })
        };
        
        return processedItem;
      });

      // Save to IndexedDB
      await indexedDB.saveDataItems(processedData, currentUserId);
      
      return processedData.length;
    } catch (error) {
      console.error('JSON import failed:', error);
      throw new Error('JSON导入失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  },

  // Import from SQLite format (SQL file)
  importFromSQLite: async (file: File): Promise<number> => {
    try {
      const text = await file.text();
      
      // Extract INSERT statements from SQL file
      const insertRegex = /INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+flipcard_data\s+VALUES\s*\(([^)]+)\);/gi;
      const matches = Array.from(text.matchAll(insertRegex));
      
      if (matches.length === 0) {
        throw new Error('SQL文件中未找到有效的数据');
      }

      const dataToImport: DataItem[] = [];

      for (const match of matches) {
        try {
          const valuesStr = match[1];
          // Parse the values - this is a simplified parser
          const values = exportUtils.parseSQLValues(valuesStr);
          
          if (values.length >= 15) { // Minimum required fields
            const item: DataItem = {
              id: values[0] || `imported_${Date.now()}_${Math.random()}`,
              timestamp: values[1] || new Date().toISOString(),
              questionTime: values[2] || values[1],
              answerTime: values[3] || values[1],
              content: values[4] || '',
              questionContent: values[5] || '',
              answerContent: values[6] || '',
              labels: values[7] ? JSON.parse(values[7]) : [],
              type: (values[8] === 'audio' || values[8] === 'video' || values[8] === 'text') ? values[8] : 'text',
              userName: values[9] || '',
              userAvatar: values[10] || '',
              idolAvatar: values[11] || '',
              idolId: values[12] ? parseInt(values[12]) || undefined : undefined,
              idolNickname: values[13] || '',
              starName: values[14] || '',
              cost: parseInt(values[15]) || 0,
              status: parseInt(values[16]) || 0,
              questionId: values[17] || values[0],
              isPublic: Boolean(parseInt(values[18])),
              createdAt: values[25] ? new Date(values[25]) : new Date(),
              // Optional fields
              ...(values[19] && { audioUrl: values[19] }),
              ...(values[20] && { videoUrl: values[20] }),
              ...(values[21] && { duration: parseInt(values[21]) }),
              ...(values[22] && { previewImg: values[22] }),
              ...(values[23] && { height: parseInt(values[23]) }),
              ...(values[24] && { width: parseInt(values[24]) })
            };
            
            dataToImport.push(item);
          }
        } catch (parseError) {
          console.warn('Failed to parse SQL row:', parseError);
          // Continue with next row
        }
      }

      if (dataToImport.length === 0) {
        throw new Error('未能解析出有效数据');
      }

      // Get current user ID
      const currentUser = authUtils.getCurrentUser();
      const currentUserId = currentUser?.userId;

      // Save to IndexedDB
      await indexedDB.saveDataItems(dataToImport, currentUserId);
      
      return dataToImport.length;
    } catch (error) {
      console.error('SQLite import failed:', error);
      throw new Error('SQLite导入失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  },

  // Helper function to parse SQL values
  parseSQLValues: (valuesStr: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i];
      const nextChar = valuesStr[i + 1];
      
      if (!inQuotes && (char === "'" || char === '"')) {
        inQuotes = true;
        quoteChar = char;
      } else if (inQuotes && char === quoteChar) {
        if (nextChar === quoteChar) {
          // Escaped quote
          current += char;
          i++; // Skip next character
        } else {
          // End of quoted string
          inQuotes = false;
          quoteChar = '';
        }
      } else if (!inQuotes && char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last value
    if (current.trim()) {
      values.push(current.trim());
    }
    
    return values;
  },

  // Export media files (aac and mp4) with folder selection
  exportMediaFiles: async (data: DataItem[]) => {
    try {
      // Filter data with media URLs and count total files
      const mediaItems = data.filter(item => item.audioUrl || item.videoUrl);
      const totalFiles = mediaItems.reduce((count, item) => {
        return count + (item.audioUrl ? 1 : 0) + (item.videoUrl ? 1 : 0);
      }, 0);
      
      if (mediaItems.length === 0) {
        throw new Error('没有找到可下载的媒体文件');
      }

      // Helper function to format date for filename
      const formatDateForFilename = (timestamp: string) => {
        if (!timestamp) return '';
        try {
          let date: Date;
          if (/^\d{13}$/.test(timestamp)) {
            date = new Date(parseInt(timestamp));
          } else if (/^\d{10}$/.test(timestamp)) {
            date = new Date(parseInt(timestamp) * 1000);
          } else {
            date = new Date(timestamp);
          }
          
          if (isNaN(date.getTime())) {
            return '';
          }
          
          return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        } catch (error) {
          return '';
        }
      };

      // Helper function to extract filename from URL
      const extractFilename = (url: string) => {
        try {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          const filename = pathname.split('/').pop() || '';
          return filename;
        } catch (error) {
          return '';
        }
      };

      // Helper function to generate filename
      const generateFilename = (item: DataItem, url: string) => {
        const starName = item.starName || 'unknown';
        const questionDate = formatDateForFilename(item.questionTime || item.timestamp);
        const answerDate = formatDateForFilename(item.answerTime || item.timestamp);
        const originalFilename = extractFilename(url);
        
        // Generate filename using original filename (which already contains extension)
        const filename = `${starName}-${questionDate}-${answerDate}-${originalFilename || 'media'}`;
        
        return filename;
      };

      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window) {
        try {
          // Use modern File System Access API
          const directoryHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'downloads'
          });

          // Create subfolder with date
          const today = new Date();
          const folderName = `翻牌媒体文件_${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
          const subfolderHandle = await directoryHandle.getDirectoryHandle(folderName, { create: true });

          let successCount = 0;
          let failCount = 0;

          alert(`准备下载 ${totalFiles} 个媒体文件到选定文件夹中...`);

          for (const [index, item] of mediaItems.entries()) {
            // Add delay between downloads
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (item.audioUrl) {
              try {
                const filename = generateFilename(item, item.audioUrl);
                const response = await fetch(item.audioUrl);
                if (response.ok) {
                  const blob = await response.blob();
                  const fileHandle = await subfolderHandle.getFileHandle(filename, { create: true });
                  const writableStream = await fileHandle.createWritable();
                  await writableStream.write(blob);
                  await writableStream.close();
                  successCount++;
                } else {
                  failCount++;
                }
              } catch (error) {
                console.error('Failed to download audio file:', error);
                failCount++;
              }
            }

            if (item.videoUrl) {
              try {
                const filename = generateFilename(item, item.videoUrl);
                const response = await fetch(item.videoUrl);
                if (response.ok) {
                  const blob = await response.blob();
                  const fileHandle = await subfolderHandle.getFileHandle(filename, { create: true });
                  const writableStream = await fileHandle.createWritable();
                  await writableStream.write(blob);
                  await writableStream.close();
                  successCount++;
                } else {
                  failCount++;
                }
              } catch (error) {
                console.error('Failed to download video file:', error);
                failCount++;
              }
            }
          }

          // Show completion message
          if (failCount === 0) {
            alert(`所有 ${successCount} 个媒体文件已下载到选定文件夹中！`);
          } else {
            alert(`下载完成！\n成功: ${successCount} 个文件\n失败: ${failCount} 个文件`);
          }

          return successCount;
        } catch (error) {
          if ((error as any).name === 'AbortError') {
            throw new Error('用户取消了文件夹选择');
          }
          console.error('Directory picker failed, falling back to individual downloads:', error);
          // Fall through to fallback method
        }
      }

      // Fallback: download files individually to default download folder
      alert(`您的浏览器不支持文件夹选择功能，将下载 ${totalFiles} 个文件到默认下载目录。`);
      
      let successCount = 0;
      let failCount = 0;

      const downloadFile = async (url: string, filename: string) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${filename}: ${response.status}`);
          }
          
          const blob = await response.blob();
          const downloadUrl = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(downloadUrl);
          
          return true;
        } catch (error) {
          console.error(`Failed to download ${filename}:`, error);
          return false;
        }
      };

      for (const [index, item] of mediaItems.entries()) {
        // Add delay between downloads to avoid browser blocking
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (item.audioUrl) {
          const filename = generateFilename(item, item.audioUrl);
          const success = await downloadFile(item.audioUrl, filename);
          if (success) successCount++;
          else failCount++;
        }

        if (item.videoUrl) {
          const filename = generateFilename(item, item.videoUrl);
          const success = await downloadFile(item.videoUrl, filename);
          if (success) successCount++;
          else failCount++;
        }
      }

      // Show completion message
      if (failCount === 0) {
        alert(`所有 ${successCount} 个媒体文件下载完成！`);
      } else {
        alert(`下载完成！\n成功: ${successCount} 个文件\n失败: ${failCount} 个文件\n\n请检查浏览器下载目录。`);
      }

      return successCount;
    } catch (error) {
      console.error('Media export failed:', error);
      throw new Error('媒体文件导出失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  },

  // Export to standalone HTML file
  exportToStaticHTML: async (data: DataItem[], filename: string = 'flipcard_offline.html', enableLocalFiles: boolean = false) => {
    try {
      // 生成内嵌样式
      const inlineCSS = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #f3f4f6; color: #1f2937; line-height: 1.6; }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .header { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .title { font-size: 2rem; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
          .subtitle { color: #6b7280; font-size: 0.875rem; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; }
          .stat-card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-label { color: #6b7280; font-size: 0.875rem; margin-bottom: 4px; }
          .stat-value { font-size: 1.5rem; font-weight: bold; color: #1f2937; }
          .controls { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .search-box { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; margin-bottom: 16px; }
          .filters { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
          .filter-button { padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 12px; transition: all 0.2s; }
          .filter-button:hover { background: #f3f4f6; }
          .filter-button.active { background: #3b82f6; color: white; border-color: #3b82f6; }
          .data-list { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .data-item { border-bottom: 1px solid #e5e7eb; padding: 20px; }
          .data-item:last-child { border-bottom: none; }
          .data-header { display: flex; justify-content: between; align-items: start; margin-bottom: 12px; }
          .data-time { color: #6b7280; font-size: 0.875rem; }
          .data-type { padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
          .type-text { background: #dbeafe; color: #1d4ed8; }
          .type-audio { background: #dcfce7; color: #166534; }
          .type-video { background: #fef3c7; color: #92400e; }
          .data-content { margin-bottom: 12px; }
          .question { color: #3b82f6; font-weight: 500; margin-bottom: 8px; }
          .answer { color: #1f2937; }
          .data-labels { display: flex; gap: 6px; flex-wrap: wrap; }
          .label { padding: 2px 6px; background: #f3f4f6; border-radius: 4px; font-size: 0.75rem; color: #374151; }
          .star-name { color: #7c3aed; font-weight: 500; font-size: 0.875rem; }
          .cost { color: #dc2626; font-weight: 500; font-size: 0.875rem; }
          .no-data { text-align: center; padding: 40px; color: #6b7280; }
          .media-player { margin: 8px 0; }
          .audio-player { width: 100%; max-width: 400px; }
          .video-player { width: 100%; max-width: 500px; border-radius: 8px; }
          .media-error { color: #dc2626; font-size: 0.875rem; padding: 8px; background: #fef2f2; border-radius: 4px; margin: 4px 0; }
          .media-info { color: #6b7280; font-size: 0.875rem; margin-top: 4px; }
          .local-file-controls { margin-top: 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
          .local-file-btn { padding: 4px 8px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 0.75rem; transition: all 0.2s; }
          .local-file-btn:hover { background: #e5e7eb; }
          .local-file-status { font-size: 0.75rem; padding: 2px 6px; border-radius: 3px; }
          .status-local { background: #d1fae5; color: #166534; }
          .status-remote { background: #dbeafe; color: #1d4ed8; }
          .status-error { background: #fee2e2; color: #dc2626; }
          .file-manager { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .file-manager-header { color: #374151; margin-bottom: 12px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; }
          .file-manager-header:hover { color: #1f2937; }
          .file-manager-toggle { font-size: 1.2em; transition: transform 0.2s; }
          .file-manager-toggle.collapsed { transform: rotate(-90deg); }
          .file-manager-content { overflow: hidden; transition: max-height 0.3s ease-out; max-height: 1000px; }
          .file-manager-content.collapsed { max-height: 0; }
          .file-drop-zone { border: 2px dashed #d1d5db; border-radius: 6px; padding: 20px; text-align: center; color: #6b7280; margin: 12px 0; transition: all 0.2s; }
          .file-drop-zone:hover, .file-drop-zone.drag-over { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
          @media (max-width: 768px) {
            .container { padding: 10px; }
            .stats { grid-template-columns: 1fr 1fr; }
            .filters { flex-direction: column; }
          }
        </style>
      `;

      // 生成 JavaScript 代码
      const inlineJS = `
        <script>
          const data = ${JSON.stringify(data, null, 2)};
          let filteredData = [...data];
          let currentSearchTerm = '';
          let currentFilters = { type: '', label: '', star: '' };

          // 格式化时间
          function formatTime(timestamp) {
            if (!timestamp) return '未知时间';
            try {
              let date;
              if (/^\\d{13}$/.test(timestamp)) {
                date = new Date(parseInt(timestamp));
              } else if (/^\\d{10}$/.test(timestamp)) {
                date = new Date(parseInt(timestamp) * 1000);
              } else {
                date = new Date(timestamp);
              }
              if (isNaN(date.getTime())) return '无效日期';
              return date.toLocaleString('zh-CN');
            } catch (error) {
              return '时间格式错误';
            }
          }

          // 格式化时长
          function formatDuration(duration) {
            if (!duration) return '';
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            return minutes + ':' + seconds.toString().padStart(2, '0');
          }

          // 应用过滤器
          function applyFilters() {
            filteredData = data.filter(item => {
              // 搜索过滤
              if (currentSearchTerm) {
                const searchLower = currentSearchTerm.toLowerCase();
                const matchContent = (item.content || '').toLowerCase().includes(searchLower);
                const matchQuestion = (item.questionContent || '').toLowerCase().includes(searchLower);
                const matchAnswer = (item.answerContent || '').toLowerCase().includes(searchLower);
                const matchUser = (item.userName || '').toLowerCase().includes(searchLower);
                const matchStar = (item.starName || '').toLowerCase().includes(searchLower);
                if (!matchContent && !matchQuestion && !matchAnswer && !matchUser && !matchStar) {
                  return false;
                }
              }

              // 类型过滤
              if (currentFilters.type && item.type !== currentFilters.type) {
                return false;
              }

              // 标签过滤
              if (currentFilters.label && !item.labels.includes(currentFilters.label)) {
                return false;
              }

              // 偶像过滤
              if (currentFilters.star && item.starName !== currentFilters.star) {
                return false;
              }

              return true;
            });

            // 按问题时间排序
            filteredData.sort((a, b) => {
              const parseTime = (timeStr) => {
                if (!timeStr) return 0;
                if (/^\\d{13}$/.test(timeStr)) return parseInt(timeStr);
                return new Date(timeStr).getTime();
              };
              const timeA = parseTime(a.questionTime || a.timestamp);
              const timeB = parseTime(b.questionTime || b.timestamp);
              return timeB - timeA;
            });

            renderData();
            updateStats();
          }

          // 创建媒体播放器
          function createMediaPlayer(item) {
            const enableLocalFiles = ${enableLocalFiles};

            if (item.type === 'audio' && item.audioUrl) {
              const audioId = 'audio_' + item.id;
              return '<div class="media-player">' +
                '<audio id="' + audioId + '" controls class="audio-player" preload="metadata">' +
                  '<source src="' + item.audioUrl + '" type="audio/aac">' +
                  '<source src="' + item.audioUrl + '" type="audio/mpeg">' +
                  '<div class="media-error">您的浏览器不支持音频播放</div>' +
                '</audio>' +
                '<div class="media-info">🎵 音频时长: ' + formatDuration(item.duration) + '</div>' +
                (enableLocalFiles ?
                  '<div class="local-file-controls">' +
                    '<button class="local-file-btn" onclick="selectLocalFile(\\'audio\\', \\''+item.id+'\\')">选择本地文件</button>' +
                    '<span id="status_'+item.id+'" class="local-file-status status-remote">远程文件</span>' +
                    '<button class="local-file-btn" onclick="resetMediaFile(\\''+item.id+'\\')">重置</button>' +
                  '</div>' : '') +
              '</div>';
            } else if (item.type === 'video' && item.videoUrl) {
              const videoId = 'video_' + item.id;
              return '<div class="media-player">' +
                '<video id="' + videoId + '" controls class="video-player" preload="metadata"' +
                  (item.previewImg ? ' poster="' + item.previewImg + '"' : '') + '>' +
                  '<source src="' + item.videoUrl + '" type="video/mp4">' +
                  '<div class="media-error">您的浏览器不支持视频播放</div>' +
                '</video>' +
                '<div class="media-info">🎬 视频时长: ' + formatDuration(item.duration) +
                  (item.width && item.height ? ' | 分辨率: ' + item.width + 'x' + item.height : '') + '</div>' +
                (enableLocalFiles ?
                  '<div class="local-file-controls">' +
                    '<button class="local-file-btn" onclick="selectLocalFile(\\'video\\', \\''+item.id+'\\')">选择本地文件</button>' +
                    '<span id="status_'+item.id+'" class="local-file-status status-remote">远程文件</span>' +
                    '<button class="local-file-btn" onclick="resetMediaFile(\\''+item.id+'\\')">重置</button>' +
                  '</div>' : '') +
              '</div>';
            }
            return '';
          }

          // 渲染数据
          function renderData() {
            const container = document.getElementById('dataList');
            if (filteredData.length === 0) {
              container.innerHTML = '<div class="no-data">没有找到匹配的数据</div>';
              return;
            }

            container.innerHTML = filteredData.map(item => {
              const typeClass = item.type === 'audio' ? 'type-audio' :
                              item.type === 'video' ? 'type-video' : 'type-text';
              const typeText = item.type === 'audio' ? '音频' :
                             item.type === 'video' ? '视频' : '文本';

              return '<div class="data-item">' +
                '<div class="data-header">' +
                  '<div>' +
                    '<div class="data-time">问题: ' + formatTime(item.questionTime || item.timestamp) + '</div>' +
                    '<div class="data-time">回复: ' + (item.answerTime ? formatTime(item.answerTime) : '暂无') + '</div>' +
                  '</div>' +
                  '<div>' +
                    '<span class="data-type ' + typeClass + '">' + typeText + '</span>' +
                  '</div>' +
                '</div>' +
                '<div class="data-content">' +
                  (item.questionContent ? '<div class="question">问题: ' + (item.questionContent || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>') + '</div>' : '') +
                  (item.answerContent ? '<div class="answer">回答: ' + (item.answerContent || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>') + '</div>' : '') +
                  (!item.questionContent && !item.answerContent && item.content ? '<div class="answer">' + (item.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>') + '</div>' : '') +
                  createMediaPlayer(item) +
                '</div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">' +
                  '<div class="data-labels">' +
                    (item.labels || []).map(label => '<span class="label">' + label + '</span>').join('') +
                  '</div>' +
                  '<div style="display: flex; gap: 12px; align-items: center;">' +
                    (item.starName ? '<span class="star-name">' + item.starName + '</span>' : '') +
                    (item.cost ? '<span class="cost">' + item.cost + '🍗</span>' : '') +
                    (item.duration ? '<span style="color: #6b7280; font-size: 0.875rem;">' + formatDuration(item.duration) + '</span>' : '') +
                  '</div>' +
                '</div>' +
              '</div>';
            }).join('');

            // 渲染完成后，恢复本地文件状态
            console.log(\`[渲染] 数据渲染完成，恢复本地文件状态...\`);
            restoreLocalFileStates();
          }

          // 更新统计信息
          function updateStats() {
            document.getElementById('totalCount').textContent = filteredData.length;
            document.getElementById('totalCost').textContent = filteredData.reduce((sum, item) => sum + (item.cost || 0), 0);
            document.getElementById('audioCount').textContent = filteredData.filter(item => item.type === 'audio').length;
            document.getElementById('videoCount').textContent = filteredData.filter(item => item.type === 'video').length;
            document.getElementById('textCount').textContent = filteredData.filter(item => item.type === 'text' || !item.type).length;
          }

          // 搜索功能
          function handleSearch(value) {
            currentSearchTerm = value;
            applyFilters();
          }

          // 过滤器功能
          function setFilter(type, value) {
            if (currentFilters[type] === value) {
              currentFilters[type] = '';
            } else {
              currentFilters[type] = value;
            }

            // 更新按钮状态
            document.querySelectorAll('.filter-button').forEach(btn => {
              btn.classList.remove('active');
            });

            Object.keys(currentFilters).forEach(key => {
              if (currentFilters[key]) {
                const btn = document.querySelector('[data-filter="' + key + '"][data-value="' + currentFilters[key] + '"]');
                if (btn) btn.classList.add('active');
              }
            });

            applyFilters();
          }

          // 获取唯一值
          function getUniqueValues(field) {
            const values = new Set();
            data.forEach(item => {
              if (field === 'labels') {
                (item.labels || []).forEach(label => values.add(label));
              } else if (item[field]) {
                values.add(item[field]);
              }
            });
            return Array.from(values).sort();
          }

          // 本地文件管理
          const localFiles = JSON.parse(localStorage.getItem('localMediaFiles') || '{}');

          // 保存本地文件映射
          function saveLocalFileMapping() {
            localStorage.setItem('localMediaFiles', JSON.stringify(localFiles));
          }

          // 选择本地文件
          function selectLocalFile(type, itemId) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = type === 'audio' ? 'audio/*' : 'video/*';

            input.onchange = function(e) {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                localFiles[itemId] = {
                  url: url,
                  name: file.name,
                  type: type
                };
                saveLocalFileMapping();
                updateMediaSource(type, itemId, url);
                updateFileStatus(itemId, 'local', file.name);
              }
            };

            input.click();
          }

          // 重置媒体文件
          function resetMediaFile(itemId) {
            if (localFiles[itemId]) {
              URL.revokeObjectURL(localFiles[itemId].url);
              delete localFiles[itemId];
              saveLocalFileMapping();
            }

            // 恢复原始媒体源
            const item = data.find(d => d.id === itemId);
            if (item) {
              const originalUrl = item.type === 'audio' ? item.audioUrl : item.videoUrl;
              updateMediaSource(item.type, itemId, originalUrl);
              updateFileStatus(itemId, 'remote');
            }
          }

          // 更新媒体源
          function updateMediaSource(type, itemId, newUrl) {
            const mediaElement = document.getElementById(type + '_' + itemId);
            if (mediaElement) {
              const source = mediaElement.querySelector('source');
              if (source) {
                source.src = newUrl;
                mediaElement.load(); // 重新加载媒体
              }
            }
          }

          // 更新文件状态显示
          function updateFileStatus(itemId, status, fileName = '') {
            const statusElement = document.getElementById('status_' + itemId);
            if (statusElement) {
              statusElement.className = 'local-file-status status-' + status;
              switch (status) {
                case 'local':
                  statusElement.textContent = '本地: ' + fileName;
                  break;
                case 'remote':
                  statusElement.textContent = '远程文件';
                  break;
                case 'error':
                  statusElement.textContent = '加载失败';
                  break;
              }
            }
          }

          // 初始化已保存的本地文件
          function initializeLocalFiles() {
            Object.keys(localFiles).forEach(itemId => {
              const localFile = localFiles[itemId];
              updateMediaSource(localFile.type, itemId, localFile.url);
              updateFileStatus(itemId, 'local', localFile.name);
            });
          }

          // 恢复本地文件状态（在重新渲染后调用）
          function restoreLocalFileStates() {
            console.log(\`[状态恢复] 开始恢复本地文件状态，当前映射数量: \${Object.keys(localFiles).length}\`);

            Object.keys(localFiles).forEach(itemId => {
              const localFile = localFiles[itemId];
              console.log(\`[状态恢复] 恢复项目 \${itemId} 的状态: \${localFile.name}\`);

              // 更新媒体源
              updateMediaSource(localFile.type, itemId, localFile.url);

              // 更新状态显示
              updateFileStatus(itemId, 'local', localFile.name);
            });

            console.log(\`[状态恢复] 状态恢复完成\`);
          }

          // 批量选择文件
          function selectMultipleFiles() {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'audio/*,video/*';

            input.onchange = function(e) {
              const files = Array.from(e.target.files);
              processBatchFiles(files);
            };

            input.click();
          }

          // 处理批量文件
          function processBatchFiles(files) {
            let matchCount = 0;
            let totalProcessed = 0;
            const matchedFiles = [];
            const unmatchedFiles = [];

            console.log(\`[批量处理] 开始处理 \${files.length} 个文件\`);
            console.log(\`[批量处理] 当前数据项总数: \${data.length}\`);

            files.forEach((file, index) => {
              console.log(\`\\n[批量处理] (\${index + 1}/\${files.length}) 处理文件: \${file.name}\`);
              console.log(\`[批量处理] 文件类型: \${file.type}, 大小: \${(file.size / 1024).toFixed(2)}KB\`);

              const fileType = file.type.startsWith('audio/') ? 'audio' :
                             file.type.startsWith('video/') ? 'video' : null;

              if (!fileType) {
                console.log(\`[批量处理] 跳过非媒体文件: \${file.name}\`);
                return;
              }

              console.log(\`[批量处理] 识别为 \${fileType} 文件，开始匹配...\`);

              // 尝试根据文件名匹配对应的数据项
              const matchedItem = findMatchingItem(file.name, fileType);

              if (matchedItem) {
                console.log(\`[批量处理] ✅ 匹配成功: \${file.name} → \${matchedItem.id} (\${matchedItem.starName})\`);

                const url = URL.createObjectURL(file);
                localFiles[matchedItem.id] = {
                  url: url,
                  name: file.name,
                  type: fileType
                };

                updateMediaSource(fileType, matchedItem.id, url);
                updateFileStatus(matchedItem.id, 'local', file.name);

                matchedFiles.push({
                  fileName: file.name,
                  itemId: matchedItem.id,
                  starName: matchedItem.starName || '未知'
                });
                matchCount++;
              } else {
                console.log(\`[批量处理] ❌ 匹配失败: \${file.name}\`);
                unmatchedFiles.push({
                  fileName: file.name,
                  fileType: fileType,
                  reason: '未找到匹配的数据项'
                });
              }
              totalProcessed++;
            });

            saveLocalFileMapping();

            console.log(\`\\n[批量处理] 处理完成统计:\`);
            console.log(\`- 总文件数: \${totalProcessed}\`);
            console.log(\`- 成功匹配: \${matchCount}\`);
            console.log(\`- 未能匹配: \${totalProcessed - matchCount}\`);
            console.log(\`- 当前本地文件映射总数: \${Object.keys(localFiles).length}\`);

            // 重新渲染页面以显示更新的状态
            console.log(\`[批量处理] 重新渲染页面...\`);
            applyFilters();

            // 等待渲染完成后恢复本地文件状态
            setTimeout(() => {
              console.log(\`[批量处理] 恢复本地文件状态...\`);
              restoreLocalFileStates();
            }, 100);

            // 生成详细的处理报告
            let reportMessage = \`批量处理完成！\\n\\n📊 处理统计:\\n\`;
            reportMessage += \`• 总文件数: \${totalProcessed}\\n\`;
            reportMessage += \`• 成功匹配: \${matchCount}\\n\`;
            reportMessage += \`• 未能匹配: \${totalProcessed - matchCount}\\n\\n\`;

            if (matchedFiles.length > 0) {
              reportMessage += \`✅ 成功匹配的文件:\\n\`;
              matchedFiles.forEach(item => {
                reportMessage += \`• \${item.fileName} → \${item.starName}\\n\`;
              });
              reportMessage += \`\\n\`;
            }

            if (unmatchedFiles.length > 0) {
              reportMessage += \`❌ 未匹配的文件:\\n\`;
              unmatchedFiles.forEach(item => {
                reportMessage += \`• \${item.fileName} (\${item.fileType})\\n\`;
              });
              reportMessage += \`\\n💡 匹配要求：\\n\`;
              reportMessage += \`仅支持严格精确匹配，文件名必须完全符合导出格式：\\n\`;
              reportMessage += \`偶像名-YYYYMMDD-YYYYMMDD-原文件名\\n\\n\`;
              reportMessage += \`注意：偶像名可以包含连字符，日期必须是8位数字\\n\`;
              reportMessage += \`例如：张-三-20241201-20241201-audio.aac\`;
            }

            alert(reportMessage);
          }

          // 时间格式化函数（与下载时保持一致）
          function formatDateForFilename(timestamp) {
            if (!timestamp) return '';
            try {
              let date;
              if (/^\\d{13}$/.test(timestamp)) {
                date = new Date(parseInt(timestamp));
              } else if (/^\\d{10}$/.test(timestamp)) {
                date = new Date(parseInt(timestamp) * 1000);
              } else {
                date = new Date(timestamp);
              }

              if (isNaN(date.getTime())) {
                return '';
              }

              return \`\${date.getFullYear()}\${(date.getMonth() + 1).toString().padStart(2, '0')}\${date.getDate().toString().padStart(2, '0')}\`;
            } catch (error) {
              return '';
            }
          }

          // 根据文件名查找匹配的数据项（严格精确匹配）
          function findMatchingItem(fileName, fileType) {
            // 去除文件扩展名
            const nameWithoutExt = fileName.replace(/\\.[^.]+$/, '');

            console.log(\`[严格匹配] 文件: \${fileName}, 类型: \${fileType}\`);

            // 使用正则表达式解析文件名：{starName}-{questionDate}-{answerDate}-{originalFilename}
            // 日期格式为8位数字（YYYYMMDD），从后往前匹配以处理偶像名中的连字符
            const datePattern = /(.*?)-(\\d{8})-(\\d{8})-(.*)/;
            const match = nameWithoutExt.match(datePattern);

            if (match) {
              const [, fileStarName, fileQuestionDate, fileAnswerDate, originalFilename] = match;
              console.log(\`[严格匹配] 解析 - 偶像: "\${fileStarName}", 问题日期: \${fileQuestionDate}, 回答日期: \${fileAnswerDate}, 原文件名: "\${originalFilename}"\`);

              // 遍历数据项寻找严格匹配
              for (const item of data) {
                if (item.type !== fileType) continue;

                const itemQuestionDate = formatDateForFilename(item.questionTime || item.timestamp);
                const itemAnswerDate = formatDateForFilename(item.answerTime || item.timestamp);
                const itemStarName = item.starName || '';

                console.log(\`[严格匹配] 比较数据项 \${item.id}: 偶像="\${itemStarName}", 问题日期=\${itemQuestionDate}, 回答日期=\${itemAnswerDate}\`);

                // 严格精确匹配：所有字段必须完全一致
                if (fileStarName === itemStarName &&
                    fileQuestionDate === itemQuestionDate &&
                    fileAnswerDate === itemAnswerDate) {
                  console.log(\`[匹配成功] 项目ID: \${item.id}\`);
                  return item;
                }
              }
            } else {
              console.log(\`[严格匹配] 文件名格式不符合规范: \${nameWithoutExt}\`);
            }

            console.log(\`[匹配失败] 未找到匹配项: \${fileName}\`);
            return null;
          }

          // 折叠/展开文件管理器
          function toggleFileManager() {
            const content = document.getElementById('fileManagerContent');
            const toggle = document.getElementById('fileManagerToggle');

            if (content.classList.contains('collapsed')) {
              content.classList.remove('collapsed');
              toggle.classList.remove('collapsed');
              toggle.textContent = '▼';
              content.style.maxHeight = content.scrollHeight + 'px';
            } else {
              content.classList.add('collapsed');
              toggle.classList.add('collapsed');
              toggle.textContent = '▶';
              content.style.maxHeight = '0px';
            }
          }

          // 清除所有本地文件
          function clearAllLocalFiles() {
            if (confirm('确定要清除所有本地文件映射吗？此操作不可撤销。')) {
              Object.keys(localFiles).forEach(itemId => {
                URL.revokeObjectURL(localFiles[itemId].url);
                resetMediaFile(itemId);
              });

              Object.keys(localFiles).forEach(key => delete localFiles[key]);
              saveLocalFileMapping();
              alert('已清除所有本地文件映射');
            }
          }

          // 显示文件映射信息
          function showFileMapping() {
            const mappingCount = Object.keys(localFiles).length;

            let mappingInfo = \`📊 文件映射统计:\\n\\n\`;
            mappingInfo += \`• 本地文件映射数量: \${mappingCount}\\n\`;
            mappingInfo += \`• 可用数据项总数: \${data.length}\\n\`;
            mappingInfo += \`• 音频数据项: \${data.filter(item => item.type === 'audio').length}\\n\`;
            mappingInfo += \`• 视频数据项: \${data.filter(item => item.type === 'video').length}\\n\\n\`;

            if (mappingCount === 0) {
              mappingInfo += '当前没有本地文件映射\\n\\n';
              mappingInfo += '💡 可用的偶像名称:\\n';
              const starNames = [...new Set(data.map(item => item.starName).filter(Boolean))];
              starNames.slice(0, 10).forEach(name => {
                mappingInfo += \`• \${name}\\n\`;
              });
              if (starNames.length > 10) {
                mappingInfo += \`• ... 还有 \${starNames.length - 10} 个\\n\`;
              }
            } else {
              mappingInfo += '🗂️ 当前映射:\\n';
              Object.keys(localFiles).forEach(itemId => {
                const file = localFiles[itemId];
                const item = data.find(d => d.id === itemId);
                const itemDesc = item ? (item.starName || item.userName || '未知') : '数据项不存在';
                mappingInfo += \`• \${file.name} → \${itemDesc} (\${file.type})\\n\`;
              });
            }

            alert(mappingInfo);
          }

          // 拖拽处理
          function handleDragOver(e) {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
          }

          function handleDragLeave(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
          }

          function handleBatchDrop(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files);
            const mediaFiles = files.filter(file =>
              file.type.startsWith('audio/') || file.type.startsWith('video/')
            );

            if (mediaFiles.length === 0) {
              alert('请拖拽音频或视频文件');
              return;
            }

            processBatchFiles(mediaFiles);
          }

          // 初始化
          window.onload = function() {
            // 渲染过滤器
            const types = [
              { value: 'text', label: '文本' },
              { value: 'audio', label: '音频' },
              { value: 'video', label: '视频' }
            ];

            const labels = getUniqueValues('labels');
            const stars = getUniqueValues('starName');

            const filtersContainer = document.getElementById('filters');
            let filtersHTML = '<div style="margin-bottom: 8px; font-weight: 500; color: #374151;">内容类型:</div>';
            filtersHTML += types.map(type =>
              '<button class="filter-button" data-filter="type" data-value="' + type.value + '" onclick="setFilter(\\'type\\', \\''+type.value+'\\')">'+type.label+'</button>'
            ).join(' ');

            if (labels.length > 0) {
              filtersHTML += '<div style="margin: 12px 0 8px 0; font-weight: 500; color: #374151;">标签:</div>';
              filtersHTML += labels.slice(0, 10).map(label =>
                '<button class="filter-button" data-filter="label" data-value="' + label + '" onclick="setFilter(\\'label\\', \\''+label+'\\')">'+label+'</button>'
              ).join(' ');
            }

            if (stars.length > 0) {
              filtersHTML += '<div style="margin: 12px 0 8px 0; font-weight: 500; color: #374151;">偶像:</div>';
              filtersHTML += stars.slice(0, 8).map(star =>
                '<button class="filter-button" data-filter="star" data-value="' + star + '" onclick="setFilter(\\'star\\', \\''+star+'\\')">'+star+'</button>'
              ).join(' ');
            }

            filtersContainer.innerHTML = filtersHTML;

            // 初始渲染
            applyFilters();

            // 初始化本地文件
            if (${enableLocalFiles}) {
              initializeLocalFiles();
            }
          };
        </script>
      `;

      // 生成完整的 HTML 内容
      const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>翻牌数据离线导出版</title>
  ${inlineCSS}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">翻牌数据离线导出版</div>
      <div class="subtitle">导出时间: ${new Date().toLocaleString('zh-CN')} | 总记录数: ${data.length}</div>
      ${enableLocalFiles ? `
      <div class="file-manager">
        <div class="file-manager-header" onclick="toggleFileManager()">
          <span>📁 本地文件管理</span>
          <span class="file-manager-toggle" id="fileManagerToggle">▼</span>
        </div>
        <div class="file-manager-content" id="fileManagerContent">
          <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 12px;">
            支持单个和批量文件替换。点击下方按钮进行批量操作，或点击各媒体项目的"选择本地文件"按钮进行单个替换。
          </p>

          <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
            <button class="local-file-btn" onclick="selectMultipleFiles()" style="background: #3b82f6; color: white; border-color: #3b82f6;">批量选择文件</button>
            <button class="local-file-btn" onclick="clearAllLocalFiles()" style="background: #ef4444; color: white; border-color: #ef4444;">清除所有本地文件</button>
            <button class="local-file-btn" onclick="showFileMapping()">查看文件映射</button>
          </div>

          <div class="file-drop-zone" ondrop="handleBatchDrop(event)" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)">
            拖拽多个媒体文件到此处进行批量替换<br>
            <small>支持的格式：音频(mp3, aac, wav)，视频(mp4, webm)</small>
          </div>

          <div style="display: flex; gap: 12px; font-size: 0.875rem; margin-top: 8px;">
            <span class="local-file-status status-local">本地文件</span>
            <span class="local-file-status status-remote">远程文件</span>
            <span class="local-file-status status-error">加载失败</span>
          </div>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">显示记录</div>
        <div class="stat-value" id="totalCount">${data.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总鸡腿花费</div>
        <div class="stat-value" id="totalCost">${data.reduce((sum, item) => sum + (item.cost || 0), 0)}🍗</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">文本</div>
        <div class="stat-value" id="textCount">${data.filter(item => item.type === 'text' || !item.type).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">音频</div>
        <div class="stat-value" id="audioCount">${data.filter(item => item.type === 'audio').length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">视频</div>
        <div class="stat-value" id="videoCount">${data.filter(item => item.type === 'video').length}</div>
      </div>
    </div>

    <div class="controls">
      <input
        type="text"
        class="search-box"
        placeholder="搜索内容、用户名或偶像名..."
        oninput="handleSearch(this.value)"
      />
      <div id="filters" class="filters"></div>
    </div>

    <div class="data-list" id="dataList">
      <!-- 数据将通过 JavaScript 动态加载 -->
    </div>
  </div>

  ${inlineJS}
</body>
</html>`;

      // 创建并下载文件
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Static HTML export failed:', error);
      throw new Error('静态HTML导出失败');
    }
  }
};