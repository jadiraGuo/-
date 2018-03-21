var getUrlParam = function(name){
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return unescape(r[2]); return null; //返回参数值
};
var code = getUrlParam('code');
/**
 * @private
 * 判断是否登录
 * @returns {Boolean}
 */
function isLogin () {
    if (localStorage.mobile_id  && localStorage.time_id  && localStorage.token_id
        && localStorage.uid) {
        return true;
    }
    return false;
}
/**
 * @private
 * 如何url地址上有code参数，需要用code换取字段
 */
function initCode (callback) {

    if (code) {
        $.ajax({
            type: 'POST',
            url: url + '/api/login/doCode',
            data: {
                code: code
            },
            success: function (data, status) {
                if(data.code == 200){
                    localStorage.mobile_id = data.data.mobile;
                    localStorage.uid = data.data.uid;
                    localStorage.token_id = data.data.token;
                    localStorage.time_id = data.data.time;
                    callback && callback();
                }
            }
        });
    }
}
function errorPop(msg) {
    $(".pop-box").text(msg);
    $(".pop-box").show();
    var time =1;
    setInterval(function(){
      time--;
      if(time == 0){
        $(".pop-box").hide();
      }
    },1000);
    return;
}
/**
 * @private
 * 获取处理后的本地个人用户信息
 * @returns {Object} userData
 */
function getUserData () {
    var mobile = localStorage.mobile_id || '';
    var time = localStorage.time_id || '';
    var token = localStorage.token_id || '';
    var uid = localStorage.uid || '';

    return {
        mobile: mobile,
        time: time,
        token: token,
        uid: uid,
    };
}
/**
 * @privare
 * 领取优惠券卷码
 */
function getCouponCode () {
    var userData = getUserData();
    var sharecode = sessionStorage.mycode;
    $.ajax({
        type: 'post',
        url: url + '/api/FirstCoupon/getCouponCode',
        data: {
            mobile: userData.mobile,
            // 本地是145，线上100
            prizeid: 100,
            // prizeid: 145,
            sharecode: sharecode,
            time: userData.time,
            token: userData.token,
            uid: userData.uid
        },
        success: function (data, status) {
            if(data.code == '200'){
                var status=data.data.code;
                switch (status) {
                    case 'error1':
                        errorPop('很遗憾，优惠券已领完');
                        break;
                    case 'error2':
                        errorPop('领取次数已达上限');
                        break;
                    case 'error4':
                        errorPop('活动已结束');
                        break;
                    case '200':
                        window.location.href='success.html?sharecode=' + sharecode
                        break;
                    default:
                        errorPop(data.data.message);
                }
            }
        }
    });
}

function dealCurrentCode () {
    var currentcode = this.getUrlParam("currentcode");
    if (typeof currentcode !== 'string') {
        return false;
    }
    if (currentcode === 'NaN' || currentcode === 'undefined') {
        return false;
    }
    return currentcode;
}
var sharefun={
    currentcode:"",
    mycode:'',
    info:'',
    getUrlParam: getUrlParam,
    popshow: function (pop){
        $(pop).show();
    },
    popclose: function (pop){
        $(pop).hide();
    },
    init: function (){
        var _this = this;
        if (!isLogin() && code) {
            initCode(function () {
                _this.initHtml();
            });
        } else {
            _this.initHtml();
        }
    },
    initHtml: function () {
        var _this=this;

      //获取所在页面code
      this.currentcode  = dealCurrentCode();
       //获取当前code
       if(!sessionStorage.mycode || sessionStorage.mycode=="" || sessionStorage.mycode=="undefined"){
           if(window.location.href.split("sharecode=")[1]){
             this.mycode=window.location.href.split("sharecode=")[1]
           }else{
             window.location.href = url + '/api/Wechat/getAuthByCode?state='+location.href
           }
       }else{
           this.mycode = sessionStorage.mycode

       }
      sessionStorage.mycode = this.mycode
      // 单独拿出去作为一个js文件
      //_this.share();

      //从官网进入自己的活动页
      if(this.currentcode=="false" || !this.currentcode){
          _this.getuserinfo(sessionStorage.mycode);
          $("#myShareBox").show();
          $("#currentShareBox").hide();
      }else if(this.currentcode!="false"){
        //获取当前被助力人的页面
         _this.getuserinfo(_this.currentcode);
         if(sessionStorage.mycode===_this.currentcode){
         //进入自己分享的助力页面显示”领取优惠券“和”分享助力“按钮
            $("#myShareBox").show();
            $("#currentShareBox").hide();
         }else{
        //进入别人分享的助力页面显示”助力“和”我也要新年券“按钮
            $("#myShareBox").hide();
            $("#currentShareBox").show();
         }
      }else{
        alert("errorcode")
      }
    },
    progress: function(realData){
      //初始优惠券

      $("#initprogressbg").css("width","50px");
      $("#initprogressbg .progresspeople").text("0人");
      $("#initprogressbg .progressprice").text("¥20")
      $("#moveprogressbg").css("left","50px")
      $("#moveprogressbg").css("width",realData.count*25+"px")
      if(realData.count==10){
        $("#moveprogressbg").css({"border-top-right-radius":"10px","border-bottom-right-radius":"10px"})
      }
    },
    getuserinfo: function (code){
        var _this=this;
        $.ajax({
            url: url + '/api/Wechat/getAuthInfoByCode',
            data: {
                sharecode: code
            },
            type: 'post',
            success: function (data) {
                console.log(data)
                if (data.data) {
                    _this.getHelpLog() //获取当前用户助力信息
                    _this.userinfohtml(data.data)//当前用户信息写入页面
                } else {
                    sessionStorage.clear();
                    location.href = '/activity/wxpower/index.html';
                }
            }
        })
    },
    //当前用户信息写入页面
    userinfohtml:function (info){
        $("#username").text(info.nickname)
        $("#userphoto").attr("src",info.headimgurl)
    },
    //获取当前用户助力信息
    getHelpLog: function (){
        var _this=this;
        var datasharecode= (!!_this.currentcode && _this.currentcode!="false") ?  _this.currentcode : sessionStorage.mycode
        console.log(_this.mycode)
        $.ajax({
            url: url + '/api/Wechat/getHelpLog',
            data: {
                sharecode : datasharecode
            },
            type: 'post',
            success: function (data) {
                console.log(data)
                if(data.code==200){
                    var realData=data.data;
                    if(realData.is_get==2){
                      if(_this.currentcode==sessionStorage.mycode || !_this.currentcode){
                         window.location.href="success.html?mycode="+sessionStorage.mycode;
                      }else{
                        _this.helpend();
                        $(".disableBtn").text("已领取")
                      }
                    }
                    var realData=data.data;
                    if(realData.count===0){
                        $(".sharenull").show();
                        $(".sharelist").hide();
                    }else{
                        var helplist=realData.list;// 助力列表
                        $(".sharenull").hide();
                        $(".sharelist").show();
                        $(".sharelist").html("")
                        for(var i =0;i<helplist.length;i++){
                            var oImgBox = document.createElement("img");
                            oImgBox.setAttribute("src", helplist[i].helpheadimgurl);
                            $(".sharelist").append(oImgBox);
                            console.log(sessionStorage.mycode)
                            if(helplist[i].helpcode==sessionStorage.mycode){
                                _this.helpend()
                            }
                        }

                    }
                    _this.progress(realData)
                    $("#price").text(realData.price)
                    $("#count").text(realData.count)
                }

            }
        })
    },
    //点击助力
    tohelp: function (){
        var _this=this;
        console.log(_this.currentcode)
        console.log(sessionStorage.mycode)
        $.ajax({
            url: url + '/api/Wechat/helpGetCoupon',
            data: {
                sharecode:_this.currentcode,
                helpcode:sessionStorage.mycode
            },
            type: 'post',
            success: function (data) {
                if(data.code==200) {
                    _this.helpend();
                    _this.getHelpLog();
                }
            }
        })
    },  //已助力
    helpend: function (){
      $("#currentShareBox #helpCoupon").hide();
      $("#currentShareBox .disableBtn").show();
    }
}
sharefun.init();

// 点击分享助力
$("#ToShare").click(function(){
    sharefun.popshow(".popsharetip")
})
$("#myShare").click(function(){
    window.location.href="landing.html"
})
$(".popsharetipclose").click(function(){
    sharefun.popclose(".popsharetip")
})

$("#helpCoupon").one("click",function(){
    sharefun.tohelp();
})
//领取优惠券
$("#GetCouponTip").click(function () {
    getCouponCode();
})
$(".closebtn").click(function () {
  $(".popgettip").hide();
})

function getNowUrlNoHash () {
    return location.protocol + '//' + location.hostname + ':' + location.port + location.pathname + location.search;
}
//领取优惠券打开提示框
$("#GetCoupon").click(function () {
    if (isLogin()) {
        $(".popgettip").show();
    } else {
        location.href = url + '/api/login/login?referer_url=' + encodeURIComponent(getNowUrlNoHash());
    }
})
