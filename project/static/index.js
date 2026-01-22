var hex_data = [];
var focused_civ_stats = [];
var focused_civ_demographics = [];
var focused_civ_abilities = [];
var focused_civ_techs = [];
var users = [];
var claims = [];
var civ_stats = [];
var curZoom = 1
var focused_hex = null;

var _startX = 0;
var _startY = 0;
var _offsetX = 0;           
var _offsetY = 0;
var _dragElement;

var activePlayer = "";
var activeId = null;

var selectingHexesToSave = false;
var hexesToRegister = [];

var selectingHexesToDelete = false;
var hexesToDeregister = [];

var rads = 72 / 180 * Math.PI;

/**
 * Creates the Hexmap.
 */
async function createHexmap() {
  await fetch("/get-hexes")
  .then((response) => {
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
  })
  .then((data) => {
    hex_data = data;
  })
  if (hex_data.length == 0) return;

  max_x = Math.max(...hex_data.map(o => o.x));
  min_x = Math.min(...hex_data.map(o => o.x));
  max_y = Math.max(...hex_data.map(o => o.y));
  min_y = Math.min(...hex_data.map(o => o.y));

	hexstr = `<code>
				{
					"layout":"odd-q",
                    "hexes": {
			`

	for (i = 0; i < hex_data.length; i++) {
    hexstr += `"` + hex_data[i].id + `":{"n":"` + hex_data[i].id + `","q":`+ hex_data[i].x +`,"r":`+ (24 - hex_data[i].y) +`,"alt":"` + `` + `","type":"horizontal"}`
    if (i != hex_data.length - 1) {
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
      <img class="hex-image" id="hex-img-` + hex.n + `" draggable=false src="static/images/hexes/` + hex.n + `.png" alt=`+id+`>
      <img class="hex-image blinder" id="hex-img-blinder-` + hex.n + `" draggable=false src="static/images/blinder.png" alt=`+id+` hidden>
    </div>`;
		
		// Build the circular token that sits on a hex
		
		return str;
	})
	
	// Set the CSS class of each hex to be the hex type
	hexmap.setClass(function(id,hex){
		return hex.type;
	});
}

/**
 * Gets claims for the logged in user.
 */
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

/**
 * Gets data for authorized civs.
 */
async function getCivs() {
  await fetch("/get-active-civs")
  .then((response) => {
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
  })
  .then((data) => {
    civ_stats = data;
  })
}

/**
 * Sends requests to acquire all relevant data.
 */
async function loadAllData() {
  if (document.getElementById("alt-civ-views") != null) {
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
    await getClaims();
  }
  await getCivs();
  if (civ_stats.length == 1) {
    activePlayer = civ_stats[0].owner;
  }
  await createHexmap();
}

/**
 * Helper to draw the inner pentagon of the stat area.
 * @param {*} canvas The canvas to draw on.
 * @param {*} origin The middle of the canvas.
 * @param {*} len The size of the pentagon.
 */
function drawPentaToScale(canvas, origin, len) {
  canvas.beginPath();
  canvas.moveTo(origin, origin - len);
  canvas.lineTo(origin - (len * Math.sin(rads)), origin - (len * Math.cos(rads)));
  canvas.lineTo(origin - (len * Math.sin(2 * rads)), origin - (len * Math.cos(2 * rads)));
  canvas.lineTo(origin + (len * Math.sin(2 * rads)), origin - (len * Math.cos(2 * rads)));
  canvas.lineTo(origin + (len * Math.sin(rads)), origin - (len * Math.cos(rads)));

  canvas.closePath();
  canvas.strokeStyle = 'rgba(0, 0, 0, 30%)'
  canvas.stroke();
}

/**
 * Draws the stat area.
 */
function drawPenta() {
  var el = document.getElementById("hex-stats").getBoundingClientRect();
  var canvas_main = document.getElementById("hex-stats-pentagon");
  var origin = el.height / 2;
  canvas_main.width = el.height;
  canvas_main.height = el.height;
  var canvas = canvas_main.getContext('2d');
  
  canvas.beginPath();
  canvas.moveTo(origin, origin - (25 * (focused_civ_stats.wood + 1)));
  canvas.lineTo(origin - ((25 * (focused_civ_stats.fire + 1)) * Math.sin(rads)), origin - ((25 * (focused_civ_stats.fire + 1)) * Math.cos(rads)));
  canvas.lineTo(origin - ((25 * (focused_civ_stats.earth + 1)) * Math.sin(2 * rads)), origin - ((25 * (focused_civ_stats.earth + 1)) * Math.cos(2 * rads)));
  canvas.lineTo(origin + ((25 * (focused_civ_stats.metal + 1)) * Math.sin(2*rads)), origin - ((25 * (focused_civ_stats.metal + 1)) * Math.cos(2*rads)));
  canvas.lineTo(origin + ((25 * (focused_civ_stats.water + 1)) * Math.sin(rads)), origin - ((25 * (focused_civ_stats.water + 1)) * Math.cos(rads)));

  canvas.closePath();
  canvas.stroke();

  drawPentaToScale(canvas, origin, 25);
  drawPentaToScale(canvas, origin, 50);
  drawPentaToScale(canvas, origin, 75);
  drawPentaToScale(canvas, origin, 100);
  drawPentaToScale(canvas, origin, 125);

  var len = 145;
  // canvas.textBaseline = "middle";
  canvas.strokeStyle = 'rgba(0, 0, 0)'
  canvas.textAlign = "center";
  canvas.font = "1em Times New Roman"

  canvas.fillText("Wood", origin, (origin - len))
  canvas.fillText("Fire", origin - (len * Math.sin(rads)), origin - (len * Math.cos(rads)))
  canvas.fillText("Earth", origin - (len * Math.sin(2 * rads)), origin - (len * Math.cos(2 * rads)))
  canvas.fillText("Metal", origin + (len * Math.sin(2*rads)), origin - (len * Math.cos(2*rads)))
  canvas.fillText("Water", origin + (len * Math.sin(rads)), origin - (len * Math.cos(rads)))
}


/**
 * Performs the zoom operation on the Hexmap.
 * @param {*} zoomincrement The increment to zoom to.
 */
function zoom(zoomincrement) {
  S.hexmap('hexmap-9').setZoom(zoomincrement);
}

/**
 * Configures zoom in and out to elements with ID zoomin and zoomout
 */
function configListeners() {
  document.getElementById('zoomout').addEventListener('click', function() {
    curZoom /= 2;
    zoom(curZoom);
  });
  document.getElementById('zoomin').addEventListener('click', function() {
    curZoom *= 2;
    zoom(curZoom);
  });
}

/**
 * Conditionally displays data based on if the given data is null.
 * @param {*} data  Data to display if not null.
 * @param {*} id    Element to display data in.
 */
function ConditionalDisplay(data, id) {
  if (data != null) {
    document.getElementById(id).textContent = data;
  } else {
    document.getElementById(id).textContent = "No Data";
  }
}

/**
 * Displays information about the current focused Hex.
 */
function DisplayFocusedHexInfo() {
  hex_info = hex_data.filter(function(entry) { return entry.id == focused_hex.alt })[0];
  document.getElementById('rightsidebar').style.display = "block";

  ConditionalDisplay(hex_info.biome, "hex-biome")
  ConditionalDisplay(hex_info.features, "hex-features")
  ConditionalDisplay(hex_info.flora, "hex-flora")
  ConditionalDisplay(hex_info.fauna, "hex-fauna")
  ConditionalDisplay(hex_info.resources, "hex-resources")
  ConditionalDisplay(hex_info.developments, "hex-developments")
  ConditionalDisplay(hex_info.description, "hex-description")
}

async function getTechs() {
  await fetch("/get-techs?civ="+activePlayer)
  .then((response) => {
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
  })
  .then((data) => {
    focused_civ_techs = data;
  })

  var tech_str = "";
  for (const tech of focused_civ_techs) {
    tech_str += `
      <div class="tech table-entry">
          <p class="tech-title" id="tech-title-`+ tech.id +`"><b>` + tech.tech + `</b></p>
          <pre class="tech-desc description" id="tech-desc-`+ tech.id +`">` + tech.desc + `</pre>`
    if (document.getElementById("alt-civ-views") != null) {
      tech_str += `<button id="delete-tech-` + tech.id + `" class="button-delete"><img class="icon" src="static/images/x-solid-full.svg"></button>`
    }
    tech_str += `</div>`
  }
  S("#tech-table").html(tech_str);
  if (document.getElementById("alt-civ-views") != null) {
    for (const tech of focused_civ_techs) {
      document.getElementById("delete-tech-" + tech.id).addEventListener('click', async function() {
        await fetch('delete-tech', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({"id": tech.id})
        });
        await getTechs();
      });
    }
  }
}

async function getStats() {
  await fetch("/get-stats?civ="+activePlayer)
  .then((response) => {
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
  })
  .then((data) => {
    focused_civ_stats = data;
  })
}

async function getAbilities() {
  await fetch("/get-abilities?civ="+activePlayer)
  .then((response) => {
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
  })
  .then((data) => {
    focused_civ_abilities = data;
  })

  var ability_str = "";
  for (const ability of focused_civ_abilities) {
    ability_str += `
      <div class="ability table-entry">
          <p class="entry-title" id="ability-title-`+ ability.id +`"><b>` + ability.tech + `</b></p>
          <pre class="entry-desc description" id="ability-desc-`+ ability.id +`">` + ability.desc + `</pre>`
    if (document.getElementById("alt-civ-views") != null) {
      ability_str += `<button id="delete-ability-` + ability.id + `" class="button-delete"><img class="icon" src="static/images/x-solid-full.svg"></button>`
    }
    ability_str += `</div>`
  }
  S("#ability-table").html(ability_str);
  if (document.getElementById("alt-civ-views") != null) {
    for (const ability of focused_civ_abilities) {
      document.getElementById("delete-ability-" + ability.id).addEventListener('click', async function() {
        await fetch('delete-ability', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({"id": ability.id})
        });
        await getAbilities();
      });
    }
  }
}

async function getDemographics() {
  await fetch("/get-demographics?civ="+activePlayer)
  .then((response) => {
      if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
      }
      return response.blob();
  })
  .then((data) => {
    S("#demographics-table").html(`<img class="table-image" src="` + URL.createObjectURL(data) + `">`)
  })
}

async function DisplayChosenCivInfo() {
  await getTechs();
  await getDemographics();
  await getAbilities();
  await getStats();
  document.getElementById("civ-title").textContent = activePlayer
  ConditionalDisplay(focused_civ_stats.wood, "stats-wood")
  ConditionalDisplay(focused_civ_stats.fire, "stats-fire")
  ConditionalDisplay(focused_civ_stats.earth, "stats-earth")
  ConditionalDisplay(focused_civ_stats.metal, "stats-metal")
  ConditionalDisplay(focused_civ_stats.water, "stats-water")
  ConditionalDisplay(focused_civ_stats.wood_total, "stats-total-wood")
  ConditionalDisplay(focused_civ_stats.fire_total, "stats-total-fire")
  ConditionalDisplay(focused_civ_stats.earth_total, "stats-total-earth")
  ConditionalDisplay(focused_civ_stats.metal_total, "stats-total-metal")
  ConditionalDisplay(focused_civ_stats.water_total, "stats-total-water")

  
  drawPenta();
}

/***
 * MAIN FUNCTIONALITY:
 * Configure the doc onload : )
 */
S(document).ready(async function(){
  await loadAllData();
  configListeners(); 

  // Drag functionality:
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
      if (selectingHexesToSave == true || selectingHexesToDelete == true) {
        const id = event.target.alt;
        var pos = null;
        if (selectingHexesToSave) {
          pos = hexesToRegister.indexOf(id);
        } else {
          pos = hexesToDeregister.indexOf(id);
        }
        
        if (pos > -1) {
          document.getElementById("hex-img-" + id).className = "hex-image";
          if (selectingHexesToSave) {
            hexesToRegister.splice(pos, 1);
          } else {
            hexesToDeregister.splice(pos, 1);
          }
        } else {
          document.getElementById("hex-img-" + id).className += " focusedhex";
          if (selectingHexesToSave) {
            hexesToRegister.push(id);
          } else {
            hexesToDeregister.push(id);
          }
        }
      } else {
        if (focused_hex != null && focused_hex.alt == event.target.alt) {
          focused_hex.className = "hex-image";
          focused_hex = null;
          document.getElementById('rightsidebar').style.display = 'none';
        } else if (focused_hex != null) {
          focused_hex.className = "hex-image";
          focused_hex = null;
          focused_hex = document.getElementById("hex-img-" + event.target.alt);
          focused_hex.className += " focusedhex"
          DisplayFocusedHexInfo();
        } else {
          focused_hex = document.getElementById("hex-img-" + event.target.alt);
          focused_hex.className += " focusedhex"
          DisplayFocusedHexInfo();
        }
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
        document.getElementById(name).contentEditable = 'true';
      }
      document.getElementById("hex-mod-confirm").style.display = 'block';
      document.getElementById("hex-mod").style.display = 'none';
    });
    document.getElementById('hex-mod-confirm').addEventListener('click', async function() {
      hex_info = hex_data.filter(function(entry) { return entry.id == focused_hex.alt })[0];

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
        document.getElementById(name).contentEditable = 'false';
        hex_info[name.split('-')[1]] = document.getElementById(name).textContent;
        upd_obj[name.split('-')[1]] = document.getElementById(name).textContent;
      }

      await fetch('update-hex', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(upd_obj)
      });
      

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
      DisplayChosenCivInfo();
    });
    document.getElementById('close-view').addEventListener('click', function() {
      document.getElementById('focus-cover').style.display = 'none';
    });
  }

  if (document.getElementById("alt-civ-views") != null) {
    var to_append = "";
    for (const u of users) {
      to_append += "<button class='button-opener user-selector' id='switch-to-user-" + u.id + "'>" + u.civ_name + "</button>";
    }
    S("#other-users").html(to_append);

    function applyBlinders() {
      var ownedHexes = claims.filter(function(entry) { return entry.owner == activePlayer })
      for (const bl of document.getElementsByClassName("blinder")) {
        if (ownedHexes.filter(function(entry) { return entry.hex_id == bl.alt }).length != 0) {
          bl.style.display = "none";
        } else {
          bl.style.display = "block";
        }
      }
    }

    for (const el of document.getElementsByClassName("user-selector")) {
      el.addEventListener('click', function () {
        activePlayer = el.textContent;
        activeId = users.filter(function(u) { return u.civ_name == activePlayer });
        document.getElementById("civ-manager").style.display = "block";
        S("#civ-view").html("Viewing: " + activePlayer);
        applyBlinders();
      })
    }

    document.getElementById("add-start").addEventListener('click', function () {
      document.getElementById("add-start").style.display = 'none';
      document.getElementById("add-confirm").style.display = 'block';
      document.getElementById("add-cancel").style.display = 'block';

      document.getElementById('rightsidebar').style.display = 'none';
      
      if (focused_hex != null) {
        focused_hex.className = "hex-image";
        focused_hex = null;
      }

      selectingHexesToSave = true;
      hexesToRegister = [];
    });

    document.getElementById("add-confirm").addEventListener('click', async function () {
      document.getElementById("add-start").style.display = 'block';
      document.getElementById("add-confirm").style.display = 'none';
      document.getElementById("add-cancel").style.display = 'none';

      if (hexesToRegister.length > 0) {
        var toUpload = {
          "register-to": activePlayer,
          "hex-ids": []
        };
        for (const h of hexesToRegister) {
          toUpload['hex-ids'].push(h)
        }

        await fetch('register-hexes', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(toUpload)
        });

        await getClaims();
        applyBlinders();
      }
      
      document.querySelectorAll(".focusedhex").forEach(function (el) {
        el.className = "hex-image";
      });
      selectingHexesToSave = false;
      hexesToRegister = [];
    });

    document.getElementById("add-cancel").addEventListener('click', function () {
      document.getElementById("add-start").style.display = 'block';
      document.getElementById("add-confirm").style.display = 'none';
      document.getElementById("add-cancel").style.display = 'none';

      selectingHexesToSave = false;
      hexesToRegister = [];
    });

    document.getElementById("remove-start").addEventListener('click', function () {
      document.getElementById("remove-start").style.display = 'none';
      document.getElementById("remove-confirm").style.display = 'block';
      document.getElementById("remove-cancel").style.display = 'block';

      document.getElementById('rightsidebar').style.display = 'none';

      if (focused_hex != null) {
        focused_hex.className = "hex-image";
        focused_hex = null;
      }

      selectingHexesToDelete = true;
      hexesToDeregister = [];
    });

    document.getElementById("remove-confirm").addEventListener('click', async function () {
      document.getElementById("remove-start").style.display = 'block';
      document.getElementById("remove-confirm").style.display = 'none';
      document.getElementById("remove-cancel").style.display = 'none';

      if (hexesToDeregister.length > 0) {
        var toUpload = {
          "delete-from": activePlayer,
          "hex-ids": []
        };
        for (const h of hexesToDeregister) {
          toUpload['hex-ids'].push(h)
        }

        await fetch('deregister-hexes', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(toUpload)
        });

        await getClaims();
        applyBlinders();
      }
      
      document.querySelectorAll(".focusedhex").forEach(function (el) {
        el.className = "hex-image";
      });
      selectingHexesToDelete = false;
      hexesToDeregister = [];
    });

    document.getElementById("remove-cancel").addEventListener('click', function () {
      document.getElementById("remove-start").style.display = 'block';
      document.getElementById("remove-confirm").style.display = 'none';
      document.getElementById("remove-cancel").style.display = 'none';

      selectingHexesToDelete = false;
      hexesToDeregister = [];
    });

    document.getElementById("alt-civ-views").addEventListener('click', function () {
      if (document.getElementById("other-users").style.display == 'block') {
        activePlayer = "";
        activeId = null;
        document.getElementById("other-users").style.display = "none";
        document.getElementById("civ-manager").style.display = "none";
        for (const bl of document.getElementsByClassName("blinder")) {
          bl.style.display = "none";
        }
      } else {
        document.getElementById("other-users").style.display = 'block';
      }
    })

    var stat_names = ["fire", "water", "earth", "metal", "wood"];
    document.getElementById("modify-stats-start").addEventListener('click', function () {
      document.getElementById("modify-stats-start").style.display = 'none';
      document.getElementById("modify-stats-confirm").style.display = 'block';
      document.getElementById("modify-stats-cancel").style.display = 'block';

      for (const stat of stat_names) {
        document.getElementById("stats-" + stat).contentEditable = 'true';
        document.getElementById("stats-total-" + stat).contentEditable = 'true';
      }
    });

    document.getElementById("modify-stats-confirm").addEventListener('click', async function () {
      document.getElementById("modify-stats-start").style.display = 'block';
      document.getElementById("modify-stats-confirm").style.display = 'none';
      document.getElementById("modify-stats-cancel").style.display = 'none';
      
      var toUpload = {
        "owner": activePlayer,
        "fire": null, 
        "water": null, 
        "earth": null, 
        "metal": null, 
        "wood": null,
        "fire_total": null, 
        "water_total": null, 
        "earth_total": null, 
        "metal_total": null, 
        "wood_total": null
      }
      for (const stat of stat_names) {
        document.getElementById("stats-" + stat).contentEditable = 'false';
        toUpload[stat] = document.getElementById("stats-" + stat).textContent;
        document.getElementById("stats-total-" + stat).contentEditable = 'false';
        toUpload[stat+"_total"] = document.getElementById("stats-total-" + stat).textContent;
      }

      await fetch('update-stats', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(toUpload)
      });

      await getCivs();
      DisplayChosenCivInfo();
    });

    document.getElementById("modify-stats-cancel").addEventListener('click', function () {
      document.getElementById("modify-stats-start").style.display = 'block';
      document.getElementById("modify-stats-confirm").style.display = 'none';
      document.getElementById("modify-stats-cancel").style.display = 'none';

      for (const stat of stat_names) {
        document.getElementById("stats-" + stat).style.display = 'inline';
        document.getElementById("stats-" + stat + "-i").style.display = 'none';
        document.getElementById("stats-" + stat + "-i").value = "";
      }
    });
    document.getElementById("edit-tech-start").addEventListener('click', function() {
      document.getElementById("edit-tech-start").style.display = 'none';
      document.getElementById("edit-tech-confirm").style.display = 'inline';
      for (const tech of focused_civ_techs) {
        document.getElementById("tech-title-" + tech.id).contentEditable = 'true';
        document.getElementById("tech-desc-" + tech.id).contentEditable = 'true';
      }
    });
    document.getElementById("edit-tech-confirm").addEventListener('click', async function() {
      document.getElementById("edit-tech-start").style.display = 'inline';
      document.getElementById("edit-tech-confirm").style.display = 'none';

      var upd_obj = {
        "update": []
      };
      for (const tech of focused_civ_techs) {
        var title = document.getElementById("tech-title-" + tech.id);
        var desc = document.getElementById("tech-desc-" + tech.id);
        title.contentEditable = 'false';
        desc.contentEditable = 'false';
        if (title.textContent != tech.title || desc.textContent != tech.desc) {
          var up = {
            "id": tech.id,
            "name": null,
            "description": null
          };
          if (title.textContent != tech.title) {
            up.name = title.textContent;
          }
          if (desc.textContent != tech.desc) {
            up.description = desc.textContent;
          }
          upd_obj.update.push(up);
        }
      }

      await fetch('update-techs', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(upd_obj)
      });

      await getTechs()
    });

    document.getElementById("new-tech").addEventListener('click', async function() {
      await fetch('create-tech', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "player": activePlayer,
          "name": "New Tech",
          "description": "New Description"
        })
      });

      await getTechs()
    });
    document.getElementById("new-demographics").addEventListener('click', async function () {
      var f = document.getElementById("demographics-file-upload").files[0]
      if (f != undefined) {
        await fetch('create-demographic?civ='+ activePlayer, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: f
        });
        getDemographics();
      }
    });
    document.getElementById("edit-ability-start").addEventListener('click', function() {
      document.getElementById("edit-ability-start").style.display = 'none';
      document.getElementById("edit-ability-confirm").style.display = 'inline';
      for (const ability of focused_civ_abilities) {
        document.getElementById("ability-title-" + ability.id).contentEditable = 'true';
        document.getElementById("ability-desc-" + ability.id).contentEditable = 'true';
      }
    });
    document.getElementById("edit-ability-confirm").addEventListener('click', async function() {
      document.getElementById("edit-ability-start").style.display = 'inline';
      document.getElementById("edit-ability-confirm").style.display = 'none';

      var upd_obj = {
        "update": []
      };
      for (const ability of focused_civ_abilities) {
        var title = document.getElementById("ability-title-" + ability.id);
        var desc = document.getElementById("ability-desc-" + ability.id);
        title.contentEditable = 'false';
        desc.contentEditable = 'false';
        if (title.textContent != ability.title || desc.textContent != ability.desc) {
          var up = {
            "id": ability.id,
            "name": null,
            "description": null
          };
          if (title.textContent != ability.title) {
            up.name = title.textContent;
          }
          if (desc.textContent != ability.desc) {
            up.description = desc.textContent;
          }
          upd_obj.update.push(up);
        }
      }

      await fetch('update-abilities', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(upd_obj)
      });

      await getAbilities()
    });

    document.getElementById("new-ability").addEventListener('click', async function() {
      await fetch('create-ability', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "player": activePlayer,
          "name": "New ability",
          "description": "New Description"
        })
      });

      await getAbilities()
    });
  }
});

function isNumberKey(evt) {
  var charCode = (evt.which) ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57))
    return false;
  return true;
}