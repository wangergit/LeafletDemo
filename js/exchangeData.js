/**
 * 数据交换
 * @param {} params 
 */
function exchangeData(params,amenity){
    if(!params.data || params.data.length == 0) return
    var results = {
        "type": "FeatureCollection",
        "generator": "overpass-turbo",
        "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.",
        "timestamp": "2015-08-08T19:03:02Z",
        "features" : []
    }
    for(var i = 0 ; i < params.data.length ; i ++){
        if(amenity) params.data[i].amenity = amenity
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
    var json = exchangePruneClusterData(syncGetData(layerName))
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
        if(leafletView){
            leafletView.Cluster.Size = parseInt(this.value)
            leafletView.ProcessView()
        }
        currentSizeSpan.firstChild.data = this.value
        var now = +new Date()
        if ((now - lastUpdate) < 400) {
            return
        }
        lastUpdate = now
    };
    document.getElementById('sizeInput').onchange = updateSize
    document.getElementById('sizeInput').oninput = updateSize
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
    var addressPoints = exchangeHeatLayerData(syncGetData(layerName))
    heatMapLayer = L.heatLayer(addressPoints)
    map.addLayer(heatMapLayer)
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

/**
 * 请求JSON数据
 * @param path  请求路径   String
 * @param type  请求类型   "GET"/"POST"
 * @param callback  function
 */
function sendAjax(path , type , callback){
	$.ajax({
		type : type,
		url : path,
		dataType : "json",
		contentType:"application/json;charset=utf-8",
		success : function(result) {
			callback && callback(result)
		},
		error : function(error){
			callback && callback(error)
		}
	})
}

/**
 * 同步抓取数据
 * @param {*} name 
 * @param {*} url 
 * @param {*} callback 
 */
function syncGetData(name,url,callback){
    var path = url ? url : ""
    if(!path){
        for(var i = 0 ; i < config.businessData.length ; i ++){
            if(config.businessData[i].name == name){
                path = config.businessData[i].xhrUrl
                break
            }
        }
    }
    var results = {}
    if(path){
        // $.ajaxSettings.async = false
        // $.get(path,function(data,status){
        //     debugger
        //     results =  data
        // })
        // $.ajaxSettings.async = true
    }
    callback && callback(results)
    return data
}

/**
 * 获取下拉框选项
 * @param {*} html 
 */
function getOptionsContent(html){
    for(var i = 0 ; i < config.businessData.length ; i ++){
        if(config.businessData[i].type == "point"){
            html += '<option value="' + config.businessData[i].name + '">' + config.businessData[i].name + '</option>'
        }
    }
    return html
}

