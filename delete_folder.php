<?php
require_once 'db_config.php';
header('Content-Type: application/json');

$id = isset($_POST['id']) ? $_POST['id'] : '';

if (empty($id)) {
    echo json_encode(['status' => 'error', 'message' => 'ID tidak ditemukan']);
    exit;
}

try {
    // 1. Hapus dulu semua file di dalam folder ini (opsional, tergantung struktur DB)
    // 2. Hapus folder itu sendiri
    $sql = "DELETE FROM folders WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal hapus: Mungkin folder tidak kosong']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>