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

/**
 * Echarts图表
 * @param {*} data 
 */
function initEchartsLayer(data){
    if(superHeatMapLayer){
        map.removeLayer(superHeatMapLayer)
        superHeatMapLayer = null
        return
    }
    var data = echartsData
    //热力图点
    var heatMapPoints = {}
    //柱状图的点
    var barPoints = {}
    for (var i = 0; i < data.length; i++) {
        var date = new Date(data[i].date)
        var month = date.getMonth() + 1
        var year = date.getFullYear()
        var point = [parseFloat(data[i].X), parseFloat(data[i].Y), parseFloat(data[i].level)]
        if (year > 2007 && year < 2018) {
            //构造热力图数据
            if (!heatMapPoints[year]) {
                heatMapPoints[year] = [point]
            } else {
                heatMapPoints[year].push(point)
            }
            //构造柱状图数据
            barPoints[year] = barPoints[year] ? barPoints[year] : {}
            if (!barPoints[year][month]) {
                barPoints[year][month] = 1
            } else {
                ++barPoints[year][month]
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
                right: 30,
                top: 20,
                bottom: 40,
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
                subtext: resources.text_echartsEarthquake_sub_title,
            }
        },
        //options的设置
        options: []
    }
    for (var key in heatMapPoints) {
        var barData = [
            barPoints[key][1], barPoints[key][2], barPoints[key][3],
            barPoints[key][4], barPoints[key][5], barPoints[key][6], barPoints[key][7],
            barPoints[key][8], barPoints[key][9], barPoints[key][10], barPoints[key][11], barPoints[key][12]
        ]
        option.options.push({
            //热力图的配置
            title: {
                text: resources.text_l_echartsEarthquake,
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
                left: 50,
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
                name: resources.text_l_echartsEarthquake_x_coordinate
            }],
            yAxis: [{
                type: 'value',
                splitLine: {show: false},
                axisLabel: {color: '#8888f1'},
                axisLine: {lineStyle: {color: "#8888f1"}},
                name: resources.text_echartsEarthquake_sub_title
            }],
            series: [
                //heatmap
                {
                    type: 'heatmap',
                    coordinateSystem: "leaflet",
                    data: heatMapPoints[key],
                    pointSize: 10,
                    blurSize: 15
                },
                //bar
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
                //pie的显示
                {
                    type: 'pie',
                    radius: ['8%', '20%'],
                    center: ['10%', '25%'],
                    data: [
                        {value: barData[0] + barData[1] + barData[2], name: resources.text_quarter_1},
                        {value: barData[3] + barData[4] + barData[5], name: resources.text_quarter_2},
                        {value: barData[6] + barData[7] + barData[8], name: resources.text_quarter_3},
                        {value: barData[9] + barData[10] + barData[11], name: resources.text_quarter_4},
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
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    },
                    animationType: 'scale',
                    animationEasing: 'elasticOut',
                    animationDelay: function (idx) {
                        return Math.random() * 200;
                    }
                }
            ]
        })
    }
    superHeatMapLayer = L.supermap.echartsLayer(option)
    map.addLayer(superHeatMapLayer)
}

/**
 * 网格图
 * @param {*} data 
 */
function initGridLayer(data){
    test()
    if(liveRenderer){
        map.removeLayer(liveRenderer)
        //liveRenderer.destroy()
        liveRenderer = null
        liveDataSet.clear()
        liveDataSet = null
        return
    }
    if(!liveLayerOption){
        liveLayerOption = getGridOptions()
    }
    //渲染实时点数据
    //var data = createLiveRendererData(data?data:gridData)
    var data = data?data:gridData
    if (data.length < 1) {
        return
    }
    updateDataSet(data)
    if (!liveRenderer) {
        liveRenderer = L.supermap.mapVLayer(liveDataSet, liveLayerOption, {noWrap: true}).addTo(map)
    } else {
        liveRenderer.update({data: liveDataSet, options: liveLayerOption})
    }
}

/**
 * 解析点查询结果数据为mapv数据
 * @param {*} results 
 */
function createLiveRendererData(results) {
    var data = []
    results.map(function (feature) {
        var coords = decodeGeoHash(feature.key);
        data.push({
            geometry: {
                type: 'Point',
                coordinates: [coords.longitude[2], coords.latitude[2]]
            },
            count: feature.doc_count
        })
    })
    return data
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
        gradient: {
            0: "rgba(49, 54, 149, 0)",
            0.2: "rgba(69,117,180, 0.7)",
            0.3: "rgba(116,173,209, 0.7)",
            0.4: "rgba(171,217,233, 0.7)",
            0.5: "rgba(224,243,248, 0.7)",
            0.6: "rgba(254,224,144,0.7)",
            0.7: "rgba(253,174,97,0.7)",
            0.8: "rgba(244,109,67,0.8)",
            0.9: "rgba(215,48,39,0.8)",
            0.95: "rgba(165, 0, 38,0.8)"
        },
        draw: 'grid'
    }
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
        }
    }
    liveDataSet.set(innerData);
}

function test(){
    for(var i = 0 ; i < gridData.length ; i ++){
        gridData[i].count = 1
    }
    console.log(JSON.stringify(gridData))
}
