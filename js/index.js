//全局变量
var map = null
var basemaps = [] //底图
var osm ;
var printer = null
var config = {}

/**
 * 初始化地图组件
 * @param {json} data 
 */
function initMap(data){
    config = data
    var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    osm = new L.TileLayer(osmUrl, {minZoom: 5, maxZoom: 18});
    for(var i = 0 ; i < config.tiledLayers.length ; i ++){
        basemaps.push(L.tileLayer(config.tiledLayers[i].path, {
            visible : config.tiledLayers[i].visible,
            //errorTileUrl : config.errorTileUrl,
            label : config.tiledLayers[i].label,
            maxZoom : config.tiledLayers[i].maxZoom,
            minZoom : config.tiledLayers[i].minZoom
        }))
    }
    //创建地图组件
    map = new L.Map('map' ,{
        zoomControl: false ,//缩放控件
        attributionControl : false,//属性控件
        layers : basemaps
    })
    //书签
    if (!map.restoreView()) {
        map.setView([config.center], config.zoom);
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
    searchControl()
    layersListControl()
    miniMapControl()
    basemapsControl()
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
    var tileUrl = 'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
    var tileOptions = {
        attribution: ''
    }
    var tiledLayer = L.tileLayer(tileUrl, tileOptions)
    config.printerControl ? printer = L.easyPrint({
        tileLayer: tiledLayer,
        sizeModes: ['Current'],
        filename: 'map',
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

getConfig()