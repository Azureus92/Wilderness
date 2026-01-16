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

		str = `
    <div class="id">
      <img class="hex-image" draggable=false src="static/images/hexes/` + hex.n + `.png" alt=`+id+`>
      <img class="hex-image blinder" draggable=false src="static/images/blinder.png" alt=`+id+` hidden>
    </div>`;
		
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

  function ConditionalDisplay(check, el1) {
    if (check != null) {
      document.getElementById(el1).textContent = check;
    } else {
      document.getElementById(el1).textContent = "No Data";
    }
  }

  function DisplayFocusedHexInfo() {
    hex_info = hexes.filter(function(entry) { return entry.id == focused_hex.alt })[0];
    console.log(focused_hex.alt)
    document.getElementById('rightsidebar').style.display = "block";
    console.log(hex_info)

    ConditionalDisplay(hex_info.biome, "hex-biome")
    ConditionalDisplay(hex_info.features, "hex-features")
    ConditionalDisplay(hex_info.flora, "hex-flora")
    ConditionalDisplay(hex_info.fauna, "hex-fauna")
    ConditionalDisplay(hex_info.resources, "hex-resources")
    ConditionalDisplay(hex_info.developments, "hex-developments")
    ConditionalDisplay(hex_info.description, "hex-description")
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
    hex_tags = ["hex-biome", "hex-features", "hex-flora", "hex-fauna", "hex-resources", "hex-developments", "hex-description"]
    document.getElementById('hex-mod').addEventListener('click', function() {
      for (const name of hex_tags) {
        document.getElementById(name).style.display = 'none';
        document.getElementById(name + "-i").style.display = 'block';
        document.getElementById(name + "-i").placeholder = document.getElementById(name).textContent;
      }
      document.getElementById("hex-mod-confirm").style.display = 'block';
      document.getElementById("hex-mod").style.display = 'none';
    });
    document.getElementById('hex-mod-confirm').addEventListener('click', async function() {
      hex_info = hexes.filter(function(entry) { return entry.id == focused_hex.alt })[0];

      var sendUpdate = false;
      var upd_obj = {
        'id': hex_info.id,
        'biome': null,
        'description': null,
        'developments': null,
        'flora': null,
        'fauna': null,
        'resources': null,
        'features': null 
      }
      for (const name of hex_tags) {
        document.getElementById(name + "-i").style.display = 'none';
        document.getElementById(name).style.display = 'block';
        if (document.getElementById(name + "-i").value != '') {
          sendUpdate = true;
          hex_info[name.split('-')[1]] = document.getElementById(name + "-i").value;
          upd_obj[name.split('-')[1]] = document.getElementById(name + "-i").value;
          document.getElementById(name + "-i").value = "";
        }
      }

      if (sendUpdate) {
        const rawResponse = await fetch('update-hex', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(upd_obj)
        });
        const content = rawResponse;

        console.log(content);
      }

      DisplayFocusedHexInfo();
      
      document.getElementById("hex-mod-confirm").style.display = 'none';
      document.getElementById("hex-mod").style.display = 'block';
    });
  }

  // Closing Right Sidebar
  document.getElementById('close-sidebar').addEventListener('click', function() {
    document.getElementById('rightsidebar').style.display = 'none';
  });

  // Specific View Overlay:
  if (document.getElementById('open-view') != null) {
    document.getElementById('open-view').addEventListener('click', function() {
    document.getElementById('focus-cover').style.display = 'block';
    });
    document.getElementById('close-view').addEventListener('click', function() {
      document.getElementById('focus-cover').style.display = 'none';
    });
  }

  if (document.getElementById("alt-civ-views") != null) {

    var users = [];
    await fetch("/get-users")
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
      users = data;
    })
    console.log(users)

    var to_append = "";
    for (const u of users) {
      to_append += "<button class='button-opener user-selector' id='switch-to-user-" + u.id + "'>" + u.civ_name + "</button>";
    }
    S("#other-users").html(to_append);

    claims = []
    async function getClaims() {
      await fetch("/get-claims")
      .then((response) => {
          if (!response.ok) {
              throw new Error(`HTTP error ${response.status}`);
          }
          return response.json();
      })
      .then((data) => {
        claims = data;
      })
    }
    await getClaims();

    var activePlayer = "";
    for (const el of document.getElementsByClassName("user-selector")) {
      el.addEventListener('click', function () {
        activePlayer = el.textContent;
        var ownedHexes = claims.filter(function(entry) { return entry.owner == activePlayer })
        for (const bl of document.getElementsByClassName("blinder")) {
          if (ownedHexes.filter(function(entry) { return entry.hex_id == bl.alt }).length != 0) {
            bl.style.display = "none";
          } else {
            bl.style.display = "block";
          }
        }
      })
    }

    document.getElementById("alt-civ-views").addEventListener('click', function () {
      if (document.getElementById("other-users").style.display == 'block') {
        document.getElementById("other-users").style.display = 'none';
        for (const bl of document.getElementsByClassName("blinder")) {
          bl.style.display = "none";
        }
      } else {
        document.getElementById("other-users").style.display = 'block';
      }
    })
  }

});