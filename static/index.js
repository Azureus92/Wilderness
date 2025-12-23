S(document).ready(function(){
	hexstr = `<code>
				{
					"layout":"odd-q",
                    "hexes": {
			`

	for (i = 0; i < 20; i++) {
		for (j = 0; j < 25; j++) {
			hexstr += `"` + i + `_` + j + `":{"n":"` + i + `_` + j + `","q":`+ (i - 10) +`,"r":`+ (12 - j) +`,"label":"gamer","type":"horizontal"}`
			if (i != 19 || j != 24) {
				hexstr += `, `
			}
		}
	}
	
// "A":{"n":"4_5","q":1,"r":4,"label":"Horn<br>sey","type":"horizontal"},

	hexstr += `    }
                }
                </code>`

	S('#hexes').html(hexstr)


	var hexmap = S.hexmap('hexmap-9');
	hexmap.positionHexes().resize();

	// Define the content of each hex
	hexmap.setContent(function(id,hex){

		str = '<div class="id"><img class="hex-image" draggable=false src="static/images/result' + hex.n + '.png" alt='+hex.n+' width=112 height=96></div>';
		
		// Build the circular token that sits on a hex
		// str += '<div class="id">'+hex.n+'</div>';
		// str += '<div class="name">'+hex.label+'</div>';

		return str;
	})

	// hexmap.on('click',function(e){
  //   // console.log(e)
  //   // if (!e.ctrlKey) {
  //   S('#message-6').html('You have clicked hex '+e.i+' ('+e.hex.id+')')
  //   // }
	// }).on('mouseover',function(e){

	// 	S('#message-6').html('You have hovered over hex '+e.i+' ('+e.hex.id+')')

	// }).on('mouseout',function(e){

	// 	S('#message-6').html('You have left hex '+e.i+' ('+e.hex.id+')')

	// }).on('focus',function(e){

	// 	S('#message-6').html('You have focussed on hex '+e.i+' ('+e.hex.id+')')

	// });
	
	// Set the CSS class of each hex to be the hex type
	hexmap.setClass(function(id,hex){
		return hex.type;
	});
  
  function zoom(zoomincrement) {
    S.hexmap('hexmap-9').setZoom(zoomincrement);
  }
  
  var curZoom = 1

  document.getElementById('zoomout').addEventListener('click', function() {
    curZoom /= 2;
    zoom(curZoom);
  });
  document.getElementById('zoomin').addEventListener('click', function() {
    curZoom *= 2;
    zoom(curZoom);
  });
  
  var _startX = 0;
  var _startY = 0;
  var _offsetX = 0;           
  var _offsetY = 0;
  var _dragElement;
  document.onmousedown = OnMouseDown;
  document.onmouseup = OnMouseUp;

  var focused_hex = null

  function DisplayHexInfo(hex) {
    S("#message-6").html("You have selected Hex "+hex.alt);
  }

  function OnMouseDown(event){
    if (event.ctrlKey == true) {
      document.onmousemove = OnMouseMove;
      _startX = event.clientX;
      _startY = event.clientY;
      _offsetX = document.getElementById('hexes').offsetLeft;
      _offsetY = document.getElementById('hexes').offsetTop;
      _dragElement = document.getElementById('hexes');
    } else if (typeof event.target.className !== "undefined" && 
        (event.target.className.includes("hex") || event.target.className.includes("hex-image"))) {
      if (focused_hex != null) {
        focused_hex.className = focused_hex.className.split(" ")[0];
        focused_hex = null;
      }
      if (event.target.className.includes("focusedhex")) {
        event.target.className = event.target.className.split(" ")[0];
      } else {
        event.target.className += " focusedhex";
        focused_hex = event.target;
        DisplayHexInfo(focused_hex);
      }
    }
  }

  function OnMouseMove(event){
    _dragElement.style.left = (_offsetX + event.clientX - _startX) + 'px';
    _dragElement.style.top = (_offsetY + event.clientY - _startY) + 'px';
  }

  function OnMouseUp(event){
    document.onmousemove = null;
    _dragElement=null;
  }
});