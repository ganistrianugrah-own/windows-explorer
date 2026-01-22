<?php
require_once 'db_config.php';

// Ambil parameter, jika tidak ada set ke 'NULL'
$p_id = isset($_GET['parent_id']) ? $_GET['parent_id'] : 'NULL';

if ($p_id === 'ALL') {
    // Ambil SEMUA folder untuk sidebar
    $sql = "SELECT * FROM folders ORDER BY name ASC";
} elseif ($p_id === 'NULL' || $p_id === '') {
    // Ambil folder UTAMA (Root)
    $sql = "SELECT * FROM folders WHERE parent_id IS NULL";
} else {
    // Ambil SUB-FOLDER berdasarkan ID
    $sql = "SELECT * FROM folders WHERE parent_id = " . (int)$p_id;
}

$result = $conn->query($sql);

if (!$result) {
    // Jika SQL Error, kirim pesan error ke JS
    http_response_code(500);
    echo json_encode(["error" => $conn->error]);
    exit;
}

$data = $result->fetch_all(MYSQLI_ASSOC);

header('Content-Type: application/json');
echo json_encode($data);