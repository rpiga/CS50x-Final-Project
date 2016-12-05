/**
 * game.hacker.js
 *
 * Computer Science 50
 * Final Project
 *
 * Game of 100 hacker version
 * Player vs. CPU with somewhat AI
 * 
 * Roberto Piga - Milan, Italy
 * rpiganet@gmail.com
 **/
 
 // Global variables & constants
 
 // scores
var high_scores = [];

// start with human (-1). CPU is (1).
var current_player = -1;

// put moves in an array
// used also for cookies
var moves = [];

// next valid moves array
var valid_moves = [];
var valid_moves_tempo = [];
var current_value = 0;

// grid dimension
const G = ( parseInt(getParameterByName('g')) >= 4 ) ? parseInt(getParameterByName('g')) : 10;

// play against CPU
const VS_CPU = ( parseInt(getParameterByName('cpu')) === 1 ) ? true : false;

// trainer mode (highlight cells valid for next move)
const TRAIN = ( parseInt(getParameterByName('train')) === 1 ) ? true : false;

// Max AI depth
const MAX_DEPTH = 3;

// temporary array for cpu evaluation
var cpu_moves_list = [];

 // execute when the DOM is fully loaded
$(function() 
{
    console.log("Hello, world.");
	
	// init board
	build_board();
	
	// change play button (solitaire or vs cpu)
	if (VS_CPU)
	{
	    $("#play_mode").text("Play Solitaire");
	}
	else
	{
	    $("#play_mode").text("Play Vs. CPU");
	}
	
    
    // check if high scores present
    get_high_scores();
    
    // check if moves from a suspended game are stored
    if (VS_CPU)
        var ck = "road_moves_vs";
    else
        var ck = "road_moves_sol";
    
    var ckMoves = getCookie(ck);
    
    // recall of old moves
    if (ckMoves)
    {
        var path = ckMoves.split(",");

        if (VS_CPU)
        {   
            var player_temp = -1; // human first
            for (i = 0, n = path.length; i < n; i++)
            {
                set_move(path[i]);
                valid_moves = verify_move(path[i]);
                set_score();
                
                player_temp *= -1;
            }
        }
        else
        {
            for (i = 0, n = path.length; i < n; i++)
            {
                set_move(path[i]);
                valid_moves = verify_move(path[i]);
                set_score();
            }
        }
    }
    
    // monitor clicks on cells
    $("#mainboard").on("click", "td", function(e) {
        // slice cel id and assign it to a variable
        var n = this.id.slice(4);
        n = +n; // string to number
        
        if ( set_move(n) )
        {
            // check for winner
            
            // memorize valid next moves in an array
            valid_moves = verify_move(n);
            //console.log(valid_moves);
            
            set_score();
            if (check_win()) return;
            
        }
        else
        {
            return false;
        }

        if (VS_CPU)
        {
            // evaluate best move for CPU
            var ncpu = cpu_move(n);
            
            if ( set_move(ncpu) )
            {
                // switch player to CPU
                current_player *= -1;
                valid_moves = verify_move(ncpu);
                set_score();
                if (check_win()) return;
                
                // switch back to human
                current_player *= -1;
            }
            else
            {
                return false;
            }
        }

        // show hints for next move
        if (TRAIN)
        {
            trainer();
        }

        e.stopPropagation();

        return;
    });

    $("#game_reset").on("click", function() {
        setCookie("road_moves_sol", "", -100);
        setCookie("road_moves_vs", "", -100);
        
        window.location.reload();
        return;
    });
    
    $("#play_mode").on("click", function() {
        if(VS_CPU)
        {
            window.location.href = "?";
        }
        else
        {
            window.location.href = "?cpu=1";
        }
    });

    
});

// blink cell in case of error
// https://jsfiddle.net/jadendreamer/Nx4qS/
function blink(t, n)
{
    if (n > 0 || n < 0)
    {
        $(t).toggleClass("blink");
    }

    if (n > 0 || n < 0)
    {
        setTimeout(function () {
            blink(t, n);
        }, 100);
        n -= .5;
    }
}

// build board as table cells, and attach them to mainboard
function build_board()
{
	var div ="";
    var count = 0;
    
    for (i = 0; i < G ; i++)
    {
        div += "<tr>";
        for (j = 0; j < G; j++)
        {
            div += "<td title='" + count + "' id='cel-" + count + "'></td>";
            count++;
        }
        div += "</tr>";
    }
    
    $("#mainboard").html(div);
}

// Check winner
function check_win()
{
    if (current_value > 0 && valid_moves.length == 0 )
    {
        var cont = "";
        if (VS_CPU)
        {
            cont = (current_player === -1) ? "Player" : "CPU";
            cont += " Wins !!";
        }
        else
        {
            cont = "No more moves available.";
        }
        
        $("#winner").html("<h3>" + cont + "</h3>");
        $("#winner").css("visibility", "visible");
        set_high_score();
        $("#game_reset").text("Play Again!");
        
        return true;
    }
    
    return false;
}

// call minimax for each possible move and define the best choice
function cpu_move (start)
{
    var choices = verify_move(start);
    var choices_mm = [];
    var best_score = -10000;
    
    for (var i = 0, j = choices.length; i < j; i++)
    {
        //console.log("CHECKING " + choices[i]);
     
        var t_score = minimax(choices[i], -99999, 99999, 0, true);
        console.log(choices[i] + "\t >" + t_score);
        
        if (t_score > best_score)
        {
            choices_mm = [];
            appo = {
                "value" : choices[i],
                "score" : t_score
            };
            
            choices_mm.push(appo);
            
            best_score = t_score;
        }
        else if (t_score == best_score)
        {
            appo = {
                "value" : choices[i],
                "score" : t_score
            };
            choices_mm.push(appo);
        }
    }
    
    if (choices_mm.length > 1)
    {
        var r_ind = Math.floor(Math.random() * (choices_mm.length - 1));
        //console.log(r_ind);
        return choices_mm[r_ind].value;
    }
    else
        return choices_mm[0].value;
    
}

/**
 * minimax alpha beta pruning
 * good readings to learn a little bit more, as well us to start my implementation
 * http://web.cs.ucla.edu/~rosen/161/notes/minimax.html
 * http://web.cs.ucla.edu/~rosen/161/notes/alphabeta.html
 * https://chessprogramming.wikispaces.com
**/
function minimax(n, alpha, beta, depth, isMax)
{
    var r = (isMax === true) ? 1 : -1;
    // keep track of performed moves
    // re initialize it when reaching depth 0
    if (depth === 0)
    {
        cpu_moves_list = [];
        cpu_moves_list.push(n);
    }
    
    // appo contains the possible moves from cunnrent node n
    var appo = verify_move(n);
    var nodes = [];
    
    // check if moves from appo were already took
    // this to eclude not valid moves to already filled cells
    for (k in appo)
    {
        if ( $.inArray(appo[k], cpu_moves_list) < 0 )
            nodes.push(appo[k]);
    }

    // end of tree because a) max depth reached b) it's a leaf
    if(depth > MAX_DEPTH || nodes.length === 0)
    {
        // leaf will report if last one, so possible win for human
        // check if leaf is a Max one (CPU) or Min one (Human) and prepare multiply factor accordingly
        
        if (nodes.length === 0)
        {    
            // this is a leaf and we're above depth, so it appears to be a winning move
            return r * 1000;
        }
        else
        {
            // we're at maximum depth, so it returns the number
            // of possible further moves from this point, as score
            return r * nodes.length;
        }    
    }

    // iterate the possible valid moves from current n 
    for (var i = 0, j = nodes.length; i < j; i++)
    {
        // just makes value a number
        var item = parseInt(nodes[i]);
        
        // add value in the list of performed (simulated) moves
        cpu_moves_list.push(item);
        
        console.log(depth + "\t" + n + "\t" + alpha + '\t' + beta + "\t" + isMax + "\t" + cpu_moves_list)
        
        // retrieve score recursively by increasing depth and switching if we're in a Max or min node
        var score = minimax(item, alpha, beta, depth + 1, (isMax === true) ? false : true);

        // after evaluation, pop value out from simulated moves list
        cpu_moves_list.pop();
        
        console.log("\t- " + depth + "\t" + n + "\t" + isMax + "\t" + alpha +"\t" + beta +"\t" + score);
        
        if (isMax) // we're in a Max node (CPU)
        {
            if( score >= beta )
                return beta;
            if( score > alpha )
                alpha = score;
        }
        else // we're in the Min (Human)
        {
            if( score <= alpha )
                return alpha;
            if( score < beta )
                beta = score;
        }
    }
    
    if(isMax)
        return alpha;
    else
        return beta;
    
}

// get high scores from cookies and put list in the page
function get_high_scores()
{
    var C_high_scores = getCookie("high_scores");
    
    // place high scores
    if (C_high_scores != "")
    {
        var arr = JSON.parse(C_high_scores);
        
        var content = "<ol>";
        
        for (i = 0; i < arr.length; i++)
        {
            date_diff = (Date.now() - arr[i].date) / 1000;
            date_ind = (date_diff < 86400) ? "today" : ( Math.floor(date_diff / 60 / 60 / 24 ) + " day/s ago");
            
            content += "<li><strong>" + arr[i].score + "</strong> <small><em>( " + arr[i].player + ", " + date_ind + " )</em></small></li>";
        }
        
        content += "</ol>";
        
        $("#highs").html(content);
        
        if (high_scores.length < 1)
        {
            high_scores = arr;
        }
    }

    return;
}

// check if target cel is empty or not
function is_free(t)
{
    if (! isNaN(parseInt(t, 10)))
    {
        t = "#cel-" + t; // backward compability
    }
    
    if ( $(t).html() !== "" || $(t).text() !== "" )
    {
        return false;
    }
 
    return true;
}

// save high scores as cookie
function set_high_score()
{
    // console.log("f set_high_score()");
    // // check which is the highset
    // var hs = -1;
    // var hsp = "";
    
    // if (score_player > hs)
    // {
    //     hs = score_player;
    //     hsp = "You";
    // }
    
    // if (score_cpu > hs)
    // {
    //     hs = score_cpu;
    //     hsp = "Cpu";
    // }
    
    var hsp = (current_player === -1) ? "You" : "CPU";
    
    // add score to high_score array
    var record = {
        "score": current_value,
        "player": hsp,
        "date": Date.now()
    };
    
    high_scores.push(record);
    
    // sort by score value
    high_scores.sort(function(a, b) {
        return b.score - a.score;
    });
    
    // keep last 3 high scores
    if (high_scores.length > 3)
    {
        high_scores.pop();
    }
    
    // set cookie
    setCookie("high_scores", JSON.stringify(high_scores), 100);
    
    return;
}

// set move in the grid
function set_move (c)
{
    c = +c; // string to number
    
    // check if move is in a valid cel
    if ( current_value > 0 && $.inArray(c, valid_moves) < 0 )
    {
        //console.log("Wrong Move (" + c + ")");
        blink("#cel-" + c, 3);
        return false;
    }
    
    // set color of previous move to black
    if (moves.length > 0)
    {
        last = moves[moves.length - 1];
//        $("#cel-" + last).css("color", "");
        $("#cel-" + last).toggleClass("value");
    }

    current_value++;
    
    //$("#cel-" + c).text(current_value).css("color", "red");
    $("#cel-" + c).text(current_value).toggleClass("value");
    
    moves.push(c);
    
    if (VS_CPU)
        setCookie("road_moves_vs", moves, 100);
    else
        setCookie("road_moves_sol", moves, 100);
        
    return true;
}

// set score
function set_score()
{
    $("#score_placeholder").text(current_value);
}


// Highlight valid next moves
function trainer()
{
    //console.log(valid_moves_tempo);
    for (var i = 0, j = G * G; i < j; i++)
    {
        cel = $("#cel-" + i);
        if ( $.inArray(i, valid_moves_tempo) > -1 )
        {
            cel.addClass("highlit");
        }
        else
        {
            if (cel.hasClass("highlit"))
            {
                cel.removeClass("highlit");
            }
        }
    }
}

// check next possible moves and return as array
function verify_move(n)
{
    // re-initialize
    valid_moves_tempo = [];
    
    var g = G; // backward compability
    n = +n;
    var lbound = 0, ubound = 0, k = 0, tmp = 0;
    // check top-bottom
    // define bounderies for possible positions
    lbound = n % g;
    ubound = n + (Math.floor(((g * g) - 1 - n) / g) * g);
    // check if possible moves within bounderies are valid
    k = (n - (3 * g));
    if ( k >= lbound && is_free(k))
    {
        valid_moves_tempo.push(k);
    }
    k = (n + (3 * g));
    if ( k <= ubound && is_free(k))
    {
        valid_moves_tempo.push(k);
    }

    // console.log(lbound + " " + ubound);
    
    // check left-right
    lbound = n - (n % g);
    ubound = lbound + g - 1;
    k = n - 3;
    if ( k >= lbound && is_free(k))
    {
        valid_moves_tempo.push(k);
    }    
    k = n + 3;
    if ( k <= ubound && is_free(k))
    {
        valid_moves_tempo.push(k);
    }   
    // console.log(lbound + " " + ubound);
    
    // check top-diagonals
    if (n - (2 * g) >= 0)
    {
        tmp = n - (2 * g);
        lbound = tmp - (tmp % g);
        ubound = lbound + g - 1;
        
        k = (n - (2 * g)) - 2;
        if ( k >= lbound && is_free(k))
        {
            valid_moves_tempo.push(k);
        }    
        
        k = (n - (2 * g)) + 2;
        if ( k <= ubound && is_free(k))
        {
            valid_moves_tempo.push(k);
        }    
    }
    
    // check bottom-diagonals
    if (n + (2 * g) < (g * g) )
    {
        tmp = n + (2 * g);
        lbound = tmp - (tmp % g);
        ubound = lbound + g - 1;
        
        k = (n + (2 * g)) - 2;
        if ( k >= lbound && is_free(k))
        {
            valid_moves_tempo.push(k);
        }    
        
        k = (n + (2 * g)) + 2;
        if ( k <= ubound && is_free(k))
        {
            valid_moves_tempo.push(k);
        }    
    }

    // console.log(valid_moves_tempo);

    return valid_moves_tempo;
}

// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// set/get cookie values http://www.w3schools.com/js/js_cookies.asp
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    
    return;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

