// Sue Reading Club - 슬라이드쇼 컨트롤러

class SlideshowController {
    constructor() {
        this.slideshowWindow = null;
        this.isPlaying = false;
        this.duration = CONFIG.SLIDESHOW.DEFAULT_DURATION;
        this.currentSlide = 0;
        this.totalSlides = CONFIG.SLIDESHOW.TOTAL_SLIDES;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadSettings();
        
        if (window.DEBUG) {
            console.log('🎬 슬라이드쇼 컨트롤러 초기화 완료');
        }
    }
    
    bindEvents() {
        // 미리보기 버튼
        const previewBtn = Utils.dom.$('#previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.showPreview());
        }
        
        // 전체화면 버튼
        const fullscreenBtn = Utils.dom.$('#fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.openFullscreen());
        }
        
        // 별도 창 열기 버튼
        const openSeparateBtn = Utils.dom.$('#openSeparateBtn');
        if (openSeparateBtn) {
            openSeparateBtn.addEventListener('click', () => this.openSeparateWindow());
        }
        
        // 설정 변경 이벤트
        const slideSpeedSelect = Utils.dom.$('#slideSpeedSelect');
        if (slideSpeedSelect) {
            slideSpeedSelect.addEventListener('change', (e) => {
                this.duration = parseInt(e.target.value);
                this.saveSettings();
            });
        }
    }
    
    loadSettings() {
        const settings = Utils.storage.get(CONFIG.STORAGE_KEYS.USER_SETTINGS, {});
        
        if (settings.slideDuration) {
            this.duration = settings.slideDuration;
            const slideSpeedSelect = Utils.dom.$('#slideSpeedSelect');
            if (slideSpeedSelect) {
                slideSpeedSelect.value = this.duration;
            }
        }
    }
    
    saveSettings() {
        const currentSettings = Utils.storage.get(CONFIG.STORAGE_KEYS.USER_SETTINGS, {});
        currentSettings.slideDuration = this.duration;
        Utils.storage.set(CONFIG.STORAGE_KEYS.USER_SETTINGS, currentSettings);
    }
    
    // 미리보기 표시
    showPreview() {
        const preview = Utils.dom.$('#slidePreview');
        const placeholder = preview.querySelector('.preview-placeholder');
        
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // iframe으로 슬라이드쇼 로드
        const iframe = Utils.dom.create('iframe', '', {
            src: `${CONFIG.SLIDESHOW.URL}?duration=${this.duration}&autostart=true`,
            width: '100%',
            height: '100%',
            frameborder: '0',
            style: 'border-radius: 20px;'
        });
        
        preview.innerHTML = '';
        preview.appendChild(iframe);
        
        Utils.toast.show('미리보기를 시작합니다', 'info');
    }
    
    // 전체화면으로 열기
    async openFullscreen() {
        try {
            // 새 창으로 슬라이드쇼 열기
            const slideshowUrl = `${CONFIG.SLIDESHOW.URL}?duration=${this.duration}&autostart=false`;
            const newWindow = window.open(slideshowUrl, 'slideshow', 'fullscreen=yes');
            
            if (newWindow) {
                Utils.toast.show('전체화면 슬라이드쇼가 열렸습니다', 'success');
                
                // 전체화면 요청
                setTimeout(() => {
                    if (newWindow.document.documentElement.requestFullscreen) {
                        newWindow.document.documentElement.requestFullscreen();
                    }
                }, 1000);
            } else {
                throw new Error('팝업이 차단되었습니다');
            }
        } catch (error) {
            Utils.error.handle(error, 'openFullscreen');
        }
    }
    
    // 별도 창으로 열기
    openSeparateWindow() {
        try {
            const width = 400;
            const height = 711;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;
            
            const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`;
            
            this.slideshowWindow = window.open(
                `${CONFIG.SLIDESHOW.URL}?duration=${this.duration}&autostart=false`,
                'SueSlideshowWindow',
                features
            );
            
            if (this.slideshowWindow) {
                Utils.toast.show('슬라이드쇼 창이 열렸습니다', 'success');
                
                // 창 닫힘 감지
                const checkClosed = setInterval(() => {
                    if (this.slideshowWindow.closed) {
                        clearInterval(checkClosed);
                        this.slideshowWindow = null;
                        Utils.toast.show('슬라이드쇼 창이 닫혔습니다', 'info');
                    }
                }, 1000);
            } else {
                throw new Error('팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.');
            }
        } catch (error) {
            Utils.error.handle(error, 'openSeparateWindow');
        }
    }
    
    // 슬라이드쇼 시작 (녹화용)
    startForRecording() {
        return new Promise((resolve, reject) => {
            try {
                if (!this.slideshowWindow || this.slideshowWindow.closed) {
                    this.openSeparateWindow();
                    
                    // 창이 로드될 때까지 대기
                    setTimeout(() => {
                        this.sendMessage('start');
                        resolve(this.slideshowWindow);
                    }, 2000);
                } else {
                    this.sendMessage('start');
                    resolve(this.slideshowWindow);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // 슬라이드쇼 정지
    stopSlideshow() {
        this.sendMessage('pause');
        this.isPlaying = false;
    }
    
    // 슬라이드쇼 재시작
    resumeSlideshow() {
        this.sendMessage('resume');
        this.isPlaying = true;
    }
    
    // 슬라이드쇼 리셋
    resetSlideshow() {
        this.sendMessage('reset');
        this.currentSlide = 0;
    }
    
    // 슬라이드쇼 창에 메시지 전송
    sendMessage(type, data = {}) {
        if (this.slideshowWindow && !this.slideshowWindow.closed) {
            this.slideshowWindow.postMessage({ type, data }, '*');
        }
    }
    
    // 슬라이드쇼 창 닫기
    closeSlideshowWindow() {
        if (this.slideshowWindow && !this.slideshowWindow.closed) {
            this.slideshowWindow.close();
            this.slideshowWindow = null;
            Utils.toast.show('슬라이드쇼 창을 닫았습니다', 'info');
        }
    }
    
    // 현재 설정 가져오기
    getSettings() {
        return {
            duration: this.duration,
            totalSlides: this.totalSlides,
            isPlaying: this.isPlaying,
            currentSlide: this.currentSlide
        };
    }
    
    // 슬라이드쇼가 실행 중인지 확인
    isRunning() {
        return this.slideshowWindow && !this.slideshowWindow.closed && this.isPlaying;
    }
    
    // 슬라이드쇼 창이 열려있는지 확인
    isWindowOpen() {
        return this.slideshowWindow && !this.slideshowWindow.closed;
    }
}

// 전역에서 사용할 수 있도록 등록
window.SlideshowController = SlideshowController;
