import { apiRequest } from './api.js';
import { checkAuth } from './auth.js';

let rooms = [];
let currentEditTenantId = null; 

document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.endsWith('tenants.html')) return;

    loadTenants();
    loadRoomsForSelect();
    setupSidebarNavigation();

    const btnAddTenant = document.getElementById('btnAddTenant');
    const btnSaveTenant = document.getElementById('btnSaveTenant');
    const btnCancelTenant = document.getElementById('btnCancelTenant');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const rentalTypeSelect = document.getElementById('rentalType'); 
    const roomIdSelect = document.getElementById('roomId'); // Dropdown Kamar

    if (btnAddTenant) btnAddTenant.onclick = showAddTenantForm;
    if (btnSaveTenant) btnSaveTenant.onclick = saveTenant;
    if (btnCancelTenant) btnCancelTenant.onclick = hideAddTenantForm;
    if (paymentMethodSelect) paymentMethodSelect.onchange = handlePaymentMethodChange;
    
    // Logic Auto-Price pas ganti tipe atau ganti kamar
    if (rentalTypeSelect) {
        rentalTypeSelect.onchange = () => {
            toggleRentalFields();
            updateAutoPrice();
        };
    }
    if (roomIdSelect) roomIdSelect.onchange = updateAutoPrice;
});

// --- FUNGSI AUTO-PRICE (SI TUKANG NYONTEK) ---
async function updateAutoPrice() {
    const roomId = document.getElementById('roomId').value;
    const rentalType = document.getElementById('rentalType').value;
    const amountInput = document.getElementById('initialAmount'); // Pastikan ID ini ada di HTML lo

    if (!roomId || !amountInput) return;

    try {
        const response = await apiRequest(`/api/admin/rooms/${roomId}`);
        const room = response.data || response;

        // Pasang harga otomatis sesuai pilihan tipe sewa di data kamar
        amountInput.value = (rentalType === 'monthly') ? (room.priceMonthly || 0) : (room.priceDaily || 0);
    } catch (error) {
        console.error("Gagal ambil harga kamar:", error);
    }
}

// --- FUNGSI TAMPILAN (UI) ---
function toggleRentalFields() {
    const type = document.getElementById('rentalType').value;
    const monthlyFields = document.getElementById('monthlyFields');
    const dailyFields = document.getElementById('dailyFields');

    if (type === 'monthly') {
        monthlyFields.style.display = 'block';
        dailyFields.style.display = 'none';
    } else {
        monthlyFields.style.display = 'none';
        dailyFields.style.display = 'block';
    }
}

function showAddTenantForm() {
    currentEditTenantId = null;
    resetTenantForm();
    updateModalUI('Tambah Penyewa Baru', 'block');
    toggleRentalFields();
    document.getElementById('addTenantForm').style.display = 'flex';
}

async function editTenant(id) {
    try {
        const response = await apiRequest(`/api/admin/tenants/${id}`);
        const tenant = response.data || response;

        currentEditTenantId = id;
        resetTenantForm();

        document.getElementById('tenantName').value = tenant.name || '';
        document.getElementById('phone').value = tenant.phone || '';
        document.getElementById('idNumber').value = tenant.idNumber || '';
        document.getElementById('paymentMethod').value = tenant.preferredPaymentMethod || '';
        
        const typeSelect = document.getElementById('rentalType');
        typeSelect.value = tenant.rentalType || 'monthly';
        
        if (tenant.rentalType === 'daily') {
            document.getElementById('checkoutDate').value = tenant.checkoutDate ? tenant.checkoutDate.split('T')[0] : '';
        } else {
            document.getElementById('dueDate').value = tenant.dueDate || '';
        }

        toggleRentalFields();
        updateModalUI('Edit Profil Penyewa', 'none');
        document.getElementById('addTenantForm').style.display = 'flex';

    } catch (error) {
        Swal.fire('Gagal!', 'Gagal memuat data penyewa', 'error');
    }
}

async function saveTenant() {
    const name = document.getElementById('tenantName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const idNumber = document.getElementById('idNumber').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    // KUNCINYA DI SINI: Ambil rentalType yang terbaru dari dropdown
    const rentalType = document.getElementById('rentalType').value; 
    
    // Ambil nominal yang sudah di-auto-fill oleh updateAutoPrice()
    const initialAmount = parseFloat(document.getElementById('initialAmount')?.value || 0);

    if (!name || !phone || !idNumber || !paymentMethod) {
        return Swal.fire('Waduh!', 'Field utama wajib diisi!', 'warning');
    }

    const payload = { 
        name, phone, idNumber, paymentMethod, 
        rentalType: rentalType // Pastikan ini terkirim sesuai pilihan (daily/monthly)
    };

    // Logic Tanggal: Pastiin payload ngikutin rentalType
    if (rentalType === 'monthly') {
        payload.dueDate = document.getElementById('dueDate').value;
    } else {
        const checkoutDate = document.getElementById('checkoutDate').value;
        if (!checkoutDate) return Swal.fire('Eitss!', 'Tanggal checkout tamu harian harus diisi!', 'warning');
        payload.checkoutDate = checkoutDate;
    }

    if (!currentEditTenantId) {
        const roomId = document.getElementById('roomId').value;
        if (!roomId) return Swal.fire('Pilih Kamar!', 'Pilih kamar dulu Bos!', 'warning');
        payload.roomId = roomId;
    }

    try {
        const url = currentEditTenantId ? `/api/admin/tenants/${currentEditTenantId}` : '/api/admin/tenants/create';
        const method = currentEditTenantId ? 'PUT' : 'POST';

        // 1. SIMPAN PROFIL PENYEWA
        const resTenant = await apiRequest(url, method, payload);
        
        // 2. SIMPAN PEMBAYARAN (Gunakan rentalType yang sama)
        if (!currentEditTenantId && initialAmount > 0) {
            await apiRequest('/api/admin/payments/create', 'POST', {
                tenantName: payload.name,
                amount: initialAmount,
                paymentMethod: payload.paymentMethod,
                rentalType: rentalType, // INI YANG BIKIN MASUK KE LAPORAN HARIAN/BULANAN
                status: 'Completed'
            });
        }

        hideAddTenantForm(); 

        await Swal.fire({
            title: 'Berhasil!',
            text: `Penyewa ${rentalType === 'daily' ? 'Harian' : 'Bulanan'} Berhasil Terdaftar!`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });

        loadTenants();
        loadRoomsForSelect();

    } catch (error) {
        Swal.fire('Gagal!', error.message, 'error');
    }
}

// Pastiin pemicunya sensitif pas ganti tipe
if (rentalTypeSelect) {
    rentalTypeSelect.onchange = () => {
        toggleRentalFields(); // Ganti tampilan field (dueDate vs checkoutDate)
        updateAutoPrice();    // Ganti nominal bayar (priceMonthly vs priceDaily)
    };
}
async function loadTenants() {
    try {
        const response = await apiRequest('/api/admin/tenants');
        const tenants = response.data || response;
        const container = document.getElementById('tenantsList');
        const countSpan = document.getElementById('tenantCount');

        if (!container) return;
        container.innerHTML = '';
        
        if (!Array.isArray(tenants)) return countSpan.textContent = '0 penyewa';
        countSpan.textContent = `${tenants.length} penyewa`;

        tenants.forEach(tenant => {
            const roomNum = (tenant.roomId && tenant.roomId.roomNumber) ? tenant.roomId.roomNumber : '-';
            const typeBadge = tenant.rentalType === 'daily' 
                ? '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; margin-left: 5px;">HARIAN</span>'
                : '<span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; margin-left: 5px;">BULANAN</span>';

            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; align-items: center;">
                        <strong style="font-size: 1.1rem; color: #1e293b;">${tenant.name}</strong>
                        ${typeBadge}
                    </div>
                    <div style="margin-top: 5px; color: #64748b; font-size: 0.9rem;">
                        <span><i class="fas fa-phone"></i> ${tenant.phone}</span> | 
                        <span><i class="fas fa-door-open"></i> Kamar ${roomNum}</span>
                        <br>
                        <small style="color: #94a3b8;">
                            ${tenant.rentalType === 'daily' ? 'Checkout: ' + (tenant.checkoutDate ? new Date(tenant.checkoutDate).toLocaleDateString('id-ID') : '-') : 'Tagihan tiap tanggal: ' + (tenant.dueDate || '-')}
                        </small>
                    </div>
                </div>
                <div class="list-actions" style="padding: 10px; display: flex; gap: 8px;">
                    <button class="edit" style="flex: 1; padding: 8px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer;">Edit</button>
                    <button class="delete" style="flex: 1; padding: 8px; background: #fee2e2; color: #ef4444; border: none; border-radius: 8px; cursor: pointer;">Keluar</button>
                </div>
            `;
            container.appendChild(div);
            div.querySelector('.edit').onclick = () => editTenant(tenant._id);
            div.querySelector('.delete').onclick = () => checkoutTenant(tenant._id);
        });
    } catch (error) {
        console.error('Error load tenants:', error);
    }
}

function resetTenantForm() {
    const fields = ['tenantName', 'phone', 'idNumber', 'roomId', 'paymentMethod', 'rentalType', 'dueDate', 'checkoutDate', 'initialAmount'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = (id === 'rentalType') ? 'monthly' : '';
    });
    document.getElementById('qrisSection').style.display = 'none';
}

function updateModalUI(titleText, roomDisplay) {
    const title = document.querySelector('#addTenantForm h3');
    const roomGroup = document.getElementById('roomIdGroup');
    if (title) title.textContent = titleText;
    if (roomGroup) roomGroup.style.display = roomDisplay;
}

function hideAddTenantForm() {
    document.getElementById('addTenantForm').style.display = 'none';
    currentEditTenantId = null;
}

function handlePaymentMethodChange() {
    const method = document.getElementById('paymentMethod').value;
    document.getElementById('qrisSection').style.display = (method === 'qr') ? 'block' : 'none';
    if (method === 'qr') displayStaticQRIS();
}

function displayStaticQRIS() {
    const container = document.getElementById('qrisContainer');
    if (container) {
        container.innerHTML = `<img src="images/qris-static.png" style="max-width: 150px; border-radius: 8px; margin-top: 10px;">`;
    }
}

async function loadRoomsForSelect() {
    try {
        const response = await apiRequest('/api/admin/rooms');
        const availableRooms = (Array.isArray(response) ? response : (response.data || [])).filter(r => r.status === 'available');
        const select = document.getElementById('roomId');
        if (!select) return;
        select.innerHTML = '<option value="">Pilih Kamar</option>';
        availableRooms.forEach(room => {
            const opt = document.createElement('option');
            opt.value = room._id;
            opt.textContent = `Kamar ${room.roomNumber} (${room.type || 'Standard'})`;
            select.appendChild(opt);
        });
    } catch (error) { console.error(error); }
}

function setupSidebarNavigation() {
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        if (item.textContent.trim().includes('Penyewa')) item.classList.add('active');
    });
}

async function checkoutTenant(id) {
    const result = await Swal.fire({
        title: 'Konfirmasi Keluar',
        text: "Penyewa akan dikeluarkan dari sistem. Pastikan tagihan sudah lunas!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#f87171',
        confirmButtonText: 'Ya, Keluarkan!',
        cancelButtonText: 'Batal',
        reverseButtons: true
    });

    if (result.isConfirmed) {
        try {
            await apiRequest(`/api/admin/tenants/checkout/${id}`, 'PUT');
            await Swal.fire({ title: 'Berhasil!', text: 'Penyewa telah berhasil keluar.', icon: 'success', timer: 1500, showConfirmButton: false });
            loadTenants();
            loadRoomsForSelect();
        } catch (error) {
            Swal.fire('Gagal!', error.message, 'error');
        }
    }
}