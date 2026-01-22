const treeEl = document.getElementById('folder-tree');
const gridEl = document.getElementById('file-grid');
const breadcrumbEl = document.getElementById('breadcrumb');
const searchInput = document.getElementById('search-input');

let selectedId = null; 
let selectedType = null; 
let navigationPath = [{ id: 'NULL', name: 'Root' }];
let allFoldersGlobal = []; 
let clipboard = { id: null, type: null };

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
    const children = allFoldersGlobal.filter(f => (parentId === null && f.parent_id === null) || (f.parent_id == parentId));
    children.forEach(f => {
        const hasChildren = allFoldersGlobal.some(child => child.parent_id == f.id);
        const li = document.createElement('li');
        li.setAttribute('data-id', f.id);
        li.setAttribute('data-type', 'folder');
        
        const caret = document.createElement('span');
        caret.className = 'caret';
        caret.innerHTML = hasChildren ? '▶' : '&nbsp;';
        
        const folderInfo = document.createElement('span');
        folderInfo.className = (f.parent_id === null) ? 'root-folder' : 'sub-folder';
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
        const currentFolder = navigationPath[navigationPath.length - 1];
        const targetFolder = allFoldersGlobal.find(f => f.id == id);
        const isChildOfCurrent = (targetFolder && targetFolder.parent_id == currentFolder.id);
        const existingIndex = navigationPath.findIndex(p => p.id == id);

        if (existingIndex !== -1) {
            navigationPath = navigationPath.slice(0, existingIndex + 1);
        } else if (isChildOfCurrent) {
            navigationPath.push({ id, name });
        } else {
            navigationPath = [{ id: 'NULL', name: 'Root' }, { id, name }];
        }
    }
    renderBreadcrumb();
    loadContent(id, name);
}

function renderBreadcrumb() {
    breadcrumbEl.innerHTML = '';
    navigationPath.forEach((path, index) => {
        const span = document.createElement('span');
        span.className = 'breadcrumb-item';
        span.innerText = path.name;
        span.onclick = () => selectFolder(null, path.id, path.name, false); 
        breadcrumbEl.appendChild(span);
        if (index < navigationPath.length - 1) {
            const sep = document.createElement('span');
            sep.className = 'breadcrumb-separator';
            sep.innerText = ' > ';
            breadcrumbEl.appendChild(sep);
        }
    });
}

// 3. LOAD CONTENT
async function loadContent(id, name) {
    if (id === 'NULL' || id === null) {
        gridEl.innerHTML = '<div style="color:gray; padding:20px; text-align:center; width:100%;">Silahkan pilih folder di sidebar...</div>';
        return;
    }

    gridEl.innerHTML = 'Memuat...';
    try {
        const response = await fetch(`get_content.php?folder_id=${id}`);
        const data = await response.json();
        gridEl.innerHTML = '';

        data.folders.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card folder';
            card.setAttribute('data-id', item.id);
            card.setAttribute('data-type', 'folder');
            card.innerHTML = `<div class="icon-large">📁</div><div class="name">${item.name}</div>`;
            card.onclick = (e) => { e.stopPropagation(); highlightItem(card, item.id, 'folder'); };
            card.ondblclick = () => selectFolder(null, item.id, item.name, false);
            gridEl.appendChild(card);
        });

        data.files.forEach(file => {
            const card = document.createElement('div');
            card.className = 'item-card file';
            card.setAttribute('data-id', file.id);
            card.setAttribute('data-type', 'file');
            card.innerHTML = `<div class="icon-large">📄</div><div class="name">${file.name}</div>`;
            card.onclick = (e) => { e.stopPropagation(); highlightItem(card, file.id, 'file'); };
            card.ondblclick = () => window.open(file.path, '_blank');
            gridEl.appendChild(card);
        });

        if (data.folders.length === 0 && data.files.length === 0) {
            gridEl.innerHTML = '<div style="color:gray; padding:20px;">Folder kosong</div>';
        }
    } catch (e) { console.error(e); gridEl.innerHTML = 'Error data.'; }
}

function highlightItem(el, id, type) {
    document.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedId = id;
    selectedType = type;
}

// 4. CONTEXT MENU & ACTIONS
document.addEventListener('contextmenu', function(e) {
    const target = e.target.closest('.item-card') || e.target.closest('#folder-tree li');
    const menu = document.getElementById('context-menu');
    if (target) {
        e.preventDefault();
        selectedId = target.getAttribute('data-id');
        selectedType = target.getAttribute('data-type');
        menu.style.display = 'block';
    } else if (e.target.closest('#file-grid')) {
        e.preventDefault();
        selectedId = null; selectedType = null;
        menu.style.display = 'block';
    } else { menu.style.display = 'none'; }
    menu.style.left = e.pageX + 'px'; menu.style.top = e.pageY + 'px';
});

async function handleMenuAction(action) {
    const currentFolder = navigationPath[navigationPath.length - 1];

    if (action === 'copy') {
        if (!selectedId) return;
        clipboard = { id: selectedId, type: selectedType };
        alert(selectedType + " disalin.");
    } 
    else if (action === 'new') {
        const name = prompt("Nama folder baru:");
        if (name) {
            let pId = 'NULL';
            // Jika klik kanan pada folder, ambil parent dari folder itu (agar sejajar)
            if (selectedId && selectedType === 'folder') {
                const targetFolder = allFoldersGlobal.find(f => f.id == selectedId);
                pId = (targetFolder && targetFolder.parent_id) ? targetFolder.parent_id : 'NULL';
            } else {
                // Jika klik kanan di area kosong, folder baru jadi anak dari folder aktif
                pId = currentFolder.id;
            }
            await executeAction('add_folder.php', { name: name, parent_id: pId });
        }
    }
    else if (action === 'paste') {
        if (!clipboard.id) return alert("Clipboard kosong!");
        await executeAction('paste_item.php', { source_id: clipboard.id, target_parent_id: currentFolder.id, type: clipboard.type });
    }
    else if (action === 'rename') {
        if (!selectedId) return;
        const name = prompt("Masukkan nama baru:");
        if (name) {
            const url = (selectedType === 'folder') ? 'rename_folder.php' : 'rename_file.php';
            await executeAction(url, { id: selectedId, name: name });
        }
    } 
    else if (action === 'delete') {
        if (!selectedId) return;
        if (confirm("Hapus " + selectedType + " ini?")) {
            const url = (selectedType === 'folder') ? 'delete_folder.php' : 'delete_file.php';
            await executeAction(url, { id: selectedId });
        }
    }
}

// LOGIKA TOMBOL ➕ SEJAJAR
async function createNewFolder() {
    const currentFolder = navigationPath[navigationPath.length - 1];
    
    // Cari parent dari folder aktif agar folder baru muncul sejajar
    const activeFolderData = allFoldersGlobal.find(f => f.id == currentFolder.id);
    const parentId = (activeFolderData && activeFolderData.parent_id) ? activeFolderData.parent_id : 'NULL';

    const name = prompt("Buat folder baru sejajar dengan " + currentFolder.name);
    if (name) {
        await executeAction('add_folder.php', { name: name, parent_id: parentId });
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
        } else { alert(result.message || "Gagal"); }
    } catch (e) { alert("Error sistem."); }
}

// 5. SEARCH & UPLOAD
function searchFolder() {
    const keyword = searchInput.value.toLowerCase();
    if (keyword.trim() === '') {
        const cur = navigationPath[navigationPath.length - 1];
        loadContent(cur.id, cur.name);
        return;
    }
    const filtered = allFoldersGlobal.filter(f => f.name.toLowerCase().includes(keyword));
    gridEl.innerHTML = '';
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card folder';
        card.innerHTML = `<div class="icon-large">📁</div><div class="name">${item.name}</div><small style="color:blue">Search Result</small>`;
        card.onclick = () => { highlightItem(card, item.id, 'folder'); };
        card.ondblclick = () => { searchInput.value = ''; selectFolder(null, item.id, item.name, true); };
        gridEl.appendChild(card);
    });
}
searchInput.addEventListener('input', searchFolder);

async function uploadFile(input) {
    const file = input.files[0];
    const currentFolder = navigationPath[navigationPath.length - 1];
    if (currentFolder.id === 'NULL') return alert("Pilih folder dulu!");
    const fd = new FormData();
    fd.append('file', file); fd.append('folder_id', currentFolder.id);
    try {
        const res = await fetch('upload_file.php', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.status === 'success') loadContent(currentFolder.id, currentFolder.name);
    } catch (e) { console.error(e); }
    input.value = '';
}

document.addEventListener('click', () => { document.getElementById('context-menu').style.display = 'none'; });

window.onload = () => { loadSidebar(); selectFolder(null, 'NULL', 'Root'); };