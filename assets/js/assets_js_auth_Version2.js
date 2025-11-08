// Authentication guard
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    return user;
}

// Initialize auth check
document.addEventListener('DOMContentLoaded', checkAuth);

// Logout function
async function logout() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out. Please try again.');
    }
}

// Get current user function
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}