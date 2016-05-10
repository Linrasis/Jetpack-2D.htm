'use strict';

function draw_logic(){
    buffer.save();
    buffer.translate(
      x,
      y
    );

    // Draw corridor over background.
    buffer.fillStyle = '#333';
    buffer.fillRect(
      -x,
      -half_corridor_height,
      width,
      settings['corridor-height']
    );

    // Draw player body.
    buffer.fillStyle = settings['color'];
    buffer.fillRect(
      0,
      -player['y'] - 25,
      25,
      50
    );

    // Draw jetpack.
    buffer.fillStyle = '#aaa';
    buffer.fillRect(
      -25,
      -player['y'] - 15,
      25,
      20
    );

    // Draw activated jetpack fire.
    if(game_running
      && key_jetpack){
        buffer.fillStyle = '#f00';
        buffer.fillRect(
          -22,
          -player['y'] + 5,
          18,
          10
        );
    }

    buffer.font = '18pt sans-serif';
    // Draw obstacles.
    for(var obstacle in obstacles){
        buffer.fillStyle = '#555';
        buffer.fillRect(
          obstacles[obstacle]['x'],
          obstacles[obstacle]['y'],
          obstacles[obstacle]['width'] * 2,
          obstacles[obstacle]['height'] * 2
        );
        buffer.fillStyle = '#fff';
        buffer.fillText(
          obstacles[obstacle]['counter'],
          obstacles[obstacle]['x'],
          obstacles[obstacle]['y']
        );
    }

    // Draw smoke trails behind the player.
    buffer.fillStyle = '#777';
    for(var id in smoke){
        buffer.fillRect(
          smoke[id]['x'],
          -smoke[id]['y'],
          10,
          10
        );
    }

    buffer.restore();

    // Setup text display.
    buffer.fillStyle = '#fff';
    buffer.font = '23pt sans-serif';

    // If game is over, display game over messages.
    if(!game_running){
        if(!played_explosion_sound){
            if(settings['audio-volume'] > 0){
                // play_audio('explosion');
            }
            played_explosion_sound = true;
        }

        if(frame_counter > best){
            buffer.fillText(
              'NEW BEST SCORE!',
              5,
              height - 100
            );
        }
        buffer.fillText(
          'You crashed... ☹',
          5,
          height - 70
        );
        buffer.fillText(
          settings['restart-key'] + ' = Restart',
          5,
          height - 40
        );
        buffer.fillText(
          'ESC = Main Menu',
          5,
          height - 10
        );
    }

    // If frame counter is enabled, draw current frame count.
    if(settings['frame-counter']){
        // Top frame counter and best text displays.
        buffer.fillText(
          frame_counter,
          5,
          25
        );
        buffer.fillText(
          best,
          5,
          50
        );
    }
}

function logic(){
    if(!game_running){
        return;
    }

    // Check if player is outside of game boundaries.
    if(player['y'] + 25 > half_corridor_height
      || player['y'] - 25 < -half_corridor_height){
        game_running = false;
        update_best();
        return;
    }

    frame_counter += 1;

    // If new obstacle should be added this frame, add one.
    if(frame_counter % frames_per_obstacle === 0){
        var obstacle_width = Math.floor(Math.random() * 15) + 20;
        obstacles.push({
          'counter': obstacle_counter,
          'height': Math.floor(Math.random() * 15) + 20,
          'width': obstacle_width,
          'x': x + obstacle_width,
          'y': Math.floor(Math.random() * settings['corridor-height'])
            - half_corridor_height,
        });
        obstacle_counter += 1;
    }

    // If obstacle frequency increase should happen this frame, do it.
    if(settings['obstacle-frequency'] > 0
      && frames_per_obstacle > 1
      && frame_counter % settings['obstacle-increase'] === 0){
        // obstacle frequency increase
        frames_per_obstacle -= 1;
    }

    // If the player has activated jetpack, increase y speed and add smoke...
    if(key_jetpack){
        player['speed'] += settings['jetpack-power'];
        smoke.push({
          'x': -20,
          'y': player['y'] - 10,
        });

    // ...else apply gravity.
    }else{
        player['speed'] -= settings['gravity'];
    }

    player['y'] += player['speed'];

    for(var obstacle in obstacles){
        // Delete obstacles that are past left side of screen.
        if(obstacles[obstacle]['x'] < -x - 70){
            obstacles.splice(
              obstacle,
              1
            );
            continue;
        }

        // Move obstacles left at speed.
        obstacles[obstacle]['x'] -= settings['speed'];

        // Check for player collision with obstacle.
        if(obstacles[obstacle]['x'] <= -obstacles[obstacle]['width'] * 2
          || obstacles[obstacle]['x'] >= obstacles[obstacle]['width']
          || obstacles[obstacle]['y'] <= -player['y'] - 25 - obstacles[obstacle]['height'] * 2
          || obstacles[obstacle]['y'] >= -player['y'] + 25){
            continue;
        }

        game_running = false;
        update_best();
    }

    // Delete smoke trails past left side of screen.
    for(var id in smoke){
        smoke[id]['x'] -= settings['speed'];

        if(smoke[id]['x'] < -x){
            smoke.splice(
              id,
              1
            );
        }
    }
}

function reset_best(){
    if(!window.confirm('Reset best?')){
        return;
    }

    best = 0;
    frame_counter = 0;
    update_best();
    setmode(
      0,
      true
    );
}

function setmode_logic(newgame){
    obstacle_counter = 0;
    obstacles = [];
    smoke = [];

    // Main menu mode.
    if(mode === 0){
        document.body.innerHTML = '<div><div><a onclick="setmode(1, true)">Cave Corridor</a></div><hr><div>Best: '
          + best
          + '<br><a onclick=reset_best()>Reset Best</a></div></div><div class=right><div>Jetpack:<ul><li><input disabled value=Click>Activate<li><input id=jetpack-key maxlength=1 value='
          + settings['jetpack-key'] + '>Activate</ul><input disabled value=ESC>Main Menu<br><input id=restart-key maxlength=1 value='
          + settings['restart-key'] + '>Restart</div><hr><div><input id=audio-volume max=1 min=0 step=0.01 type=range value='
          + settings['audio-volume'] + '>Audio<br><input id=color type=color value='
          + settings['color'] + '>Color<br><input id=corridor-height value='
          + settings['corridor-height'] + '>Corridor Height<br><input '
          + (settings['frame-counter'] ? 'checked ' : '') + 'id=frame-counter type=checkbox>Frame Counter<br><input id=gravity value='
          + settings['gravity'] + '>Gravity<br>Jetpack:<ul><li><input id=jetpack-power value='
          + settings['jetpack-power'] + '>Power<li><input id=speed value='
          + settings['speed'] + '>Speed</ul><input id=ms-per-frame value='
          + settings['ms-per-frame'] + '>ms/Frame<br>Obstacle:<ul><li><input id=obstacle-frequency value='
          + settings['obstacle-frequency'] + '>Frequency<li><input id=obstacle-increase value='
          + settings['obstacle-increase'] + '>Increase</ul><a onclick=reset()>Reset Settings</a></div></div>';

    // Play game mode.
    }else{
        if(newgame){
            save();
        }

        frame_counter = 0;
        frames_per_obstacle = settings['obstacle-frequency'];
        game_running = true;
        half_corridor_height = settings['corridor-height'] / 2;
        played_explosion_sound = false;
        player = {
          'speed': 0,
          'y': 0,
        };
    }
}

function update_best(){
    if(!settings['frame-counter']){
        return;
    }

    if(frame_counter > best){
        best = frame_counter;
    }

    if(best > 0){
        window.localStorage.setItem(
          'Jetpack-2D.htm-best',
          best
        );

    }else{
        window.localStorage.removeItem('Jetpack-2D.htm-best');
    }
}

var animationFrame = 0;
var best = parseInt(
  window.localStorage.getItem('Jetpack-2D.htm-best'),
  10
) || 0;
var buffer = 0;
var canvas = 0;
var frame_counter = 0;
var frames_per_obstacle = 0;
var game_running = false;
var half_corridor_height = 0;
var height = 0;
var interval = 0;
var key_jetpack = false;
var mode = 0;
var obstacle_counter = 0;
var obstacles = [];
var played_explosion_sound = false;
var player = {};
var smoke = [];
var width = 0;
var x = 0;
var y = 0;

window.onkeydown = function(e){
    if(mode <= 0){
        return;
    }

    var key = e.keyCode || e.which;

    // ESC: update best and return to main menu.
    if(key === 27){
        update_best();
        setmode(
          0,
          true
        );
        return;
    }

    key = String.fromCharCode(key);

    if(key === settings['jetpack-key']){
        key_jetpack = true;

    }else if(key === settings['restart-key']){
        update_best();
        setmode(1);
    }
};

window.onkeyup = function(e){
    var key = String.fromCharCode(e.keyCode || e.which);

    if(key === settings['jetpack-key']){
        key_jetpack = false;
    }
};

window.onload = function(){
    init_settings(
      'Jetpack-2D.htm-',
      {
        'audio-volume': 1,
        'color': '#009900',
        'corridor-height': 500,
        'frame-counter': true,
        'gravity': 1,
        'jetpack-key': 'W',
        'jetpack-power': 2,
        'ms-per-frame': 30,
        'obstacle-frequency': 23,
        'obstacle-increase': 115,
        'restart-key': 'H',
        'speed': 10,
      }
    );
    init_canvas();
};

window.onmousedown
  = window.ontouchstart = function(e){
    if(mode <= 0){
        return;
    }

    e.preventDefault();
    key_jetpack = true;
};

window.onmouseup
  = window.ontouchend = function(e){
    key_jetpack = false;
};
