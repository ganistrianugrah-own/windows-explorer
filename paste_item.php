<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$source_id = $_POST['source_id'];
$target_parent_id = $_POST['target_parent_id'];
$type = $_POST['type'];

if ($type === 'folder') {
    // Copy Folder Logic
    $res = $conn->query("SELECT name FROM folders WHERE id = $source_id")->fetch_assoc();
    $newName = $res['name'] . " - Copy";
    $parent = ($target_parent_id === 'NULL') ? "NULL" : $target_parent_id;

    $stmt = $conn->prepare("INSERT INTO folders (name, parent_id) VALUES (?, $parent)");
    $stmt->bind_param("s", $newName);
    if($stmt->execute()) echo json_encode(['status' => 'success']);

} else if ($type === 'file') {
    // Copy File Logic (DB + Fisik)
    $res = $conn->query("SELECT * FROM files WHERE id = $source_id")->fetch_assoc();
    $oldPath = $res['path'];
    $newName = "Copy_of_" . $res['name'];
    $newPath = "uploads/" . time() . "_" . $newName;

    // Duplikasi File Fisik
    if (copy($oldPath, $newPath)) {
        $stmt = $conn->prepare("INSERT INTO files (name, folder_id, path, size) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sisi", $newName, $target_parent_id, $newPath, $res['size']);
        if($stmt->execute()) echo json_encode(['status' => 'success']);
    }
}
?>