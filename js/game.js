/**
 * 'Spot the Flute' - a web game for Ten Out of Ten
 * made by Duncan Brown with graphics by Clare Dunn
 *
 * http://duncanjbrown.com
 *
 * "Yet left I not here, but committed a little more scutcherie"
 */

/* Usefuls */
Array.prototype.shuffle = function() { var i = this.length, j, tempi, tempj; if ( i == 0 ) return false; while ( --i ) { j       = Math.floor( Math.random() * ( i + 1 ) ); tempi   = this[i]; tempj   = this[j]; this[i] = tempj; this[j] = tempi; } return this; }
function pickRandomProperty(obj) { var result; var count = 0; for (var prop in obj) if (Math.random() < 1/++count) result = prop; return result; }

/* Config */
window.assetPath = 'assets/';
window.levels = { 
	1: { speed: 800, objects: 1, rounds: 10, hardItems: false },
	2: { speed: 760, objects: 1, rounds: 15, hardItems: false },
	3: { speed: 730, objects: 1, rounds: 20, hardItems: false },
	4: { speed: 700, objects: 1, rounds: 20, hardItems: false },
	5: { speed: 680, objects: 2, rounds: 20, hardItems: false },
	6: { speed: 660, objects: 2, rounds: 20, hardItems: true },
	7: { speed: 640, objects: 3, rounds: 20, hardItems: true  },
	8: { speed: 620, objects: 4, rounds: 20, hardItems: true  },
	9: { speed: 600, objects: 5, rounds: 20, hardItems: true  },
	10: { speed: 500, objects: 6, rounds: 20, hardItems: true  }
};

window.items = {
	1: { name: 'biscuits' }, //done
	2: { name: 'teacup' }, //done
	3: { name: 'chair' }, //done
	4: { name: 'spanner' }, //spanner
	5: { name: 'guitar' }, //done
	7: { name: 'trumpet' }, //done
	8: { name: 'keyboard' }, //done
	9: { name: 'cinema' }, //done
	10: { name: 'beans' }, //done
	11: { name: 'brownie' }, //done
	13: { name: 'flowers' }, //done
	14: { name: 'popcorn' }, //done
};
window.hardItems = {
	15: { name: 'clarinet' }, //done
	6: { name: 'oboe' }, //done
	12: { name: 'gokart' }, //done
	12: { name: 'gokart' }, //done
}
window.ticketLink = '/tickets';

/**
 * Feed a game a number of stages - it will make that many and put them in its stages array
 * Then it will flip out each one in turn, calling its start() method. This causes the stage to
 * display its rounds in order.
 *
 */
jQuery( document ).ready( function( $ ) {

	var Game = function( numStages ) { 

		this.interface = new Interface();

		this.numStages = numStages;
		this.stages = [];
		this.currentStage = 0;
		this.stageCount = 0;
		var self = this;

		/* On interrupt, stop playing and figure out if it's a win or a lose */
		$( this ).on( 'interrupt', function() {
			if( self.currentStage ) {
				var winning = self.currentStage.isWinner();
				self.stop( winning );
				if( winning )
					self.win_stage();
				else
					self.lose_stage();
			} 
		});

		/* On time out, lose the game */
		$( this ).on( 'time-out', function() {
			self.stop( false );
		});

		$( document ).keydown( function (e) {
			e.preventDefault();
			if ( e.which === 32 ) {
				$( self ).trigger( 'interrupt' );
			}
			return false;
		});

	}

	/* Manage stopped state */
	Game.prototype.stop = function( winning ) {
		this.interface.stop_playing( winning );
		this.currentStage.stop();
		this.currentStage = undefined;
	};

	/* Finish a stage */
	Game.prototype.finishStage = function ( ) {
		this.stageCount++;
	};

	Game.prototype.win_stage = function() { 
		this.getReady();
	};

	Game.prototype.missed = function() { 
		this.stop( false );
		this.interface.lose();
	};

	Game.prototype.lose_stage = function() { 
		if( this.stageCount < 5 )
			this.interface.loseEarly( this.stageCount - 1 );
		else 
			this.interface.loseLate( this.stageCount - 1);
	};

	Game.prototype.start = function() {
		this.currentStage.start();
	}

	Game.prototype.getNextStage = function() {
		this.stageCount++;
		if ( this.stageCount <= this.numStages ) {
			return new Stage( this.stageCount );
		} else
			return false;
	}

	Game.prototype.startPlay = function() {
		this.currentStage = this.getNextStage();
		this.interface.startPlay( this.currentStage );

		var self = this;

		/* bind an event to start the game */
		$( 'body' ).one( 'keydown', function (e) {
			e.preventDefault();
			if ( e.which === 32 ) {
				$( this ).unbind( 'keydown' );
				self.interface.refresh();
				self.start();
				return false;
			}
		});

	}

	/* Show a message in between stages */
	Game.prototype.getReady = function () {

		var self = this;

		/* Show the message to get ready */
		if ( this.stageCount < this.numStages ) {
			this.interface.getReady( this.stageCount + 1 );
		} else {
			this.interface.win(); // you've won
		}

		/* Bind the next interrupt to starting the next stage */
		$( self ).one( 'interrupt', function(e) {

			self.currentStage = self.getNextStage();
			if ( !self.currentStage ) { // there are no stages left
				self.interface.refresh();
				self.interface.showTwitterAndFacebook( stageCount );
			}
			else {
				self.interface.refresh();
				window.setTimeout( function() { self.start(); }, 750 );
			}
			return false;
		});
	};



	/**
	*	A stage has a collection of rounds, that it turns into markup and displays in the grid
	*/
	var Stage = function( difficulty ) {

		this.grid = $( '#grid' );
		this.winner = false; // is a correct round showing?
		this.rounds = [];
		this.correctItem = getCorrectItem();
		this.playing = false;

		this.level = window.levels[difficulty];

		this.getRoundsMarkup();
		
	}

	/* populate this stage with incorrect rounds and one correct one */
	Stage.prototype.getRounds = function() {
		var rounds = [];
		for ( var i = 0; i < this.level.rounds - 1; i++ ) {
			rounds.push( new Round( this.level.objects, this.level.hardItems ) );
		}
		rounds.push( new correctRound( this.level.objects, this.level.hardItems, this.correctItem ) );
		rounds.shuffle();
		return rounds;
	}

	Stage.prototype.getRoundsMarkup = function() {

		_rounds = this.getRounds();

		rounds = [];

		for( var j = 0; j < _rounds.length; j++ ) {

			(function() { 
				if ( !_rounds[j].layout ) 
					return;

				var squares = $( '.square' ).clone();
				for( var i = 0; i < 6; i++ ) {
					(function() {
						if ( _rounds[j].layout[i] != undefined ) {
							$( squares[i] ).addClass( _rounds[j].layout[i].name );
						} 
					})();
				}
				rounds.push(  { squares: squares, winner: _rounds[j] instanceof correctRound, number: j } );
			})();
		}

		this.rounds = rounds;
	}

	/* show a round in the viewport */
	Stage.prototype.displayRound = function( round ) {
		this.grid.html( round.squares );
	}

	Stage.prototype.clearGrid = function() {
		$( '.square' ).removeClass().addClass( 'square' );
	}

	Stage.prototype.isWinner = function() {
		return this.winner;
	}

	/* Get another round and set winning/losing state for it */
	Stage.prototype.getNextRound = function() {

		var round = this.rounds.pop();

		this.winner = round.winner;

		return round;
	}

	/* Main game loop - show rounds until an interrupt */
	Stage.prototype.start = function() {

		// if already playing, stop
		if ( this.playing )
			clearInterval ( this.playing );

		var self = this;

		// if there are rounds, show the next one
		if ( this.rounds.length )
			this.displayRound( this.getNextRound() );
		this.playing = setInterval( function() {
			if( self.winner == true ) { //if the last round was a winner, they must have missed it
				self.winner = false;
				$( window.game ).trigger( 'interrupt' );
				self.stop();
				return;
				//self.stop(); // make sure we don't trigger a timeout as well
			}
			if ( ! self.rounds.length ) {
				$( window.game ).trigger( 'time-out' );
				self.stop();
				return;
			} else {
				var round = self.getNextRound();
				self.displayRound( round );
			}
		}, self.level.speed );
	};

	/* stop showing rounds for this stage */
	Stage.prototype.stop = function() {
		this.clearGrid();
		clearInterval( this.playing );
		this.winner = false;
	};

	var Round = function( objects, hardItems ) {

		this.layout = new Array(6 - objects );
		for ( var i = 0; i < objects; i++ ) {
			this.layout.push( new randomItem( hardItems ) );
		}
		this.layout.shuffle();
	}

	var correctRound = function( objects, hardItems, correctItem ) {

		this.layout = new Array( 6 - objects );
		for ( var i = 0; i < objects - 1; i++ ) { // leave 1 space for the correctitem
			this.layout.push( new randomItem( hardItems ) );
		}
		this.layout.push( correctItem );
		this.layout.shuffle();
	}

	var blankItem = function() {
		this.name = '';
	}

	/**
	 * Pass in hardItem = true to get a harder one
	 */
	var randomItem = function( hardItem ) {

		var items;

		items = ( hardItem ) ?
			$.extend( {}, window.items, window.hardItems ) :
			window.items;

		var prop = pickRandomProperty( items );

		return items[prop];
	}


	var getCorrectItem = function() {
		return { name: 'flute' };
	}

	var MessageWindow = function( message ) {
		
		this.message = message;
		this.messageApron = $( '.messageApron' );
		this.element;

	}

	MessageWindow.prototype.display = function( extraclass ) {
		this.element = $( '<div>' ).removeClass().addClass( 'messageWindow' + ' ' + extraclass ).html( this.message ).appendTo( this.messageApron.show() );
	}

	MessageWindow.prototype.destroy = function() {
		this.messageApron.hide();
		if ( this.element )
			this.element.remove();
	}


	var Interface = function() {

		this.man = new Man();
		this.scoreBoard = new ScoreBoard();
		var messageWindow; //only one is ever displayed at a time so we use a single handle for all instances of MW
		var self = this;

	}

	Interface.prototype.getTwitterLink = function( score ) {
		return '<a target="_blank" href="http://twitter.com/?status=I scored ' + score + ' on Spot The Flute! - ' + window.location + '"><img src="' + assetPath + 'icons/twitter.png" /></a>'; 
	}

	Interface.prototype.getFacebookLink = function( score ) {
		return '<a target="_blank" href="http://facebook.com/sharer.php?u=' + window.location +'&t=I+scored+' + score + '+on+Spot+The+Flute!"><img src="' + assetPath + 'icons/facebook.png" /></a>'; 
	}

	Interface.prototype.startPlay = function() {
		messageWindow = new MessageWindow( $( '<img>' ).attr( 'src', assetPath + 'text/intro.png' ) );
		messageWindow.display();
	}

	Interface.prototype.getReady = function( stage ) {
		messageWindow = new MessageWindow( $( '<img>' ).attr( 'src', assetPath + 'text/' + stage + '.png' ) );
		messageWindow.display();
	}

	Interface.prototype.loseEarly = function( score ) {

		var self = this;
		messageWindow = new MessageWindow( 
			$( '<a href="' + window.location + '"><img src="' + assetPath + 'text/ouch.png" /></a>' )
		);
		messageWindow.display();
	}

	Interface.prototype.loseLate = function( score ) {

		messageWindow = new MessageWindow(
			$( '<a href="' + window.location + '"><img src="' + assetPath + 'text/consolation.png" /></a>' +
				this.getFacebookLink( score ) + this.getTwitterLink( score ) +
				'<img src="' + assetPath + 'text/showoff.png" />'
			)
		);
		messageWindow.display( 'ending' );

	}

	Interface.prototype.win = function() {
		messageWindow = new MessageWindow(
			$( '<a href="' + window.location + '"><img src="' + assetPath + 'text/goldstar.png" /></a>' +
				this.getFacebookLink( score ) + this.getTwitterLink( score ) +
				'<img src="' + assetPath + 'text/showoff.png" />'
			)
		);
		messageWindow.display( 'ending' );
	}

	Interface.prototype.stop_playing = function( winning ) {
		if ( winning ) {
			this.man.setState( 'HAPPY' );
			this.scoreBoard.addPoint();
		} else {
			this.man.setState( 'SAD' );
		}
	};

	Interface.prototype.refresh = function() {
		this.man.setState( 'NEUTRAL' );
		this.scoreBoard.showScore();
		messageWindow.destroy();
	};

	var Man = function() {

		var states = {
			NEUTRAL: 0,
			HAPPY: 1,
			SAD: 2
		} 
		var self = this;

		var currentState;

		Man.prototype.getState = function() {
			return states[currentState];
		}

		Man.prototype.setState = function( state ) {
			currentState = state;
			$( '#man' ).attr( 'src', window.assetPath + 'man_' + states[state] + '.png' );
		}

		this.setState( 'NEUTRAL' );
	}

	var ScoreBoard = function() {

		var score = 0;
		var self = this;
		var numberImage = $( '<img>' ).attr( 'src', assetPath + 'numbers/0.png' );
		this.element = $( '#score' );	

		function getScoreMarkup( score ) {
			return numberImage.attr( 'src', assetPath + '/numbers/' + score + '.png' );
		}

		ScoreBoard.prototype.addPoint = function () {
			score++;
			this.showScore();
		}

		ScoreBoard.prototype.showScore = function() {
			self.element.html( getScoreMarkup( self.getScore() ) );
		}

		ScoreBoard.prototype.getScore = function() {
			return score;
		}

	}


	/**
	 * Initial keypress to start the game
	 */
	$( 'body' ).one( 'keydown', function (e) {
		window.game = new Game( 10 );
		e.preventDefault();
		if ( e.which === 32 ) {
			$( this ).unbind( 'keydown' );
			$( '#press-space' ).hide();
			window.game.startPlay();
			return false;
		}
	});

	// preload the images
	var items = [ "beans.png", "biscuits.png", "brownie.png", "chair.png", "cinema.png", "clarinet.png", "flowers.png", "flute.png", "gokart.png", "guitar.png", "keyboard.png", "oboe.png", "popcorn.png", "spanner.png", "teacup.png", "trumpet.png" ];
	var texts = [ "consolation.png", "impressive.png", "goldstar.png", "1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png", "11.png", "intro.png", "showoff.png" ];

	function preload(imgs, path) {
		var img;
		for (var i = 0, len = imgs.length; i < len; ++i) {
			img = new Image();
			img.src = assetPath + path + '/' + imgs[i];
		}
	}

	preload(items, 'items');
	preload(texts, 'text');

});
