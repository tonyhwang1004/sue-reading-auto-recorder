// Sue Reading Club 완전 자동화 시스템 - 유틸리티 함수들

class Utils {
    // 로컬 스토리지 관리
    static storage = {
        set(key, value) {
            try {
                const data = {
                    value: value,
                    timestamp: Date.now()
                };
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                if (!item) return defaultValue;
                
                const data = JSON.parse(item);
                return data.value;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        }
    };
    
    // DOM 유틸리티
    static dom = {
        $(selector) {
            return document.querySelector(selector);
        },
        
        $(selector) {
            return document.querySelectorAll(selector);
        },
        
        create(tag, className = '', attributes = {}) {
            const element = document.createElement(tag);
            if (className) element.className = className;
            Object.keys(attributes).forEach(key => {
                element.setAttribute(key, attributes[key]);
            });
            return element;
        },
        
        hide(element) {
            element.classList.add('hidden');
        },
        
        show(element) {
            element.classList.remove('hidden');
        },
        
        toggle(element) {
            element.classList.toggle('hidden');
        }
    };
    
    // 시간 관련 유틸리티
    static time = {
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },
        
        formatDuration(ms) {
            const seconds = Math.floor(ms / 1000);
            return this.formatTime(seconds);
        },
        
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };
    
    // 파일 관련 유틸리티
    static file = {
        download(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        generateFilename(prefix = 'sue-reading', extension = 'mp4') {
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/[:.]/g, '-')
                .split('T')[0] + '_' + 
                now.toTimeString().split(' ')[0].replace(/:/g, '-');
            return `${prefix}_${timestamp}.${extension}`;
        }
    };
    
    // 디바이스 감지
    static device = {
        isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        isIOS() {
            return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        },
        
        isAndroid() {
            return /Android/.test(navigator.userAgent);
        },
        
        isTouchDevice() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },
        
        getScreenSize() {
            return {
                width: window.innerWidth,
                height: window.innerHeight
            };
        },
        
        isStandalone() {
            return window.matchMedia('(display-mode: standalone)').matches;
        }
    };
    
    // 미디어 API 지원 확인
    static media = {
        isMediaRecorderSupported() {
            return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported;
        },
        
        isGetDisplayMediaSupported() {
            return navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia;
        },
        
        getSupportedVideoTypes() {
            const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/mp4'];
            return types.filter(type => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type));
        },
        
        async checkPermissions() {
            try {
                const permissions = await Promise.all([
                    navigator.permissions.query({ name: 'camera' }),
                    navigator.permissions.query({ name: 'microphone' })
                ]);
                
                return {
                    camera: permissions[0].state,
                    microphone: permissions[1].state
                };
            } catch (error) {
                console.warn('Permission check not supported:', error);
                return { camera: 'unknown', microphone: 'unknown' };
            }
        }
    };
    
    // 애니메이션 유틸리티
    static animation = {
        fadeIn(element, duration = 300) {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            let start = null;
            function animate(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const opacity = Math.min(progress / duration, 1);
                
                element.style.opacity = opacity;
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                }
            }
            
            requestAnimationFrame(animate);
        },
        
        fadeOut(element, duration = 300) {
            let start = null;
            const initialOpacity = parseFloat(getComputedStyle(element).opacity);
            
            function animate(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const opacity = initialOpacity * (1 - Math.min(progress / duration, 1));
                
                element.style.opacity = opacity;
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                }
            }
            
            requestAnimationFrame(animate);
        },
        
        countDown(element, from, to = 0, duration = 1000) {
            return new Promise(resolve => {
                let current = from;
                const step = (from - to) / (duration / 100);
                
                const interval = setInterval(() => {
                    current -= step;
                    element.textContent = Math.ceil(current);
                    
                    if (current <= to) {
                        clearInterval(interval);
                        element.textContent = to;
                        resolve();
                    }
                }, 100);
            });
        }
    };
    
    // 이벤트 관리
    static events = {
        on(element, event, handler) {
            element.addEventListener(event, handler);
            return () => element.removeEventListener(event, handler);
        },
        
        once(element, event, handler) {
            const wrapper = (e) => {
                handler(e);
                element.removeEventListener(event, wrapper);
            };
            element.addEventListener(event, wrapper);
            return () => element.removeEventListener(event, wrapper);
        },
        
        emit(element, eventName, data = {}) {
            const event = new CustomEvent(eventName, { detail: data });
            element.dispatchEvent(event);
        }
    };
    
    // 토스트 알림
    static toast = {
        show(message, type = 'info', duration = 3000) {
            const toast = Utils.dom.$('#toast');
            const icon = Utils.dom.$('#toast .toast-icon');
            const messageEl = Utils.dom.$('#toast .toast-message');
            
            // 아이콘 설정
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            icon.textContent = icons[type] || icons.info;
            messageEl.textContent = message;
            
            // 토스트 표시
            toast.classList.add('show');
            
            // 자동 숨김
            setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }
    };
    
    // URL 유틸리티
    static url = {
        getParams() {
            return new URLSearchParams(window.location.search);
        },
        
        getParam(name, defaultValue = null) {
            const params = this.getParams();
            return params.get(name) || defaultValue;
        },
        
        setParam(name, value) {
            const url = new URL(window.location);
            url.searchParams.set(name, value);
            window.history.replaceState({}, '', url);
        },
        
        removeParam(name) {
            const url = new URL(window.location);
            url.searchParams.delete(name);
            window.history.replaceState({}, '', url);
        }
    };
    
    // 에러 처리
    static error = {
        handle(error, context = '') {
            console.error(`Error in ${context}:`, error);
            
            let message = '알 수 없는 오류가 발생했습니다.';
            
            if (error.name === 'NotAllowedError') {
                message = '권한이 거부되었습니다. 브라우저 설정을 확인해주세요.';
            } else if (error.name === 'NotSupportedError') {
                message = '이 브라우저는 해당 기능을 지원하지 않습니다.';
            } else if (error.message) {
                message = error.message;
            }
            
            Utils.toast.show(message, 'error');
            return message;
        }
    };
}

// 전역에서 사용할 수 있도록 등록
window.Utils = Utils;

// 개발 모드에서 디버그 정보 출력
if (window.DEBUG) {
    console.log('🛠️ Utils 로드 완료');
    console.log('📱 모바일 디바이스:', Utils.device.isMobile());
    console.log('🎥 MediaRecorder 지원:', Utils.media.isMediaRecorderSupported());
    console.log('🖥️ getDisplayMedia 지원:', Utils.media.isGetDisplayMediaSupported());
}
