<?php
echo $_GET['name'];
// echo "LEN: ".strlen($_GET['data']);
// echo "PART1: ".substr($_GET['data'], 0, 22);
// echo "PART2: ".base64_decode($_GET['data']);
$png = base64_decode(str_replace(' ', '+', $_GET['data']));
// echo "B64:".((false !== $png) ? 'PNG':'BIN');
$result = file_put_contents('img/'.$_GET['name'], $png);
$isPng = (imagecreatefromstring($png) !== false);
echo ($result) ? 'OK' : 'Fail';
// echo ($isPng) ? 'PNG' : 'Image Invalid';
