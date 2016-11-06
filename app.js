var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
/* Express将app初始化成一个函数处理器，
你可以将其提供给一个HTTP服务器(看第三行)
我们定义一个路由处理器，当我们访问网站主页时，这个处理器就会被调用。
我们让这个http服务器监听3000端口。 */

/* Socket.IO由两部分构成：

socket.io：一个服务器，集成了Node.JS的HTTP服务器
socket.io-client：一个客户端库，在浏览器端加载
在开发期间，socket.io会自动为我们提供客户端，所以现在我们只需安装一个模块：

npm install --save socket.io
var io=require('socket.io')(http);
 注意到，我传递了一个http(HTTP Server)对象来创建一个新的socket.io实例，
 然后，为即将来到的套接字监听connection事件，我会将其打印到控制台中。
*/

var io=require('socket.io')(http);
app.use(express.static((__dirname + '/public')));
app.get('/',function(req,res){
	
	res.sendfile('index.html');
});
var connectedSockets={};
//初始值即包含了群聊，用“”表示nickname
var allUsers=[{nickname:"",color:"#000"}];
io.on('connection',function(socket){
	
	
	
	socket.on('addUser',function(data){
		//该事件由客户端输入昵称后触发，服务端收到后判断,昵称已被占用
		if(connectedSockets[data.nickname]){
			socket.emit('userAddingResult',{result:false});
		}else{
			//反之通知客户端昵称有效以及当前所有已经连接的用户信息，并广播
			socket.emit('userAddingResult',{result:true});
			socket.nickname=data.nickname;
			/* 保存每个socket实例，发私信需要用
			发给特定用户，如果消息是发给特定用户A，那么就需要获取A对应的socket实例，
			然后调用起emit方法，所以没当一个客户端连接到server时，
			我们得把socket实例保存起来，以备后续之需 */
			connectedSockets[socket.nickname]=socket;
			allUsers.push(data);
			//广播欢迎新用户，除新用户外都可以看到
			socket.broadcast.emit('userAdded',data);
			//将所有在线用户发给新用户
			socket.emit('allUser',allUsers);
			
		}
	});
	socket.on('addMessage',function(data){
		if(data.to){
			console.log(data);
			//需要发私信时，取出socket实例做操作即可：
			connectedSockets[data.to].emit('messageAdded',data);
			
		}else{
		//群发，广播消息，除原发送外其他的都可以看到
socket.broadcast.emit('messageAdded',data);		
			
		}
	});
	socket.on('disconnect',function(){
		//有用户退出聊天室
		//广播有用户退出
		socket.broadcast.emit('userRemoved',{
			nickname: socket.nickname
		});
		for(var i=0;i<allUsers.length;i++){
			if(allUsers[i].nickname==socket.nickname){
				allUsers.splice(i,1);
				
			}
		}
		//删除对应的socket实例
		delete connectedSockets[socket.nickname];
	});
	
});
http.listen(3012,function(){
	console.log('hello  listening on * 3012');
	
});