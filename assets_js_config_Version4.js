// Supabase configuration
const supabaseConfig = {
    url: 'https://oxqgkipakpztpccerwlq.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cWdraXBha3B6dHBjY2Vyd2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTI1ODEsImV4cCI6MjA3ODE4ODU4MX0.Hj1Fk33E6-MKHEYez8NvCbUgFEtGaniw186hVWe0ZhY'
};

// Initialize Supabase client
const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

// Application configuration
const appConfig = {
    // Theme settings
    theme: {
        defaultTheme: 'light',
        storageKey: 'theme-preference'
    },
    
    // File upload settings
    fileUpload: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        storageBucket: 'attachments'
    },
    
    // Quiz settings
    quiz: {
        defaultTimeLimit: 30, // minutes
        minQuestions: 1,
        maxQuestions: 50,
        pointsPerQuestion: 1
    },
    
    // Grade settings
    grades: {
        passingGrade: 60,
        gradeScale: {
            A: 90,
            B: 80,
            C: 70,
            D: 60,
            F: 0
        }
    },
    
    // Attendance settings
    attendance: {
        lateThreshold: 15, // minutes
        autoMarkAbsent: true,
        requireReason: true
    },
    
    // Points system
    points: {
        maxAwardPerAction: 100,
        maxDeductPerAction: -50,
        startingBalance: 0
    },
    
    // API endpoints and routes
    api: {
        baseUrl: supabaseConfig.url,
        endpoints: {
            grades: '/grades',
            attendance: '/attendance',
            homework: '/homework',
            behavior: '/behavior',
            points: '/points',
            files: '/files',
            quizzes: '/quizzes'
        }
    },
    
    // Date and time formats
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    timezone: 'UTC',
    
    // Notification settings
    notifications: {
        position: 'top-right',
        duration: 3000,
        requireConfirmation: false
    }
};

// Export configuration
window.appConfig = appConfig;
window.supabase = supabase;