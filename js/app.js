// Sue Reading Club 완전 자동화 영상 제작 시스템 - 메인 앱

class SueAutoRecorderApp {
    constructor() {
        this.slideshowController = null;
        this.autoRecorder = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Sue Reading Club 자동 녹화 시스템 시작');
            
            // 로딩 화면 표시
            await this.showLoadingScreen();
            
            // 컴포넌트 초기화
            this.initializeComponents();
            
            // 이벤트 바인딩
            this.bindGlobalEvents();
            
            // 기존 데이터 로드
            this.loadExistingData();
            
            // 로딩 완료
            await this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('✅ 초기화 완료');
            
            // 환영 메시지
            Utils.toast.show('Sue Reading Club 자동 녹화 시스템에 오신 것을 환영합니다!', 'success');
            
        } catch (error) {
            console.error('❌ 초기화 실패:', error);
            Utils.toast.show('시스템 초기화에 실패했습니다.', 'error');
        }
    }
    
    async showLoadingScreen() {
        const loadingProgress = Utils.dom.$('#loadingProgress');
        let progress = 0;
        
        const updateProgress = () => {
            progress += Math.random() * 30;
            if (progress > 100) progress = 100;
            
            if (loadingProgress) {
                loadingProgress.style.width = `${progress}%`;
            }
            
            if (progress < 100) {
                setTimeout(updateProgress, 200 + Math.random() * 300);
            }
        };
        
        updateProgress();
        
        // 최소 로딩 시간 보장
        await Utils.time.sleep(CONFIG.UI.LOADING_MIN_TIME);
        
        if (loadingProgress) {
            loadingProgress.style.width = '100%';
        }
        
        await Utils.time.sleep(500);
    }
    
    async hideLoadingScreen() {
        const loadingScreen = Utils.dom.$('#loadingScreen');
        const app = Utils.dom.$('#app');
        
        if (loadingScreen && app) {
            loadingScreen.classList.add('hidden');
            app.classList.remove('hidden');
        }
    }
    
    initializeComponents() {
        // 슬라이드쇼 컨트롤러 초기화
        this.slideshowController = new SlideshowController();
        window.slideshowController = this.slideshowController;
        
        // 자동 녹화 시스템 초기화
        this.autoRecorder = new AutoRecorder();
        window.autoRecorder = this.autoRecorder;
        
        console.log('🎬 컴포넌트 초기화 완료');
    }
    
    bindGlobalEvents() {
        // 설정 버튼
        const settingsBtn = Utils.dom.$('#settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }
        
        // 윈도우 이벤트
        window.addEventListener('beforeunload', (e) => {
            if (this.autoRecorder && this.autoRecorder.isRecording) {
                e.preventDefault();
                e.returnValue = '녹화가 진행 중입니다. 정말 페이지를 떠나시겠습니까?';
                return e.returnValue;
            }
        });
        
        // 가시성 변경 이벤트
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 앱이 백그라운드로 이동');
            } else {
                console.log('📱 앱이 포그라운드로 복귀');
                this.updateSystemStatus();
            }
        });
        
        // 키보드 단축키 안내
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
        });
        
        // PWA 설치 이벤트
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.showInstallPrompt(e);
        });
        
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            Utils.toast.show('인터넷 연결이 복구되었습니다', 'success');
            this.updateSystemStatus();
        });
        
        window.addEventListener('offline', () => {
            Utils.toast.show('인터넷 연결이 끊어졌습니다', 'warning');
            this.updateSystemStatus();
        });
    }
    
    loadExistingData() {
        // 기존 비디오 목록 로드
        if (this.autoRecorder) {
            this.autoRecorder.loadExistingVideos();
        }
        
        // 시스템 상태 업데이트
        this.updateSystemStatus();
        
        console.log('📁 기존 데이터 로드 완료');
    }
    
    updateSystemStatus() {
        const systemStatus = Utils.dom.$('#systemStatus .status-text');
        const statusDot = Utils.dom.$('#systemStatus .status-dot');
        
        if (!systemStatus || !statusDot) return;
        
        let status = '준비완료';
        let statusClass = 'status-ready';
        
        if (!navigator.onLine) {
            status = '오프라인';
            statusClass = 'status-offline';
        } else if (this.autoRecorder && this.autoRecorder.isRecording) {
            status = '녹화중';
            statusClass = 'status-recording';
        } else if (!Utils.media.isMediaRecorderSupported()) {
            status = '지원안됨';
            statusClass = 'status-unsupported';
        }
        
        systemStatus.textContent = status;
        statusDot.className = `status-dot ${statusClass}`;
    }
    
    openSettings() {
        // 설정 모달 표시 (실제 구현에서는 모달 내용 추가)
        Utils.toast.show('설정 기능은 개발 중입니다', 'info');
    }
    
    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl+R', description: '자동 녹화 시작' },
            { key: 'Ctrl+S', description: '녹화 중지' },
            { key: 'F1', description: '단축키 도움말' },
            { key: 'Esc', description: '전체화면 종료' }
        ];
        
        let message = '⌨️ 키보드 단축키:\n\n';
        shortcuts.forEach(shortcut => {
            message += `${shortcut.key}: ${shortcut.description}\n`;
        });
        
        alert(message);
    }
    
    showInstallPrompt(installEvent) {
        const installButton = Utils.dom.create('button', 'btn btn-install');
        installButton.innerHTML = '📱 앱으로 설치';
        installButton.onclick = async () => {
            installEvent.prompt();
            const result = await installEvent.userChoice;
            if (result.outcome === 'accepted') {
                Utils.toast.show('앱이 설치되었습니다!', 'success');
            }
            installButton.remove();
        };
        
        const header = Utils.dom.$('.header-controls');
        if (header) {
            header.appendChild(installButton);
        }
    }
    
    // 전체화면 모드 토글
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    // 시스템 상태 확인
    getSystemInfo() {
        return {
            app: {
                name: CONFIG.APP_NAME,
                version: CONFIG.VERSION,
                initialized: this.isInitialized
            },
            browser: {
                userAgent: navigator.userAgent,
                online: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled
            },
            support: {
                mediaRecorder: Utils.media.isMediaRecorderSupported(),
                getDisplayMedia: Utils.media.isGetDisplayMediaSupported(),
                fullscreen: !!document.documentElement.requestFullscreen
            },
            device: {
                isMobile: Utils.device.isMobile(),
                isTouch: Utils.device.isTouchDevice(),
                screen: Utils.device.getScreenSize(),
                standalone: Utils.device.isStandalone()
            },
            components: {
                slideshowController: !!this.slideshowController,
                autoRecorder: !!this.autoRecorder
            }
        };
    }
    
    // 오류 리포트 생성
    generateErrorReport(error) {
        const systemInfo = this.getSystemInfo();
        const errorReport = {
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            system: systemInfo,
            url: window.location.href,
            storage: {
                localStorage: !!window.localStorage,
                sessionStorage: !!window.sessionStorage
            }
        };
        
        console.error('🐛 Error Report:', errorReport);
        return errorReport;
    }
    
    // 디버그 정보 출력
    debug() {
        if (window.DEBUG) {
            console.group('🔍 Debug Information');
            console.log('System Info:', this.getSystemInfo());
            console.log('Slideshow Controller:', this.slideshowController);
            console.log('Auto Recorder:', this.autoRecorder);
            console.groupEnd();
        }
    }
    
    // 성능 메트릭 수집
    collectPerformanceMetrics() {
        if (window.performance) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const metrics = {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
                networkTime: navigation.responseEnd - navigation.fetchStart
            };
            
            console.log('📊 Performance Metrics:', metrics);
            return metrics;
        }
        return null;
    }
    
    // 앱 상태 저장
    saveAppState() {
        const appState = {
            timestamp: Date.now(),
            slideshowSettings: this.slideshowController ? this.slideshowController.getSettings() : null,
            recordingState: this.autoRecorder ? this.autoRecorder.getRecordingState() : null
        };
        
        Utils.storage.set('sue_app_state', appState);
    }
    
    // 앱 상태 복원
    restoreAppState() {
        const appState = Utils.storage.get('sue_app_state');
        if (appState) {
            console.log('🔄 앱 상태 복원:', appState);
            // 필요시 상태 복원 로직 구현
        }
    }
}

// DOM 로드 완료 후 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.sueApp = new SueAutoRecorderApp();
    
    // 글로벌 에러 핸들러
    window.addEventListener('error', (event) => {
        console.error('Global Error:', event.error);
        if (window.sueApp) {
            window.sueApp.generateErrorReport(event.error);
        }
        Utils.toast.show('예상치 못한 오류가 발생했습니다.', 'error');
    });
    
    // Promise 거부 핸들러
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Promise Rejection:', event.reason);
        if (window.sueApp) {
            window.sueApp.generateErrorReport(event.reason);
        }
        Utils.toast.show('비동기 작업 중 오류가 발생했습니다.', 'error');
    });
    
    // 개발 모드에서 디버그 정보 자동 출력
    if (window.DEBUG) {
        setTimeout(() => {
            if (window.sueApp) {
                window.sueApp.debug();
                window.sueApp.collectPerformanceMetrics();
            }
        }, 3000);
    }
});

// PWA 서비스 워커 등록 (선택사항)
if ('serviceWorker' in navigator && !window.DEBUG) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
