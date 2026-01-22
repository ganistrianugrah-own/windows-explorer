<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$folder_id = $_POST['folder_id'];
$file = $_FILES['file'];

$target_dir = "uploads/";
$file_name = time() . "_" . basename($file["name"]);
$target_file = $target_dir . $file_name;

if (move_uploaded_file($file["tmp_name"], $target_file)) {
    $sql = "INSERT INTO files (name, folder_id, path, size) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sisi", $file['name'], $folder_id, $target_file, $file['size']);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal simpan ke DB']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal upload fisik']);
}

$file_extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
$allowed_extensions = ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx', 'zip', 'txt', 'mp4'];

if (!in_array($file_extension, $allowed_extensions)) {
    echo json_encode(['status' => 'error', 'message' => 'Tipe file tidak diizinkan!']);
    exit;
}

?>