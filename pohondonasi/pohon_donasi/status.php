<?php
header("Content-Type:text/plain");

echo trim(file_get_contents("status.txt"));
?>