/**
 * 数据交换
 * @param {} params 
 */
function exchangeData(params,amenity,geoType){
    if(!params.data || params.data.length == 0) {return [];}
    var results = {
        "type": "FeatureCollection",
        "generator": "overpass-turbo",
        "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.",
        "timestamp": "2015-08-08T19:03:02Z",
        "features" : []
    };
    for(var i = 0 ; i < params.data.length ; i ++){
        if(amenity) params.data[i].amenity = amenity;
        if(geoType === "point"){
        	results.features.push({
                "type": "Feature",
                "id": params.data[i].id,
                "properties": params.data[i],
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        parseFloat(params.data[i].longtitude),
                        parseFloat(params.data[i].latitude)
                    ]
                }
            });
        }else if(geoType === "polygon"){
        	var points = [];
        	var arr = JSON.parse(params.data[i].regionalScope).data;
        	for (var int = 0; int < arr.length; int++) {
        		points.push([arr[int][1],arr[int][0]]);
			}
        	points.push([arr[0][1],arr[0][0]]);
        	results.features.push({  
    			"type":"Feature",
                "id": params.data[i].id,
                "properties": params.data[i],
    			"geometry":{
    				"type":"Polygon",
    				"coordinates":[
    				     points
    				]
    			}
    		});
        }else if(geoType === "polyline"){
        	results.features.push({  
    			"type":"Feature",
                "id": params.data[i].id,
                "properties": params.data[i],
    			"geometry":{
    				"type":"LineString",
    				"coordinates":[
    				     JSON.parse(params.data[i].regionalScope).data
    				]
    			}
    		});
        }
    }
    return results;
}

/**
 * 处理聚合分析数据
 */
function exchangePruneClusterData (params){
    var results = {
        "features": []
    };
    for(var i = 0 ; i < params.data.length ; i ++){
        results.features.push({
            "geometry": {
                "coordinates": [
                    parseFloat(params.data[i].longtitude),
                    parseFloat(params.data[i].latitude)
                ],
                "type": "Point"
            },
            "properties": params.data[i],
            "type": "Feature"
        });
    }
    return results;
}

/**
 * 聚合图层
 */
function PruneClusterLayer(data){
	data = data ? data : exchangePruneClusterData(syncGetData($("#businessSelect")[0].value));
    if(leafletView){
    	map.removeLayer(leafletView);
    	leafletView.remove();
    	leafletView = null;
    }
    leafletView = new PruneClusterForLeaflet(parseInt(document.getElementById('sizeInput').value));
    var markers = [] ;
    for (var a = 0; a < data.features.length; a++) {
        var lon = data.features[a].geometry.coordinates[0];
        var lat = data.features[a].geometry.coordinates[1];
        if (lon != 0.0 && lat != 0.0) {
            var marker = new PruneCluster.Marker(lat, lon);
            markers.push(marker);
            leafletView.RegisterMarker(marker);
        }
    }
    var lastUpdate = 0;
    if(windowInterval) window.clearInterval(windowInterval);
    windowInterval = window.setInterval(function () {
        var now = +new Date();
        if ((now - lastUpdate) < 400) {
            return
        }
        for (var i = 0 ; i < size / 2; ++i) {
            var coef = i < size / 8 ? 10 : 1;
            var ll = markers[i].position;
            ll.lat += (Math.random() - 0.5) * 0.00001 * coef;
            ll.lng += (Math.random() - 0.5) * 0.00002 * coef;
        }
        leafletView.ProcessView();
        lastUpdate = now;
    }, 500);
    map.addLayer(leafletView);
    var currentSizeSpan = document.getElementById('currentSize');
    var updateSize = function () {
        if(leafletView){
            leafletView.Cluster.Size = parseInt(this.value);
            leafletView.ProcessView();
        }
        currentSizeSpan.firstChild.data = this.value;
        var now = +new Date();
        if ((now - lastUpdate) < 400) {
            return
        }
        lastUpdate = now;
    };
    document.getElementById('sizeInput').onchange = updateSize;
    document.getElementById('sizeInput').oninput = updateSize;
}

/**
 * 清除聚合分析数据
 */
function clearPruneClusterLayer(){
    if(windowInterval) window.clearInterval(windowInterval);
    if(leafletView) {
        map.removeLayer(leafletView);
        leafletView.removeFrom();
        leafletView = null;
    }
}

/**
 * 处理热力分析数据
 */
function exchangeHeatLayerData (params){
    var results = [];
    for(var i = 0 ; i < params.data.length ; i ++){
        results.push([params.data[i].latitude,params.data[i].longtitude]);
    }
    return results;
}

/**
 * 热力图层
 */
function HeatLayer(data){
    var layerName = $("#businessSelect")[0].value ;
    if(heatMapLayer){
    	map.removeLayer(heatMapLayer);
    	heatMapLayer.remove();
    	heatMapLayer = null;
    }
    var addressPoints = exchangeHeatLayerData(syncGetData(layerName));
    heatMapLayer = L.heatLayer(addressPoints);
    map.addLayer(heatMapLayer);
}

/**
 * 清空热力图层
 */
function clearHeatLayer(){
    if(heatMapLayer) {
        map.removeLayer(heatMapLayer);
    	heatMapLayer.remove();
        heatMapLayer = null;
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
			callback && callback(result);
		},
		error : function(error){
			callback && callback(error);
		}
	});
}

/**
 * 同步抓取数据
 * @param {*} name 
 * @param {*} url 
 * @param {*} callback 
 */
function syncGetData(name,url,callback){
    var path = url ? url : "";
    if(!path){
        for(var i = 0 ; i < config.businessData.length ; i ++){
            if(config.businessData[i].name == name){
                path = config.host + config.businessData[i].xhrUrl + "" + ssoid;
                break;
            }
        }
    }
    var results = {};
    if(path){
         $.ajaxSettings.async = false;
         $.get(path,function(data,status){
             results =  data;
         });
         $.ajaxSettings.async = true;
    }
    callback && callback(results);
    return results;
}

/**
 * 获取下拉框选项
 * @param {*} html 
 */
function getOptionsContent(html){
    for(var i = 0 ; i < config.businessData.length ; i ++){
        if(config.businessData[i].type == "point"){
            html += '<option value="' + config.businessData[i].name + '">' + config.businessData[i].name + '</option>';
        }
    }
    return html;
}

/**
 * Echarts图表
 * @param {*} data 
 */
function initEchartsLayer(data){
    if(superHeatMapLayer){
        map.removeLayer(superHeatMapLayer);
        superHeatMapLayer = null;
        return
    }
    var data = echartsData;
    //热力图点
    var heatMapPoints = {};
    //柱状图的点
    var barPoints = {};
    for (var i = 0; i < data.length; i++) {
        var date = new Date(data[i].date);
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        var point = [parseFloat(data[i].X), parseFloat(data[i].Y), parseFloat(data[i].level)];
        if (year > 2007 && year < 2018) {
            //构造热力图数据
            if (!heatMapPoints[year]) {
                heatMapPoints[year] = [point];
            } else {
                heatMapPoints[year].push(point);
            }
            //构造柱状图数据
            barPoints[year] = barPoints[year] ? barPoints[year] : {};
            if (!barPoints[year][month]) {
                barPoints[year][month] = 1;
            } else {
                ++barPoints[year][month];
            }
        }
    }
    var option = {
        baseOption: {
            animationDurationUpdate: 1000,
            animationEasingUpdate: 'quinticInOut',
            timeline: {
                axisType: 'category',
                orient: 'vertical',
                autoPlay: true,
                inverse: true,
                playInterval: 3000,
                left: null,
                right: 50,
                top: 40,
                bottom: 80,
                width: 55,
                height: null,
                label: {
                    normal: {textStyle: {color: '#8888f1'}},
                    emphasis: {textStyle: {color: '#8888f1'}}
                },
                symbol: 'none',
                lineStyle: {color: '#fff'},
                checkpointStyle: {color: '#bbb', borderColor: '#777', borderWidth: 2},
                controlStyle: {
                    showNextBtn: false,
                    showPrevBtn: false,
                    normal: {color: '#666', borderColor: '#666'},
                    emphasis: {color: '#aaa', borderColor: '#aaa'}
                },
                data: ['2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017']
            },
            title: {
                //subtext: "2008-2017年安全监察数据统计",
            	text: '2008-2017年安全监察数据统计'
            }
        },
        //options的设置
        options: []
    };
    for (var key in heatMapPoints) {
        var barData = [
            barPoints[key][1], barPoints[key][2], barPoints[key][3],
            barPoints[key][4], barPoints[key][5], barPoints[key][6], barPoints[key][7],
            barPoints[key][8], barPoints[key][9], barPoints[key][10], barPoints[key][11], barPoints[key][12]
        ];
        option.options.push({
            //热力图的配置
            title: {
                text: "2008-2017年安全监察数据统计",
                left: 'center',
                top: 30,
                textStyle: {
                    color: '#8888f1'
                }
            },
            visualMap: {
                show: false,
                min: 0,
                max: 5,
                seriesIndex: 0,
                calculable: true,
                inRange: {
                    color: ['blue', 'green', 'yellow', 'red']
                }
            },
            grid: {
                left: 120,
                bottom: '10%',
                width: '30%',
                height: '30%',
                textStyle: {
                    color: "#8888f1"
                },
            },
            tooltip: {
                trigger: "item",
                textStyle: {
                    fontSize: 12
                },
                formatter: "{b0}:{c0}"
            },
            //bar的x,y坐标
            xAxis: [{
                data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
                axisLabel: {color: '#8888f1'},
                axisLine: {lineStyle: {color: "#8888f1"}},
                name: "月份"
            }],
            yAxis: [{
                type: 'value',
                splitLine: {show: false},
                axisLabel: {color: '#8888f1'},
                axisLine: {lineStyle: {color: "#8888f1"}},
                name: "单位：次数"
            }],
            series: [
                {
                    type: 'heatmap',
                    coordinateSystem: "leaflet",
                    data: heatMapPoints[key],
                    pointSize: 10,
                    blurSize: 15
                },
                {
                    type: 'bar',
                    label: {show: true,
                        position:'top',
                        color:'#8888f1'
                    },
                    itemStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(
                                0, 0, 0, 1,
                                [
                                    {offset: 0, color: 'red'},
                                    {offset: 0.5, color: 'yellow'},
                                    {offset: 1, color: 'red'}
                                ]
                            ),
                            barBorderRadius: 15
                        },
                        emphasis: {
                            color: new echarts.graphic.LinearGradient(
                                0, 0, 0, 1,
                                [
                                    {offset: 0, color: 'red'},
                                    {offset: 0.7, color: 'yellow'},
                                    {offset: 1, color: 'red'}
                                ]
                            )
                        }
                    },
                    barWidth: 20,
                    barGap: 5,
                    data: barData
                },
                {
                    type: 'pie',
                    radius: ['8%', '20%'],
                    center: ['10%', '25%'],
                    data: [
                        {value: barData[0] + barData[1] + barData[2], name: "一季度"},
                        {value: barData[3] + barData[4] + barData[5], name: "二季度"},
                        {value: barData[6] + barData[7] + barData[8], name: "三季度"},
                        {value: barData[9] + barData[10] + barData[11], name: "四季度"},
                    ].sort(function (a, b) { return a.value - b.value; }),
                    roseType: 'angle',
                    label: {
                        normal: {
                            textStyle: {
                                color: '#8888f1'
                            }
                        }
                    },
                    labelLine: {
                        normal: {
                            lineStyle: {
                                color: '#8888f1'
                            },
                            smooth: 0.2,
                            length: 10,
                            length2: 20
                        }
                    },
                    itemStyle: {
                        normal: {
                            color: 'orange',
                            shadowBlur: 200,
                            shadowColor: 'rgba(0, 0, 0, 0.4)'
                        }
                    },
                    animationType: 'scale',
                    animationEasing: 'elasticOut',
                    animationDelay: function (idx) {
                        return Math.random() * 200;
                    }
                }
            ]
        });
    }
    superHeatMapLayer = L.supermap.echartsLayer(option);
    map.addLayer(superHeatMapLayer);
}

/**
 * 网格图
 * @param {*} data 
 */
function initGridLayer(data){
	var layerName = $("#businessSelect")[0].value ;
	var addressPoints = [];
	for (var int = 0; int < overlayMaps[layerName].getLayers().length; int++) {
		addressPoints.push(overlayMaps[layerName].getLayers()[int].toGeoJSON());
	}
    if(liveRenderer){
        map.removeLayer(liveRenderer);
        liveRenderer = null;
        liveDataSet.clear();
        liveDataSet = null;
        //return
    }
    if(!liveLayerOption){
        liveLayerOption = getGridOptions();
    }
    //渲染实时点数据
    //var data = createLiveRendererData(data?data:gridData);
    addressPoints = data?data:addressPoints;
    if (addressPoints.length < 1) {
        return
    }
    updateDataSet(addressPoints);
    if (!liveRenderer) {
        liveRenderer = L.supermap.mapVLayer(liveDataSet, liveLayerOption, {noWrap: true}).addTo(map);
    } else {
        liveRenderer.update({data: liveDataSet, options: liveLayerOption});
    }
}

/**
 * 清除网格分析图
 */
function clearGridLayer(){
	if(liveRenderer){
        map.removeLayer(liveRenderer);
        liveRenderer = null;
        liveDataSet.clear();
        liveDataSet = null;
        return
    }
}

/**
 * 解析点查询结果数据为mapv数据
 * @param {*} results 
 */
function createLiveRendererData(results) {
    var data = [];
    results.map(function (feature) {
        var coords = decodeGeoHash(feature.key);
        data.push({
            geometry: {
                type: 'Point',
                coordinates: [coords.longitude[2], coords.latitude[2]]
            },
            count: feature.doc_count
        });
    });
    return data;
}

/**
 * 获取网格样式
 */
function getGridOptions() {
    return {
        fillStyle: 'rgba(55, 50, 250, 0.8)',
        shadowColor: 'rgba(255, 250, 50, 1)',
        shadowBlur: 10,
        size: 40,
        globalAlpha: 0.5,
        label: {
            show: true,
            fillStyle: 'white',
            shadowColor: 'yellow',
            font: '15px Arial',
            shadowBlur: 10
        },
//        gradient: {
//            '0': "rgba(49, 54, 149, 0)",
//            '0.2': "rgba(69,117,180, 0.7)",
//            '0.3': "rgba(116,173,209, 0.7)",
//            '0.4': "rgba(171,217,233, 0.7)",
//            '0.5': "rgba(224,243,248, 0.7)",
//            '0.6': "rgba(254,224,144,0.7)",
//            '0.7': "rgba(253,174,97,0.7)",
//            '0.8': "rgba(244,109,67,0.8)",
//            '0.9': "rgba(215,48,39,0.8)",
//            '0.95': "rgba(165, 0, 38,0.8)"
//        },
        gradient: {
            '0': "rgba(40,146,199, 1)",
            '0.2': "rgba(109,169,179,1)",
            '0.3': "rgba(160,194,155,1)",
            '0.4': "rgba(206,222,129,1)",
            '0.5': "rgba(250,250,100,1)",
            '0.6': "rgba(252,196,76,1)",
            '0.7': "rgba(250,141,52,1)",
            '0.8': "rgba(242,89,34,1)",
            '0.9': "rgba(232,16,20,1)",
            '0.95': "rgba(255,0,0,1)"
        },
        draw: 'grid'
    };
}

/**
 * 更新点数据集
 * @param {*} data 
 */
function updateDataSet(data) {
    if (!liveDataSet) {
        liveDataSet = new mapv.DataSet(data);
        return;
    }
    var innerData = liveDataSet.get();
    var dataLen = data.length;
    for (var i = 0; i < innerData.length; i++) {
        if (i < dataLen && data[i].ident === innerData[i].ident) {
            innerData[i] = data[i];
        };
    }
    liveDataSet.set(innerData);
}

function test(){
    for(var i = 0 ; i < gridData.length ; i ++){
        gridData[i].count = 1;
    }
    //console.log(JSON.stringify(gridData));
}

/**
 * 分页面板
 * @param {*} data 
 */
function pagingControl(data){
    pagingData = data;
    if($("#paging")[0]) {$("#paging")[0].innerHTML = "";}
    new Page({
        id: 'paging',
        pageTotal: Math.ceil(data.length / 10), //必填,总页数
        pageAmount: 10,  //每页多少条
        dataTotal: data.length, //总共多少条数据
        curPage:1, //初始页码,不填默认为1
        pageSize: 3, //分页个数,不填默认为5
        showPageTotalFlag:true, //是否显示数据统计,不填默认不显示
        showSkipInputFlag:true, //是否支持跳转,不填默认不显示
        getPage: function (page) {
            var html = getPageContent(pagingData,page,10);
            completeTable(html);
        }
    });
    var html = getPageContent(pagingData,1,10);
    completeTable(html);
}

function completeTable(html){
    $("#infoContainer")[0].innerHTML = html;
    for(var i = 1 ; i < $(".listTable tr").length ; i ++){
        $(".listTable tr")[i].onclick = function(e){
            var param = pagingData[parseInt(e.currentTarget.attributes.index.value)];
            centerAndZoom(param.longtitude,param.latitude,10);
        };
    };
}

function clearbufferAnalysis(){
    $("#infoContainer")[0].innerHTML = "";
    $("#paging")[0].innerHTML = "";
    $("#bufferItem")[0].value = "";
    $("#bufferValue")[0].value = "";
    pagingData = null;
    if(bufferGeo){
        map.removeLayer(bufferGeo);
        bufferGeo = null;
    }
    if(plotLayer) plotLayer.clearLayers();
}

/**
 * 
 * @param {*} data 
 * @param {*} index 
 * @param {*} pageAmount 
 */
function getPageContent(data,index,pageAmount){
    var html = "<table class='listTable'><tr><th>序号</th><th>名称</th></tr>";
    // for(var i = (index - 1) * pageAmount  ; i < index * pageAmount ; i ++){
    //     if(!data[i]) break
    //     html += "<div index='" + i + "' class='listStyle'><span class='listSpan'>" + (i + 1) + "</span>" + data[i].name + "</div>"
    // }
    for(var i = (index - 1) * pageAmount  ; i < index * pageAmount ; i ++){
        if(!data[i]) {break;}
        html += '<tr index="' + i + '"><td>' + (i + 1) + '</td><td>' + data[i].name + '</td></tr>';
    }
    return html + "</table>";
}

/**
 * 实时数据展示
 */
function initRealtimeWidget(){
    if(realtimeWidget){
        map.removeLayer(realtimeWidget);
        realtimeWidget.clearAllEventListeners();
        realtimeWidget = null;
        return
    }
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    realtimeWidget = L.realtime({
        url: 'https://wanderdrone.appspot.com/',
        crossOrigin: true,
        type: 'json'
    }, {
        interval: 3 * 1000,
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
        /*
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                'icon': L.icon({
                    iconUrl: '//leafletjs.com/docs/images/leaf-green.png',
                    shadowUrl: '//leafletjs.com/docs/images/leaf-shadow.png',
                    iconSize:     [38, 95], // size of the icon
                    shadowSize:   [50, 64], // size of the shadow
                    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
                    shadowAnchor: [4, 62],  // the same for the shadow
                    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
                })
            });
        }*/
    }).addTo(map);

    realtimeWidget.on('update', function(e) {
        var coordPart = function(v, dirs) {
                return dirs.charAt(v >= 0 ? 0 : 1) + (Math.round(Math.abs(v) * 100) / 100).toString();
        },
        popupContent = function(fId) {
            var feature = e.features[fId], c = feature.geometry.coordinates;
            return 'Wander drone at ' + coordPart(c[1], 'NS') + ', ' + coordPart(c[0], 'EW');
        },
        bindFeaturePopup = function(fId) {
            realtimeWidget.getLayer(fId).bindPopup(popupContent(fId));
        },
        updateFeaturePopup = function(fId) {
            realtimeWidget.getLayer(fId).getPopup().setContent(popupContent(fId));
        };

        map.fitBounds(realtimeWidget.getBounds(), {maxZoom: 3});

        Object.keys(e.enter).forEach(bindFeaturePopup);
        Object.keys(e.update).forEach(updateFeaturePopup);
    });
}