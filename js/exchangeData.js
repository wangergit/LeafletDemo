/**
 * 数据交换
 * @param {} params 
 */
function exchangeData(params){
    if(!params.data || params.data.length == 0) return
    var results = {
        "type": "FeatureCollection",
        "generator": "overpass-turbo",
        "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.",
        "timestamp": "2015-08-08T19:03:02Z",
        "features" : []
    }
    for(var i = 0 ; i < params.data.length ; i ++){
        results.features.push({
            "type": "Feature",
            "id": params.data[i].id,
            "properties": params.data[i],
            "geometry": {
                "type": "Point",
                "coordinates": [
                    params.data[i].longtitude,
                    params.data[i].latitude
                ]
            }
        })
    }
    return results
}

/**
 * 处理聚合分析数据
 */
function exchangePruneClusterData (params){
    var results = {
        "features": []
    }
    for(var i = 0 ; i < params.data.length ; i ++){
        results.features.push({
            "geometry": {
                "coordinates": [
                    params.data[i].longtitude,
                    params.data[i].latitude
                ],
                "type": "Point"
            },
            "properties": params.data[i],
            "type": "Feature"
        })
    }
    return results
}

/**
 * 聚合图层
 */
function PruneClusterLayer(){
    var layerName = $("#businessSelect")[0].value 
    for(var i = 0 ; i < config.businessData.length ; i ++){
        if(config.businessData[i].name == layerName){
            //var src = config.businessData[i].xhrUrl
            // var str = ""
            // $.ajaxSettings.async = false
            // $.get(src,function(data,status){
            //     debugger
            //     str =  data
            // });
            // $.ajaxSettings.async = true
            // overlayMaps[config.businessData[i].name] = L.geoJson(str,geojsonOpts)
            var json = exchangePruneClusterData(data)
            leafletView = new PruneClusterForLeaflet(parseInt(document.getElementById('sizeInput').value))
            var markers = [] 
            for (var a = 0; a < json.features.length; a++) {
                var lon = json.features[a].geometry.coordinates[0]
                var lat = json.features[a].geometry.coordinates[1]
                if (lon != 0.0 && lat != 0.0) {
                    var marker = new PruneCluster.Marker(lat, lon);
                    markers.push(marker)
                    leafletView.RegisterMarker(marker)
                }
            }
            var lastUpdate = 0
            if(windowInterval) window.clearInterval(windowInterval)
            windowInterval = window.setInterval(function () {
                var now = +new Date()
                if ((now - lastUpdate) < 400) {
                    return
                }
                for (i = 0; i < size / 2; ++i) {
                    var coef = i < size / 8 ? 10 : 1
                    var ll = markers[i].position
                    ll.lat += (Math.random() - 0.5) * 0.00001 * coef
                    ll.lng += (Math.random() - 0.5) * 0.00002 * coef
                }
                leafletView.ProcessView()
                lastUpdate = now
            }, 500)
            map.addLayer(leafletView)
            var currentSizeSpan = document.getElementById('currentSize')
            var updateSize = function () {
                leafletView.Cluster.Size = parseInt(this.value)
                currentSizeSpan.firstChild.data = this.value
                var now = +new Date()
                if ((now - lastUpdate) < 400) {
                    return
                }
                leafletView.ProcessView()
                lastUpdate = now
            };
            document.getElementById('sizeInput').onchange = updateSize
            document.getElementById('sizeInput').oninput = updateSize
            break
        }
    }
}

/**
 * 清除聚合分析数据
 */
function clearPruneClusterLayer(){
    if(windowInterval) window.clearInterval(windowInterval)
    if(leafletView) {
        map.removeLayer(leafletView)
        leafletView.removeFrom()
        leafletView = null
    }
}

/**
 * 处理热力分析数据
 */
function exchangeHeatLayerData (params){
    var results = []
    for(var i = 0 ; i < params.data.length ; i ++){
        results.push([params.data[i].latitude,params.data[i].longtitude])
    }
    return results
}

/**
 * 热力图层
 */
function HeatLayer(){
    var layerName = $("#businessSelect")[0].value 
    for(var i = 0 ; i < config.businessData.length ; i ++){
        if(config.businessData[i].name == layerName){
            //var src = config.businessData[i].xhrUrl
            // var str = ""
            // $.ajaxSettings.async = false
            // $.get(src,function(data,status){
            //     debugger
            //     str =  data
            // });
            // $.ajaxSettings.async = true
            // overlayMaps[config.businessData[i].name] = L.geoJson(str,geojsonOpts)
            var addressPoints = exchangeHeatLayerData(data)
            heatMapLayer = L.heatLayer(addressPoints)
            map.addLayer(heatMapLayer)
            break
        }
    }
}

/**
 * 清空热力图层
 */
function clearHeatLayer(){
    if(heatMapLayer) {
        map.removeLayer(heatMapLayer)
        heatMapLayer = null
    }
}

