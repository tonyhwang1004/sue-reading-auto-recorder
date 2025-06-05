// Sue Reading Club - 자동 녹화 시스템

class AutoRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.recordingTimer = null;
        this.stream = null;
        this.videoQuality = '1080';
        this.frameRate = 30;
        this.autoDownload = true;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadSettings();
        this.checkBrowserSupport();
        
        if (window.DEBUG) {
            console.log('🎥 자동 녹화 시스템 초기화 완료');
        }
    }
    
    bindEvents() {
        // 자동 녹화 시작 버튼
        const startBtn = Utils.dom.$('#startAutoRecording');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startAutoRecording());
        }
        
        // 수동 녹화 중지 버튼
        const stopBtn = Utils.dom.$('#stopRecording');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopRecording());
        }
        
        // 설정 변경 이벤트
        this.bindSettingsEvents();
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'r':
                        e.preventDefault();
                        if (!this.isRecording) {
                            this.startAutoRecording();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        if (this.isRecording) {
                            this.stopRecording();
                        }
                        break;
                }
            }
        });
    }
    
    bindSettingsEvents() {
        const qualitySelect = Utils.dom.$('#videoQualitySelect');
        const frameRateSelect = Utils.dom.$('#frameRateSelect');
        const autoDownloadCheck = Utils.dom.$('#autoDownload');
        
        if (qualitySelect) {
            qualitySelect.addEventListener('change', (e) => {
                this.videoQuality = e.target.value;
                this.updateQualityDisplay();
                this.saveSettings();
            });
        }
        
        if (frameRateSelect) {
            frameRateSelect.addEventListener('change', (e) => {
                this.frameRate = parseInt(e.target.value);
                this.saveSettings();
            });
        }
        
        if (autoDownloadCheck) {
            autoDownloadCheck.addEventListener('change', (e) => {
                this.autoDownload = e.target.checked;
                this.saveSettings();
            });
        }
    }
    
    loadSettings() {
        const settings = Utils.storage.get(CONFIG.STORAGE_KEYS.USER_SETTINGS, {});
        
        if (settings.videoQuality) {
            this.videoQuality = settings.videoQuality;
            const qualitySelect = Utils.dom.$('#videoQualitySelect');
            if (qualitySelect) qualitySelect.value = this.videoQuality;
        }
        
        if (settings.frameRate) {
            this.frameRate = settings.frameRate;
            const frameRateSelect = Utils.dom.$('#frameRateSelect');
            if (frameRateSelect) frameRateSelect.value = this.frameRate;
        }
        
        if (settings.autoDownload !== undefined) {
            this.autoDownload = settings.autoDownload;
            const autoDownloadCheck = Utils.dom.$('#autoDownload');
            if (autoDownloadCheck) autoDownloadCheck.checked = this.autoDownload;
        }
        
        this.updateQualityDisplay();
    }
    
    saveSettings() {
        const currentSettings = Utils.storage.get(CONFIG.STORAGE_KEYS.USER_SETTINGS, {});
        Object.assign(currentSettings, {
            videoQuality: this.videoQuality,
            frameRate: this.frameRate,
            autoDownload: this.autoDownload
        });
        Utils.storage.set(CONFIG.STORAGE_KEYS.USER_SETTINGS, currentSettings);
    }
    
    updateQualityDisplay() {
        const qualityDisplay = Utils.dom.$('#videoQuality');
        if (qualityDisplay) {
            qualityDisplay.textContent = `${this.videoQuality}p`;
        }
    }
    
    checkBrowserSupport() {
        const isSupported = Utils.media.isMediaRecorderSupported() && Utils.media.isGetDisplayMediaSupported();
        
        if (!isSupported) {
            Utils.toast.show('이 브라우저는 화면 녹화를 지원하지 않습니다.', 'error');
            const startBtn = Utils.dom.$('#startAutoRecording');
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.innerHTML = '<div class="btn-icon">❌</div><div class="btn-text"><div class="btn-title">지원되지 않음</div><div class="btn-subtitle">다른 브라우저를 이용해주세요</div></div>';
            }
        }
    }
    
    // 완전 자동 녹화 프로세스
    async startAutoRecording() {
        try {
            if (this.isRecording) {
                Utils.toast.show('이미 녹화가 진행 중입니다.', 'warning');
                return;
            }
            
            Utils.toast.show('자동 녹화 프로세스를 시작합니다...', 'info');
            
            // 1단계: 슬라이드쇼 준비
            await this.executeStep(1, async () => {
                if (!window.slideshowController.isWindowOpen()) {
                    await window.slideshowController.startForRecording();
                }
                await Utils.time.sleep(1000);
            });
            
            // 2단계: 카운트다운
            await this.executeStep(2, async () => {
                await this.showCountdown();
            });
            
            // 3단계: 녹화 시작
            await this.executeStep(3, async () => {
                await this.startRecording();
                await this.recordForDuration(CONFIG.SLIDESHOW.TOTAL_RECORDING_TIME);
            });
            
            // 4단계: 파일 생성
            await this.executeStep(4, async () => {
                await this.stopRecording();
                await this.processRecording();
            });
            
            Utils.toast.show('자동 녹화가 완료되었습니다!', 'success');
            
        } catch (error) {
            Utils.error.handle(error, 'startAutoRecording');
            this.resetProcess();
        }
    }
    
    async executeStep(stepNumber, action) {
        const step = Utils.dom.$(`.process-step[data-step="${stepNumber}"]`);
        const status = step?.querySelector('.step-status');
        
        // 단계 활성화
        if (step) {
            step.classList.add('active');
            if (status) status.textContent = '진행중';
        }
        
        try {
            await action();
            
            // 단계 완료
            if (step) {
                step.classList.remove('active');
                step.classList.add('completed');
                if (status) status.textContent = '완료';
            }
        } catch (error) {
            // 단계 실패
            if (step) {
                step.classList.remove('active');
                step.classList.add('error');
                if (status) status.textContent = '실패';
            }
            throw error;
        }
    }
    
    async showCountdown() {
        const overlay = Utils.dom.$('#countdownOverlay');
        const countdownNumber = Utils.dom.$('#countdownNumber');
        
        overlay.classList.remove('hidden');
        
        for (let i = 5; i >= 1; i--) {
            countdownNumber.textContent = i;
            await Utils.time.sleep(1000);
        }
        
        overlay.classList.add('hidden');
    }
    
    async startRecording() {
        try {
            // 화면 캡처 스트림 가져오기
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: CONFIG.RECORDING.VIDEO_OPTIONS[this.videoQuality].width,
                    height: CONFIG.RECORDING.VIDEO_OPTIONS[this.videoQuality].height,
                    frameRate: this.frameRate
                },
                audio: false // 슬라이드쇼에는 오디오가 없으므로
            });
            
            // MediaRecorder 설정
            const options = {
                mimeType: this.getSupportedMimeType(),
                videoBitsPerSecond: CONFIG.RECORDING.VIDEO_OPTIONS[this.videoQuality].bitrate
            };
            
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.recordedChunks = [];
            
            // 이벤트 핸들러 설정
            this.setupRecorderEvents();
            
            // 녹화 시작
            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();
            
            // UI 업데이트
            this.showRecordingOverlay();
            this.updateRecordingStatus('recording');
            this.startRecordingTimer();
            
            // 슬라이드쇼 시작
            window.slideshowController.sendMessage('start');
            
            Utils.toast.show('녹화가 시작되었습니다', 'success');
            
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                throw new Error('화면 공유 권한이 거부되었습니다. 권한을 허용해주세요.');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('이 브라우저는 화면 녹화를 지원하지 않습니다.');
            }
            throw error;
        }
    }
    
    setupRecorderEvents() {
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
                this.updateFileSize();
            }
        };
        
        this.mediaRecorder.onstop = () => {
            this.isRecording = false;
            this.hideRecordingOverlay();
            this.stopRecordingTimer();
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
        };
        
        this.mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            Utils.toast.show('녹화 중 오류가 발생했습니다', 'error');
        };
    }
    
    async recordForDuration(duration) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const progressBar = Utils.dom.$('#recordingProgress');
            
            const updateProgress = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min((elapsed / duration) * 100, 100);
                
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
                
                const progressSeconds = Utils.dom.$('#progressSeconds');
                if (progressSeconds) {
                    progressSeconds.textContent = Math.floor(elapsed / 1000);
                }
                
                if (elapsed >= duration) {
                    resolve();
                } else {
                    requestAnimationFrame(updateProgress);
                }
            };
            
            updateProgress();
        });
    }
    
    async stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            
            // 데이터 수집 완료까지 대기
            await new Promise(resolve => {
                this.mediaRecorder.onstop = () => {
                    this.mediaRecorder.onstop(); // 기존 핸들러 호출
                    resolve();
                };
            });
            
            this.updateRecordingStatus('processing');
        }
    }
    
    async processRecording() {
        if (this.recordedChunks.length === 0) {
            throw new Error('녹화된 데이터가 없습니다.');
        }
        
        // 블롭 생성
        const blob = new Blob(this.recordedChunks, { 
            type: this.getSupportedMimeType() 
        });
        
        // 파일명 생성
        const filename = Utils.file.generateFilename('sue-reading-video', 'webm');
        
        // 비디오 정보 저장
        const videoInfo = {
            id: Date.now(),
            filename: filename,
            size: blob.size,
            duration: CONFIG.SLIDESHOW.TOTAL_RECORDING_TIME,
            quality: this.videoQuality,
            frameRate: this.frameRate,
            createdAt: new Date().toISOString(),
            blob: blob // 실제 환경에서는 IndexedDB 등에 저장
        };
        
        this.saveVideoInfo(videoInfo);
        
        // 자동 다운로드
        if (this.autoDownload) {
            Utils.file.download(blob, filename);
            Utils.toast.show('비디오가 다운로드되었습니다', 'success');
        }
        
        // UI 업데이트
        this.addVideoToList(videoInfo);
        this.updateRecordingStatus('completed');
        
        return videoInfo;
    }
    
    getSupportedMimeType() {
        const types = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        
        return 'video/webm';
    }
    
    showRecordingOverlay() {
        const overlay = Utils.dom.$('#recordingOverlay');
        overlay.classList.remove('hidden');
    }
    
    hideRecordingOverlay() {
        const overlay = Utils.dom.$('#recordingOverlay');
        overlay.classList.add('hidden');
    }
    
    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            if (this.startTime) {
                const elapsed = Date.now() - this.startTime;
                const timerElement = Utils.dom.$('#recordingTimer');
                if (timerElement) {
                    timerElement.textContent = Utils.time.formatDuration(elapsed);
                }
                
                const mainTimerElement = Utils.dom.$('#recordingTime');
                if (mainTimerElement) {
                    mainTimerElement.textContent = Utils.time.formatDuration(elapsed);
                }
            }
        }, 100);
    }
    
    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }
    
    updateRecordingStatus(status) {
        const statusElement = Utils.dom.$('#recordingStatus');
        const statusTexts = {
            idle: '대기중',
            preparing: '준비중',
            recording: '녹화중',
            processing: '처리중',
            completed: '완료'
        };
        
        if (statusElement) {
            statusElement.textContent = statusTexts[status] || status;
        }
        
        // body 클래스 업데이트 (CSS 스타일링용)
        document.body.className = document.body.className.replace(/recording-status-\w+/g, '');
        document.body.classList.add(`recording-status-${status}`);
    }
    
    updateFileSize() {
        if (this.recordedChunks.length > 0) {
            const totalSize = this.recordedChunks.reduce((total, chunk) => total + chunk.size, 0);
            const fileSizeElement = Utils.dom.$('#fileSize');
            if (fileSizeElement) {
                fileSizeElement.textContent = Utils.file.formatFileSize(totalSize);
                fileSizeElement.classList.add('file-size-updating');
                setTimeout(() => fileSizeElement.classList.remove('file-size-updating'), 300);
            }
        }
    }
    
    saveVideoInfo(videoInfo) {
        const videos = Utils.storage.get(CONFIG.STORAGE_KEYS.GENERATED_VIDEOS, []);
        
        // blob은 저장하지 않음 (크기 문제)
        const videoInfoForStorage = { ...videoInfo };
        delete videoInfoForStorage.blob;
        
        videos.unshift(videoInfoForStorage);
        
        // 최대 50개까지만 저장
        if (videos.length > 50) {
            videos.splice(50);
        }
        
        Utils.storage.set(CONFIG.STORAGE_KEYS.GENERATED_VIDEOS, videos);
    }
    
    addVideoToList(videoInfo) {
        const videoList = Utils.dom.$('#videoList');
        const emptyState = videoList.querySelector('.empty-state');
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        const videoCard = this.createVideoCard(videoInfo);
        videoList.prepend(videoCard);
    }
    
    createVideoCard(videoInfo) {
        const card = Utils.dom.create('div', 'video-card');
        
        card.innerHTML = `
            <div class="video-thumbnail">
                <div class="video-overlay">
                    <div class="play-icon">▶️</div>
                </div>
            </div>
            <div class="video-info">
                <div class="video-title">${videoInfo.filename}</div>
                <div class="video-meta">
                    <span>📏 ${videoInfo.quality}p</span>
                    <span>📊 ${Utils.file.formatFileSize(videoInfo.size)}</span>
                    <span>⏱️ ${Utils.time.formatDuration(videoInfo.duration)}</span>
                    <span>📅 ${new Date(videoInfo.createdAt).toLocaleString()}</span>
                </div>
            </div>
            <div class="video-actions">
                <button class="btn btn-small" onclick="autoRecorder.downloadVideo('${videoInfo.id}')">
                    📥 다운로드
                </button>
                <button class="btn btn-small" onclick="autoRecorder.deleteVideo('${videoInfo.id}')">
                    🗑️ 삭제
                </button>
            </div>
        `;
        
        return card;
    }
    
    downloadVideo(videoId) {
        // 실제 환경에서는 IndexedDB에서 blob 데이터를 가져와야 함
        Utils.toast.show('다운로드 기능은 실제 녹화 후에 사용할 수 있습니다', 'info');
    }
    
    deleteVideo(videoId) {
        const videos = Utils.storage.get(CONFIG.STORAGE_KEYS.GENERATED_VIDEOS, []);
        const filteredVideos = videos.filter(video => video.id != videoId);
        Utils.storage.set(CONFIG.STORAGE_KEYS.GENERATED_VIDEOS, filteredVideos);
        
        // UI에서 제거
        const videoCard = document.querySelector(`[onclick*="${videoId}"]`)?.closest('.video-card');
        if (videoCard) {
            videoCard.remove();
            Utils.toast.show('비디오가 삭제되었습니다', 'info');
        }
        
        // 비디오가 없으면 empty state 표시
        const videoList = Utils.dom.$('#videoList');
        if (videoList.children.length === 0 || Array.from(videoList.children).every(child => child.classList.contains('empty-state'))) {
            const emptyState = videoList.querySelector('.empty-state');
            if (emptyState) {
                emptyState.style.display = 'block';
            }
        }
    }
    
    loadExistingVideos() {
        const videos = Utils.storage.get(CONFIG.STORAGE_KEYS.GENERATED_VIDEOS, []);
        const videoList = Utils.dom.$('#videoList');
        const emptyState = videoList.querySelector('.empty-state');
        
        if (videos.length > 0) {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            videos.forEach(videoInfo => {
                const videoCard = this.createVideoCard(videoInfo);
                videoList.appendChild(videoCard);
            });
        }
    }
    
    resetProcess() {
        // 모든 단계 상태 리셋
        Utils.dom.$('.process-step').forEach(step => {
            step.classList.remove('active', 'completed', 'error');
            const status = step.querySelector('.step-status');
            if (status) status.textContent = '대기';
        });
        
        // 녹화 중지
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // 오버레이 숨기기
        this.hideRecordingOverlay();
        Utils.dom.$('#countdownOverlay').classList.add('hidden');
        
        // 상태 초기화
        this.updateRecordingStatus('idle');
        
        // 타이머 리셋
        const recordingTime = Utils.dom.$('#recordingTime');
        if (recordingTime) recordingTime.textContent = '00:00';
        
        const fileSize = Utils.dom.$('#fileSize');
        if (fileSize) fileSize.textContent = '0 MB';
    }
    
    // 수동 제어 메서드들
    async requestScreenShare() {
        try {
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });
            return this.stream;
        } catch (error) {
            Utils.error.handle(error, 'requestScreenShare');
            throw error;
        }
    }
    
    getRecordingState() {
        return {
            isRecording: this.isRecording,
            startTime: this.startTime,
            duration: this.startTime ? Date.now() - this.startTime : 0,
            chunksCount: this.recordedChunks.length,
            settings: {
                quality: this.videoQuality,
                frameRate: this.frameRate,
                autoDownload: this.autoDownload
            }
        };
    }
}

// 전역에서 사용할 수 있도록 등록
window.AutoRecorder = AutoRecorder;
