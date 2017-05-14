// var gp = null;
// window.addEventListener("gamepadconnected", function(e) {
//   console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
//   e.gamepad.index, e.gamepad.id,
//   e.gamepad.buttons.length, e.gamepad.axes.length);
//   gp = e.gamepad;
//   setInterval(gameLoop, 50);
// });

// function gameLoop() {

//     var a = 0;
//     var b = 0;
//     var c = false;
//   if(gp.axes[0] != 0) {
//     b -= gp.axes[0];
//   } else if(gp.axes[1] != 0) {
//     a += gp.axes[1];
//   } else if(gp.axes[2] != 0) {
//     b += gp.axes[2];
//   } else if(gp.axes[3] != 0) {
//     a -= gp.axes[3];
//   }

//   if(gp.buttons[0].value > 0 || gp.buttons[0].pressed == true) c = true;
//     console.log('button', c);
//     console.log('X', a)
//     console.log('Y', b)



// };