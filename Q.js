/* -----------------------------------------------------------------------------------------------------------
 * 名称：Q.js框架
 * 描述：这是一个轻量级的js框架
 * 主要功能：脚本文件模块化加载 函数队列执行 样式注入 事件绑定 事件移除 dom选择 支持链式调用
 * 兼容性：几乎兼容所有现代浏览器
 * 性能：尚未测试 但能保证她绝对不是最慢的
 * 开发者：单骑闯天下
 * 最后更新时间：2014.4.1
 * 版本：v 1.0

 * ---------------------- 项目历程 ---------------------------------------------------------------------------
 * 2013年12月份开始构思js模块化加载
 * 2014年3月11框架发布并且定义名称为M.js 目前已独立出来托管在http://github.com/githubyang/M
 * 
 * 2014年3月19日开始扩展框架 增加 事件绑定 事件移除 dom选择 并且框架命名为Q.js

 * ---------------------- 每次修改增加的功能 -----------------------------------------------------------------
 * # 2014年3月19日
 * 事件绑定:
 * bind()方法目前可以绑定基本的事件 click mouseover mouseout等事件
 * 事件移除:
 * remove()方法
 * dom选择:
 * className()方法支持选择class=attriubte形式的所有元素
 * attriubte()方法支持属性选择 如下:
 * *[title]{} 包含标题(title)的所有元素
 * a[href]{} 对href属性的a元素应用样式
 * a[href][title]{} 将同时有href和title属性的a元素应用样式
 * [attribute=value] 选取带有指定属性值的每个元素
 * [attribute~=value] 选取带有指定词汇的每个元素
 * [attribute|=value] 选取指定属性值开头的所有元素，但必须是整个单词，后面可以跟-号
 * [attribute^=value] 选取指定属性值开头的所有元素
 * [attribute$=value] 选取指定属性值结尾的每个元素
 * [attribute*=value] 选取包含属性指定值的每个元素
 * [attribute!=value] 选取不等于指定属性值的每一个元素 jquery里面的
 * # 2014年3月20日
 * 增加ready事件加载功能 由于目前水平有限 ready的速度始终无法超过jquery的ready方法
 * 调整DOM选择接口统一为Q.$()
 * 增加remove方法用来移除元素
 * 增加设置和获取元素属性的值attr方法
 * 增加addClass方法
 * 增加removeClass方法
 * # 2014年3月21日
 * 增加方法 append prepend before after html val
 * # 2014年3月22日
 * 增加方法css用来获取元素的 width height padding
 * # 2014年3月25日
 * 修改事件绑定 增加事件缓存 以及修正IE里面的部分事件
 * # 2014年3月27日
 * 为IE getElementsByTagName设置了缓存来提升匹配速度 增加children 和find方法 增加选择器支持 a > b 形式
 * # 2014年3月28日
 * 增加了hover事件
 * # 2014年3月31日
 * 重写了ready方法 现在ready事件延迟加载的速度已经达到我想要的速度 比onload快
 * 修正了hover方法里面的触发问题和绑定函数的执行顺序问题
 * # 2014年4月1日
 * 修正hover模拟事件的冒泡 children增加在子节点集合查找特定节点的方法 removeClass修正
 * # 2014年4月8日
 * 增加自定义事件触发器spark 必须接受一个触发参数
 * # 2014年4月11日
 * 实现方法合并extend
 * ----------------------------------------------------------------------------------------------------------*/
(function(window){
;({
    /* 核心库的配置文件 */
    config:{
        auto:true,
        coreLib:[], /* 需要加载的核心js文件 */
        model:{}
    },
    selector:null, /* class选择器用到的变量 标识getElementsByClassName原生API是否可用 */
    Reg:{}, /* 缓存正则 由于重复匹配可以提升性能 */
    uid:0, /* 控制核心库的加载次数 避免无谓的计算 */
    count:0,/* 队列执行需要用到的计数 */
    map:{},/* 队列执行的字面量 */
    rmap:{},/* 队列执行的字面量 */
    jsReference:{},/* 加载外部模块参考位置 */
    reference:{},/* 指定的位置 */
    cssArr:{},/* 存储已注入css的索引 */
    loaded:{},/* 加载完成 readyState */
    loadList:{},/* 函数执行完毕 开始准备执行回调函数 */

    cacheNode:null,/* 缓存getElementsByTagName(*)选取的数据,在IE里面可以提升速度 */
    cdp:null,/* 用来判断浏览器是否支持contains */

    cacheData:{},/* 缓存事件的数据 */
    uuid:null,/* 缓存事件的计数 */
    expando:null,/* 读取和删除事件缓存数据的索引 */

    ready:undefined, /* 页面是否加载完毕的标识 */
    readyFn:[], /* ready 函数的队列 */

    version:'1.0.0',

    attribute:['class','id','style','title'], /* html的标准属性 */

    /* 分离自jquery */
    class2type:{},
    toString:Object.prototype.toString,
    hasOwn:Object.prototype.hasOwnProperty,
    /* 负责初始化 */
    init:function(){
        var that=this;
        this.uuid=0;
        this.expando='Q'+(Math.random()+'').slice(-8);
        /* 初始外部配置 */
        (function(){
            var jsObj = (function (a) {
                var files = a.getElementsByTagName('script'),
                    n=parseInt( (files.length - 1),10);
                that.jsReference[0] = files[n];
                return files[n];
            }(document));
            that.reference[0]=document.body.firstChild;
            (function(a){
                var obj=a,
                    initAuto=obj.getAttribute('auto'),/* 是否关闭加载核心库 */
                    initCore=obj.getAttribute('core');/* 外部加载的核心库 */
                if(initAuto){
                    that.config.auto=(initAuto.toLowerCase()==='false')?false:true;
                }
                if(initCore){
                    that.config.coreLib=initCore.split(',');
                }
            }(jsObj||{}));
        }());
        that.readyInit();
        if(document.getElementsByClassName){
            that.selector=1;
        }
        if(document.compareDocumentPosition){
            that.cdp=1;
        }
        window.Q=(function(){
            return that.method();
        }());
    },
    getMod:function (e){
        var model = this.config.model,
            mod; 
        if(typeof e === 'string') {
            mod=(model[e]) ? model[e] : {path : e};
        }else{
            mod = e;
        }
        return mod;
    },
    load:function(path,type,charset,fn){
        var node,
            t,
            that=this,
            done=function(){
                that.loaded[path]=1;
                fn();
            };
        if(typeof path ==='string'){
            t=type || path.toLowerCase().split(/\./).pop().replace(/[\?#].*/,'');
        }else{
            path=path.join("");
            t=type || path.toLowerCase().split(/\./).pop().replace(/[\?#].*/,'');
        }
        if(t==='js'){
            node=document.createElement('script');
            node.setAttribute('src',path);
            node.setAttribute('async',true);
        }else if(t==='css'){
            node=document.createElement('link');
            node.setAttribute('href', path);
            node.setAttribute('type', 'text/css');
            node.setAttribute('rel', 'stylesheet');
        }
        if(charset){node.charset=charset;}
        node.onerror=function(){done();node.onerror=null;};
        node.onload=node.onreadystatechange=function(){
            if(!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete'){
                done();
                node.onload=node.onreadystatechange=null;
            }
        };
        that.jsReference[0].parentNode.insertBefore(node,that.jsReference[0]);
    },
    /* 判断是否加载依赖文件或者独立的模块 在这里并不执行任何实质性的加载而是执行递归判断文件依赖性然后调用load进行加载 */
    check:function(deps,cb){
        var name=deps.join(''),
            mod=this.getMod(name),
            that=this,
            path=mod.path;
        /* 它是被load fn 所引用 */
        var callback=function (){
                that.loadList[name]=1;/* 代表已经加载完毕了 函数执行完毕 开始准备执行回调函数 */
                cb();
            };
        /* 比如run依赖h执行 在框架内部会开始加载run 也就是返回函数 然后执行h */
        if(mod.requires){
            this.check(mod.requires,(
                /* 只有这里执行完毕之后外部的递归才会开始执行 为什么要用return 因为return会让后面的语句计算 才能保证依赖执行 */
                function(m){
                    return function(){
                        that.load(m.path,m.type,m.charset,callback);
                    };
                }(mod))
            );
        }else{
            this.load(mod.path,mod.type,mod.charset,callback);
        }
    },
    /* 查找数组里面当前元素的位置 */
    indexOf:Array.prototype.indexOf || function(obj){
        for(var i=0,len=this.length;i<len;++i){
            if(this[i]===obj){return i;}
        }
        return -1;
    },
    /* 异步执行的内置方法 */
    release:function(res,list){
        var maps=this.map,
            rmaps=this.rmap,
            /* 某些方面讲这是个异步执行的核心方法 这方法还有优化空间 */
            fire=function(callback,thisObj){
                setTimeout(function(){
                    callback.call(thisObj);
                },0);
            };
        for(var i=0,len=list.length;i<len;++i){
            var uid=list[i],
                mapItem=maps[uid],
                waiting=mapItem.waiting,
                pos=this.indexOf.call(waiting,res);
                waiting.splice(pos,1);
            if (waiting.length===0){
                fire(mapItem.callback,mapItem.thisObj);
                delete maps[uid];
            }
        }
    },
    /* 给匹配的元素对象加套子 */
    classArray:function(dom){
        var toArray = function(s){
            try{
                return Array.prototype.slice.call(s);
            } catch(e){
                var arr = [];
                for(var i = 0,len = s.length; i < len; i++){
                    arr[i] = s[i]; 
                }
                return arr;
            }
        };
        var arr = toArray(dom);
        for(var i in Q){
            arr[i] = Q[i];
        }
        return arr;
    },
    /* 一些判断方法 我是从jquery里面提取的 */
    isFunction:function(obj){return this.type(obj)==="function";},
    isArray:Array.isArray || function(obj){return this.type(obj)==="array";},
    isWindow:function(obj){return obj && typeof obj === "object" && "setInterval" in obj;},
    isNaN:function(obj){
        var rdigit=/\d/;
        return obj===null || !rdigit.test(obj) || isNaN(obj);
    },
    type:function(obj){
        return obj===null?String(obj):this.class2type[this.toString.call(obj)] || "object";
    },
    /* 遍历方法 我是从jquery里面提取的 */
    each:function(object,callback,args){
        var name,i=0,length=object.length,isObj=length===undefined || this.isFunction(object);
        if(args){
            if(isObj){
                for(name in object){
                    if(callback.apply(object[name],args)===false){
                        break;
                    }
                }
            }else{
                for(;i<length;){
                    if(callback.apply(object[i++],args)===false){
                        break;
                    }
                }
            }
        }else{
            if(isObj){
                for(name in object){
                    if ( callback.call( object[ name ], name, object[ name ] ) === false ) {
                        break;
                    }
                }
            } else {
                for ( ; i < length; ) {
                    if ( callback.call( object[ i ], i, object[ i++ ] ) === false ) {
                        break;
                    }
                }
            }
        }
        return object;
    },
    trim:function(text){
        return text===null?"":text.toString().replace(/^\s+/,"").replace(/\s+$/,"");
    },
    data:function(elem,key,value){
        var index=(elem===window)?0:(elem.nodeType===9)?1:elem[this.expando]?elem[this.expando]:(elem[this.expando]=++this.uuid),
            pointer=this.cacheData[index]?this.cacheData[index]:(this.cacheData[index]={});
        if(value!==undefined){
            pointer[key]=value;
        }
        return pointer[key];
    },
    removeData:function(elem,key){
        var index=(elem===window)?0:(elem.nodeType===9)?1:elem[this.expando],
            isEmptyObject=function(obj){
                var name;
                for(name in obj){
                    return false;
                }
                return true;
            },
            deleteData=function(elem){
                if(index<1){return;}
                try{
                    delete elem[this.expando];
                }catch(e){
                    elem.removeAttribute(this.expando);
                }
            };
        if(index===undefined){return;}
        delete this.cacheData[index][key];
        if(isEmptyObject(this.cacheData[index])){
            deleteData(elem);
        }
    },
    /* 添加事件 */
    addEvent:function(elem,type,handler){
        elem['on'+type]=handler;
    },
    /* 移除事件 */
    removeEvent:function(elem,type){
        elem['on'+type]=null;
        this.removeData(elem,type);
    },
    /* IE里面的事件修正 */
    fixEvent:function(e){
        if(e.target){return e;}
        var event={},
            name;
        event.target=(e.srcElement||document);
        event.preventDefault=function(){
            e.returnValue=false;
        };
        event.stopPropagation=function(){
            e.cancelBubble=true;
        };
        for(name in e){
            event[name]=e[name];
        }
        if((event.pageX!==true) && event.clientX !==null){
            var doc=document.documentElement,
                body=document.body;
            event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
        }
        return event;
    },
    /* 事件绑定 */
    handler:function(elem){
        var that=this;
        return function(event){
            event=that.fixEvent(event || window.event);
            var type=event.type,
                i=0,
                handler,
                events=that.data(elem,type),
                len=events.length;
            for(;i<len;i++){
                handler=events[i];
                if(handler.call(elem,event)===false){
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        };
    },
    /* 选择器的API接口 用来选取class=attriubte */
    className:function(){
        var args=Array.prototype.slice.call(arguments),
            arr=[],
            i=0,
            a,
            b,
            n,
            tag=args[1]||'*',
            reg,
            className;
        if(args===false){return;}
        if(this.selector){
            a=document.getElementsByClassName(args[0]);
            n=a.length;
            for(;i<n;i++){
                arr.push(a[i]);
            }
            return arr;
        }else{
            classNmae=args[0].replace('-','\\-');
            reg=new RegExp('(^|\\s)'+classNmae+'(\\s|$)');
            if(this.cacheNode){
                a=this.cacheNode;
            }else{
                this.cacheNode=a=document.getElementsByTagName(tag);
            }
            n=a.length;
            for(;i<n;i++){
                b=a[i];
                if(reg.test(b.className)){
                    arr.push(b);
                }
            }
            return arr;
        }
    },
    attriubte:function(){
        var reg;
        if(this.Reg.reg){
            reg=this.Reg.reg;
        }else{
            reg=/([\*a-zA-Z1-6]*)?(\[(\w+)\s*(\^|\$|\*|\||~|!)?=?\s*([\w\u00C0-\uFFFF\s\-_\.]+)?\])?/;
            this.Reg.reg=reg;
        }
        var node=arguments[1] || document,
            search=arguments[0],
            str=search.match(reg),
            tag=str[1], /* 属性选择器假如为e[k=v]形式 tag为e */
            key=str[3], /* 属性选择器假如为e[k=v]形式 key为k */
            type=str[4]+'=', /* 属性选择器假如为e[k=v]形式 type为符号 */
            val=str[5], /* 属性选择器假如为e[k=v]形式 val为v */
            arr=[],
            attr,
            i,
            n,
            value,
            elem=node.getElementsByTagName(tag),
            len=elem.length;
        /* 如果支持 IE8+以上都支持 */
        if((!!document.querySelectorAll) && type != "!="){
            value = document.querySelectorAll(search);
            if(value){return arr;}
            for(i=0,length = value.length;i < length;i++){
                arr.push(value[i]);
            }
            return arr;
        }
        for(i=0;i<len;i++){
            attr=elem[i];
            value=attr[key];
            if(typeof value==='string'){
                if(value!==false){
                    var where=false;
                    if(type==='*='){
                        where=(value.indexOf(val)>=0)?true:false;
                    }else if(type==='!='){
                        where=(value!=val)?true:false; /* 将会选取所有属性值不等于条件值的元素 例: 条件值a title="a b" title="a" 将会选取title="a b" */
                    }else if(type==='^='){
                        where=(value.indexOf(val)===0)?true:false; /* 选取以xx开头的所有元素 */
                    }else if(type==='$='){
                        n=val.length;
                        where=(value.slice(-n)===val)?true:false; /* 选取以xx结尾的所有元素 */
                    }else if(type==='~='){
                        where=((''+value+'').indexOf(val)>=0)?true:false; /* 选取指定词汇的元素 */
                    }else if(type==='|='){ /* 匹配属性值为XX或以XX-打头的元素 */
                        where=( (value===val) ||value.slice(0,val.length+1)===(val+'-') )?true:false;
                    }else if(type==='='){
                        where=(value===val)?true:false;
                    }
                    if(where){
                        arr.push(attr);
                    }
                }
            }
        }
        return arr;
    },
    insert:function(elem,value,check){
        var fragment=document.createDocumentFragment(),
            str=this.parseTag(value,fragment);
        if(check==='append'){
            elem.appendChild(str);
        }else if(check==='prepend'){
            elem.insertBefore(str,elem.firstChild);
        }else if(check==='before'){
            elem.parentNode.insertBefore(str,elem);
        }else if(check==='after'){
            elem.parentNode.insertBefore(str,elem.nextSibling);
        }
    },
    parseTag:function(value,fragment){
        var div=document.createElement('div'),
            node,
            regTag=/^<(\w+)\s*\/?>$/,/* 匹配单个标签 */
            regTags=/<\s*([\w\:]+)/;
        if(regTag.test(value)===true){
            return document.createElement(RegExp.$1);
        }else if(regTags.test(value)===true){
            div.innerHTML=value;
            while((node=div.firstChild)){ /* 将div上的节点转移到文档碎片上 */
                fragment.appendChild(node);
            }
            return fragment;
        }else{
            node=document.createTextNode(value);
            fragment.appendChild(node);
            return fragment;
        }
    },
    getStyle:function(elem,style){
        var isQuirk=(document.documentMode)?(document.documentMode==5)?true:false:((document.compatMode=="CSS1Compat")?false:true),
            toHump=function(value){
                return value.replace(/\-(\w)/g,function(a,value){
                    return value.toUpperCase();
                });
            },
            getIEopacity=function(elem){
                var filter;
                if(!!window.XDomainRequest){
                    filter = elem.style.filter.match(/progid:DXImageTransform.Microsoft.Alpha\(.?opacity=(.*).?\)/i);
                }else{
                    filter = elem.style.filter.match(/alpha\(opacity=(.*)\)/i);
                }
                if(filter){
                    var value = parseFloat(filter[1]);
                    if (!isNaN(value)) {
                        return value ? value / 100 : 0;
                    }
                }
                return 1;
            };
        if(document.recalc){
            if(style=="opacity"){
                return getIEopacity(elem);
            }
            var value=elem.currentStyle[toHump(style)];
            if(/^(height|width)$/.test(style)){
                var values = (style == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
                if(isQuirk){
                    return elem[toHump("offset-"+style)];
                }else{
                    var client = parseFloat(elem[toHump("client-"+style)]),
                        paddingA = parseFloat(this.getStyle.call(null,elem, "padding-"+ values[0])),
                        paddingB = parseFloat(this.getStyle.call(null,elem, "padding-"+ values[1]));
                    return (client - paddingA - paddingB);
                }
            }
            return value;
        }else{
            if(style === "float"){
                style = Float;
            }
            return document.defaultView.getComputedStyle(elem,null).getPropertyValue(style);
        }
    },
    /* 用来判断parent是不是child的父元素 */
    contains:function(parent,child){
        if(this.cdp===1){
            return !!(parent.compareDocumentPosition(child) & 16);
        }else{
            return (parent !== child) && (parent.contains ? parent.contains(child) : true);
        }
    },
    /* hover方法的修正函数 */
    fixMouseLeave:function(elem,fn,boll){
        var mouseleave = !this.cdp ? "mouseleave" : "mouseout",
            that=this;
        if(elem === null || elem === window ){
            (elem = document);
        }
        return {
            type:mouseleave,
            elem:elem,
            fn:(!this.cdp||boll)? fn : function(e) {
                var source=e.relatedTarget.tagName.toLowerCase();
                if(!that.contains(e.relatedTarget,this)||(source==='body')){
                    fn.call(this,e);
                }
            }
        };
    },
    fixMouseEnter:function(elem,fn,boll){
        var mouseenter = !this.cdp ? "mouseenter" : "mouseover",
            that=this;
        if(elem===null || elem===window ){
            elem = document;
        }
        return {
            type:mouseenter,
            elem:elem,
            fn:(!this.cdp||boll)? fn : function(e){
                var source=e.relatedTarget.tagName.toLowerCase();
                if(!that.contains(e.relatedTarget,this)||(source==='body')){
                    fn.call(this,e);
                }
            }
        };
    },
    /* ready的方法 */
    readyOn:function(fn){
        if(this.ready===undefined){
            this.readyFn.push(fn);
            return;
        }
        this.readyRun();
    },
    readyRun:function(){
        var i=0,
            n=this.readyFn.length;
        if(n>0){
            if(n===1){
                this.readyFn[0]();
                return;
            }
            for(;i<n;i++){
                this.readyFn[i]();
            }
            this.readyFn=null;
        }
    },
    readyInit:function(){
        var that=this;
        if(document.addEventListener){
            document.addEventListener('DOMContentLoaded',function(){
                that.ready=true;
                that.readyRun();
            },false);
        }else{
            document.onreadystatechange=function(){
                if(document.readyState==='complete'){
                    that.ready=true;
                    that.readyRun();
                    document.onreadystatechange=null;
                }
            };
        }
    },
    extend:function(object,obj,prop) {
        if (!prop) {
            prop = obj;
            obj = object;
        }
        for (var i in prop) {
            obj[i] = prop[i];
        }
        return obj;
    },
    /* 提供给外部访问的方法接口 */
    method:function(){
        var that=this;
        return {
            /* 运行方法 */
            run:function(){
                var args=[].slice.call(arguments),
                    fn,
                    id,
                    len=parseInt(args.length,10);
                that.uid++;
                /* 加载核心库 */
                if(that.config.auto && ( that.loadList[that.config.coreLib.join('')] !== true ) && ( (that.uid>1) !== true ) ){
                    that.check(that.config.coreLib,function(){
                        Q.run.apply(that,args);
                    });
                    return Q;
                }
                if( (len>0) && ( (that.loadList[args[0]]===1) !== true ) ){
                    if(typeof args[len-1]==='function'){
                        fn=args.pop();
                    }
                    id=args.join('');
                    if((args.length === 0 || that.loadList[id]) && fn){
                        fn();
                        return Q;
                    }
                    /* 正常加载 */
                    that.check(args,function(){
                        that.loadList[id] = 1;
                        if(fn){
                            fn();
                        }
                    });
                }else{
                    return Q;
                }
                return Q;
            },
            /* 批量设置模块的方法 */
            set:function(m){
                if(m){
                    for(var a in m){
                        that.config.model[a]=m[a];
                    }
                }
                return Q;
            },
            /* CSS注入方法 */
            inCss:function(a,s){
                var css=document.getElementById('addCss');
                if(!css){
                    css=document.createElement('style');
                    css.type='text/css';
                    css.id='addCss';
                    that.reference[0].parentNode.insertBefore(css,that.reference[0]);
                }
                if( (that.cssArr[0]===a) !== true ){
                    that.cssArr[0]=a;
                    if(css.styleSheet){
                        css.styleSheet.cssText=css.styleSheet.cssText + s;
                    }else{
                        css.appendChild(document.createTextNode(s));
                    }
                }
                return Q;
            },
            /* 单个添加模块的方法 */
            add:function(name,obj){
                if(!name || !obj || !obj.path){return;}
                that.config.model[name]=obj;
                return Q;
            },
            /* 异步执行外部调用的等待方法 */
            when:function(resources, callback, thisObj){
                var maps=that.map,
                    rmaps=that.rmap;
                if(typeof resources === 'string'){resources=[resources];}
                var id=(that.count++).toString(16);
                maps[id]={
                    waiting:resources.slice(0),
                    callback:callback,
                    thisObj:thisObj || window
                };
                for (var i=0,len=resources.length;i<len;++i){
                    var res=resources[i],
                        list=rmaps[res] || (rmaps[res]=[]);
                    list.push(id);
                }
                return Q;
            },
            /* 异步执行外部调用的触发方法 */
            trigger:function(resources){
                if(!resources){return Q;}
                var maps=that.map,
                    rmaps=that.rmap;
                if(typeof resources==='string'){resources=[resources];}
                for(var i=0,len=resources.length;i<len;++i){
                    var res=resources[i];
                    if (typeof rmaps[res]==='undefined') continue;
                    that.release(res,rmaps[res]);
                    delete rmaps[res];
                }
                return Q;
            },
            /* 属性选择外部接口 */
            $:function(selector){
                var elem,
                    reg=/(^[\.|#]{1}\w+)+\s*>\s*(\.*\w+)+$/,
                    regId=/^#\w+$/,
                    regClass=/^\.\w+$/,
                    m;
                if(typeof selector === "object" || selector.nodeType === 1 || selector.nodeType === 9 ){
                    if(selector == document){
                        selector = document.body;
                    }
                    return that.classArray([selector]);
                }else if(regId.test(selector)){
                    elem=document.getElementById(selector.replace('#',''));
                    return that.classArray([elem]);
                }else if(regClass.test(selector)){
                    elem=that.className(selector.replace('.',''));
                    return that.classArray(elem);
                }else if(reg.test(selector)){
                    m=selector.match(reg);
                    elem=Q.$(m[1]).children().find(m[2]);
                    return elem;
                }else{/* 如果都不是就默认属性匹配 */
                    elem=that.attriubte(selector);
                    return that.classArray(elem);
                }
            },
            bind:function(type,handler){
                var elem=this[0],
                    events=that.data(elem,type)||that.data(elem,type,[]);
                events.push(handler);
                if(events.length===1){
                    var handlers=that.handler(elem);
                    that.addEvent(elem,type,handlers);
                }
            },
            unbind:function(type){
                var elem=this[0],
                    events=that.data(elem,type);
                if(events===undefined){return;}
                that.removeEvent(elem,type);
            },
            /* 事件延迟加载 */
            ready:function(fn){
                that.readyOn(fn);
            },
            /* 元素移除 */
            remove:function(elem){
                var delNode=function(a){
                    var d,
                        elem=a;
                    if(!!document.recalc){
                        if( (elem[0] && elem[0].tagName) !='body'){
                            d=document.createElement('div');
                            d.appendChild(elem[0]);
                            d.innerHTML='';
                        }
                    }else{
                        if( (elem[0] && elem[0].parentNode && elem[0].tagName) != 'body' ){
                            elem[0].parentNode.removeChild(elem[0]);
                        }
                    }
                };
                if(elem){
                    delNode(elem);
                }else{
                    delNode(this);
                }
            },
            /* 添加样式 */
            addClass:function(value){
                var str=value.split(' '),
                    len=str.length,
                    temp,
                    i=0,
                    setCss;
                if(this[0].nodeType===1){
                    if(!this[0].className){
                        this[0].className=value;
                    }else{
                        temp=' '+this[0].className+' ';
                        setCss=this[0].className;
                        if(len>0){
                            for(;i<len;i++){
                                if(temp.indexOf(' '+str[i]+' ')<0){
                                    setCss+=' '+str[i];
                                }
                            }
                        }else{
                            setCss+=' '+value;
                        }
                        this[0].className=that.trim(setCss);
                    }
                    return this;
                }
            },
            /* 移除样式 */
            removeClass:function(value){
                if(value!==undefined){
                    var str=this[0].className;
                    if(str){
                        var arr=that.trim((str.replace(/\s{2,}/,' '))).split(' '),
                            len=arr.length,
                            n,
                            i=0,
                            s;
                        n=that.indexOf.call(arr,value);
                        if(n!=-1){
                            arr.splice(n,1);
                        }
                        s=arr.join(' ');
                        this[0].className=that.trim(s);
                    }
                }else{
                    this[0].className='';
                }
                return this;
            },
            /* 设置获取元素属性的值 */
            attr:function(name,value){
                if(value!==undefined){
                    this[0].setAttribute(name,value);
                    return this;
                }else{
                    var a=that.indexOf.call(that.attribute,name),
                        b;
                    if(a===-1){
                        b=this[0].getAttribute(name) || this[0].attributes[name];
                        if(!b){
                            b=this[0].getAttributeNode(name)?this[0].getAttributeNode(name).value:'';
                        }
                        return b;
                    }else{
                        if(name && name=="class" && this[0].className){
                            b = this[0].className;
                        }else{
                            b=this[0][name];
                        }
                        return b;
                    }
                }
            },
            /* 添加文档碎片方法 尚未完全实现 */
            append:function(value){
                if(value===undefined){return;}
                that.insert(this[0],value,'append');
            },
            prepend:function(value){
                if(value===undefined){return;}
                that.insert(this[0],value,'prepend');
            },
            before:function(value){
                if(value===undefined){return;}
                that.insert(this[0],value,'before');
            },
            after:function(value){
                if(value===undefined){return;}
                that.insert(this[0],value,'after');
            },
            html:function(value){
                var str;
                if(value===undefined){
                    return this[0].innerHTML;
                }else{
                    this[0].innerHTML=value;
                    return this;
                }
            },
            val:function(value){
                if(value===undefined){
                    return this[0].textContent? this[0].textContent:this[0].innerText;
                }else{
                    return this[0].value;
                }
            },
            /* 获取样式属性值的方法 */
            css:function(value){
                if(value===undefined){return;}
                return that.getStyle(this[0],value);
            },
            /* 获取当前选中元素的所有子元素 value提供在子节点列表查找特定的节点*/
            children:function(value){
                var nodes=this[0].childNodes,
                    i=0,
                    elem=[],
                    s,
                    n=nodes.length,
                    arr=[];
                if(value){
                    for(;i<n;i++){
                        s=nodes[i].className;
                        if((s.indexOf(value)>=0)){
                            arr.push(nodes[i]);
                        }
                    }
                }else{
                    for(;i<n;i++){
                        if(nodes[i].nodeType===1){
                            arr.push(nodes[i]);
                        }
                    }
                }
                return that.classArray(arr);
            },
            /* 在获取当前选中元素的所有子元素里面查找需要的元素 */
            find:function(value){
                var nodes=this,
                    n=nodes.length,
                    i=0,
                    arr=[],
                    attr,
                    temp=value;
                for(;i<n;i++){
                    if((value.indexOf('.')===0)){
                        temp=(value.indexOf('.')===0)?value.slice(1):value;
                        attr=Q.$(nodes[i]).attr('class');
                    }else{
                        attr=nodes[i].tagName.toLowerCase();
                    }
                    if(temp===attr){
                        arr.push(nodes[i]);
                    }
                }
                return that.classArray(arr);
            },
            /* 用来获取元素的坐标 top bottom left right -left -top*/
            bound:function(value){
                var that;
                if(value){
                    that=value;
                }else{
                    that=this[0];
                }
                return that.getBoundingClientRect();
            },
            x:function(){
                var x=Q.bound(this[0]).left+document.documentElement.scrollLeft-document.documentElement.clientLeft;
                return x;
            },
            y:function(){
                var y=Q.bound(this[0]).top+document.documentElement.scrollTop-document.documentElement.clientTop;
                return y;
            },
            /* hover方法 */
            hover:function(fnOut,fnOver,boll){
                if(boll===undefined){
                    boll=false;
                }
                var over=that.fixMouseLeave(this[0],fnOver,boll),
                    out=that.fixMouseEnter(this[0],fnOut,boll);
                this.bind(over.type,over.fn);
                this.bind(out.type,out.fn);
            },
            /* 自定义事件触发器 */
            spark:function(type){
                var elem=this[0],
                    val=Array.prototype.slice.call(arguments,1),
                    len=val.length,
                    fn=that.data(elem,type);
                if(!fn){
                    return this;
                }
                if(len>0){
                    fn[0].apply(elem,val);
                    return;
                }
                fn[0].call(elem);
            },
            /* each外部调用方法 */
            each:function(callback,args){
                return that.each(this,callback,args);
            },
            extend:function(obj,prop) {
                return that.extend(this,obj,prop);
            }
        };
    }
}).init();
}(window));