// Supabase configuration
const supabaseConfig = {
    url: 'https://oxqgkipakpztpccerwlq.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cWdraXBha3B6dHBjY2Vyd2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTI1ODEsImV4cCI6MjA3ODE4ODU4MX0.Hj1Fk33E6-MKHEYez8NvCbUgFEtGaniw186hVWe0ZhY'
};

// Initialize Supabase client
const supabase = createClient(supabaseConfig.url, supabaseConfig.key);