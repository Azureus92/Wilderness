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

		str = '<div class="id"><img src="static/images/result' + hex.n + '.png" width=112 height=96></div>';
		
		// Build the circular token that sits on a hex
		// str += '<div class="id">'+hex.n+'</div>';
		// str += '<div class="name">'+hex.label+'</div>';

		return str;
	})

	hexmap.on('click',function(e){

		S('#message-6').html('You have clicked hex '+e.i+' ('+e.hex.id+')')

	}).on('mouseover',function(e){

		S('#message-6').html('You have hovered over hex '+e.i+' ('+e.hex.id+')')

	}).on('mouseout',function(e){

		S('#message-6').html('You have left hex '+e.i+' ('+e.hex.id+')')

	}).on('focus',function(e){

		S('#message-6').html('You have focussed on hex '+e.i+' ('+e.hex.id+')')

	});
	
	// Set the CSS class of each hex to be the hex type
	hexmap.setClass(function(id,hex){
		return hex.type;
	});

	var img_ele = null,
    x_cursor = 0,
    y_cursor = 0,
    x_img_ele = 0,
    y_img_ele = 0;
  
  function zoom(zoomincrement) {
    S.hexmap('hexmap-9').setZoom(zoomincrement);
  }
  
  var curZoom = 1

  document.getElementById('zoomout').addEventListener('click', function() {
    curZoom *= 2;
    zoom(curZoom);
  });
  document.getElementById('zoomin').addEventListener('click', function() {
    curZoom /= 2;
    zoom(curZoom);
  });
  
  function start_drag() {
    img_ele = this;
    x_img_ele = window.event.clientX - document.getElementById('drag-img').offsetLeft;
    y_img_ele = window.event.clientY - document.getElementById('drag-img').offsetTop;
    
  }
  
  function stop_drag() {
    img_ele = null;
  }
  
  function while_drag() {
    var x_cursor = window.event.clientX;
    var y_cursor = window.event.clientY;
    if (img_ele !== null) {
      img_ele.style.left = (x_cursor - x_img_ele) + 'px';
      img_ele.style.top = ( window.event.clientY - y_img_ele) + 'px';
      
        console.log(img_ele.style.left+' - '+img_ele.style.top);
  
    }
  }
  
  // document.getElementById('drag-img').addEventListener('mousedown', start_drag);
  // document.getElementById('container').addEventListener('mousemove', while_drag);
  // document.getElementById('container').addEventListener('mouseup', stop_drag);
});