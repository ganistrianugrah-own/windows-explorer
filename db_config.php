<?php
$host = 'localhost';
$user = 'root';     
$pass = '';         
$db   = 'web_explorer';


$conn = new mysqli($host, $user, $pass, $db);


if ($conn->connect_error) {
    die("Koneksi Gagal: " . $conn->connect_error);
}
?>