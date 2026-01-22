<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>My Web Explorer</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <aside id="sidebar">
        <div class="sidebar-header">Quick Access</div>
        <ul id="folder-tree"></ul>
    </aside>

    <main id="main-content">
        <div class="address-bar">
            <div class="address-left">
                <button onclick="selectFolder(null, 'NULL', 'Root')" title="Home">🏠</button>
                <button onclick="createNewFolder()" title="New Folder">➕ Folder</button>
                <button onclick="document.getElementById('file-upload').click()">📤 Upload File</button>
    <input type="file" id="file-upload" style="display:none" onchange="uploadFile(this)">
                <div id="breadcrumb">Root</div>
            </div>

            <div id="context-menu" class="context-menu">
                <div class="menu-item" onclick="handleMenuAction('new')">➕ New Folder</div>
                 <hr>
                <div class="menu-item" onclick="handleMenuAction('copy')">📄 Copy</div>
                <div class="menu-item" onclick="handleMenuAction('paste')">📋 Paste</div>
                <hr>
                <div class="menu-item" onclick="handleMenuAction('rename')">✏️ Rename</div>
                <div class="menu-item red" onclick="handleMenuAction('delete')">🗑️ Delete</div>
                </div>

            <div class="address-right">
                <input type="text" id="search-input" placeholder="Cari folder..." onkeyup="searchFolder()">
            </div>
        </div>

        <div id="file-grid"></div>
    </main>

    <script src="script.js"></script>
</body>
</html>