<!DOCTYPE html>
<html>
	<head>
		<title>Find the Flute - A Ten Out of Ten Web Game</title>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
		<link rel="stylesheet" href="css/style.css" type="text/css" />
		<script src="js/game.min.js"></script>
	</head>
	<body>

	<div class="messageApron"></div>
	<div class="game clearfix">
		<div class="game-side">
			<div class="game-title"><a target="_blank" href="http://tenoutoften.org.uk/"><img src="assets/text/toot_present.png" /></a></div>
			<div id="score"></div>
			<img id="man" src="assets/man_1.png" /></div>
		<div id="grid">
			<?php for( $i = 0; $i < 6; $i++ ) : ?>
			<div class="square"></div>
			<?php endfor; ?>
		</div>
	</div>
	<img id="press-space" src="assets/text/hit_space.png" />
	</body>
</html>
