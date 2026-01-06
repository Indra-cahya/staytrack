import { apiRequest } from './api.js';

// Fungsi logout
document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role'); 
    window.location.href = 'index.html';
});

export function checkAuth() {
    const token = localStorage.getItem('token'); 
    if (!token) {
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    // --- 1. BAGIAN LOGIN ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await apiRequest('/api/auth/login', 'POST', { email, password });
                
                if (res.success && res.data && res.data.token) { 
                    localStorage.setItem('token', res.data.token); 
                    localStorage.setItem('role', res.data.role || 'admin'); 
                    window.location.href = 'dashboard.html'; 
                } else {
                    throw new Error(res.message || 'Email atau password salah!')
                }
            } catch (error) {
                console.error('Login Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Login Gagal!',
                    text: error.message,
                    confirmButtonColor: '#d33'
                });
            }
        });
        return;
    }

    // --- 2. CEK AUTH & ROLE (UNTUK HALAMAN NON-LOGIN) ---
    if (!window.location.pathname.endsWith('index.html')) {
        checkAuth();
        
        // [TAMBAHAN] LOGIC TAMPILIN MENU OWNER
        const userRole = localStorage.getItem('role');
        const ownerMenu = document.getElementById('ownerOnlyMenu');
        
        if (ownerMenu) {
            // Hanya tampil jika role-nya beneran 'owner'
            ownerMenu.style.display = (userRole === 'owner') ? 'block' : 'none';
        }
    }

    setupActiveMenu();
});

function setupActiveMenu() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.nav-menu a'); // Sesuaikan selector dengan HTML lo

    menuItems.forEach(item => {
        if (currentPath.includes(item.getAttribute('href'))) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}