<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

include 'db_config.php';

$source_id = $_POST['source_id'] ?? null;
$target_id = $_POST['target_parent_id'] ?? null;
$type      = $_POST['type'] ?? null;
$mode      = $_POST['mode'] ?? null;

if (!$source_id || !$target_id) {
    echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap']);
    exit;
}

$db_target = ($target_id === 'NULL' || $target_id === '') ? "NULL" : "'$target_id'";

if ($type === 'folder') {
    if ($mode === 'cut') {
        // Jika CUT: Pindahkan saja tanpa ubah nama
        $query = "UPDATE folders SET parent_id = $db_target WHERE id = '$source_id'";
    } else {
        // Jika COPY: Ambil nama asli lalu tambahkan ' - Copy'
        $query = "INSERT INTO folders (name, parent_id) 
                  SELECT CONCAT(name, ' - Copy'), $db_target 
                  FROM folders WHERE id = '$source_id'";
    }
} else {
    if ($mode === 'cut') {
        // Jika CUT: Pindahkan saja
        $query = "UPDATE files SET folder_id = $db_target WHERE id = '$source_id'";
    } else {
        // Jika COPY: Ambil nama asli lalu tambahkan ' - Copy'
        $query = "INSERT INTO files (name, path, folder_id) 
                  SELECT CONCAT(name, ' - Copy'), path, $db_target 
                  FROM files WHERE id = '$source_id'";
    }
}

if (mysqli_query($conn, $query)) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
}
?>