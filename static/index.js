S(document).ready(function(){
  hex_details = [];
  for (i = 0; i < 20; i++) {
    temp = []
    for (j = 0; j < 25; j++) {
      temp.push(JSON.parse(`
        {
          "name": "Hex ` + (20 * j + i + 1) + `",
          "type": "` + i + `",
          "description": "This is hex ` + i + `, a hex in Tasmania.",
          "population": "` + (i * 1000) + `"
        }`
      ))
    }
    hex_details.push(temp);
  }

	hexstr = `<code>
				{
					"layout":"odd-q",
                    "hexes": {
			`

	for (i = 0; i < 20; i++) {
		for (j = 0; j < 25; j++) {
			hexstr += `"` + i + `_` + j + `":{"n":"` + i + `_` + j + `","q":`+ (i - 10) +`,"r":`+ (12 - j) +`,"alt":"` + i + `_` + j + `","type":"horizontal"}`
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

		str = '<div class="id"><img class="hex-image" draggable=false src="static/images/hexes/' + hex.n + '.png" alt='+hex.n+' width=112 height=96></div>';
		
		// Build the circular token that sits on a hex
		
		return str;
	})
	
	// Set the CSS class of each hex to be the hex type
	hexmap.setClass(function(id,hex){
		return hex.type;
	});
  
  // Zoom functionality
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

  var focused_hex = null
  function GetFocusedHex() {
    if (focused_hex != null) {
      id = focused_hex.alt.split('_');
      hex_info = hex_details[parseInt(id[0])][parseInt(id[1])];
      return hex_info
    } else return null;
  }

  function DisplayFocusedHexInfo() {
    hex_info = GetFocusedHex();
    document.getElementById('rightsidebar').style.display = "block";
    S("#hex-name").html("Name: " + hex_info.name);
    S("#hex-type").html("Type: " + hex_info.type);
    S("#hex-desc").html("Description: " + hex_info.description);
    S("#hex-pop").html("Population: " + hex_info.population);
  }
  
  // Drag functionality:
  var _startX = 0;
  var _startY = 0;
  var _offsetX = 0;           
  var _offsetY = 0;
  var _dragElement;
  document.onmousedown = OnMouseDown;
  document.onmouseup = OnMouseUp;
  function OnMouseDown(event){
    if (event.ctrlKey == true) {
      document.onmousemove = OnMouseMove;
      _startX = event.clientX;
      _startY = event.clientY;
      _offsetX = document.getElementById('hexes').offsetLeft;
      _offsetY = document.getElementById('hexes').offsetTop;
      _dragElement = document.getElementById('hexes');
    } else if (typeof event.target.className !== "undefined" && 
        (event.target.className.includes("hex-image"))) {
      if (focused_hex != null) {
        focused_hex.className = focused_hex.className.split(" ")[0];
        focused_hex = null;
      }
      if (event.target.className.includes("focusedhex")) {
        event.target.className = event.target.className.split(" ")[0];
      } else {
        event.target.className += " focusedhex";
        focused_hex = event.target;
        DisplayFocusedHexInfo();
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

  // Detail Modding:
  document.getElementById('hex-mod').addEventListener('click', function() {
    document.getElementById('modifier').style.display = 'block';
  });
  document.getElementById('hex-mod-confirm').addEventListener('click', function() {
    hex_info = GetFocusedHex();
    hex_info.description = document.getElementById('hex-desc-new').value;
    DisplayFocusedHexInfo();
    document.getElementById('modifier').style.display = 'none';
  });


});