import React, { useState, useEffect, useCallback } from 'react';
import { Download, Youtube, Music, Video, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Define the Firebase configuration and initial auth token from the Canvas environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';

// Initialize Firebase App and Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

interface DownloadOption {
  id: string;
  label: string;
  type: 'audio' | 'video';
  quality?: string;
  size?: string; // Estimated size, will be dynamic in a real backend
}

interface DownloadJob {
  url: string;
  selectedFormatId: string;
  status: 'pending' | 'analyzing' | 'ready' | 'downloading' | 'complete' | 'error';
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
  timestamp: number;
  userId: string; // To link jobs to users
}

function App() {
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'ready' | 'downloading' | 'complete' | 'error'>('idle');
  const [currentDownloadUrl, setCurrentDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Hardcoded download options for demonstration. In a real app, these would come from backend analysis.
  const downloadOptions: DownloadOption[] = [
    { id: 'mp3-128', label: 'MP3 Audio (128 kbps)', type: 'audio', size: '~3MB' },
    { id: 'mp3-320', label: 'MP3 Audio (320 kbps)', type: 'audio', size: '~7MB' },
    { id: 'mp4-360', label: 'MP4 Video (360p)', type: 'video', quality: '360p', size: '~15MB' },
    { id: 'mp4-720', label: 'MP4 Video (720p)', type: 'video', quality: '720p', size: '~45MB' },
    { id: 'mp4-1080', label: 'MP4 Video (1080p)', type: 'video', quality: '1080p', size: '~85MB' },
  ];

  // Authenticate user anonymously or with custom token
  useEffect(() => {
    const authenticate = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase authentication failed:", error);
        setErrorMessage("Authentication failed. Please try again.");
      } finally {
        setIsAuthReady(true);
      }
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null); // User logged out or not authenticated
      }
    });

    authenticate();
  }, []); // Run once on component mount

  // Listen for job status updates from Firestore
  useEffect(() => {
    if (!jobId || !userId || !isAuthReady) return;

    const jobDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/downloadJobs`, jobId);

    const unsubscribe = onSnapshot(jobDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const jobData = docSnap.data() as DownloadJob;
        setStatus(jobData.status);
        setDownloadProgress(jobData.progress);
        setCurrentDownloadUrl(jobData.downloadUrl || null);
        setErrorMessage(jobData.errorMessage || null);
      } else {
        console.log("No such document for job:", jobId);
        // Handle case where job might have been deleted or not found
      }
    }, (error) => {
      console.error("Error listening to job updates:", error);
      setErrorMessage("Failed to get real-time updates for the download.");
    });

    return () => unsubscribe(); // Clean up listener on unmount or jobId change
  }, [jobId, userId, isAuthReady]);

  const isValidYouTubeUrl = (inputUrl: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(inputUrl);
  };

  const handleAnalyze = useCallback(async () => {
    if (!isValidYouTubeUrl(url)) {
      setStatus('error');
      setErrorMessage('Please enter a valid YouTube URL.');
      return;
    }
    if (!userId) {
      setErrorMessage("User not authenticated. Please wait or refresh.");
      return;
    }

    setStatus('analyzing');
    setErrorMessage(null);
    setSelectedFormat(''); // Reset selected format on new analysis

    try {
      // Generate a unique job ID for this request
      const newJobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setJobId(newJobId);

      // Create a new job document in Firestore
      const jobDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/downloadJobs`, newJobId);
      await setDoc(jobDocRef, {
        url: url,
        selectedFormatId: '', // No format selected yet
        status: 'analyzing',
        progress: 0,
        timestamp: Date.now(),
        userId: userId,
      } as DownloadJob);

      // Simulate backend analysis (replace with actual fetch to Vercel API in real app)
      // In a real Vercel setup, this would trigger a background worker.
      setTimeout(async () => {
        // After "analysis", update job status to 'ready' and make formats available
        await setDoc(jobDocRef, { status: 'ready', progress: 0, errorMessage: null }, { merge: true });
        setStatus('ready'); // UI will update via onSnapshot
      }, 2000); // Simulate 2 seconds of analysis
      
    } catch (error) {
      console.error("Error initiating analysis:", error);
      setStatus('error');
      setErrorMessage("Failed to initiate analysis. Please try again.");
    }
  }, [url, userId]);

  const handleDownload = useCallback(async () => {
    if (!selectedFormat || !jobId || !userId) return;

    setStatus('downloading');
    setErrorMessage(null);
    setDownloadProgress(0);
    setCurrentDownloadUrl(null);

    try {
      const jobDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/downloadJobs`, jobId);
      await setDoc(jobDocRef, { selectedFormatId: selectedFormat, status: 'downloading', progress: 0, errorMessage: null }, { merge: true });

      // Simulate download progress and completion (This is the part that needs a real backend worker)
      let currentProgress = 0;
      const interval = setInterval(async () => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          // Simulate a download URL
          const mockDownloadUrl = `https://example.com/downloads/${jobId}_${selectedFormat}.mp4`; // Replace with actual object storage URL
          
          await setDoc(jobDocRef, { 
            status: 'complete', 
            progress: 100, 
            downloadUrl: mockDownloadUrl, 
            errorMessage: null 
          }, { merge: true });
          // UI will update via onSnapshot
        } else {
          await setDoc(jobDocRef, { progress: Math.round(currentProgress) }, { merge: true });
          // UI will update via onSnapshot
        }
      }, 500); // Update progress every 0.5 seconds

    } catch (error) {
      console.error("Error initiating download:", error);
      setStatus('error');
      setErrorMessage("Failed to start download. Please try again.");
      if (jobId && userId) {
        const jobDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/downloadJobs`, jobId);
        await setDoc(jobDocRef, { status: 'error', errorMessage: "Failed to start download." }, { merge: true });
      }
    }
  }, [selectedFormat, jobId, userId]);

  const resetForm = useCallback(() => {
    setUrl('');
    setSelectedFormat('');
    setJobId(null);
    setDownloadProgress(0);
    setStatus('idle');
    setCurrentDownloadUrl(null);
    setErrorMessage(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 font-sans">
      {/* Background texture overlay */}
      <div className="absolute inset-0 opacity-10" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
           }}>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 rounded-full shadow-lg">
              <Youtube className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-serif font-bold text-amber-100 mb-4 tracking-wide sm:text-6xl">
            VintageDownloader
          </h1>
          <p className="text-xl text-stone-300 font-light sm:text-2xl">
            Download your favorite videos in classic style
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-600 to-orange-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* User ID Display (for multi-user testing in Canvas) */}
        {userId && (
          <div className="text-center text-stone-400 text-sm mb-8 p-2 bg-stone-800/50 rounded-lg max-w-md mx-auto">
            Your User ID: <span className="font-mono text-amber-300 break-all">{userId}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-stone-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-stone-700/50 overflow-hidden">
            <div className="p-8 sm:p-10">
              {/* URL Input Section */}
              <div className="mb-8">
                <label htmlFor="youtube-url" className="block text-stone-200 text-lg font-medium mb-4">
                  YouTube Video URL
                </label>
                <div className="relative">
                  <input
                    id="youtube-url"
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (status === 'error' && isValidYouTubeUrl(e.target.value)) {
                        setStatus('idle'); // Clear error if URL becomes valid
                        setErrorMessage(null);
                      }
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`w-full pr-32 px-6 py-4 bg-stone-900/50 border-2 rounded-xl text-stone-100 placeholder-stone-400 text-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-600/30 ${
                      status === 'error' ? 'border-red-500' : 'border-stone-600 focus:border-amber-500'
                    }`}
                    disabled={status === 'analyzing' || status === 'downloading'}
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={!url || status === 'analyzing' || status === 'downloading' || !userId}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium transition-all duration-300 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {status === 'analyzing' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Analyze'
                    )}
                  </button>
                </div>
                {errorMessage && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errorMessage}
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
                        } ${status === 'downloading' ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={option.id}
                          checked={selectedFormat === option.id}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="sr-only"
                          disabled={status === 'downloading'}
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
                  <div className="flex items-center gap-3 text-green-300 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span>Download completed successfully!</span>
                  </div>
                  {currentDownloadUrl && (
                    <a 
                      href={currentDownloadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-center px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors duration-300"
                    >
                      Click to Download File
                    </a>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 flex-col sm:flex-row">
                {status === 'ready' && (
                  <button
                    onClick={handleDownload}
                    disabled={!selectedFormat || status === 'downloading'}
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
                <span className="text-amber-400">Note:</span> This is a UI demonstration with simulated backend. 
                Actual downloading requires a dedicated backend service that can handle long-running tasks and comply with YouTube's terms of service.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-stone-800/50 rounded-xl shadow-lg border border-stone-700/50">
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
            
            <div className="text-center p-6 bg-stone-800/50 rounded-xl shadow-lg border border-stone-700/50">
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
            
            <div className="text-center p-6 bg-stone-800/50 rounded-xl shadow-lg border border-stone-700/50">
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
