import { DataItem, DuplicateCheckResult, DuplicateCheckStatus, SaveDataItemsResult } from '../types';

// 数据库配置
const DB_BASE_NAME = 'PocketFlipcardDB';
const DB_VERSION = 3;
const STORE_NAME = 'dataItems';

// 同步接口返回的记录不包含本地媒体路径。写入前保留同一远程媒体已完成的缓存，
// 否则下一次同步会把离线播放能力覆盖掉。
const preserveLocalMedia = (incoming: DataItem, existing?: DataItem): DataItem => ({
  ...incoming,
  localAudioPath: incoming.localAudioPath ?? (
    incoming.audioUrl && incoming.audioUrl === existing?.audioUrl
      ? existing.localAudioPath
      : undefined
  ),
  localVideoPath: incoming.localVideoPath ?? (
    incoming.videoUrl && incoming.videoUrl === existing?.videoUrl
      ? existing.localVideoPath
      : undefined
  ),
});

// 生成基于userId的数据库名称
const getDBName = (userId?: number): string => {
  if (userId) {
    return `${DB_BASE_NAME}_User_${userId}`;
  }
  return `${DB_BASE_NAME}_Default`; // 向后兼容，用于没有userId的情况
};

// 打开数据库连接
const openDB = (userId?: number): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const dbName = getDBName(userId);
    const request = indexedDB.open(dbName, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // 创建对象存储空间
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('questionTime', 'questionTime', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('questionId', 'questionId', { unique: true });
        store.createIndex('sortTime', 'sortTime', { unique: false });
      } else {
        // 数据库升级，添加新索引
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const store = transaction.objectStore(STORE_NAME);
        
        if (!store.indexNames.contains('questionTime')) {
          store.createIndex('questionTime', 'questionTime', { unique: false });
        }
        if (!store.indexNames.contains('sortTime')) {
          store.createIndex('sortTime', 'sortTime', { unique: false });
        }
      }
    };
  });
};

// 保存单个数据项
export const saveDataItem = async (item: DataItem, userId?: number): Promise<void> => {
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 批量保存数据项
export const saveDataItems = async (
  items: DataItem[], 
  userId?: number, 
  useEnhancedDuplicateCheck: boolean = false
): Promise<void> => {
  if (!items || items.length === 0) {
    return;
  }

  // 如果使用增强的重复检查，调用新的函数
  if (useEnhancedDuplicateCheck) {
    const result = await saveDataItemsWithStats(items, userId);
    console.log(`Enhanced save completed: ${result.newCount} new, ${result.updatedCount} updated, ${result.duplicateCount} duplicates`);
    return;
  }

  // 同步数据时保留已缓存媒体的本地路径。
  const itemsToWrite = await Promise.all(
    items.map(async item => preserveLocalMedia(item, await getDataItem(item.id, userId)))
  );

  // 否则使用原来的逻辑
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    let completed = 0;
    let hasError = false;
    
    // 使用事务的完成事件来确保所有操作都完成
    transaction.oncomplete = () => {
      if (!hasError) {
        console.log(`Successfully saved ${itemsToWrite.length} items to IndexedDB`);
        resolve();
      }
    };
    
    transaction.onerror = () => {
      console.error('Transaction failed:', transaction.error);
      reject(transaction.error);
    };
    
    transaction.onabort = () => {
      console.error('Transaction was aborted');
      reject(new Error('Transaction was aborted'));
    };
    
    itemsToWrite.forEach((item, index) => {
      try {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          // 减少日志输出，只在批次完成时输出
        };
        request.onerror = () => {
          console.error(`Failed to save item ${index + 1}:`, request.error);
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      } catch (error) {
        console.error(`Error processing item ${index + 1}:`, error);
        if (!hasError) {
          hasError = true;
          reject(error);
        }
      }
    });
  });
};

// 根据ID获取单个数据项
export const getDataItem = async (id: string, userId?: number): Promise<DataItem | undefined> => {
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 获取所有数据项
export const getAllDataItems = async (userId?: number): Promise<DataItem[]> => {
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 获取按问题时间排序的数据项（降序）
export const getAllDataItemsSorted = async (userId?: number): Promise<DataItem[]> => {
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const items: DataItem[] = [];
    const request = store.openCursor();
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        // 在IndexedDB层面就完成排序，减少API层的排序开销
        items.sort((a, b) => {
          const parseTime = (timeStr: string) => {
            if (!timeStr) return 0;
            if (/^\d{13}$/.test(timeStr)) {
              return parseInt(timeStr);
            }
            return new Date(timeStr).getTime();
          };
          
          const timeA = parseTime(a.questionTime || a.timestamp);
          const timeB = parseTime(b.questionTime || b.timestamp);
          
          if (isNaN(timeA) && isNaN(timeB)) return 0;
          if (isNaN(timeA)) return 1;
          if (isNaN(timeB)) return -1;
          
          return timeB - timeA; // 降序
        });
        resolve(items);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
};


// 根据时间范围获取数据项
export const getDataItemsByDateRange = async (start: Date, end: Date, userId?: number): Promise<DataItem[]> => {
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('timestamp');
  
  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.bound(start.toISOString(), end.toISOString());
    const request = index.getAll(range);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 根据类型获取数据项
export const getDataItemsByType = async (type: 'text' | 'audio' | 'video', userId?: number): Promise<DataItem[]> => {
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('type');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(type);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 删除单个数据项
export const deleteDataItem = async (id: string, userId?: number): Promise<void> => {
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 清空所有数据
export const clearAllData = async (userId?: number): Promise<void> => {
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clearDatabaseContents = (name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('questionTime', 'questionTime', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('questionId', 'questionId', { unique: true });
        store.createIndex('sortTime', 'sortTime', { unique: false });
      }
    };
    request.onerror = () => reject(request.error || new Error(`无法打开本地数据库 ${name}`));
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        resolve();
        return;
      }

      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error || new Error(`无法清除本地数据库 ${name}`));
      };
      transaction.onabort = () => {
        db.close();
        reject(transaction.error || new Error(`清除本地数据库 ${name} 时被中断`));
      };
      transaction.objectStore(STORE_NAME).clear();
    };
  });
};

/**
 * 删除本应用在当前 WebView 源下的全部 IndexedDB 数据库。
 * `databases()` 在现代 WebView2/WKWebView 中可用；旧环境则退回到已知账号库。
 */
export const clearAllApplicationData = async (knownUserIds: Array<number | undefined> = []): Promise<void> => {
  const databaseNames = new Set<string>([
    getDBName(),
    ...knownUserIds.filter((id): id is number => typeof id === 'number').map(id => getDBName(id)),
  ]);

  if (typeof indexedDB.databases === 'function') {
    // 某些旧版 WKWebView 对 databases() 支持不完整；超时后仍清理已知账号库。
    const databases = await Promise.race([
      indexedDB.databases(),
      new Promise<IDBDatabaseInfo[]>(resolve => setTimeout(() => resolve([]), 1500)),
    ]);
    databases.forEach(database => {
      if (database.name?.startsWith(DB_BASE_NAME)) {
        databaseNames.add(database.name);
      }
    });
  }

  await Promise.all([...databaseNames].map(clearDatabaseContents));
};

// 获取数据项数量
export const getDataItemCount = async (userId?: number): Promise<number> => {
  const db = await openDB(userId);
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 检查数据项是否有实际的答案内容
const hasAnswerContent = (item: DataItem): boolean => {
  if (!item.answerContent) return false;
  
  // 检查是否是未翻牌状态的占位符内容
  const placeholderPatterns = [
    /\[.*未翻牌.*\]/,
    /\[.*回答.*未翻牌\]/,
    /\[文字回答，未翻牌\]/,
    /\[音频回答，未翻牌\]/,
    /\[视频回答，未翻牌\]/
  ];
  
  const hasPlaceholder = placeholderPatterns.some(pattern => 
    pattern.test(item.answerContent || '')
  );
  
  // 如果包含占位符，说明没有真实答案
  if (hasPlaceholder) return false;
  
  // 检查状态：只有status为2才是已翻牌
  if (item.status !== 2) return false;
  
  // 检查内容不为空且不只是空白字符
  return item.answerContent.trim().length > 0;
};

// 增强的重复检查：检查是否需要更新答案内容
export const checkForDuplicateWithAnswerUpdate = async (
  newItem: DataItem, 
  userId?: number
): Promise<DuplicateCheckResult> => {
  const existingItem = await getDataItem(newItem.id, userId);
  
  // 如果不存在，直接返回新项
  if (!existingItem) {
    return {
      status: 'new',
      shouldSave: true
    };
  }
  
  // 检查现有项和新项的答案内容
  const existingHasAnswer = hasAnswerContent(existingItem);
  const newHasAnswer = hasAnswerContent(newItem);
  
  // 实现新规则：如果之前没有答案，新数据有答案，则更新；否则算重复
  if (!existingHasAnswer && newHasAnswer) {
    return {
      status: 'updated',
      existingItem,
      shouldSave: true
    };
  }
  
  // 如果现有数据已有答案，或者新数据也没有答案，算作重复
  return {
    status: 'duplicate',
    existingItem,
    shouldSave: false
  };
};

// 批量保存数据项（带统计信息）
export const saveDataItemsWithStats = async (
  items: DataItem[],
  userId?: number
): Promise<SaveDataItemsResult> => {
  if (!items || items.length === 0) {
    return {
      newCount: 0,
      updatedCount: 0,
      duplicateCount: 0,
      totalProcessed: 0
    };
  }

  const db = await openDB(userId);

  let newCount = 0;
  let updatedCount = 0;
  let duplicateCount = 0;

  // 先检查所有项目的重复状态（在事务外进行）
  const checkResults: DuplicateCheckResult[] = [];

  try {
    for (const item of items) {
      const checkResult = await checkForDuplicateWithAnswerUpdate(item, userId);
      checkResults.push(checkResult);

      switch (checkResult.status) {
        case 'new':
          newCount++;
          break;
        case 'updated':
          updatedCount++;
          break;
        case 'duplicate':
          duplicateCount++;
          break;
      }
    }
  } catch (checkError) {
    throw checkError;
  }

  // 现在创建事务进行保存
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    let completed = 0;
    let hasError = false;
    const itemsToSave = items.filter((_, index) => checkResults[index].shouldSave);

    // 如果没有要保存的项目，直接返回结果
    if (itemsToSave.length === 0) {
      console.log(`Batch save completed: ${newCount} new, ${updatedCount} updated, ${duplicateCount} duplicates`);
      resolve({
        newCount,
        updatedCount,
        duplicateCount,
        totalProcessed: items.length
      });
      return;
    }

    // 使用事务的完成事件来确保所有操作都完成
    transaction.oncomplete = () => {
      if (!hasError) {
        console.log(`Batch save completed: ${newCount} new, ${updatedCount} updated, ${duplicateCount} duplicates`);
        resolve({
          newCount,
          updatedCount,
          duplicateCount,
          totalProcessed: items.length
        });
      }
    };

    transaction.onerror = () => {
      console.error('Transaction failed:', transaction.error);
      reject(transaction.error);
    };

    transaction.onabort = () => {
      console.error('Transaction was aborted');
      reject(new Error('Transaction was aborted'));
    };

    // 只保存需要保存的项目
    items.forEach((item, index) => {
      const checkResult = checkResults[index];

      if (checkResult.shouldSave) {
        try {
          const request = store.put(preserveLocalMedia(item, checkResult.existingItem));
          request.onsuccess = () => {
            completed++;
          };
          request.onerror = () => {
            console.error(`Failed to save item ${index + 1}:`, request.error);
            if (!hasError) {
              hasError = true;
              reject(request.error);
            }
          };
        } catch (error) {
          console.error(`Error processing item ${index + 1}:`, error);
          if (!hasError) {
            hasError = true;
            reject(error);
          }
        }
      }
    });
  });
};

// 检查数据项是否存在
export const hasDataItem = async (id: string, userId?: number): Promise<boolean> => {
  const item = await getDataItem(id, userId);
  return item !== undefined;
};
