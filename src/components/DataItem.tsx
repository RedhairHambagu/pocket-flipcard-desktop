import React from 'react';
import { Clock, Tag, Headphones, Play } from 'lucide-react';
import { DataItem } from '../types';
import AudioPlayer from './AudioPlayer';
import { getMediaPlaybackUrl } from '../utils/desktop';

interface DataItemProps {
  item: DataItem;
}

const DataItemComponent: React.FC<DataItemProps> = ({ item }) => {
  const audioPlaybackUrl = getMediaPlaybackUrl(item.localAudioPath, item.audioUrl);
  const videoPlaybackUrl = getMediaPlaybackUrl(item.localVideoPath, item.videoUrl);
  const formatDate = (timestamp: string) => {
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
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'timestamp:', timestamp);
      return '日期格式错误';
    }
  };

  const getLabelColor = (index: number) => {
    const colors = [
      'bg-emerald-100 text-emerald-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800',
      'bg-amber-100 text-amber-800',
      'bg-rose-100 text-rose-800',
      'bg-slate-100 text-slate-800'
    ];
    return colors[index % colors.length];
  };

  // 视频播放器组件
  const VideoPlayer = ({ videoUrl, previewImg }: { videoUrl: string; previewImg?: string }) => {
    const [showVideo, setShowVideo] = React.useState(false);

    return (
      <div className="mb-4">
        {showVideo ? (
          <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
            <video
              src={videoUrl}
              controls
              className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
              autoPlay
            />
          </div>
        ) : (
          <div
            className="relative cursor-pointer rounded-xl overflow-hidden bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 hover:border-teal-300/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
            onClick={() => setShowVideo(true)}
          >
            {previewImg && (
              <img
                src={previewImg}
                alt="视频预览"
                className="w-full h-auto max-h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 via-transparent to-transparent">
              <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-white">
                <Play className="w-8 h-8 text-teal-600 ml-1" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 bg-teal-600/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg font-medium">
              视频
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-in slide-in-from-bottom-4">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div className="flex-shrink-0">
            {item.questionTime && (
              <div className="flex items-center text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium">
                <Clock className="w-3 h-3 mr-1.5" />
                问题发送: {formatDate(item.questionTime)}
              </div>
            )}
            {/* 如果没有分离的时间，显示原始时间戳 */}
            {!item.questionTime && (
              <div className="flex items-center text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg font-medium">
                <Clock className="w-4 h-4 mr-2" />
                {formatDate(item.timestamp)}
              </div>
            )}
          </div>

          <div className="flex gap-1 sm:gap-2 flex-wrap sm:flex-nowrap sm:justify-end overflow-hidden">
            {item.type === 'audio' && (
              <div className="flex items-center text-xs sm:text-sm text-emerald-700 bg-emerald-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-medium transition-all duration-200 hover:bg-emerald-200 flex-shrink-0">
                <Headphones size={12} className="sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                音频
              </div>
            )}

            {item.type === 'video' && (
              <div className="flex items-center text-xs sm:text-sm text-teal-700 bg-teal-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-medium transition-all duration-200 hover:bg-teal-200 flex-shrink-0">
                <Play size={12} className="sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                视频
              </div>
            )}

            {item.cost !== undefined && item.cost > 0 && (
              <div className="flex items-center text-xs sm:text-sm text-amber-700 bg-amber-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-medium transition-all duration-200 hover:bg-amber-200 flex-shrink-0">
                <span className="text-xs">🍗{item.cost}</span>
              </div>
            )}

            {item.status === 1 && (
              <div className="flex items-center text-xs sm:text-sm text-slate-600 bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-medium transition-all duration-200 hover:bg-slate-200 flex-shrink-0">
                未翻
              </div>
            )}
            {item.status === 2 && (
              <div className="flex items-center text-xs sm:text-sm text-slate-600 bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-medium transition-all duration-200 hover:bg-slate-200 flex-shrink-0">
                已翻
              </div>
            )}
            {item.status === 3 && (
              <div className="flex items-center text-xs sm:text-sm text-slate-600 bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-medium transition-all duration-200 hover:bg-slate-200 flex-shrink-0">
                退回/撤回
              </div>
            )}
          </div>
        </div>

        {/* 用户信息 */}
        {(item.userName || item.userAvatar) && (
          <div className="flex items-center mb-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            {item.userAvatar && (
              <img
                src={item.userAvatar}
                alt={item.userName || '用户头像'}
                className="w-10 h-10 rounded-full mr-3 shadow-md ring-2 ring-white"
              />
            )}
            {item.userName && (
              <span className="text-sm font-semibold text-slate-700">{item.userName}</span>
            )}
          </div>
        )}

        <div className="mb-5">
          {item.questionContent && item.answerContent ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200/50 transition-all duration-200 hover:shadow-md">
                <p className="text-sm font-semibold text-emerald-700 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                  问题：
                </p>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{item.questionContent}</p>
              </div>
              {/* 只有当有回答时才显示回答区域 */}
              {item.answerTime && (
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-200/50 transition-all duration-200 hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-sm font-semibold text-teal-700 flex items-center">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                      {item.idolNickname && item.starName ? `${item.idolNickname}(${item.starName})` : ''} 的回答:
                    </p>
                    <div className="flex items-center text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded-lg font-medium">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(item.answerTime)}
                    </div>
                  </div>
                  {item.type === 'audio' && audioPlaybackUrl ? (
                    <div className="mt-3">
                      <div className="text-xs text-teal-600 mb-2 bg-teal-100 px-3 py-1 rounded-lg inline-block font-medium">
                        🎵 音频时长: {item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : '未知'}
                      </div>
                      <AudioPlayer
                        audioUrl={audioPlaybackUrl}
                        downloadUrl={item.audioUrl}
                        duration={item.duration}
                      />
                    </div>
                  ) : item.type === 'video' && videoPlaybackUrl ? (
                    <div className="mt-3">
                      <VideoPlayer
                        videoUrl={videoPlaybackUrl}
                        previewImg={item.previewImg}
                      />
                    </div>
                  ) : (
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{item.answerContent}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200/50">
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{item.content}</p>
            </div>
          )}
        </div>

        {/* Audio和Video Player已经移到回答区域内 */}

        {item.labels.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <div className="flex-shrink-0 mt-0.5">
              <Tag className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              {item.labels.map((label, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${getLabelColor(index)}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataItemComponent;
