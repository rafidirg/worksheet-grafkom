### Link Video:
https://drive.google.com/file/d/183QHOmq8fn_Nb2pNFi6EoClEKGD3GOHq/view?usp=sharing

### Cara Menggunakan Program:
- Setup:
    - Disarankan membuka project menggunakan vs code
    - Menginstall extension live server
    - Menjalankan live server dengan menekan tombol 'Go Live' di pojok kanan bawah
    - Program akan berjalan di port 5500
- Setelah Program Berjalan:
    - Animasi:
        - Terdapat tombol untuk toggle animasi
        - Saat animasi berhenti, user dapat berinteraksi dengan objek dengan mengotak-atik slider yang ada
    - Menampilkan Objek:
        - Terdapat 2 mode untuk menampilkan objek, shading dan wireframe
        - Mode shading untuk menampilkan objek lengkap dengan shadernya
        - Mode wireframe hanya menampilkan kerangka dari objek
    - Titik Pandang Kamera:
        - Terdapat 2 mode titik pandang kamera, titik pandang utama dan titik pandang dari salah satu objek
        - Titik pandang utama merupakan kamera yang dapat melihat keseluruhan object dan scene
        - Titik pandang dari salah satu objek merupakan kamera dari sudut pandang salah satu object berhirarki. Kamera akan mengikuti pergerakan objectnya

### Proses Pembentukan Object:
- Membuat kerangka sesuai dengan bentuk bentuk objek (Cube, Cylinder, Sphere)
- Penggabungan objek-objek kedalam bentuk tree dengan meng-translate dan scaling

### Proses Render Object:
- Object dirender dengan cara traverse node-node yang ada pada tree

### Fasilitas WebGL yang digunakan:
- Pembentukan kerangka object yang sama dapat dibuat sebuah fungsi sehingga ketika ada objek yang mirip objek hanya perlu di translate dan scale

### Algoritma Khusus yang digunakan:
- Penggunaan struktur data tree untuk model hierearki.
- Pembentukan objek dari kerangka objek
- Pembentukan bayangan pada fragment shader.

### Pembagian Kerja:
- Rafi Indrawan Dirgantara (1906350824):
    - Membuat model spider dan claw machine
    - Membuat camera view (umum dan dari salah satu objek berhirarki)
    - Membuat mode wireframe
    - Menerapkan texture pada objek-objek 
    - Membuat readme
- Lazuardi Pratama Putra Nusantara (1906398225):
    - Membuat model bird, table, dan piston
    - Menerapkan texture pada objek-objek
    - Membuat readme

### Referensi:
- https://scele.cs.ui.ac.id/mod/resource/view.php?id=103463
- https://scele.cs.ui.ac.id/mod/resource/view.php?id=103439