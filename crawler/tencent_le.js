// 腾讯乐捐

var http = require("http"),
    async = require("async"),
    url = 'http://npoapp.gongyi.qq.com/succorv2/unproject/getlist?g_tk=false&jsoncallback=_Callback&s_status=0';

function _parseData(data) {
	var params = data.substr(10, data.length - 12);
    return JSON.parse(params);
}

function rwData() {
    http.get(url, function(res) {
        var data = '';

        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
        	var params = _parseData(data),
                pageCount = params.info.pages.total_page;
            console.log(params.info);
        });
    }).on('error', function() {
        console.log('获取 腾讯乐捐 数据出错');
    });
}

exports.rwData = rwData;
