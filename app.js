// =================================================================
// KODE MASTER v4.0 - 13 JULI 2025
// PERBAIKAN FINAL SEMUA KESALAHAN & REGRESI
// =================================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- BAGIAN 1: KONEKSI & VARIABEL GLOBAL ---
    const SUPABASE_URL = 'https://ubfbsmhyshosiihaewis.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZmJzbWh5c2hvc2lpaGFld2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NzEwNjEsImV4cCI6MjA2NzQ0NzA2MX0.6mSpqn-jeS4Ix-2ZhBXFygPzxrQMQhCDzxyOgG5L9ss'; // <- GANTI DENGAN KUNCI ASLI LOE
    const { createClient } = window.supabase;
    const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let masterBahanList = [];
    let semuaResepList = [];
    let isEditing = false;
    let editingResepId = null;

    // --- BAGIAN 2: SELEKSI ELEMEN DOM ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const masterBahanForm = document.getElementById('master-bahan-form');
    const masterBahanTableBody = document.getElementById('master-bahan-table-body');
    const editModal = document.getElementById('edit-modal');
    const editBahanForm = document.getElementById('edit-bahan-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const hppForm = document.getElementById('hpp-form');
    const produkTableBody = document.getElementById('produk-table-body');
    const resetHppBtn = document.getElementById('reset-hpp-btn');
    
    // --- BAGIAN 3: FUNGSI OTENTIKASI & UI ---
    function setupUI(user) {
        if (user) {
            if (authContainer) authContainer.classList.add('hidden');
            if (appContainer) {
                appContainer.classList.remove('hidden');
                if (!appContainer.dataset.listenersAttached) {
                    setupAppEventListeners();
                    appContainer.dataset.listenersAttached = 'true';
                }
            }
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;
            loadDataAwal();
        } else {
            if (authContainer) authContainer.classList.remove('hidden');
            if (appContainer) appContainer.classList.add('hidden');
            if (userEmailDisplay) userEmailDisplay.textContent = '';
        }
    }

    function initAuth() {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const { error } = await _supabase.auth.signInWithPassword({ email, password });
                if (error) alert(`Login Gagal: ${error.message}`);
            });
        }
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                const { error } = await _supabase.auth.signUp({ email, password });
                if (error) { alert(`Daftar Gagal: ${error.message}`); } else { alert('Pendaftaran berhasil! Cek email untuk verifikasi.'); }
            });
        }
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => await _supabase.auth.signOut());
        }
        _supabase.auth.onAuthStateChange((_event, session) => setupUI(session ? session.user : null));
    }

    // --- BAGIAN 4: LOGIKA APLIKASI ---
    async function loadDataAwal() {
        await Promise.all([loadBahanBaku(), loadSemuaResep()]);
        renderProdukTable();
    }
    
    async function loadBahanBaku(kategoriFilter = 'Semua') {
        if (!masterBahanTableBody) return;
        let query = _supabase.from('bahan_baku').select('*').order('created_at', { ascending: false });
        if (kategoriFilter !== 'Semua') { query = query.eq('kategori', kategoriFilter); }
        const { data, error } = await query;
        if (error) { console.error("Gagal memuat bahan baku:", error.message); masterBahanList = []; return; }
        masterBahanList = data || [];
        renderBahanBakuTable();
    }
    
    function renderBahanBakuTable() {
        if (!masterBahanTableBody) return;
        masterBahanTableBody.innerHTML = '';
        if (masterBahanList.length === 0) {
            masterBahanTableBody.innerHTML = `<tr><td colspan="4">Tidak ada bahan baku.</td></tr>`;
            return;
        }
        masterBahanList.forEach(bahan => {
            const hargaPerSatuan = (bahan.harga_beli_kemasan && bahan.isi_kemasan > 0) ? (bahan.harga_beli_kemasan / bahan.isi_kemasan) : 0;
            const row = document.createElement('tr');
            row.dataset.id = bahan.id;
            row.innerHTML = `<td>${bahan.nama || 'N/A'}</td><td>${bahan.kategori || 'N/A'}</td><td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(hargaPerSatuan)} / ${bahan.satuan_kemasan || ''}</td><td><button class="edit-btn">Edit</button> <button class="delete-btn">Hapus</button></td>`;
            masterBahanTableBody.appendChild(row);
        });
    }

    async function loadSemuaResep() {
        const { data, error } = await _supabase.from('resep').select('*').order('created_at', { ascending: false });
        if (error) { console.error("Gagal memuat resep:", error.message); semuaResepList = []; } 
        else { semuaResepList = data || []; }
    }

    function renderProdukTable(tipeFilter = 'PRODUK JADI') {
        if (!produkTableBody) return;
        const filteredList = semuaResepList.filter(r => r.tipe_resep === tipeFilter);
        produkTableBody.innerHTML = '';
        if (filteredList.length === 0) {
            produkTableBody.innerHTML = `<tr><td colspan="5">Belum ada ${tipeFilter.toLowerCase().replace('_', ' ')} yang disimpan.</td></tr>`;
            return;
        }
        filteredList.forEach(resep => {
            const row = document.createElement('tr');
            row.dataset.id = resep.id;
            row.dataset.nama = resep.nama_resep;
            const tipeTeks = resep.tipe_resep === 'PRODUK JADI' ? 'Produk Jadi' : 'Bahan Olahan';
            const hargaTampil = resep.tipe_resep === 'PRODUK JADI' 
                ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(resep.harga_jual || 0)
                : `-`;
            row.innerHTML = `<td>${resep.nama_resep || 'N/A'}</td><td><span class="chip-kategori">${tipeTeks}</span></td><td>${resep.kategori || 'N/A'}</td><td>${hargaTampil}</td><td><button class="button-edit">Lihat/Edit</button> <button class="button-delete">Hapus</button></td>`;
            produkTableBody.appendChild(row);
        });
    }

    function populateEditForm(id) {
        const bahan = masterBahanList.find(b => b.id == id);
        if (!bahan) return;
        document.getElementById('edit-bahan-id').value = bahan.id;
        document.getElementById('edit-bahan-nama').value = bahan.nama;
        document.getElementById('edit-bahan-kategori').value = bahan.kategori;
        document.getElementById('edit-harga-beli-kemasan').value = bahan.harga_beli_kemasan;
        document.getElementById('edit-isi-kemasan').value = bahan.isi_kemasan;
        document.getElementById('edit-satuan-kemasan').value = bahan.satuan_kemasan;
        if(editModal) editModal.classList.remove('hidden');
    }

    async function handleHapusBahan(id) {
        if (confirm('Yakin mau hapus bahan ini?')) {
            const { error } = await _supabase.from('bahan_baku').delete().eq('id', id);
            if (error) { alert('Gagal hapus bahan: ' + error.message); } 
            else {
                alert('Bahan berhasil dihapus.');
                loadBahanBaku();
            }
        }
    }

    async function handleHapusProduk(id, namaResep) {
        if (confirm(`Yakin mau hapus resep "${namaResep}"?`)) {
            const { error } = await _supabase.from('resep').delete().eq('id', id);
            if (error) { alert('Gagal hapus resep: ' + error.message); } 
            else {
                alert('Resep berhasil dihapus.');
                await loadSemuaResep();
                renderProdukTable(document.querySelector('.resep-filter-btn.active').dataset.tipe);
            }
        }
    }
    
    async function loadResepToKalkulator(resepId) {
        const { data: resep, error } = await _supabase.from('resep').select('*').eq('id', resepId).single();
        if (error || !resep) { alert('Gagal mengambil detail resep!'); return; }
        
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.nav-button[data-page="page-kalkulator"]').classList.add('active');
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById('page-kalkulator').classList.add('active');
        
        const jenisResepInput = document.getElementById('jenis-resep-input');
        jenisResepInput.value = resep.tipe_resep;
        jenisResepInput.disabled = true;
        jenisResepInput.dispatchEvent(new Event('change'));

        document.getElementById('resep-nama').value = resep.nama_resep;
        document.getElementById('resep-kategori').value = resep.kategori;
        document.getElementById('harga-jual-aktual').value = resep.harga_jual;
        
        if (resep.tipe_resep === 'BAHAN OLAHAN') {
            document.getElementById('hasil-jadi-jumlah').value = resep.hasil_jadi_jumlah;
            document.getElementById('hasil-jadi-satuan').value = resep.hasil_jadi_satuan;
        }
        
        const resepTableBody = document.getElementById('resep-table-body');
        resepTableBody.innerHTML = '';
        if(resep.resep_json) {
            resep.resep_json.forEach(item => {
                const bahanAsli = item.source === 'bahan_baku' 
                    ? masterBahanList.find(b => b.id == item.bahan_id)
                    : semuaResepList.find(r => r.id == item.bahan_id);
                
                if (bahanAsli) {
                    const hargaSatuan = hitungHargaSatuan(bahanAsli, item.source);
                    const bahanInfo = { nama: item.nama_bahan, bahanId: item.bahan_id, harga: hargaSatuan, source: item.source };
                    tambahBahanKeResep(bahanInfo, item.jumlah);
                }
            });
        }
        isEditing = true;
        editingResepId = resepId;
        document.querySelector('#hpp-form button[type="submit"]').textContent = 'Update Resep';
        kalkulasiFinal();
    }

    function hitungHargaSatuan(item, sourceType) {
        if (!item) return 0;
        if (sourceType === 'bahan_baku') {
            return (item.harga_beli_kemasan && item.isi_kemasan > 0) ? (item.harga_beli_kemasan / item.isi_kemasan) : 0;
        } else { // bahan_olahan
            return (item.total_hpp && item.hasil_jadi_jumlah > 0) ? item.total_hpp / item.hasil_jadi_jumlah : 0;
        }
    }

    function renderPilihBahanList(sourceType) {
        const searchResults = document.getElementById('bahan-search-results');
        if (!searchResults) return;
        
        let listToRender = [];
        if (sourceType === 'bahan_baku') {
            listToRender = masterBahanList;
        } else { // bahan_olahan
            listToRender = semuaResepList.filter(r => r.tipe_resep === 'BAHAN OLAHAN');
        }

        const searchTerm = document.getElementById('search-bahan-input').value.toLowerCase();
        if(searchTerm) {
            const nameProperty = sourceType === 'bahan_baku' ? 'nama' : 'nama_resep';
            listToRender = listToRender.filter(item => item[nameProperty] && item[nameProperty].toLowerCase().includes(searchTerm));
        }

        searchResults.innerHTML = '';
        if (listToRender.length === 0) { searchResults.innerHTML = `<li>Tidak ada data tersedia.</li>`; } 
        else {
            listToRender.forEach(item => {
                const li = document.createElement('li');
                const harga = hitungHargaSatuan(item, sourceType);
                const nama = sourceType === 'bahan_baku' ? item.nama : item.nama_resep;
                const satuan = sourceType === 'bahan_baku' ? item.satuan_kemasan : item.hasil_jadi_satuan;
                
                li.textContent = `${nama} (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(harga)} / ${satuan || ''})`;
                li.dataset.bahanId = item.id; li.dataset.source = sourceType; li.dataset.nama = nama; li.dataset.harga = harga;
                li.classList.add('search-result-item');
                searchResults.appendChild(li);
            });
        }
    }

    function tambahBahanKeResep(bahanInfo, jumlah) {
        const resepTableBody = document.getElementById('resep-table-body');
        if(!resepTableBody) return;
        const row = document.createElement('tr');
        row.dataset.bahanId = bahanInfo.bahanId; row.dataset.source = bahanInfo.source; row.dataset.harga = bahanInfo.harga;
        const jumlahValue = jumlah !== undefined ? jumlah : '';
        const biayaAwal = jumlah ? (jumlah * parseFloat(bahanInfo.harga)) : 0;
        row.innerHTML = `
            <td>${bahanInfo.nama}</td>
            <td><input type="number" class="resep-jumlah" value="${jumlahValue}" placeholder="0" min="0" step="any"></td>
            <td class="resep-biaya">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(biayaAwal)}</td>
            <td><button class="resep-delete-btn">Hapus</button></td>
        `;
        resepTableBody.appendChild(row);
        document.getElementById('pilih-bahan-modal').classList.add('hidden');
    }

    function openPilihBahanModal() {
        const modal = document.getElementById('pilih-bahan-modal');
        if (!modal) { return; }
        document.getElementById('search-bahan-input').value = '';
        document.querySelector('.bahan-source-btn[data-source="bahan_baku"]').classList.add('active');
        document.querySelector('.bahan-source-btn[data-source="bahan_olahan"]').classList.remove('active');
        renderPilihBahanList('bahan_baku');
        modal.classList.remove('hidden');
    }

    function kalkulasiFinal() {
        const semuaBahan = document.querySelectorAll('#resep-table-body tr');
        let hppBahanBaku = 0;
        semuaBahan.forEach(row => {
            const biayaText = row.querySelector('.resep-biaya').textContent;
            const biayaAngka = parseFloat(biayaText.replace(/[^0-9,-]+/g, "").replace(",", "."));
            if (!isNaN(biayaAngka)) { hppBahanBaku += biayaAngka; }
        });
        const overheadCost = parseFloat(document.getElementById('overhead-cost').value) || 0;
        const overheadType = document.getElementById('overhead-type').value;
        const laborCost = parseFloat(document.getElementById('labor-cost').value) || 0;
        const errorCostPercent = parseFloat(document.getElementById('error-cost-percent').value) || 0;
        const targetMarginPercent = parseFloat(document.getElementById('target-margin-percent').value) || 0;
        const hargaJualAktual = parseFloat(document.getElementById('harga-jual-aktual').value) || 0;
        let overheadNominal = overheadCost;
        if (overheadType === 'persen' && hppBahanBaku > 0) { overheadNominal = hppBahanBaku * (overheadCost / 100); }
        const hppSebelumError = hppBahanBaku + overheadNominal + laborCost;
        const errorCostNominal = hppSebelumError * (errorCostPercent / 100);
        const totalHPP = hppSebelumError + errorCostNominal;
        let saranHargaJual = 0;
        if (targetMarginPercent < 100 && targetMarginPercent >= 0) {
            saranHargaJual = totalHPP / (1 - (targetMarginPercent / 100));
        }
        let profitNominal = 0;
        let profitPercent = 0;
        if (hargaJualAktual > 0) {
            profitNominal = hargaJualAktual - totalHPP;
            profitPercent = (profitNominal / hargaJualAktual) * 100;
        }
        const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 }).format(angka);
        document.getElementById('total-cogs-display').textContent = formatRupiah(totalHPP);
        document.getElementById('saran-harga-display').textContent = formatRupiah(saranHargaJual);
        document.getElementById('profit-display').textContent = formatRupiah(profitNominal);
        document.getElementById('profit-percent-display').textContent = `${profitPercent.toFixed(2)}%`;
    }

    async function handleSimpanResep(e) {
        e.preventDefault();
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) { alert("Sesi tidak valid."); return; }
        const resepRows = document.querySelectorAll('#resep-table-body tr');
        if (resepRows.length === 0) { alert('Resep tidak boleh kosong!'); return; }
        const resepJsonData = Array.from(resepRows).map(row => ({
            bahan_id: row.dataset.bahanId, nama_bahan: row.cells[0].textContent, jumlah: row.querySelector('.resep-jumlah').value,
            biaya: parseFloat(row.querySelector('.resep-biaya').textContent.replace(/[^0-9,-]+/g, "").replace(",", ".")),
            source: row.dataset.source
        }));
        let resepData = {
            user_id: user.id,
            nama_resep: document.getElementById('resep-nama').value,
            tipe_resep: document.getElementById('jenis-resep-input').value,
            kategori: document.getElementById('resep-kategori').value,
            resep_json: resepJsonData,
            total_hpp: parseFloat(document.getElementById('total-cogs-display').textContent.replace(/[^0-9,-]+/g, "").replace(",", ".")),
            harga_jual: parseFloat(document.getElementById('harga-jual-aktual').value) || null,
        };
        if (!resepData.nama_resep) { alert('Nama resep harus diisi!'); return; }
        if (resepData.tipe_resep === 'BAHAN OLAHAN') {
            resepData.hasil_jadi_jumlah = parseFloat(document.getElementById('hasil-jadi-jumlah').value) || null;
            resepData.hasil_jadi_satuan = document.getElementById('hasil-jadi-satuan').value || null;
        }
        
        if (isEditing && editingResepId) {
            const { error } = await _supabase.from('resep').update(resepData).eq('id', editingResepId);
            if (error) {
                alert('Gagal mengupdate resep: ' + error.message);
            } else {
                alert(`Resep "${resepData.nama_resep}" berhasil diupdate!`);
                resetKalkulator();
                loadDataAwal();
            }
        } else {
            const { data, error } = await _supabase.from('resep').insert([resepData]).select();
            if (error) {
                alert(`Gagal menyimpan resep: ${error.message}`);
            } else {
                alert(`Resep "${data[0].nama_resep}" berhasil disimpan!`);
                resetKalkulator();
                loadDataAwal();
            }
        }
    }

    async function handleSimpanBahanCepat(e) {
        e.preventDefault();
        const form = e.target;
        const { data: { user } } = await _supabase.auth.getUser();
        if(!user) { alert("Sesi tidak valid"); return; }
        
        const newBahan = {
            nama: document.getElementById('bahan-nama-cepat').value,
            kategori: document.getElementById('bahan-kategori-cepat').value,
            harga_beli_kemasan: document.getElementById('harga-beli-kemasan-cepat').value,
            isi_kemasan: document.getElementById('isi-kemasan-cepat').value,
            satuan_kemasan: document.getElementById('satuan-kemasan-cepat').value,
            user_id: user.id
        };

        const { error } = await _supabase.from('bahan_baku').insert([newBahan]);
        if (error) {
            alert('Gagal simpan bahan baru: ' + error.message);
        } else {
            alert('Bahan baru berhasil disimpan!');
            form.reset();
            document.getElementById('tambah-bahan-cepat-modal').classList.add('hidden');
            await loadBahanBaku(); 
            openPilihBahanModal(); 
        }
    }

    function resetKalkulator() {
        if(hppForm) hppForm.reset();
        document.getElementById('resep-table-body').innerHTML = '';
        isEditing = false;
        editingResepId = null;
        document.querySelector('#hpp-form button[type="submit"]').textContent = 'Simpan Resep';
        document.getElementById('jenis-resep-input').disabled = false;
        document.getElementById('hasil-jadi-container').classList.add('hidden');
        kalkulasiFinal();
    }
    
    // BAGIAN 5: PEMASANGAN SEMUA EVENT LISTENER
    function setupAppEventListeners() {
        if (masterBahanForm) {
            masterBahanForm.addEventListener('submit', async (e) => {
                if (masterBahanList.length >= 20) {
                    alert("Anda sudah mencapai batas maksimal 20 bahan baku untuk akun gratis.");
                    return;
                }
                e.preventDefault();
                const { data: { user } } = await _supabase.auth.getUser();
                if(!user) { alert("Sesi tidak valid"); return; }
                const newBahan = {
                    nama: document.getElementById('bahan-nama').value,
                    kategori: document.getElementById('bahan-kategori').value,
                    harga_beli_kemasan: document.getElementById('harga-beli-kemasan').value,
                    isi_kemasan: document.getElementById('isi-kemasan').value,
                    satuan_kemasan: document.getElementById('satuan-kemasan').value,
                    user_id: user.id
                };
                const { error } = await _supabase.from('bahan_baku').insert([newBahan]);
                if (error) { alert('Gagal simpan bahan: ' + error.message); } 
                else {
                    alert('Bahan baru berhasil disimpan!');
                    masterBahanForm.reset();
                    loadBahanBaku();
                }
            });
        }
        if (editBahanForm) {
            editBahanForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-bahan-id').value;
                const updatedBahan = {
                    nama: document.getElementById('edit-bahan-nama').value,
                    kategori: document.getElementById('edit-bahan-kategori').value,
                    harga_beli_kemasan: document.getElementById('edit-harga-beli-kemasan').value,
                    isi_kemasan: document.getElementById('edit-isi-kemasan').value,
                    satuan_kemasan: document.getElementById('edit-satuan-kemasan').value,
                };
                const { error } = await _supabase.from('bahan_baku').update(updatedBahan).eq('id', id);
                if (error) { alert('Gagal update bahan: ' + error.message); } 
                else {
                    alert('Bahan berhasil diupdate!');
                    if(editModal) editModal.classList.add('hidden');
                    loadBahanBaku();
                }
            });
        }
        if (masterBahanTableBody) {
            masterBahanTableBody.addEventListener('click', (e) => {
                const targetRow = e.target.closest('tr');
                if (!targetRow || !targetRow.dataset.id) return;
                const id = targetRow.dataset.id;
                if (e.target.classList.contains('edit-btn')) { populateEditForm(id); }
                if (e.target.classList.contains('delete-btn')) { handleHapusBahan(id); }
            });
        }
        if (cancelEditBtn) { cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden')); }

        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(button.dataset.page).classList.add('active');
                if(button.dataset.page === 'page-kalkulator'){ resetKalkulator(); }
            });
        });

        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                loadBahanBaku(button.dataset.kategori);
            });
        });
        
        const addResepItemBtn = document.getElementById('add-resep-item-btn');
        if (addResepItemBtn) { addResepItemBtn.addEventListener('click', openPilihBahanModal); }
        
        const cancelPilihBahanBtn = document.getElementById('cancel-pilih-bahan-btn');
        if (cancelPilihBahanBtn) { cancelPilihBahanBtn.addEventListener('click', () => document.getElementById('pilih-bahan-modal').classList.add('hidden')); }

        const buatBahanBaruCepatBtn = document.getElementById('buat-bahan-baru-cepat-btn');
        if (buatBahanBaruCepatBtn) {
            buatBahanBaruCepatBtn.addEventListener('click', () => {
                document.getElementById('pilih-bahan-modal').classList.add('hidden');
                document.getElementById('tambah-bahan-cepat-modal').classList.remove('hidden');
            });
        }
        
        const cancelTambahCepatBtn = document.getElementById('cancel-tambah-cepat-btn');
        if (cancelTambahCepatBtn) { cancelTambahCepatBtn.addEventListener('click', () => document.getElementById('tambah-bahan-cepat-modal').classList.add('hidden')); }
        
        const masterBahanCepatForm = document.getElementById('master-bahan-cepat-form');
        if (masterBahanCepatForm) {
            masterBahanCepatForm.addEventListener('submit', handleSimpanBahanCepat);
        }

        const bahanSourceTabs = document.querySelectorAll('.bahan-source-btn');
        bahanSourceTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                bahanSourceTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const source = tab.dataset.source;
                renderPilihBahanList(source);
            });
        });

        const searchInput = document.getElementById('search-bahan-input');
        if(searchInput) {
            searchInput.addEventListener('input', () => {
                const currentSource = document.querySelector('.bahan-source-btn.active').dataset.source;
                renderPilihBahanList(currentSource);
            });
        }

        const searchResultsContainer = document.getElementById('bahan-search-results');
        if(searchResultsContainer) {
            searchResultsContainer.addEventListener('click', (e) => {
                if(e.target && e.target.matches('li.search-result-item')) {
                    tambahBahanKeResep(e.target.dataset);
                }
            });
        }
        
        const resepTableBody = document.getElementById('resep-table-body');
        if(resepTableBody) {
            resepTableBody.addEventListener('click', (e) => {
                if (e.target && e.target.classList.contains('resep-delete-btn')) {
                    e.target.closest('tr').remove();
                    kalkulasiFinal();
                }
            });
            resepTableBody.addEventListener('input', (e) => {
                if (e.target && e.target.classList.contains('resep-jumlah')) {
                    const row = e.target.closest('tr');
                    const hargaPerSatuan = parseFloat(row.dataset.harga);
                    const jumlah = parseFloat(e.target.value);
                    const biayaCell = row.querySelector('.resep-biaya');
                    if (!isNaN(hargaPerSatuan) && !isNaN(jumlah) && jumlah >= 0) {
                        const totalBiaya = hargaPerSatuan * jumlah;
                        biayaCell.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalBiaya);
                    } else {
                        biayaCell.textContent = 'Rp 0,00';
                    }
                    kalkulasiFinal();
                }
            });
        }

        const kalkulasiInputs = ['overhead-cost', 'overhead-type', 'labor-cost', 'error-cost-percent', 'target-margin-percent', 'harga-jual-aktual'];
        kalkulasiInputs.forEach(id => {
            const element = document.getElementById(id);
            if(element) { element.addEventListener('input', kalkulasiFinal); }
        });

        if (hppForm) {
            hppForm.addEventListener('submit', handleSimpanResep);
        }

        const resepFilterButtons = document.querySelectorAll('.resep-filter-btn');
        if (resepFilterButtons) {
            resepFilterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    resepFilterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    renderProdukTable(button.dataset.tipe);
                });
            });
        }

        if (produkTableBody) {
            produkTableBody.addEventListener('click', (e) => {
                const targetRow = e.target.closest('tr');
                if (!targetRow || !targetRow.dataset.id) return;
                const resepId = targetRow.dataset.id;
                const namaResep = targetRow.dataset.nama;
                if (e.target.classList.contains('button-edit')) {
                    loadResepToKalkulator(resepId);
                }
                if (e.target.classList.contains('button-delete')) {
                    handleHapusProduk(resepId, namaResep);
                }
            });
        }

        if(resetHppBtn) {
            resetHppBtn.addEventListener('click', resetKalkulator);
        }
        
        const jenisResepInput = document.getElementById('jenis-resep-input');
        const hasilJadiContainer = document.getElementById('hasil-jadi-container');
        if(jenisResepInput && hasilJadiContainer){
            jenisResepInput.addEventListener('change', () => {
                if(jenisResepInput.value === 'BAHAN OLAHAN'){
                    hasilJadiContainer.classList.remove('hidden');
                } else {
                    hasilJadiContainer.classList.add('hidden');
                }
            });
        }
        
        const buatDaftarBelanjaBtn = document.getElementById('buat-daftar-belanja-btn');
        if(buatDaftarBelanjaBtn){
            buatDaftarBelanjaBtn.addEventListener('click', handleBuatDaftarBelanja);
        }
    }
    
    // --- BAGIAN 6: JALANKAN APLIKASI ---
    initAuth();
});
