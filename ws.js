function ws(){
	var op=null;
	window.isW=false;
	var websocket = null;
};
ws.prototype.init=function(op){
	if(null!=op){
		this.setOp(op);
	}
	var _this = this;
	
	//判断当前浏览器是否支持WebSocket
	if ('WebSocket' in window) {
		this.websocket = new WebSocket(this.op.url);
		
		this.websocket.onopen =function (){
			//启动定时器检测心跳
			window.isW=true;
			_this.getOp().heartCheck.start(_this); 
			_this.getOp().open();
		}
		
		this.websocket.onmessage=function (event) {
			console.info(event.data);
			_this.getOp().onmessage(event.data);
			_this.getOp().heartCheck.reset(_this); 
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
			window.isW=false;
			//_this.websocket = null;  
			_this.reconnect();
		}
		
	}
}
//重新连接
ws.prototype.reconnect=function(){
	if(!this.isW){
		var md=new Date();
		this.websocket = new WebSocket(this.op.url);
		getReadyMessage(this.websocket.readyState);
	}
	
};
//返回对浏览器支持ws的检测结果
ws.prototype.getOp=function(){
	return this.op;
};
ws.prototype.setOp=function(op){
	this.op=op;
};
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



	
	