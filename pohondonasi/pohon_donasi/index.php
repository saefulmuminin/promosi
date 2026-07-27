<?php

// =============================
// SIMPAN STATUS
// =============================
if(isset($_POST['pendidikan'])){
    file_put_contents("status.txt","pendidikan");
    header("Location: index.php?loading=1");
    exit;
}

if(isset($_POST['ekonomi'])){
    file_put_contents("status.txt","ekonomi");
    header("Location: index.php?loading=1");
    exit;
}

if(isset($_POST['sosial'])){
    file_put_contents("status.txt","sosial");
    header("Location: index.php?loading=1");
    exit;
}

if(isset($_POST['dakwah'])){
    file_put_contents("status.txt","dakwah");
    header("Location: index.php?loading=1");
    exit;
}

if(isset($_POST['kesehatan'])){
    file_put_contents("status.txt","kesehatan");
    header("Location: index.php?loading=1");
    exit;
}

if(isset($_POST['harapan'])){
    file_put_contents("status.txt","harapan");
    header("Location: index.php?loading=1");
    exit;
}

// =============================

if(file_exists("status.txt")){
    $status = trim(file_get_contents("status.txt"));
}else{
    $status = "-";
}

?>

<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<title>Pohon Donasi IoT</title>

<style>

body{
    font-family:Arial;
    background:#0B4E1B;
    text-align:center;
    color:white;
    margin:0;
    padding:40px;
}

h1{
    margin-bottom:30px;
}

button{
    width:300px;
    padding:20px;
    margin:10px;
    font-size:20px;
    cursor:pointer;
    border:none;
    border-radius:10px;
    transition:.3s;
}

button:hover{
    transform:scale(1.05);
}

h2{
    margin-top:40px;
}

/* ========================= */
/* LOADING */
/* ========================= */

#loading{

    display:none;

    position:fixed;

    top:0;
    left:0;

    width:100%;
    height:100%;

    background:rgba(0,0,0,.9);

    justify-content:center;
    align-items:center;
    flex-direction:column;

    z-index:9999;

}

.loader{

    width:90px;
    height:90px;

    border:10px solid #444;

    border-top:10px solid #00ff66;

    border-radius:50%;

    animation:putar 1s linear infinite;

    margin-bottom:30px;

}

@keyframes putar{

    from{
        transform:rotate(0deg);
    }

    to{
        transform:rotate(360deg);
    }

}

#loading h2{

    font-size:35px;

    margin:10px;

}

#loading p{

    font-size:22px;

    color:#ccc;

}

#countdown{

    font-size:80px;

    color:#00ff66;

    margin-top:20px;

    font-weight:bold;

}

</style>

</head>

<body>

<h1>🌳 POHON DONASI IoT</h1>

<form method="POST">

<button name="pendidikan">🟢 Pendidikan</button><br>

<button name="ekonomi">🟠 Ekonomi</button><br>

<button name="sosial">🟡 Sosial</button><br>

<button name="dakwah">🔵 Dakwah</button><br>

<button name="kesehatan">🟣 Kesehatan</button><br>

<button name="harapan">🔴 Harapan / Doa</button>

</form>

<h2>

Status :
<b style="color:yellow;">
<?php echo strtoupper($status); ?>
</b>

</h2>

<!-- ============================= -->
<!-- LOADING -->
<!-- ============================= -->

<div id="loading">

<div class="loader"></div>

<h2>🌳 IoT Sedang Menjalankan Animasi</h2>

<p>Mohon tunggu...</p>

<div id="countdown">10</div>

</div>

<?php if(isset($_GET['loading'])){ ?>

<script>

const loading = document.getElementById("loading");

loading.style.display="flex";

let waktu = 10;

const angka = document.getElementById("countdown");

angka.innerHTML = waktu;

const hitung = setInterval(function(){

    waktu--;

    angka.innerHTML = waktu;

    if(waktu<=0){

        clearInterval(hitung);

        loading.style.display="none";

        window.location="index.php";

    }

},1000);

</script>

<?php } ?>

</body>

</html>