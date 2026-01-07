import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Langsung tarik data pas halaman dibuka
    loadAdmins();

    // 2. Setup Event Listener buat Tombol
    const modal = document.getElementById('modalAdmin');
    const btnOpen = document.getElementById('btnOpenModalAdmin');
    const btnCancel = document.getElementById('btnCancelAdmin');
    const btnSave = document.getElementById('btnSaveAdmin');

    // Buka Modal
    btnOpen.onclick = () => {
        modal.style.display = 'flex';
    };

    // Tutup Modal
    btnCancel.onclick = () => {
        modal.style.display = 'none';
        clearForm(); 
    };

    // Simpan Admin Baru
    btnSave.onclick = createAdmin;
});

//  [READ] Fungsi nampilin daftar admin 
async function loadAdmins() {
    try {
        const res = await apiRequest('/api/admin/list');
        const tbody = document.getElementById('adminTableBody');
        const countBadge = document.getElementById('adminCount');

        if (res.success) {
            countBadge.innerText = `${res.count} admin`;
            
            tbody.innerHTML = res.data.map(admin => `
                <tr>
                    <td>
                        <div style="font-weight: 700; color: #1e293b;">${admin.name}</div>
                        <small style="color: #94a3b8;">Admin Aktif</small>
                    </td>
                    <td>${admin.email}</td>
                    <td>${admin.phone || '-'}</td>
                    <td style="display: flex; gap: 10px;">
                        <button onclick="confirmResetPassword('${admin._id}', '${admin.name}')" 
                                class="btn-action-custom" style="background: #eff6ff; color: #3b82f6; padding: 8px;">
                            <i class="fas fa-key"></i>
                        </button>

                        <button onclick="confirmDeleteAdmin('${admin._id}', '${admin.name}')" 
                                class="btn-logout-nav" style="padding: 8px 12px; font-size: 0.8rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error load admin:', error);
        Swal.fire('Gagal!', 'Sistem gak ngenalin role kamu sebagai Owner.', 'error');
    }
}

//[CREATE] Fungsi tambah admin baru 
async function createAdmin() {
    const name = document.getElementById('adminName').value;
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const phone = document.getElementById('adminPhone').value;

    if (!name || !email || !password) {
        return Swal.fire('S!', 'Nama, Email, dan Password wajib diisi.', 'warning');
    }

    try {
        const res = await apiRequest('/api/admin/create', 'POST', { name, email, password, phone });

        if (res.success) {
            // Tutup modal dulu biar notif sukses keliatan jelas
            document.getElementById('modalAdmin').style.display = 'none';
            clearForm();

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Akun staf admin baru sudah aktif.',
                confirmButtonColor: '#4f46e5',
                timer: 2000
            }).then(() => {
                location.reload(); 
            });
        }
    } catch (error) {
        Swal.fire('Gagal!', error.message, 'error');
    }
}

// [RESET PASSWORD] Fungsi reset password admin 
window.confirmResetPassword = async (adminId, name) => {
    const { value: newPassword } = await Swal.fire({
        title: `Reset Password ${name}`,
        input: 'password',
        inputLabel: 'Masukkan Password Baru',
        inputPlaceholder: 'Min. 6 Karakter',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Update Password',
        inputValidator: (value) => {
            if (!value || value.length < 6) {
                return 'Password harus minimal 6 karakter ya Bos!';
            }
        }
    });

    if (newPassword) {
        try {
            const res = await apiRequest(`/api/admin/${adminId}/reset-password`, 'PUT', { newPassword });
            
            if (res.success) {
                Swal.fire('Berhasil!', `Password staf ${name} sudah diperbarui.`, 'success');
            }
        } catch (error) {
            Swal.fire('Gagal!', error.message, 'error');
        }
    }
};

// [DELETE] Fungsi hapus admin 
window.confirmDeleteAdmin = async (adminId, name) => {
    const result = await Swal.fire({
        title: 'Yakin mau hapus?',
        text: `Akses ${name} akan di hapus permanen!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        try {
            const res = await apiRequest(`/api/admin/${adminId}`, 'DELETE');
            
            if (res.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus!',
                    text: 'Admin sudah tidak punya akses lagi.',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    loadAdmins(); 
                });
            }
        } catch (error) {
            Swal.fire('Error!', error.message, 'error');
        }
    }
};

function clearForm() {
    document.getElementById('adminName').value = '';
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPhone').value = '';
}