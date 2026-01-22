<?php
$host = 'localhost';
$user = 'root';     // Default XAMPP adalah root
$pass = '';         // Default XAMPP adalah kosong
$db   = 'web_explorer';

// Membuat koneksi
$conn = new mysqli($host, $user, $pass, $db);

// Cek koneksi
if ($conn->connect_error) {
    die("Koneksi Gagal: " . $conn->connect_error);
}
?>