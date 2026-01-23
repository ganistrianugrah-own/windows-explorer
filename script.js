const treeEl = document.getElementById('folder-tree');
const gridEl = document.getElementById('file-grid');
const breadcrumbEl = document.getElementById('breadcrumb');
const searchInput = document.getElementById('search-input');

let selectedId = null; 
let selectedType = null; 
let navigationPath = [{ id: 'NULL', name: 'Root' }];
let allFoldersGlobal = []; 
let clipboard = { id: null, type: null, isCut: false }; 
let isPasting = false;

// 1. LOAD SIDEBAR
async function loadSidebar() {
    try {
        const response = await fetch('get_folders.php?parent_id=ALL');
        allFoldersGlobal = await response.json();
        treeEl.innerHTML = ''; 
        buildTree(null, treeEl);
    } catch (e) { console.error("Gagal load sidebar:", e); }
}

function buildTree(parentId, container) {
    const children = allFoldersGlobal.filter(f => (parentId === null && (f.parent_id === null || f.parent_id === 'NULL')) || (f.parent_id == parentId));
    children.forEach(f => {
        const hasChildren = allFoldersGlobal.some(child => child.parent_id == f.id);
        const li = document.createElement('li');
        li.setAttribute('data-id', f.id);
        li.setAttribute('data-type', 'folder');
        
        const caret = document.createElement('span');
        caret.className = 'caret';
        caret.innerHTML = hasChildren ? '▶' : '&nbsp;';
        
        const folderInfo = document.createElement('span');
        folderInfo.innerHTML = `<span class="folder-icon">📁</span>${f.name}`;

        li.appendChild(caret);
        li.appendChild(folderInfo);
        container.appendChild(li);

        const toggleOrSelect = (e) => {
            e.stopPropagation();
            if (hasChildren) {
                const ulNested = li.nextElementSibling;
                if (ulNested && ulNested.classList.contains('nested')) {
                    ulNested.classList.toggle('active-tree');
                    caret.innerHTML = ulNested.classList.contains('active-tree') ? '▼' : '▶';
                }
            }
            selectFolder(li, f.id, f.name, true); 
        };

        caret.onclick = toggleOrSelect;
        folderInfo.onclick = toggleOrSelect;

        if (hasChildren) {
            const ulNested = document.createElement('ul');
            ulNested.className = 'nested';
            container.appendChild(ulNested);
            buildTree(f.id, ulNested);
        }
    });
}

// 2. NAVIGASI
function selectFolder(el, id, name, isSidebar = false) {
    document.querySelectorAll('#folder-tree li').forEach(item => item.classList.remove('active'));
    if(el) el.classList.add('active');
    
    if (id === 'NULL' || id === null) {
        navigationPath = [{ id: 'NULL', name: 'Root' }];
    } else {
        if (isSidebar) {
            navigationPath = [{ id: 'NULL', name: 'Root' }, { id, name }];
        } else {
            const existingIndex = navigationPath.findIndex(p => String(p.id) === String(id));
            if (existingIndex !== -1) navigationPath = navigationPath.slice(0, existingIndex + 1);
            else navigationPath.push({ id, name });
        }
    }
    renderBreadcrumb();
    loadContent(id, name);
    selectedId = null; selectedType = null;
}

function renderBreadcrumb() {
    breadcrumbEl.innerHTML = '';
    navigationPath.forEach((path, index) => {
        const span = document.createElement('span');
        span.className = 'breadcrumb-item';
        span.innerText = path.name;
        span.style.cursor = 'pointer';
        span.onclick = (e) => {
            e.stopPropagation();
            selectFolder(null, path.id, path.name, false);
        };
        breadcrumbEl.appendChild(span);
        if (index < navigationPath.length - 1) {
            const sep = document.createElement('span');
            sep.innerText = ' > ';
            sep.className = 'breadcrumb-separator';
            breadcrumbEl.appendChild(sep);
        }
    });
}

// 3. LOAD CONTENT & DRAG DROP
async function loadContent(id, name) {
    if (id === 'NULL') {
        gridEl.innerHTML = '<div style="padding:20px; color:gray;">Pilih folder...</div>';
        return;
    }
    gridEl.innerHTML = 'Memuat...';
    try {
        const response = await fetch(`get_content.php?folder_id=${id}`);
        const data = await response.json();
        gridEl.innerHTML = '';

        // 1. Render Folder
        data.folders.forEach(item => {
            const card = createItemCard(item.id, 'folder', '📁', item.name);
            // Double click masuk ke folder
            card.ondblclick = () => selectFolder(null, item.id, item.name, false);
            gridEl.appendChild(card);
        });

        // 2. Render File
        data.files.forEach(file => {
            const card = createItemCard(file.id, 'file', '📄', file.name);
            // Double click buka file di tab baru
            card.ondblclick = () => {
                if (file.path) {
                    window.open(file.path, '_blank');
                } else {
                    alert("File tidak memiliki lokasi (path) yang valid.");
                }
            };
            gridEl.appendChild(card);
        });

        // Jika folder kosong
        if (data.folders.length === 0 && data.files.length === 0) {
            gridEl.innerHTML = '<div style="padding:20px; color:gray;">Folder ini kosong</div>';
        }

    } catch (e) { 
        console.error("Error load content:", e);
        gridEl.innerHTML = 'Gagal memuat konten.'; 
    }
}

function createItemCard(id, type, icon, name) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.setAttribute('data-id', id);
    card.setAttribute('data-type', type);
    card.setAttribute('draggable', 'true');
    card.innerHTML = `<div class="icon-large">${icon}</div><div class="name">${name}</div>`;
    
    card.onclick = (e) => { e.stopPropagation(); highlightItem(card, id, type); };
    if (type === 'folder') card.ondblclick = () => selectFolder(null, id, name, false);
    else card.ondblclick = () => { /* open file logic */ };

    // DRAG LOGIC
    card.ondragstart = (e) => {
        highlightItem(card, id, type);
        e.dataTransfer.setData("text/plain", id);
    };

    if (type === 'folder') {
        card.ondragover = (e) => e.preventDefault();
        card.ondrop = async (e) => {
            e.preventDefault();
            const sourceId = e.dataTransfer.getData("text/plain");
            if (String(sourceId) !== String(id)) {
                await executeAction('paste_item.php', { 
                    source_id: sourceId, 
                    target_parent_id: id, 
                    type: selectedType, 
                    mode: 'cut' 
                });
            }
        };
    }
    return card;
}

function highlightItem(el, id, type) {
    document.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedId = id;
    selectedType = type;
}

// 4. SEARCH & NEW FOLDER (TOMBOL ATAS)
async function searchFolder() {
    const keyword = searchInput.value.toLowerCase();
    if (keyword.trim() === '') {
        const cur = navigationPath[navigationPath.length - 1];
        loadContent(cur.id, cur.name);
        return;
    }
    try {
        const response = await fetch(`search_all.php?keyword=${keyword}`);
        const data = await response.json();
        gridEl.innerHTML = '';
        data.folders.forEach(f => gridEl.appendChild(createItemCard(f.id, 'folder', '📁', f.name)));
        data.files.forEach(f => gridEl.appendChild(createItemCard(f.id, 'file', '📄', f.name)));
    } catch (e) { console.error(e); }
}

async function createNewFolder() {
    await handleMenuAction('new');
}

//UPOLOAD
async function uploadFile(input) {
    const files = input.files;
    if (files.length === 0) return;

    // Ambil folder aktif saat ini dari navigasi terakhir
    const currentFolder = navigationPath[navigationPath.length - 1];
    
    // Validasi: Jangan ijinkan upload jika di Root (NULL) karena file butuh folder_id
    if (!currentFolder || currentFolder.id === 'NULL') {
        alert("Silakan pilih folder terlebih dahulu sebelum upload!");
        input.value = '';
        return;
    }

    const fd = new FormData();
    fd.append('file', files[0]);
    fd.append('folder_id', currentFolder.id);

    // Beri indikasi memuat
    gridEl.innerHTML = 'Sedang mengunggah...';

    try {
        const res = await fetch('upload_file.php', { 
            method: 'POST', 
            body: fd 
        });
        
        const result = await res.json();
        
        if (result.status === 'success') {
            alert("Upload Berhasil!");
            // Refresh konten folder saat ini
            loadContent(currentFolder.id, currentFolder.name);
        } else {
            alert("Gagal Upload: " + result.message);
            loadContent(currentFolder.id, currentFolder.name);
        }
    } catch (e) {
        console.error("Upload error:", e);
        alert("Terjadi kesalahan koneksi saat upload.");
        loadContent(currentFolder.id, currentFolder.name);
    }
    
    input.value = ''; // Reset input file
}

// 5. ACTIONS
async function handleMenuAction(action) {
    const currentFolder = navigationPath[navigationPath.length - 1];
    const menu = document.getElementById('context-menu');
    if (menu) menu.style.display = 'none';

    // 1. ACTION NEW FOLDER
    if (action === 'new') {
        const name = prompt("Nama folder baru:");
        if (name && name.trim() !== "") {
            // PERBAIKAN: Pastikan pId benar-benar valid. 
            // Jika yang dipilih bukan folder, atau tidak ada yang dipilih, pakai folder aktif saat ini.
            let pId = (selectedType === 'folder' && selectedId) ? selectedId : currentFolder.id;
            
            await executeAction('add_folder.php', { 
                name: name.trim(), 
                parent_id: pId 
            });
        }
    } 
    // 2. ACTION COPY / CUT
    else if (action === 'copy' || action === 'cut') {
        if (!selectedId) return alert("Pilih item!");
        clipboard = { id: selectedId, type: selectedType, isCut: (action === 'cut') };
        
        document.querySelectorAll('.item-card').forEach(c => c.style.opacity = "1");
        if (action === 'cut') {
            const active = document.querySelector(`.item-card.selected`);
            if (active) active.style.opacity = "0.5";
        }
    } 
    // 3. ACTION PASTE
    else if (action === 'paste') {
        if (isPasting || !clipboard.id) {
            alert("Clipboard kosong! Copy atau Cut file terlebih dahulu.");
            return;
        }
        
        isPasting = true;
        
        // LOGIKA PENENTUAN TARGET:
        // 1. Jika user klik kanan di sebuah FOLDER, masukkan ke dalam folder itu.
        // 2. Jika user klik di area kosong, masukkan ke folder yang sedang dibuka (navigationPath).
        let targetId;
        if (selectedType === 'folder' && selectedId) {
            targetId = selectedId;
        } else {
            targetId = currentFolder.id;
        }

        // Jangan izinkan paste ke diri sendiri (misal folder A di-cut lalu di-paste ke folder A)
        if (clipboard.type === 'folder' && String(clipboard.id) === String(targetId)) {
            alert("Tidak bisa memindahkan folder ke dalam dirinya sendiri!");
            isPasting = false;
            return;
        }

        console.log("Memindahkan ID:", clipboard.id, "Ke Folder:", targetId); // Untuk cek di Console F12

        await executeAction('paste_item.php', { 
            source_id: clipboard.id, 
            target_parent_id: targetId, 
            type: clipboard.type, 
            mode: clipboard.isCut ? 'cut' : 'copy' 
        });

        // Jika mode CUT, kosongkan clipboard setelah sukses
        if (clipboard.isCut) {
            clipboard = { id: null, type: null, isCut: false };
        }
        
        isPasting = false;
    }
    // 4. ACTION RENAME
    else if (action === 'rename') {
        if (!selectedId) return alert("Pilih item yang ingin diubah namanya!");
        const n = prompt("Nama baru:", "");
        if (n && n.trim() !== "") {
            const url = (selectedType === 'folder') ? 'rename_folder.php' : 'rename_file.php';
            await executeAction(url, { id: selectedId, name: n.trim() });
        }
    }
    // 5. ACTION DELETE
    else if (action === 'delete') {
        if (!selectedId) return alert("Pilih item yang ingin dihapus!");
        if (confirm(`Hapus ${selectedType} ini?`)) {
            const url = (selectedType === 'folder') ? 'delete_folder.php' : 'delete_file.php';
            await executeAction(url, { id: selectedId });
        }
    }
}
async function executeAction(url, data) {
    const fd = new FormData();
    for (let key in data) fd.append(key, data[key]);
    try {
        const res = await fetch(url, { method: 'POST', body: fd });
        const result = await res.json();
        if (result.status === 'success') {
            await loadSidebar();
            const cur = navigationPath[navigationPath.length - 1];
            loadContent(cur.id, cur.name);
        } else { alert(result.message); }
    } catch (e) { alert("Error server."); }
}

// 6. LISTENERS
document.addEventListener('keydown', async (e) => {
    // 1. Abaikan jika sedang mengetik di input/search/prompt
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // 2. Shortcut PASTE (Ctrl + V) - Tetap jalan meski tidak ada yang dipilih (targetnya folder aktif)
    if (e.ctrlKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        console.log("Shortcut Paste ditekan");
        await handleMenuAction('paste');
    }

    // 3. Shortcut COPY (Ctrl + C) & CUT (Ctrl + X)
    else if (e.ctrlKey && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x')) {
        if (!selectedId) return; // Harus ada yang dipilih
        e.preventDefault();
        const mode = e.key.toLowerCase() === 'c' ? 'copy' : 'cut';
        console.log("Shortcut " + mode + " ditekan");
        await handleMenuAction(mode);
    }

    // 4. Shortcut DELETE (Delete key)
    else if (e.key === 'Delete') {
        if (!selectedId) return;
        e.preventDefault();
        await handleMenuAction('delete');
    }
});

// Perbaikan Klik Kanan (Context Menu)
document.addEventListener('contextmenu', (e) => {
    const menu = document.getElementById('context-menu');
    const target = e.target.closest('.item-card') || e.target.closest('#folder-tree li');
    const isGrid = e.target.closest('#file-grid');

    if (target || isGrid) {
        e.preventDefault();
        if (target) {
            highlightItem(target, target.dataset.id, target.dataset.type);
        }

        menu.style.display = 'block';
        let posX = e.pageX;
        let posY = e.pageY;

        if (posX + menu.offsetWidth > window.innerWidth) posX = window.innerWidth - menu.offsetWidth - 10;
        if (posY + menu.offsetHeight > window.innerHeight) posY = posY - menu.offsetHeight;

        menu.style.left = posX + 'px';
        menu.style.top = posY + 'px';
    } else {
        menu.style.display = 'none';
    }
});

// Perbaikan Klik Kiri (Agar tidak gampang reset selectedId saat mau klik menu)
document.addEventListener('click', (e) => {
    const menu = document.getElementById('context-menu');
    
    // Kalau klik di dalam menu, jangan reset seleksi dulu
    if (menu && menu.contains(e.target)) {
        menu.style.display = 'none';
        return;
    }

    menu.style.display = 'none';

    // Reset seleksi HANYA jika klik benar-benar di luar item
    if (!e.target.closest('.item-card') && !e.target.closest('#folder-tree li')) {
        // Jangan reset jika klik tombol navigasi/search
        if (!e.target.closest('button') && !e.target.closest('input')) {
            selectedId = null;
            selectedType = null;
            document.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected'));
        }
    }
});


document.addEventListener('click', () => { document.getElementById('context-menu').style.display = 'none'; });
window.onload = () => { loadSidebar(); selectFolder(null, 'NULL', 'Root'); };