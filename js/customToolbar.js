/**
 * 初始化标绘组件
 */
function initDrawToolbar(bool){
    if(drawTool) {
        if(!bool) destoryDrawToolbar()
        return
    }
    drawnItems.on("click",function(layer){
        drawItemTrigger(layer.layer)
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
 * 绘制图层点击事件触发函数
 * @param {*} feature 
 */
function drawItemTrigger(feature){
    if(bufferState){//缓冲区分析
        if($("#bufferItem")[0]){
            $("#bufferItem")[0].value = JSON.stringify(feature.toGeoJSON())
        }
    }else {//保存要素

    }
}

/**
 * 缓冲区
 */
function bufferTrigger(){
    var geojson
    var radius 
    if($("#bufferItem")[0] && $("#bufferItem")[0].value){
        geojson = JSON.parse($("#bufferItem")[0].value)
    }else{
        alert("请先选择要缓冲的要素")
        return
    }
    if($("#bufferValue")[0] && $("#bufferValue")[0].value){
        var value = parseFloat($("#bufferValue")[0].value)
        if(!isNaN(value)){
            radius = value
        } else{
            alert("请输入正确的缓冲半径")
            return
        }
    }else{
        alert("请输入缓冲半径")
        return
    }
    bufferFeature = turf.buffer(geojson, radius, {
        units: 'meters'
    })
    if(bufferGeo){
        map.removeLayer(bufferGeo)
        bufferGeo = null
    }
    bufferGeo = L.geoJSON(bufferFeature, {
        style: function() {
            return {
                color: 'red'
            }
        }
    }).addTo(map)
}

/**
 * 缓冲区分析
 */
function bufferAnalysisTrigger(){
    var layerName = $("#businessSelect")[0].value 
    var result = syncGetData(layerName)
    var results = []
    for(var i = 0 ; i < result.data.length ; i ++){
        var pt = turf.point([result.data[i].longtitude,result.data[i].latitude])
        if(turf.booleanPointInPolygon(pt, bufferFeature)){
            results.push(result.data[i])
        }  
    }
    if(results.length > 0){
        pagingControl(results)
    }else{
        $("#paging")[0] &&　($("#paging")[0].innerHTML = "")
        $("#infoContainer")[0] &&　($("#infoContainer")[0].innerHTML = "范围内无查询结果")
    }
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
    if(placeSearchControl) placeSearchControl._container.style.display = "none"
    if(searchControl){
        if(searchControl._container.style.display == "block" || !searchControl._container.style.display){
            searchControl._container.style.display = "none"
        }else{
            searchControl._container.style.display = "block"
            //searchControl._container.style.zIndex = 99999
        }
        return
    }
    searchControl = L.control.search({
        layer: poiLayers,
        initial: false,
        textPlaceholder : "请输入关键字...",
        position : config.searchPosition,
        propertyName: 'name',
        buildTip: function(text, val) {
            var type = val.layer.feature.properties.amenity
            return '<a href="#" class="' + type  +'">' + text + '<b>' + type + '</b></a>'
        }
    })
    //searchControl.options.propertyName = "name"
    searchControl.addTo(map)
}

/**
 * 地名检索要素
 */
function initPlaceSearchControl(){
    if(searchControl) searchControl._container.style.display = "none"
    if(placeSearchControl){
        if(placeSearchControl._container.style.display == "block" || !placeSearchControl._container.style.display){
            placeSearchControl._container.style.display = "none"
        }else{
            placeSearchControl._container.style.display = "block"
            placeSearchControl._container.style.zIndex = 99999
        }
        return
    }
    var layer = L.geoJson(chinaGeojson,{})
    var placeLayers = L.layerGroup()
    placeLayers.addLayer(layer)
    placeSearchControl = L.control.search({
        layer: placeLayers,
        textPlaceholder : "请输入地名关键字...",
        initial: false,
        position : config.searchPosition,
        propertyName: 'name',
        layerSymbol : true,
        buildTip : function(text, val) {
            //var type = val.layer.feature.properties.amenity
            return '<a href="#">' + text + '</a>'
        }
    })
    placeSearchControl.addTo(map)
}