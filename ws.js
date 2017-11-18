function ws(url_){
	var url=null;
	var isW=false;
	var websocket = null;
	var heartCheck = {
		timeout: 10000,//60ms
		timeoutObj: null,
		serverTimeoutObj: null,
		reset: function(){
			clearTimeout(this.timeoutObj);
			this.start();
		},
		start: function(){
			var self = this;
			this.timeoutObj = setTimeout(function(){
				_this.websocket.send("HeartBeat", "beat");
			}, this.timeout)
		},
	};
	var _this = this;
	if(null!=url_){
		this.url=url_;
	}
	//判断当前浏览器是否支持WebSocket
    if ('WebSocket' in window) {
        this.websocket = new WebSocket(this.url);
		
		
		this.websocket.onopen =function (){
			//启动定时器检测心跳
			_this.isW=true;
			heartCheck.start(); 
		}
		
		
		this.websocket.onmessage=function (event) {
			console.info(event.data);
			heartCheck.reset(); 
		}

		this.websocket.onerror=function(e){
			console.info(e);  
			console.log("WebSocket连接发生错误,错误时间："+new Date());
			_this.reconnect();
		}
		this.websocket.onclose = function (e) {
			if(e.wasClean){
				console.log(_this.websocket.readyState+"WebSocket服务器连接主动关闭,关闭时间："+new Date());
			}else{
				console.log("WebSocket连接关闭,关闭时间："+new Date());
			}
			_this.isW=false;
			//_this.websocket = null;  
			_this.reconnect();
		}
		
    }
};

//重新连接
ws.prototype.reconnect=function(){
	if(!this.isW){
		var md=new Date();
		this.websocket = new WebSocket(this.url);
		getReadyMessage(this.websocket.readyState);
	}
	
};
//返回对浏览器支持ws的检测结果
ws.prototype.getIsW=function(){
	return this.isW;
};
ws.prototype.setIsW=function(isW){
	this.isW=isW;
};


//发送指令
ws.prototype.sendWs= function(json){
	var param=JSON.stringify(json);
	 //如果发送缓冲区没有数据才继续发送  
    if (this.websocket.bufferedAmount <= 0) {  
		this.websocket.send(param);
	}
	
};
function getReadyMessage(readyState){
	switch(readyState){
		case 0:
			console.log("WebSocket连接还没开启。,时间："+new Date());
			break;
		case 1:
			console.log("WebSocket连接已开启并准备好进行通信,时间："+new Date());
			break;
		case 2:
			console.log("WebSocket连接正在关闭的过程中,时间："+new Date());
			break;
		case 3:
			console.log("WebSocket连接已经关闭，或者连接无法建立,时间："+new Date());
			break;
	}

}



	
	