// 腾讯乐捐

var http = require("http"),
    request = require("request"),
    async = require("async"),
    common = require("./common"),
    pageURLTpl = 'http://npoapp.gongyi.qq.com/succorv2/unproject/getlist?g_tk=false&jsoncallback=_Callback&s_status=&s_tid=&s_puin=&s_fid=&s_sort=&s_key=&p=',
    pjUrlTpl = 'http://gongyi.qq.com/js/succor_data/pcdetail/pc.detail.{$id}.js';

var count = 0; // for test

function _parseData(data) {
    var params = data.substr(10, data.length - 12);
    return JSON.parse(params);
}

function _generatePageUrls(pageCount) {
    for (var i = pageCount, arr = []; i > 0; i--) {
        arr.push(pageURLTpl + i);
    }
    return arr;
}

function _generatePjUrls(pjList) {
    var i, il, id, arr = [];
    for (i = 0, il = pjList.length; i < il; i++) {
        id = pjList[i].id;
        arr.push(pjUrlTpl.replace('{$id}', pjIds[i]));
        console.log(pjUrlTpl.replace('{$id}', pjIds[i]));
    }
    return arr;
}

function _extractInfo(pj) {
    var status = 'unknown';
    switch (pj.status) {
        case '1':
            status = '募款中';
            break;
        case '2':
            status = '执行中';
            break;
        case '3':
            status = '已结束';
            break;
        default:
            status = 'unknown';
            break;
    }

    var donate = pj.donate,
        result = {
            '项目名称': pj.title,
            '状态': status,
            '目标筹款额': donate.needMoney + '元',
            '已筹': donate.obtainMoney + '元',
            '时间': pj.startTime + '至' + pj.endTime,
            '金额设置': '',
            '发起公益机构': pj.fundName,
            '公益机构乐捐项目数': pj.fundPCnt
        };

    console.log(result);

    return result;
}

function _requestAndSave(url) {
    request(url, function(err, res, body) {
        var data = _parseData(body),
            list = data.info,
            infoObj = {},
            i, il;

        for (i = 0, il = list.length; i < il; i++) {
            console.log('项目： ' + count);
            count++;

            // 提取所需信息
            infoObj = _extractInfo(list[i]);

            // 写入excel文件
            common.writeToExcel(infoObj);
        }
    });
}

function _processPage(pageURL) {
    request(pageURL, function(err, res, body) {
        // var data = _parseData(body),
        //     list = data.info,
        //     i, il;

        // 获取页面中各项目详细页链接
        //console.log(list);
        //var pjUrlArr = _generatePjUrls(list);
        // async.each(pjUrlArr, function(pjURL, callback) {
        //     setTimeout(function() {
        //         _requestAndSave(pjURL);
        //     }, 50);
        // }, function(err) {
        //     console.log(err);
        // });
    });
}

function rwData() {
    http.get(pageURLTpl, function(res) {
        var data = '';

        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
            var params = _parseData(data),
                info = params.info,
                pageCount = info.pages.total_page,
                pageUrlArr = _generatePageUrls(pageCount);

            console.log('页面总数：' + pageCount);
            // 逐个遍历page获取单个项目链接
            async.each(pageUrlArr, function(pageURL, callback) {
                setTimeout(function() {
                    // 逐个遍历项目详细页提取单个项目信息, 并写入Excel
                    _processPage(pageURL);
                }, 50);
            }, function(err) {
                console.log(err);
            });
        });
    }).on('error', function() {
        console.log('获取 腾讯乐捐 数据出错');
    });
}

exports.rwData = rwData;
