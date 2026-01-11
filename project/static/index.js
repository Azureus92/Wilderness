S(document).ready(async function(){
  
  var hexes = [];
  await fetch("/get-hexes")
  .then((response) => {
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
  })
  .then((data) => {
    console.log(data)
    hexes = data;
  })

  max_x = Math.max(...hexes.map(o => o.x));
  min_x = Math.min(...hexes.map(o => o.x));
  max_y = Math.max(...hexes.map(o => o.y));
  min_y = Math.min(...hexes.map(o => o.y));

	hexstr = `<code>
				{
					"layout":"odd-q",
                    "hexes": {
			`

	for (i = 0; i < hexes.length; i++) {
    hexstr += `"` + hexes[i].id + `":{"n":"` + hexes[i].id + `","q":`+ hexes[i].x +`,"r":`+ (24 - hexes[i].y) +`,"alt":"` + `` + `","type":"horizontal"}`
    if (i != hexes.length - 1) {
      hexstr += `, `
    }
	}

	hexstr += `    }
                }
                </code>`

	S('#hexes').html(hexstr)


	var hexmap = S.hexmap('hexmap-9');
	hexmap.positionHexes().resize();

  
	// Define the content of each hex
	hexmap.setContent(function(id,hex){

		str = '<div class="id"><img class="hex-image" draggable=false src="static/images/hexes/' + hex.n + '.png" alt='+id+' width=112 height=96></div>';
		
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

  function DisplayFocusedHexInfo() {
    hex_info = hexes.filter(function(entry) { return entry.id == focused_hex.alt })[0];
    document.getElementById('rightsidebar').style.display = "block";
    console.log(hex_info)
    S("#hex-name").html("Name: " + hex_info.x);
    // S("#hex-type").html("Type: " + hex_info.type);
    // S("#hex-desc").html("Description: " + hex_info.description);
    // S("#hex-pop").html("Population: " + hex_info.population);
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
  if (document.getElementById('hex-mod') != null) {
    document.getElementById('hex-mod').addEventListener('click', function() {
      document.getElementById('modifier').style.display = 'block';
    });
    document.getElementById('hex-mod-confirm').addEventListener('click', function() {
      hex_info = GetFocusedHex();
      hex_info.description = document.getElementById('hex-desc-new').value;
      DisplayFocusedHexInfo();
      document.getElementById('modifier').style.display = 'none';
    });
  }

  document.getElementById('close-sidebar').addEventListener('click', function() {
    document.getElementById('rightsidebar').style.display = 'none';
  });
  


});