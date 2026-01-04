import { apiRequest } from './api.js';
import { checkAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.endsWith('reports.html')) return;
    //tanggal atau bulan ini
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    // Reset input tanggal saat refresh halaman agar kembali ke data awal (semua)
    const formatDateInput = (date) => date.toISOString().split('T')[0];
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
   if (startDateInput && endDateInput) {
        startDateInput.value = formatDateInput(firstDay);
        endDateInput.value = formatDateInput(lastDay);
    }
    loadReport();
    setupSidebarNavigation();
    setupEventListeners();
});

function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => {
        if (item.textContent.trim().includes('Laporan')) {
            item.classList.add('active');
        }
    });
}

function setupEventListeners() {
    const btnFilter = document.getElementById('btnFilterReport');
if (btnFilter) {
    // Ini buat efek warna yang lo mau
    btnFilter.addEventListener('mouseenter', () => btnFilter.style.background = '#4338ca');
    btnFilter.addEventListener('mouseleave', () => btnFilter.style.background = '#4f46e5');

    // INI YANG KURANG: Perintah buat jalanin filter pas diklik!
    btnFilter.addEventListener('click', () => {
        console.log("Tombol Filter dieksekusi..."); // Buat ngecek di F12
        loadReport(); 
    });
}
    const btnExport = document.getElementById('btnExportExcel');
    if (btnExport) {
        btnExport.addEventListener('mouseenter', () => btnExport.style.background = '#059669');
        btnExport.addEventListener('mouseleave', () => btnExport.style.background = '#10b981');
        btnExport.addEventListener('click', exportToExcel);
    }
    const btnRefresh = document.getElementById('btnRefreshReport');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            location.reload();
        });
    }

    const btnSavePayment = document.getElementById('btnSavePayment');
    if (btnSavePayment) {
        btnSavePayment.addEventListener('click', recordPayment);
    }
}

async function loadReport() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;

    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        // FIX: Tambahin .toString() biar parameternya beneran jadi query string
        const response = await apiRequest(`/api/admin/reports?${params.toString()}`);
        const data = response.data || response;

        // Update Ringkasan Statis
        document.getElementById('totalIncome').textContent = formatRupiah(data.totalIncome || 0);
        document.getElementById('successfulPayments').textContent = data.successfulPayments || 0;

        // Render Tabel
        renderPaymentTable(data.payments || []);
    } catch (error) {
        console.error('Gagal memuat laporan:', error);
        renderPaymentTable([]);
    }
}

// public/js/reports.js

function renderPaymentTable(payments) {
    const tbody = document.getElementById('paymentTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // FIX UTAMA: Cek apakah datanya beneran ada
    if (!Array.isArray(payments) || payments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div style="text-align: center; padding: 50px 20px;">
                        <i class="fas fa-search-dollar" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px; display: block;"></i>
                        <h4 style="margin: 0; color: #1e293b;">Data Tidak Ditemukan</h4>
                        <p style="color: #64748b; font-size: 0.9rem;">Coba ganti filter tanggal atau refresh data Anda.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    // RENDER DATA
    payments.forEach(payment => {
    const row = document.createElement('tr');
    
    const statusStyle = payment.status?.toLowerCase() === 'paid' || payment.status?.toLowerCase() === 'completed'
        ? 'background: #dcfce7; color: #15803d;' 
        : 'background: #fef9c3; color: #a16207;';

    row.innerHTML = `
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9;">${payment.tenantName}</td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; color: #4f46e5; font-weight: 600;">${payment.roomNumber}</td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; font-weight: 700;">${formatRupiah(payment.amount)}</td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
            <span style="text-transform: uppercase; font-weight: 700; font-size: 0.8rem; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; color: #475569;">
                ${payment.method || '-'} 
            </span>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
            <span style="padding: 5px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; ${statusStyle}">
                ${payment.status}
            </span>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 0.85rem;">${formatDate(payment.date)}</td>
    `;
    tbody.appendChild(row);
});
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Fungsi tambah pembayaran manual (jika kamu ingin fitur ini di laporan)
async function recordPayment() {
    // Ambil element input
    const tenantName = document.getElementById('tenantName').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const methodSelect = document.getElementById('paymentType'); // Dropdown Cash/Transfer/QRIS

    if (!tenantName || isNaN(amount) || !methodSelect.value) {
        alert('Semua field harus diisi dengan benar!');
        return;
    }

    try {
        // KITA KIRIM paymentMethod SESUAI YANG DITUNGGU BACKEND
        await apiRequest('/admin/payments/create', 'POST', {
            tenantName: tenantName, 
            amount: amount,
            paymentMethod: methodSelect.value // Ini kuncinya!
        });

        alert('Pembayaran berhasil dicatat!');
        // Reset form & reload
        document.getElementById('tenantName').value = '';
        document.getElementById('amount').value = '';
        methodSelect.value = '';
        loadReport(); 
    } catch (error) {
        alert('Gagal: ' + error.message);
    }
}
// Tambahin ini di setupEventListeners
const btnExport = document.getElementById('btnExportExcel');
if (btnExport) {
    btnExport.addEventListener('click', exportToExcel);
}

// Fungsi Utama Export
function exportToExcel() {
    const table = document.querySelector("table"); // Ambil tabel laporan
    
    // 1. Convert tabel HTML ke format Worksheet
    const wb = XLSX.utils.table_to_book(table, { sheet: "Laporan Keuangan" });
    
    // 2. Ambil tanggal buat nama file biar rapi
    const date = new Date().toISOString().split('T')[0];
    const fileName = `Laporan_Kosan_${date}.xlsx`;
    
    // 3. Download filenya
    XLSX.writeFile(wb, fileName);
    
    alert('Laporan berhasil di-export ke Excel!');
}