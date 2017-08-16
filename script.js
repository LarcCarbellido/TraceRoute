// MAPS for wayfinding
var MAPS = [
      {'path': 'mapa0.svg', 'id': 'mapa0'},
      {'path': 'mapa1.svg', 'id': 'mapa1'}
    ];
// Value initial 
var START_ROOM = 's121';
var DEFAULT_MAP = 'mapa0';
var lastRoomSelected;
    
// Vars for zoom
var MAX_ZOOM_IN = 16.0;
var MAX_ZOOM_OUT = 1.0;
var zoomScaleStep = 2;
var zoomTranslationMap = d3.map();
var translationStep = 100;
var zoomable_layer, zoom;
var zoomObjects = [];

zoomTranslationMap.set(1, 0.0);
zoomTranslationMap.set(2, 1.0);
zoomTranslationMap.set(4, 3.0);
zoomTranslationMap.set(8, 2.33);
zoomTranslationMap.set(16, 2.14);

//Setup options for wayfinding
$(document).ready(function () {
  'use strict';
  $('#myMaps').wayfinding({
    'maps': MAPS,
    'path': {
      width: 3,
      color: 'red',
      radius: 8,
      speed: 5
    },
    'startpoint': function () {
      return START_ROOM;
    },
    'defaultMap': DEFAULT_MAP
  });

  //Make the floor buttons clickable
  $("#controls button").click(function () {
    $("#myMaps").wayfinding('currentMap',$(this).attr('id'));
  });
  $('#controls #beginSelect').change(function () {
    $('#myMaps').wayfinding('startpoint', $(this).val());
    if ($('#controls .endSelect').val() !== '') {
      $('#myMaps').wayfinding('routeTo', $('#controls #endSelect').val());
    }
  });

  $('#controls #endSelect').change(function () {
    $('#myMaps').wayfinding('routeTo', $(this).val());
  });

  $('#controls #accessible').change(function () {
    if ($('#controls #accessible:checked').val() !== undefined) {
      $('#myMaps').wayfinding('accessibleRoute', true);
    } else {
      $('#myMaps').wayfinding('accessibleRoute', false);
    }
    $('#myMaps').wayfinding('routeTo', $('#controls #endSelect').val());
  });
        
  setZoomEnvironment();
  
});

//Create the zoom beaviour and wait for map creation and then set zoom behaviour on it
function setZoomEnvironment(){
  
  //Create the zoom behavior to set for the draw
  zoom = d3.behavior.zoom().scaleExtent([MAX_ZOOM_OUT, MAX_ZOOM_IN]).on('zoom', zoomed);
  
  //Wait for the creation of all maps
  waitMapsCreation();
}

function waitMapsCreation(){
  
  var checkMapsCreationFunction = setInterval(function() {
    
    var allMapsCreated = true;
    $.map(MAPS, function(value) {
      if($('#' + value.id).length == 0){
        allMapsCreated = false;
      }
    });
    if(allMapsCreated){
      //Cancel the timer
      clearInterval(checkMapsCreationFunction);
      //Create the zoom environment
      $.map(MAPS, function(value) {
        setZoomBehaviourForMap(value.id);
      });
      //Update the destination in the drop-down menu when the correspondent room is clicked and create the custom context menu
      $('#Rooms a')
        .on('click', function () {
          $('#controls #endSelect option[value="' + $(this).prop('id') + '"]').attr('selected', true);
        })
        .on('contextmenu', function (event) {
          // Avoid the real one
          event.preventDefault();
          //Set the last room selected
          lastRoomSelected = $(this).prop('id');
          // Show contextmenu
          $(".custom-menu").finish().toggle(100).
          // In the right position (the mouse)
          css({
            top: event.pageY + "px",
            left: event.pageX + "px"
          });
        })
        .on("mousedown", function (e) {
          // If the clicked element is not the menu
          if (!$(e.target).parents(".custom-menu").length > 0) {	
            // Hide it
            $(".custom-menu").hide(100);
          }
        });
      //Set the actions to do on the option selection in the context menu
      $(".custom-menu li").click(function(){
        
        // This is the triggered action name
        switch($(this).attr("data-action")) {
          // A case for each action. Your actions here
          case "source":
            $('#controls #beginSelect option[value="' + lastRoomSelected + '"]').attr('selected', true);
            $('#controls #beginSelect').trigger("change");
            break;
          case "sink":
            $('#controls #endSelect option[value="' + lastRoomSelected + '"]').attr('selected', true);
            $('#controls #endSelect').trigger("change");
            break;
        }
        
        // Hide it AFTER the action was triggered
        $(".custom-menu").hide(100);
      });
    }
  }, 100); // check every 100ms
}

function setZoomBehaviourForMap(mapId){
      
  //Create specific variables for map zooming
  var mapObj = d3.select('#' + mapId + " svg").call(zoom);
  var zoomMap = mapObj.select("g");
  var svgWidth = mapObj.attr('width').replace('px', '');
  var svgHeight = mapObj.attr('height').replace('px', '');
  var centerX = d3.round(-(svgWidth / 2));
  var centerY = d3.round(-(svgHeight / 2));
  
  zoomObjects[mapId] = {
    zoomMap: zoomMap, 
    svgWidth:  svgWidth,
    svgHeight: svgHeight,
    centerX: centerX,
    centerY: centerY
  };
        
  //Set the zoom behavior on the floor		
  //zoomMap.call(zoom);
}
    
//Function called on the zoom event. It translate the draw on the zoommed point and scale with a certain factor
function zoomed() {	
  
  var id = d3.select(this.parentNode).attr("id");
  var zoomObj = zoomObjects[id];
  zoomObj.centerX = d3.round(d3.event.translate[0]);
  zoomObj.centerY = d3.round(d3.event.translate[1]);
  //alert("Richiesto livello di zoom " + d3.event.scale + " e traslazione in " + centerX + ", " + centerY);
  zoomObj.zoomMap.attr("transform", "translate(" + zoomObj.centerX + ", " + zoomObj.centerY + ")scale(" + d3.event.scale + ")");
}