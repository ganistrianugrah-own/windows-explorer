<?php
require_once 'db_config.php';
$folder_id = $_GET['folder_id'];

$folders = $conn->query("SELECT * FROM folders WHERE parent_id = $folder_id")->fetch_all(MYSQLI_ASSOC);
$files = $conn->query("SELECT * FROM files WHERE folder_id = $folder_id")->fetch_all(MYSQLI_ASSOC);

echo json_encode([
    'folders' => $folders,
    'files' => $files
]);
?>