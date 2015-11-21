// 腾讯乐捐

var request = require("request"),
    async = require("async"),
    common = require("./common"),
    map_limit = 20;

var pjUrlTpl = 'http://gongyi.qq.com/js/succor_data/pcdetail/pc.detail.{$id}.js',
    headers = ['项目名称', '状态', '目标筹款额', '已筹', '时间', '发起公益机构', '公益机构乐捐项目数'],
    pjUrlArr = [],
    pjInfoArr = [headers],
    pjIdx = 1,
    fileName = '腾讯乐捐',
    startTime;

function _parseData(data) {
    var params = '',
        result = {};
    try {
        params = data.match(/(\{=?)([\s\S]*)(\})/);
        if (!!params && params.length && params.length > 0) {
            result = JSON.parse(params[0]);
        }
    } catch (e) {
        console.log('_parseData err: ' + e);
    }

    return result;
}

function _extractInfo(pj) {
    var status = '';
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
        result = [
            pj.title,
            status,
            donate.needMoney + '元', donate.obtainMoney + '元',
            pj.startTime + '至' + pj.endTime,
            pj.fundName,
            pj.fundPCnt
        ];

    return result;
}

function rwData(pageURLTpl, calbak) {
    var getPageUrlArr = function(pageURLTpl, cb) {
        console.log('Reading page urls...');
        request(pageURLTpl, function(err, res, body) {
            var data = _parseData(body),
                pageUrlArr = [],
                pageCount;

            if (data && data.info) {
                pageCount = data.info.pages.total_page;

                console.log('页面总数: ' + pageCount);

                for (var i = pageCount; i > 0; i--) {
                    pageUrlArr.push(pageURLTpl + i);
                }
            }

            cb(null, pageUrlArr);
        });
    };

    var getPjUrlArr = function(pageUrlArr, cb) {
        console.log('Reading projects...');
        async.mapLimit(pageUrlArr, map_limit, function(pageUrl, cb1) {
            request(pageUrl, function(err, res, body) {
                var data = _parseData(body),
                    list,
                    i, il, id;
                if (data && data.info && data.info.list) {
                    list = data.info.list;
                    for (i = 0, il = list.length; i < il; i++) {
                        pjUrlArr.push(pjUrlTpl.replace('{$id}', list[i].id));
                    }
                }
                cb1(null, pjUrlArr.length);
            });
        }, function(err, results) {
            if (err) {
                console.log('err: ' + err);
                return;
            }
            console.log('项目数：' + pjUrlArr.length);
            cb(null, pjUrlArr.length);
        });
    };

    var getPjInfoArr = function(n, cb) {
        async.mapLimit(pjUrlArr, map_limit, function(pjURL, cb1) {
            request(pjURL, function(err, res, body) {
                if (body) {
                    console.log('\n项目' + (pjIdx++));
                    var data = _parseData(body),
                        pjInfo;
                        
                    if (data && data.info && data.info.base) {
                        pjInfo = _extractInfo(data.info.base);
                        console.log(pjInfo);
                        pjInfoArr.push(pjInfo);
                    }
                }
                cb1(null, pjInfoArr.length);
            });
        }, function(err, results) {
            if (err) {
                console.log('err: ' + err);
                return;
            }
            cb(null, pjInfoArr.length);
        });
    };

    var start = async.compose(getPjInfoArr, getPjUrlArr, getPageUrlArr);
    start(pageURLTpl, function(err, results) {
        if (err) {
            console.log('err: ' + err);
            return;
        }
        console.log(pjInfoArr.length);
        calbak(null);
    });
}

function crawler() {
    var pageURLTplArr = [
        //'http://npoapp.gongyi.qq.com/succorv2/unproject/getlist?g_tk=false&jsoncallback=_Callback&s_status=0&s_tid=&s_puin=&s_fid=&s_sort=&s_key=&p=',
        'http://npoapp.gongyi.qq.com/succorv2/unproject/getlist?g_tk=false&jsoncallback=_Callback&s_status=1&s_tid=&s_puin=&s_fid=&s_sort=&s_key=&p=',
        'http://npoapp.gongyi.qq.com/succorv2/unproject/getlist?g_tk=false&jsoncallback=_Callback&s_status=2&s_tid=&s_puin=&s_fid=&s_sort=&s_key=&p=',
        'http://npoapp.gongyi.qq.com/succorv2/unproject/getlist?g_tk=false&jsoncallback=_Callback&s_status=3&s_tid=&s_puin=&s_fid=&s_sort=&s_key=&p='
    ];

    startTime = Date.now();
    async.eachLimit(pageURLTplArr, 2, function(pageURLTpl, calbak) {
        rwData(pageURLTpl, calbak);
    }, function(err, results) {
        if (err) {
            console.log(err);
            return;
        }

        common.writeToExcel(fileName, pjInfoArr);
        console.log('Finished successfully!');
        console.log('项目总数：' + pjInfoArr.length);
        console.log('总耗时：' + ((Date.now() - startTime) / 1000) + 's');
    });
}

exports.crawler = crawler;
