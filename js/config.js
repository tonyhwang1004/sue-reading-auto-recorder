// Sue Reading Club 완전 자동화 녹화 시스템 - 설정 파일

const CONFIG = {
    // 앱 정보
    APP_NAME: 'Sue Reading Club 완전 자동화 녹화 시스템',
    VERSION: '2.0.0',
    
    // 슬라이드쇼 설정
    SLIDESHOW: {
        DEFAULT_DURATION: 2500, // 2.5초
        TOTAL_SLIDES: 11,
        COUNTDOWN_DURATION: 5000, // 5초 카운트다운
        TOTAL_RECORDING_TIME: 27500, // 27.5초 녹화
        URL: './slideshow/slideshow.html'
    },
    
    // 녹화 설정
    RECORDING: {
        DEFAULT_QUALITY: '1080',
        DEFAULT_FPS: 30,
        SUPPORTED_FORMATS: ['webm', 'mp4'],
        VIDEO_OPTIONS: {
            '480': { width: 854, height: 480, bitrate: 1000000 },
            '720': { width: 1280, height: 720, bitrate: 2500000 },
            '1080': { width: 1920, height: 1080, bitrate: 5000000 }
        },
        AUDIO_OPTIONS: {
            sampleRate: 44100,
            channelCount: 2,
            echoCancellation: true,
            noiseSuppression: true
        }
    },
    
    // Sue Reading Club 정보
    ACADEMY_INFO: {
        name: 'Sue Reading Club',
        phone: '010-9579-4429',
        address: '인천 연수구 송도동',
        detail_address: '해온더라운지 702호',
        description: 'AI 기반 미래형 교육'
    },
    
    // UI 설정
    UI: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 3000,
        LOADING_MIN_TIME: 2000,
        MOBILE_BREAKPOINT: 768
    },
    
    // 로컬 스토리지 키
    STORAGE_KEYS: {
        USER_SETTINGS: 'sue_auto_recorder_settings',
        GENERATED_VIDEOS: 'sue_auto_recorder_videos',
        LAST_CONFIG: 'sue_auto_recorder_last_config'
    },
    
    // 자동 녹화 프로세스
    AUTO_PROCESS: {
        STEPS: [
            { id: 1, name: '슬라이드쇼 준비', duration: 2000 },
            { id: 2, name: '카운트다운', duration: 5000 },
            { id: 3, name: '자동 녹화', duration: 27500 },
            { id: 4, name: 'MP4 생성', duration: 3000 }
        ]
    }
};

// 전역 변수로 설정
window.CONFIG = CONFIG;

// 개발 모드 확인
window.DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (window.DEBUG) {
    console.log('🎬 Sue Reading Club 완전 자동화 녹화 시스템');
    console.log('📋 설정 로드 완료:', CONFIG);
}
