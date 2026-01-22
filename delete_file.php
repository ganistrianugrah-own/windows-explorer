<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$id = $_POST['id'];

// 1. Ambil path file dulu untuk hapus fisik
$res = $conn->query("SELECT path FROM files WHERE id = $id")->fetch_assoc();
if ($res) {
    if (file_exists($res['path'])) {
        unlink($res['path']); // Hapus file dari folder uploads
    }
    // 2. Hapus dari database
    $conn->query("DELETE FROM files WHERE id = $id");
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'File tidak ditemukan']);
}
?>