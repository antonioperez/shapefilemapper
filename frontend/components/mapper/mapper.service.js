(function () {

angular
    .module('app')
    .service('mapservice', function ($http) {

        var self = this;
        var defaultCenter = [36.8, -120];
        var CONVERTER_URL = "http://localhost:3000/convertJson";
        self.generateMap = function (mapId, zoom, zipPath, backgroundOptions, popupContent, searchKey, addDrawingOptions, customFeatureCallback) {

            $("#"+mapId).css('width', "100%");
            $("#"+mapId).css('height', "500px");
            var map = L.map(mapId, {
                zoomControl: false
            }).setView(defaultCenter, zoom);
            var layer = L.esri.basemapLayer("Topographic").addTo(map);

            var zoomHome = L.Control.zoomHome();
            zoomHome.addTo(map);
            
            var options = {
                searchKey : searchKey, 
                addDrawingOptions : addDrawingOptions,
                backgroundOverlayStyle : backgroundOptions,
                popupContent : popupContent,
                customFeatureCallback : customFeatureCallback
            }

            self.loadShapefile(map, zipPath, options);
            return map;
        }

        self.loadShapefile = function (map, zipPath, options) {
            shp(zipPath).then(function (geojson) {
                geoj = geojson.features;
                //dirty fix to not all certain keys to pass. will need to pass in obj with callback and template. 
                var stateCheck = geoj[0].properties["STATE"];
                if (stateCheck) {
                    for (var i in geoj) {
                        stateCheck = geoj[i].properties["STATE"];
                        if (stateCheck != "CA") {
                            geoj[i] = undefined;
                        }
                    }
                }
                var geoj = geoj.filter(function(val){return val});
                //function to display popup
                var featuresLayer = L.geoJSON(geoj, {
                    style: options.backgroundOverlayStyle,
                    onEachFeature: function (feature, layer) {
                        
                        if (options.popupContent) {
                            self.onEachFeature(feature, layer, options.popupContent, options.customFeatureCallback);
                        }
                    }
                });
                map.addLayer(featuresLayer);
                //end data to map. 

                if (options.searchKey) {
                    self.addSearchControls(map, options.searchKey, featuresLayer);
                }

                //create mapping drawing functionality
                if (options.addDrawingOptions) {
                    self.addDrawControls(map, featuresLayer);
                }
                //end drawing functionality
                return map;
            });
        }

        self.genGuid = function () {
            var date = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
                var rand = (date + Math.random() * 16) % 16 | 0;
                date = Math.floor(date / 16);
                return (char == 'x' ? rand : (rand & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        };

        self.downloadFile = function (url, payload, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (this.status === 200) {
                    var filename = "";
                    if (payload.outputName) {
                        filename = payload.outputName;
                    } else {
                        //random guid name
                        filename = self.genGuid();
                    }

                    //filename needs the .zip in order to get a zip file. TODO: better check in case of multiple. 
                    if (filename.indexOf(".zip" < 0)) {
                        filename += ".zip"
                    }

                    var type = xhr.getResponseHeader('Content-Type');
                    var blob = new Blob([this.response], {
                        type: type
                    });

                    //is IE?
                    if (typeof window.navigator.msSaveBlob !== 'undefined') {
                        // IE workaround"
                        window.navigator.msSaveBlob(blob, filename);
                    } else {
                        var URL = window.URL || window.webkitURL;
                        var downloadUrl = URL.createObjectURL(blob);
                        if (filename) {

                            var atag = document.createElement("a");
                            // safari fix
                            if (typeof atag.download === 'undefined') {
                                window.location = downloadUrl;
                            } else {
                                atag.href = downloadUrl;
                                atag.download = filename;
                                document.body.appendChild(atag);
                                atag.click();
                            }
                        } else {
                            window.location = downloadUrl;
                        }

                        setTimeout(function () {
                            // let the browser know not to keep the reference to the file any longer
                            URL.revokeObjectURL(downloadUrl);
                        }, 100);

                        if (callback) {
                            callback();
                        }
                    }
                }
            };
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xhr.send($.param(payload));
        }

        self.onEachFeature = function (feature, layer, popupContent, customFeatureCallback) {
            //function to display popup
            var props = feature.properties;
            
            if(customFeatureCallback) {
                customFeatureCallback(feature, layer);
            }

            //get values;
            var template = popupContent;
            var keys = template.match(/[^{]+(?=\}})/g);
            if (keys.length > 0) {
                for (var k in keys) {
                    var key = keys[k];
                    template = template.replace("{{" + key + "}}", props[key]);
                }
            }

            if (feature.properties && feature.properties.popupContent) {
                template += feature.properties.popupContent;
            }
            layer.bindPopup(template);
        };

        self.addDrawControls = function (map, featuresLayer) {
            //create mapping drawing functionality
            var drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);
            var drawControl = new L.Control.Draw({
                position: 'topright',
                draw: {
                    polyline: true,
                    polygon: true,
                    circle: false,
                    marker: true
                },
                edit: {
                    featureGroup: drawnItems,
                    remove: true
                }
            });
            map.addControl(drawControl);
            //end drawing functionality

            map.on(L.Draw.Event.CREATED, function (e) {
                //custom feature is created on map. Add it or do more with it. 
                var type = e.layerType;
                var layer = e.layer;
                drawnItems.addLayer(layer);
            });

            map.on(L.Draw.Event.EDITED, function (e) {
                var layers = e.layers;
                var countOfEditedLayers = 0;
                layers.eachLayer(function (layer) {
                    countOfEditedLayers++;
                });

                //TO DO: Need to add edited features to current geojson
                var data = featuresLayer.toGeoJSON();
                data = JSON.stringify(data);
                filename = $("#js-fileName").val();

                payload = {
                    json: data,
                    outputName: filename
                }

                //animate progress bar
                progressBar = $("#js-map-progress-bar");
                doneProcessing = null;

                if (progressBar) {
                    var percentVal = 0;
                    var interval = setInterval(function () {
                        if (percentVal <= 100) {
                            progressBar.css('width', percentVal + "%").attr('aria-valuenow', percentVal);
                            percentVal += .5;
                            percentVal = Math.round(percentVal);
                        } else if (percentVal > 100) {
                            percentVal = 0;
                        }
                    }, 50);

                    doneProcessing = function () {
                        clearInterval(interval);
                        progressBar.css('width', "0%").attr('aria-valuenow', 0);
                    }
                }
                self.downloadFile(CONVERTER_URL, payload, doneProcessing);
            });
        };

        self.addSearchControls = function (map, searchKey, featuresLayer) {

            var searchControl = new L.Control.Search({
                layer: featuresLayer,
                propertyName: searchKey,
                marker: false,
                moveToLocation: function (latlng, title, map) {
                    var zoom = map.getBoundsZoom(latlng.layer.getBounds());
                    map.setView(latlng, zoom);
                }
            });

            searchControl.on('search:locationfound', function (e) {
                ////if a search is found. Highlight the area
                e.layer.setStyle({
                    fillColor: '#3f0',
                    color: '#0f0'
                });
                if (e.layer._popup) {
                    e.layer.openPopup();
                }
            }).on('search:collapsed', function (e) {
                featuresLayer.eachLayer(function (layer) {
                    //restore original background color
                    featuresLayer.resetStyle(layer);
                });
            });

            map.addControl(searchControl);
            //end search options
        }
    })

})();