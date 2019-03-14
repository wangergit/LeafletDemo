//全局变量
var map = null
var basemaps = [] //底图
var osm 
var tiles
var leafletView = null
var heatMapLayer = null
var windowInterval = null
var printer = null
var config = {}

/**
 * 初始化地图组件
 * @param {json} data 
 */
function initMap(data){
    config = data
    var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    osm = new L.TileLayer(osmUrl, {minZoom: 5, maxZoom: 18})

    //创建地图组件
    map = new L.Map('map' ,{
        zoomControl: false ,//缩放控件
        attributionControl : false,//属性控件
        //layers : basemaps
    })
    for(var i = 0 ; i < config.tiledLayers.length ; i ++){
        if(config.tiledLayers[i].label.indexOf("街道") > -1){
            tiles = L.tileLayer(config.tiledLayers[i].path, {
                visible : config.tiledLayers[i].visible,
                //errorTileUrl : config.errorTileUrl,
                label : config.tiledLayers[i].label,
                maxZoom : config.tiledLayers[i].maxZoom,
                minZoom : config.tiledLayers[i].minZoom
            }).addTo(map)
            basemaps.push(tiles)
        }else{
            basemaps.push(L.tileLayer(config.tiledLayers[i].path, {
                visible : config.tiledLayers[i].visible,
                //errorTileUrl : config.errorTileUrl,
                label : config.tiledLayers[i].label,
                maxZoom : config.tiledLayers[i].maxZoom,
                minZoom : config.tiledLayers[i].minZoom
            }).addTo(map))
        }
    }
    //书签
    if (!map.restoreView()) {
        map.setView(config.center, config.zoom)
    }
    attributionControl()
    zoomControl()
    fullscreenControl()
    measureControl()
    scaleControl()
    navbarControl()
    mousePositioControl()
    printerControl()
    magnifyingGlassControl()
    //searchControl()
    //layersListControl()
    getBusinessData()
    miniMapControl()
    basemapsControl()
    initMenu(config.menuList)
}

function getConfig (){
    sendAjax("config/config.json","GET",initMap)
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
			if(callback){callback(result)}
		},
		error : function(result){
			if(callback){callback("error")}
		}
	})
}

/**
 * 底图快捷切换工具
 */
function basemapsControl(){
    config.basemapsControl ? L.control.basemaps({
        basemaps: basemaps,
        tileX: 0,
        tileY: 0,
        tileZ: 1
    }).addTo(map) : null
}

/**
 * 比例尺
 */
function scaleControl(){
    config.scaleControl ? L.control.scale({
        imperial : false , 
        position : config.scalePosition
    }).addTo(map) : null
}

/**
 * 平移
 */
function panControl(){
    L.control.pan().addTo(map)
}

/**
 * 缩放
 */
function zoomControl(){
    //L.control.zoom().addTo(map)
    config.zoomControl ? L.control.slider({
        map : map,
        position : config.zoomPosition,
        countryLevel : config.zoomLevel.countryLevel,
        provinceLevel : config.zoomLevel.provinceLevel,
        cityLevel : config.zoomLevel.cityLevel ,
        streetLevel : config.zoomLevel.streetLevel
    }) : null
}

/**
 * 漫游记忆
 */
function navbarControl(){
    config.navbarControl ? L.control.navbar({
        position : config.navbarPosition
    }).addTo(map) : null
}

/**
 * 鼠标信息
 */
function mousePositioControl(){
    config.mousePositionControl ? L.control.mousePosition({
        lngFirst : true,
        position : config.mousePosition
    }).addTo(map) : null
}

/**
 * 打印
 */
function printerControl(){
    config.printerControl ? printer = L.easyPrint({
        tileLayer: tiles,
        sizeModes: ['A4Landscape', 'A4Portrait'],
        filename: 'myMap',
        exportOnly: true,
        hideControlContainer: true,
        position : config.printerPosition
    }).addTo(map) : null
}

/**
 * 执行打印
 */
function manualPrint() {
    printer.printMap('CurrentSize', 'MyManualPrint')
}

/**
 * 属性信息
 */
function attributionControl(){
    config.attributionControl ? L.control.attribution({
        "prefix" : "<a href='" + config.attribute.link + "' title='" + config.attribute.title + "' target='_blank'>" + config.attribute.name + "</a>"
    }).addTo(map) : null
}

/**
 * 鹰眼图
 */
function miniMapControl() {
    if(!config.miniMapControl) return
    var miniMap = new L.Control.MiniMap(osm, { toggleDisplay: true }).addTo(map)
    miniMap.on("toggle", function(data) {
    })
    miniMap.on("minimize", function() {
    })
    miniMap.on("restore", function() {
    })
    var actionButton = new (L.Control.extend({
        options: {
            position: config.miniMapPosition,
            html: "#",
            toggleClass: "toggle",
            status: true,
            listeners: []
        },
        initialize: function (options) {
            L.setOptions(this, options)
            this._status = this.options.status
        },
        onAdd: function () {
            var container = L.DomUtil.create('div', 'leaflet-control-actionbtn leaflet-bar leaflet-control')
            var link = this._link = L.DomUtil.create('a', '', container)
            link.href = '#'
            link.innerHTML = this.options.html
            link.title = this.options.title || this.options.html
            L.DomEvent.on(link, 'click', this._onBtnClick, this)
            if (this.options.status) {
                this._toggle()
            }
            this._addListeners()
            return container
        },
        toggle: function () {
            this._toggle()
            if (this.options.action) {
                this._removeListeners()
                this._forListeners(null, function (listener) {
                    listener[0].once(listener[1], this._addListeners, this)
                })
                this.options.action.call(this, this._status)
            }
        },
        _toggle: function () {
            this._status = !this._status
            if (!this._status) {
                L.DomUtil.addClass(this._link, this.options.toggleClass)
            } else {
                L.DomUtil.removeClass(this._link, this.options.toggleClass)
            }
        },
        _addListeners: function () {
            this._forListeners()
        },
        _removeListeners: function () {
            this._forListeners(true)
        },
        _forListeners: function (off, func) {
            if (this.options.listeners.length) {
                for (var fry = 0; fry < this.options.listeners.length; fry++) {
                    var listener = this.options.listeners[fry]
                    var action = listener[0] && listener[0][off ? "off" : "on"]
                    if (action && typeof listener[1] === 'string') {
                        if (func) {
                            func.call(this, listener)
                        } else {
                            action.call(listener[0], listener[1], this._toggle, this)
                        }
                    }
                }
            }
        },
        _onBtnClick: function (e) {
            L.DomEvent.stop(e)
            this.toggle()
        }
    }))({
        action: function() { miniMap._toggleDisplayButtonClicked() },
        status: !miniMap._minimized,
        html: "MINI",
        listeners: [[miniMap, "toggle"]]
    })
    //miniMap._toggleDisplayButtonClicked()//收起
    actionButton.addTo(map)
}

/**
 * 放大镜
 */
function magnifyingGlassControl() {
    if(!config.magnifyingGlassControl) return
    L.Control.MagnifyingGlass = L.Control.extend({
        _magnifyingGlass: false,
        options: {
            position: config.magnifyingGlassPosition,
            title: '放大镜',
            forceSeparateButton: false
        },
        initialize: function (magnifyingGlass, options) {
            this._magnifyingGlass = magnifyingGlass
            for (var i in options) if (options.hasOwnProperty(i) && this.options.hasOwnProperty(i)) this.options[i] = options[i]
        },
        onAdd: function (map) {
            var className = 'leaflet-control-magnifying-glass', container
            if (map.zoomControl && !this.options.forceSeparateButton) container = map.zoomControl._container
            else container = L.DomUtil.create('div', 'leaflet-bar')
            this._createButton(this.options.title, className, container, this._clicked, map, this._magnifyingGlass)
            return container
        },
        _createButton: function (title, className, container, method, map, magnifyingGlass) {
            var link = L.DomUtil.create('a', className, container)
            link.href = '#'
            link.title = title
            L.DomEvent
            .addListener(link, 'click', L.DomEvent.stopPropagation)
            .addListener(link, 'click', L.DomEvent.preventDefault)
            .addListener(link, 'click', function() {method(map, magnifyingGlass);}, map)
            return link
        },
        _clicked: function (map, magnifyingGlass) {
            if (!magnifyingGlass) return
            if (map.hasLayer(magnifyingGlass)) map.removeLayer(magnifyingGlass)
            else magnifyingGlass.addTo(map)
        }
    })
    
    L.control.magnifyingglass = function (magnifyingGlass, options) {
        return new L.Control.MagnifyingGlass(magnifyingGlass, options)
    }
    var magnifyingGlass = L.magnifyingGlass({
        zoomOffset: 3,
        layers: osm
    })
    L.control.magnifyingglass(magnifyingGlass, {
        forceSeparateButton: true
    }).addTo(map)
}

/**
 * 图层检索要素
 */
function searchControl(){
    if(!config.searchControl) return
    var geojsonOpts = {
        pointToLayer: function(feature, latlng) {
            var myIcon = L.icon({
                iconUrl: 'http://localhost/webgis/images/custom-icon.png',
                iconSize : [20, 20]
            })
            return L.marker(latlng, {
                icon : myIcon
            }).bindPopup(feature.properties.amenity+'<br><b>'+feature.properties.name+'</b>')
        }
    }
    var poiLayers = L.layerGroup([
        L.geoJson(bar, geojsonOpts),
        L.geoJson(pharmacy, geojsonOpts),
        L.geoJson(restaurant, geojsonOpts)
    ])
    L.control.search({
        layer: poiLayers,
        initial: false,
        position : config.searchPosition,
        propertyName: 'name',
        buildTip: function(text, val) {
            var type = val.layer.feature.properties.amenity
            return '<a href="#" class="' + type  +'">' + text + '<b>' + type + '</b></a>'
        }
    }).addTo(map)
}

/**
 * 图层管理
 */
function layersListControl(){
    var geojsonOpts = {
        pointToLayer: function(feature, latlng) {
            var myIcon = L.icon({
                iconUrl: 'http://localhost/webgis/images/custom-icon.png',
                iconSize : [20, 20]
            })
            return L.marker(latlng, {
                icon : myIcon
            }).bindPopup(feature.properties.amenity+'<br><b>'+feature.properties.name+'</b>')
        }
    }
    var overlayMaps = { 
		"Cities": L.geoJson(bar, geojsonOpts),
		"Cities1": L.geoJson(pharmacy, geojsonOpts),
		"Cities2": L.geoJson(restaurant, geojsonOpts)
    }
    
    // var baseMaps = { 
    //     "<span style='color: gray'>Grayscale</span>": basemaps[0],
    //     "Streets": basemaps[1] 
    // }
    var baseMaps = {}
    for(var i = 0 ; i < basemaps.length ; i ++){
        baseMaps[basemaps[i].options.label] = basemaps[i]
    }
    L.control.layers(baseMaps,overlayMaps).addTo(map)
}

/**
 * 全屏
 */
function fullscreenControl(){
    config.fullscreenControl ? L.control.fullscreen({
        position : config.fullscreenPosition,
        title : "全屏浏览",
        titleCancel : "退出全屏"
    }).addTo(map) : null
}

/**
 * 测量
 */
function measureControl(){
    config.measureControl ? L.control.measure({
        position : config.measurePosition
    }).addTo(map) : null
}

/**
 * 初始化菜单
 * @param [] results 
 */
function initMenu(results) {
    if (results == null && results.length == 0) return
    var content = ""
    content += "<div id='slider1'> <a class='buttons prev' href='#'>left</a>  "
    content += "<div class='viewport'>"
    content += "<ul class='overview'>"
    for (var i = 0; i < results.length; i++) {
        content += "<li onclick='menuClick(" + results[i]["menuId"] + ")'><img src='images/appleToolbar/" + results[i]["img"] + "' alt='" + results[i]["name"] + "' /><span>" + results[i]["name"] + "</span></li>"
    }
    // if (g_userId != "ebe5027d-906d-4485-acbd-753d7421c790") {
    //     content += "<li onclick='appleToolbarClick(\"列表\")'><img src='Images/appleToolbar/icon_gengduo02.png' alt='列表' /><span>列表</span></li>  "
    // }
    content += "</ul></div><a class='buttons next' href='#'>right</a></div>"
    $("#dockContainer")[0].innerHTML = content
    $('#slider1').tinycarousel()
}

/**
 * 菜单点击事件
 */
function menuClick(menuId){
    // L.control.window("map",{
	// 	visible : true,
	// 	title : "业务信息",
	// 	content : "<button type='button' class='btn btn-primary'>Primary</button>"
	// })
    switch(menuId){
        case 1 ://经纬度定位
            var html = ""
            html += '<input id="jd" type="text" value="" placeholder="经度" class="form-control input-sm" style="width: 120px;margin-top: 3px;">'
            html += '<input id="wd" type="text" value="" placeholder="纬度" class="form-control input-sm" style="width: 120px;margin-top: 3px;">'
            html += '<input id="zoom" type="text" value="" placeholder="级别" class="form-control input-sm" style="width: 120px;margin-top: 3px;">'
            html += '</br><button type="button" class="btn btn-primary" onclick="centerAndZoom()">定位</button>'
            L.control.window("map",{
                visible : true,
                title : "经纬度定位",
                content : html
            })
            break
        case 2 :

        break
        case 3 :

        break
        case 4 ://聚合
            var html = '<select id="businessSelect" data-toggle="select" class="select-info mrs mbm select2-container form-control select " style="background-color: #007bff;color: white;">'
            for(var i = 0 ; i < config.businessData.length ; i ++){
                if(config.businessData[i].type == "point"){
                    html += '<option value="' + config.businessData[i].name + '">' + config.businessData[i].name + '</option>'
                }
            }
            html += '</select>'
            html += '<div href="#" id="size">Cluster size: <input type="range" value="160" min="35" max="500" step="1" id="sizeInput"/><span id="currentSize">160</span></div>'
            html += '<button type="button" class="btn btn-primary" onclick="PruneClusterLayer()">聚合</button>'
            html += '<button type="button" class="btn btn-primary" onclick="clearPruneClusterLayer()" style="margin-left: 35px;">清除</button>'
            L.control.window("map",{
                visible : true,
                title : "数据聚合",
                content : html
            })
            var currentSizeSpan = document.getElementById('currentSize')
            var updateSize = function () {
                currentSizeSpan.firstChild.data = this.value
            }
            document.getElementById('sizeInput').onchange = updateSize
            document.getElementById('sizeInput').oninput = updateSize
        break
        case 5:
            var html = '<select id="businessSelect" data-toggle="select" class="select-info mrs mbm select2-container form-control select " style="background-color: #007bff;color: white;">'
            for(var i = 0 ; i < config.businessData.length ; i ++){
                if(config.businessData[i].type == "point"){
                    html += '<option value="' + config.businessData[i].name + '">' + config.businessData[i].name + '</option>'
                }
            }
            html += '</select>'
            html += '<button type="button" class="btn btn-primary" onclick="HeatLayer()">分析</button>'
            html += '<button type="button" class="btn btn-primary" onclick="clearHeatLayer()" style="margin-left: 35px;">清除</button>'
            L.control.window("map",{
                visible : true,
                title : "热力分析",
                content : html
            })
        break
        case 6 :

        break
        case 7 :

        break
        case 8:

        break
        default:
        break
    }
}

/**
 * 
 * @param {*} x 
 * @param {*} y 
 * @param {*} zoom 
 */
function centerAndZoom(x,y,zoom){
    var jd = $("#jd")[0].value
    var wd = $("#wd")[0].value
    var zoom = $("#zoom")[0].value
    map.setView([parseFloat(wd),parseFloat(jd)], parseInt(zoom))
}

/**
 * 加载业务数据
 */
function getBusinessData(){
    var overlayMaps = {}
    for(var i = 0 ; i < config.businessData.length ; i ++){
        var geojsonOpts = {
            pointToLayer : function(feature, latlng) {
                var myIcon = L.icon({
                    iconUrl: config.businessData[i].icon,
                    iconSize : config.businessData[i].iconSize,
                    popupAnchor : config.businessData[i].popupAnchor
                })
                var d = L.marker(latlng, {
                    icon : myIcon
                })
                return L.marker(latlng, {
                    icon : myIcon
                }).bindTooltip(feature.properties.typeName+'<br><b>'+feature.properties.name+'</b>')
            }
        }
        //var src = config.businessData[i].xhrUrl
        // var str = ""
        // $.ajaxSettings.async = false
        // $.get(src,function(data,status){
        //     debugger
        //     str =  data
        // });
        // $.ajaxSettings.async = true
        // overlayMaps[config.businessData[i].name] = L.geoJson(str,geojsonOpts)
        var results = exchangeData(data)
        //overlayMaps["<span class='basinessSpan' style='background-image:url(" + config.businessData[i].icon + ")'></span>" + config.businessData[i].name] = L.geoJson(results,geojsonOpts)
        overlayMaps[config.businessData[i].name] = L.geoJson(results,geojsonOpts)
    }
    var baseMaps = {}
    for(var i = 0 ; i < basemaps.length ; i ++){
        baseMaps[basemaps[i].options.label] = basemaps[i]
    }
    L.control.layers(baseMaps,overlayMaps).addTo(map)
}

getConfig()