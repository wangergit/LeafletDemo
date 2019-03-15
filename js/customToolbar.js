/**
 * 初始化标绘组件
 */
function initDrawToolbar(){
    if(drawTool) {
        destoryDrawToolbar()
        return
    }
    drawnItems.on("click",function(layer){
        console.log(layer.layer.toGeoJSON())
    })
    drawTool = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            poly : {
                allowIntersection : false
            }
        },
        draw: {
            polygon : {
                allowIntersection: false,
                showArea:true
            }
        }
    })
    map.addControl(drawTool)
    var _round = function(num, len) {
        return Math.round(num*(Math.pow(10, len)))/(Math.pow(10, len));
    }
    var strLatLng = function(latlng) {
        return "(" + _round(latlng.lat, 3) + ", " + _round(latlng.lng, 3) + ")";
    }
    var getPopupContent = function(layer) {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
            return strLatLng(layer.getLatLng())
        } else if (layer instanceof L.Circle) {
            var center = layer.getLatLng(),radius = layer.getRadius()
            return "Center: "+strLatLng(center)+"<br />" +"Radius: "+_round(radius, 2)+" m"
        } else if (layer instanceof L.Polygon) {
            var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
                area = L.GeometryUtil.geodesicArea(latlngs)
            return "Area: " + L.GeometryUtil.readableArea(area, true)
        } else if (layer instanceof L.Polyline) {
            var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
                distance = 0
            if (latlngs.length < 2) {
                return "Distance: N/A"
            } else {
                for (var i = 0; i < latlngs.length-1; i++) {
                    distance += latlngs[i].distanceTo(latlngs[i+1])
                }
                return "Distance: "+_round(distance, 2)+" m"
            }
        }
        return null
    }
    map.on(L.Draw.Event.CREATED, function(event) {
        var layer = event.layer
        //以下是点击弹出长度距离面积
        // var content = getPopupContent(layer)
        // if (content !== null) {
        //     layer.bindPopup(content)
        // }
        drawnItems.addLayer(layer)
    })
    map.on(L.Draw.Event.EDITED, function(event) {
        // var layers = event.layers,
        //     content = null
        // layers.eachLayer(function(layer) {
        //     content = getPopupContent(layer)
        //     if (content !== null) {
        //         layer.setPopupContent(content)
        //     }
        // })
    })
}

/**
 * 销毁标绘组件
 */
function destoryDrawToolbar(){
    map.removeControl(drawTool)
    drawTool.remove()
    drawTool = null
    //drawnItems.removeLayers()
    // map.removeLayer(drawnItems)
    // drawnItems = null
}

/**
 * 图层检索要素
 */
function initSearchControl(){
    if(searchControl){
        if($(".leaflet-control-search")[0].style.display == "block" || !$(".leaflet-control-search")[0].style.display){
            $(".leaflet-control-search")[0].style.display = "none"
        }else{
            $(".leaflet-control-search")[0].style.display = "block"
            searchControl.expand()
        }
        return
    }
    searchControl = L.control.search({
        layer: poiLayers,
        initial: false,
        position : config.searchPosition,
        propertyName: 'name',
        buildTip: function(text, val) {
            var type = val.layer.feature.properties.amenity
            return '<a href="#" class="' + type  +'">' + text + '<b>' + type + '</b></a>'
        }
    })
    //searchControl.options.propertyName = "name"
    searchControl.addTo(map)
    searchControl.expand()
}