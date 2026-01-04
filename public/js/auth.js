import { apiRequest } from './api.js';
// Fungsi logout
document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

// Cek otentikasi di halaman yang memerlukan login
export function checkAuth() {
    const token = localStorage.getItem('token'); 
    if (!token) {
        window.location.href = 'index.html';
    }
}

// Handle login form
document.addEventListener('DOMContentLoaded', () => {
    // Jika di halaman login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');

    try {
        const res = await apiRequest('/api/auth/login', 'POST', { email, password });
        
       
        if (res.success && res.data && res.data.token) { 
            localStorage.setItem('token', res.data.token); 
            window.location.href = 'dashboard.html'; 
        } else if (res.message) {
             // Tangani jika response sukses (200) tapi tidak ada token
             throw new Error(res.message || 'Email atau password salah!')
        }

    } catch (error) {
        console.error('Login Error:', error);
                
                Swal.fire({
                    icon: 'error',
                    title: 'Login Gagal!',
                    text: error.message || 'Coba cek lagi email & password kamu.',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                    timer: 3000 
                });
            }
        });
        return;
    }

    // Jika di halaman lain (dashboard, rooms, dll), cek auth
    if (!window.location.pathname.endsWith('index.html')) {
        checkAuth();
    }

    // Handle sidebar navigation (opsional, tapi bagus untuk UX)
    const menuItems = document.querySelectorAll('.sidebar-menu a');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // Cegah default link behavior
            const target = item.getAttribute('href');
            window.location.href = target; // Ganti dengan URL yang sesuai
        });
    });

    // Setup active menu
    setupActiveMenu();
});

function setupActiveMenu() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.sidebar-menu a');

    menuItems.forEach(item => {
        if (item.getAttribute('href') === currentPath) {
            item.parentElement.classList.add('active');
        } else {
            item.parentElement.classList.remove('active');
        }
    });
}