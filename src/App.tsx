import React, { useState } from 'react';
import { Download, Youtube, Music, Video, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DownloadOption {
  id: string;
  label: string;
  type: 'audio' | 'video';
  quality?: string;
  size?: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'ready' | 'downloading' | 'complete' | 'error'>('idle');

  const downloadOptions: DownloadOption[] = [
    { id: 'mp3-128', label: 'MP3 Audio (128 kbps)', type: 'audio', size: '~3MB' },
    { id: 'mp3-320', label: 'MP3 Audio (320 kbps)', type: 'audio', size: '~7MB' },
    { id: 'mp4-360', label: 'MP4 Video (360p)', type: 'video', quality: '360p', size: '~15MB' },
    { id: 'mp4-720', label: 'MP4 Video (720p)', type: 'video', quality: '720p', size: '~45MB' },
    { id: 'mp4-1080', label: 'MP4 Video (1080p)', type: 'video', quality: '1080p', size: '~85MB' },
  ];

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const handleAnalyze = () => {
    if (!isValidYouTubeUrl(url)) {
      setStatus('error');
      return;
    }

    setIsAnalyzing(true);
    setStatus('analyzing');
    
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setStatus('ready');
    }, 2000);
  };

  const handleDownload = () => {
    if (!selectedFormat) return;
    
    setIsDownloading(true);
    setStatus('downloading');
    setDownloadProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          setStatus('complete');
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const resetForm = () => {
    setUrl('');
    setSelectedFormat('');
    setDownloadProgress(0);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900">
      {/* Background texture overlay */}
      <div className="absolute inset-0 opacity-10" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
           }}>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 rounded-full shadow-lg">
              <Youtube className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-serif font-bold text-amber-100 mb-4 tracking-wide">
            VintageDownloader
          </h1>
          <p className="text-xl text-stone-300 font-light">
            Download your favorite videos in classic style
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-600 to-orange-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Main Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-stone-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-stone-700/50 overflow-hidden">
            <div className="p-8">
              {/* URL Input Section */}
              <div className="mb-8">
                <label className="block text-stone-200 text-lg font-medium mb-4">
                  YouTube Video URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`w-full px-6 py-4 bg-stone-900/50 border-2 rounded-xl text-stone-100 placeholder-stone-400 text-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-600/30 ${
                      status === 'error' ? 'border-red-500' : 'border-stone-600 focus:border-amber-500'
                    }`}
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={!url || isAnalyzing || status === 'downloading'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium transition-all duration-300 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Analyze'
                    )}
                  </button>
                </div>
                {status === 'error' && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Please enter a valid YouTube URL
                  </p>
                )}
              </div>

              {/* Status Messages */}
              {status === 'analyzing' && (
                <div className="mb-8 p-4 bg-blue-900/30 border border-blue-700/50 rounded-xl">
                  <div className="flex items-center gap-3 text-blue-300">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing video... Please wait</span>
                  </div>
                </div>
              )}

              {/* Format Selection */}
              {(status === 'ready' || status === 'downloading' || status === 'complete') && (
                <div className="mb-8">
                  <h3 className="text-stone-200 text-lg font-medium mb-4">
                    Select Download Format
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {downloadOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          selectedFormat === option.id
                            ? 'border-amber-500 bg-amber-900/20'
                            : 'border-stone-600 bg-stone-900/30 hover:border-stone-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={option.id}
                          checked={selectedFormat === option.id}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          {option.type === 'audio' ? (
                            <Music className="w-5 h-5 text-amber-400" />
                          ) : (
                            <Video className="w-5 h-5 text-amber-400" />
                          )}
                          <div>
                            <div className="text-stone-200 font-medium">
                              {option.label}
                            </div>
                            <div className="text-stone-400 text-sm">
                              Est. size: {option.size}
                            </div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          selectedFormat === option.id
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-stone-500'
                        }`}>
                          {selectedFormat === option.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Progress */}
              {status === 'downloading' && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-stone-200">Downloading...</span>
                    <span className="text-stone-300">{Math.round(downloadProgress)}%</span>
                  </div>
                  <div className="w-full bg-stone-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-amber-600 to-orange-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {status === 'complete' && (
                <div className="mb-8 p-4 bg-green-900/30 border border-green-700/50 rounded-xl">
                  <div className="flex items-center gap-3 text-green-300">
                    <CheckCircle className="w-5 h-5" />
                    <span>Download completed successfully!</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {status === 'ready' && (
                  <button
                    onClick={handleDownload}
                    disabled={!selectedFormat}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium text-lg transition-all duration-300 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-5 h-5" />
                    Start Download
                  </button>
                )}
                
                {(status === 'complete' || status === 'error') && (
                  <button
                    onClick={resetForm}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-stone-700 text-stone-200 rounded-xl font-medium text-lg transition-all duration-300 hover:bg-stone-600 shadow-lg hover:shadow-xl"
                  >
                    Download Another
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-stone-900/50 px-8 py-4 border-t border-stone-700/50">
              <p className="text-stone-400 text-sm text-center">
                <span className="text-amber-400">Note:</span> This is a UI demonstration. 
                Actual downloading would require backend services and compliance with YouTube's terms of service.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-amber-100 mb-2">
                Multiple Formats
              </h3>
              <p className="text-stone-300">
                Choose from various audio and video quality options to suit your needs.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-amber-100 mb-2">
                Audio Extraction
              </h3>
              <p className="text-stone-300">
                Extract high-quality audio tracks in MP3 format with different bitrates.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-amber-100 mb-2">
                Video Quality
              </h3>
              <p className="text-stone-300">
                Download videos in resolutions from 360p to 1080p HD quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;