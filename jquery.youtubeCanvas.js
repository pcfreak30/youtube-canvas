(function ($) {

    $.fn.youtubeCanvas = function (id, options) {

        // This is the easiest way to have default options.
        var settings = $.extend({
            'quality': 'medium',
            'androidType': 'video/mp4'
        }, options);
        var element = this;

        function decodeQueryString(queryString) {
            var key, keyValPair, keyValPairs, r, val, _i, _len;
            r = {};
            keyValPairs = queryString.split("&");
            for (_i = 0, _len = keyValPairs.length; _i < _len; _i++) {
                keyValPair = keyValPairs[_i];
                key = decodeURIComponent(keyValPair.split("=")[0]);
                val = decodeURIComponent(keyValPair.split("=")[1] || "");
                r[key] = val;
            }
            return r;
        }

        function decodeStreamMap(url_encoded_fmt_stream_map) {
            var quality, sources, stream, type, urlEncodedStream, _i, _len, _ref;
            sources = {};
            _ref = url_encoded_fmt_stream_map.split(",");
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                urlEncodedStream = _ref[_i];
                stream = decodeQueryString(urlEncodedStream);
                type = stream.type.split(";")[0];
                quality = stream.quality.split(",")[0];
                stream.original_url = stream.url;
                stream.url = "" + stream.url + "&signature=" + stream.sig;
                sources["" + type + " " + quality] = stream;
            }
            return sources;
        }

        function getSource(sources, type, quality) {
            var exact, key, lowest, source;
            lowest = null;
            exact = null;
            for (key in sources) {
                source = sources[key];
                if (source.type.match(type)) {
                    if (source.quality.match(quality)) {
                        exact = source;
                    } else {
                        lowest = source;
                    }
                }
            }
            return exact || lowest;
        }

        function getPlayer(controls) {
            var player_id = $(controls).parent().data('player_id');
            var player;
            $(controls).parent().parent().find('video').each(function () {
                if ($(this).data('player_id') == player_id) {
                    player = this;
                    return false;
                }
            });
            return typeof player == 'undefined' ? false : player;
        }
        function getControls(player) {
            var player_id = $(player).data('player_id');
            var controls;
            $(player).parent().find('div.videoControls').each(function () {
                if ($(this).data('player_id') == player_id) {
                    controls = this;
                    return false;
                }
            });
            return typeof controls == 'undefined' ? false : controls;
        }
        function processVideo(el, data) {
            var video = decodeQueryString(data);
            if (video.status !== "fail") {
                var sources = decodeStreamMap(video.url_encoded_fmt_stream_map);
                el[0].controls = true;
                el.closest('.panel').attr('data-unload', 'youtubeCanvasUnLoadPanel');
                if (typeof AppMobi.device.platform != "undefined") {
                    if (AppMobi.device.platform == "Android") {
                        var source = getSource(sources, settings.androidType, settings.quality);
                        source.url = decodeURIComponent(source.url.replace(/\+/g, " "));
                        el.html("<source src=\"" + source.url + "\"/>");
                        el.off().click(function () {
                            this.paused ? this.play() : (this.currentTime > 0 ? this.pause() : this.play());
                        });
                        if (el.data('player_id') == null) {
                            var player_id = Math.floor(Math.random() * 9999);
                            el.data('player_id', player_id);
                        }
                        var renderControls = true;
                        if(getControls(el) !== false)
                        {
                            renderControls = false;
                        }
                        if (renderControls) {
                            var controls = $("<div class=\"videoControls\"><a class=\"button startVideo\">Start</a><a class=\"button stopVideo\">Stop</a><a class=\"button restartVideo\">Restart</a></div>")
                                .data('player_id', el.data('player_id'));
                            controls.insertAfter(el);
                            controls.children('.startVideo').click(function () {
                                var player = getPlayer(this);
                                if (player !== false) {
                                    player.play();
                                }
                            })
                                .end().children('.stopVideo').click(function () {
                                    var player = getPlayer(this);
                                    if (player !== false) {
                                        player.pause();
                                    }
                                }).end().children('.restartVideo').click(function () {
                                    var player = getPlayer(this);
                                    if (player !== false) {
                                        player.currentTime = 0;
                                        player.play();
                                    }
                                });
                        }
                        return true;
                    }
                }
                for (key in sources) {
                    if (sources[key].quality.match(settings.quality)) {
                        el.append("<source src=\"" + sources[key].url + "\" type=\"" + key.split(' ')[0] + "\" />");
                    }
                }
            }
        }
        $.ajax({
            url: 'http://www.youtube.com/get_video_info',
            dataType: "text",
            data: {
                'video_id': id
            },
            success: function (data) {
                processVideo(element, data);
            },
        });
    };
}(af || jq || jQuery));

function youtubeCanvasUnLoadPanel(panel) {
    console.log($(panel).find('video'));
    $(panel).find('video').each(function () {
        this.pause();
    });
}
