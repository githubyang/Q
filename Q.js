/* -----------------------------------------------------------------------------------------------------------
 * 名称：Q.js框架
 * 描述：这是一个轻量级的js框架
 * 主要功能：脚本文件模块化加载 函数队列执行 样式注入 事件绑定 事件移除 dom选择 支持链式调用
 * 兼容性：几乎兼容所有现代浏览器
 * 性能：尚未测试 但能保证她绝对不是最慢的
 * 开发者：单骑闯天下
 * 最后更新时间：2014.3.13
 * 版本：v 1.0.0 (测试版)

 * ---------------------- 项目历程 ---------------------------------------------------------------------------
 * # v1.0.0
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
 * ----------------------------------------------------------------------------------------------------------*/
(function(window){
// 用来修正IE里面的事件 目前把这些函数移到外面
var fixEvent=function(event){
        event.preventDefault=preventDefault;
        event.stopPropagation=stopPropagation;
        return event;
    },
    preventDefault=function(){
        window.event.returnValue=false;
    },
    stopPropagation=function(){
        window.event.cancelBubble=true;
    };
;({
    /* 核心库的配置文件 */
    config:{
        auto:true,
        coreLib:['./js/jquery.1.9.1.min.js'],
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
    version:'1.0.1',
    /* 分离自jquery */
    class2type:{},
    toString:Object.prototype.toString,
    hasOwn:Object.prototype.hasOwnProperty,
    /* 负责初始化 */
    init:function(){
        var that=this;
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
        if(document.getElementsByClassName){
            that.selector=1;
        }
        window.M=(function(){
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
        }
        var arr = toArray(dom);
        for(var i in M){
            arr[i] = M[i];
        }
        return arr;
    },
    /* 一些判断方法 我是从jquery里面提取的 */
    isFunction:function(obj){return this.type(obj)==="function";},
    isArray:Array.isArray || function(obj){return this.type(obj)==="array";},
    isWindow:function(obj){return obj && typeof obj === "object" && "setInterval" in obj;},
    isNaN:function(obj){
        var rdigit=/\d/;
        return obj==null || !rdigit.test(obj) || isNaN(obj);
    },
    type:function(obj){
        return obj==null?String(obj):this.class2type[this.toString.call(obj)] || "object";
    },
    isPlainObject:function(obj){
        if(!obj || this.type(obj) !== "object" || obj.nodeType || this.isWindow(obj)){
            return false;
        }
        if(obj.constructor && !this.hasOwn.call(obj,"constructor") && !this.hasOwn.call(obj.constructor.prototype,"isPrototypeOf")){return false;}
        var key;
        for(key in obj){}
        return key===undefined || this.hasOwn.call(obj,key);
    },
    isEmptyObject:function(obj){
        for(var name in obj){return false;}
            return true;
        },
        nodeName:function(elem,name){
        return elem.nodeName && elem.nodeName.toUpperCase()===name.toUpperCase();
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
    handlerEvent:function(event){
        event=event || fixEvent(window.event);
        var handlers=this.events[event.type];
        if(handlers!==null){
            handlers[0](event);
        }
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
                        M.run.apply(that,args);
                    });
                    return M;
                }
                if( (len>0) && ( (that.loadList[args[0]]===1) !== true ) ){
                    if(typeof args[len-1]==='function'){
                        fn=args.pop();
                    }
                    id=args.join('');
                    if((args.length === 0 || that.loadList[id]) && fn){
                        fn();
                        return M;
                    }
                    /* 正常加载 */
                    that.check(args,function(){
                        that.loadList[id] = 1;
                        if(fn){
                            fn();
                        }
                    });
                }else{
                    return M;
                }
                return M;
            },
            /* 批量设置模块的方法 */
            set:function(m){
                if(m){
                    for(var a in m){
                        that.config.model[a]=m[a];
                    }
                }
                return M;
            },
            /* CSS注入方法 */
            css:function(a,s){
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
                return M;
            },
            /* 单个添加模块的方法 */
            add:function(name,obj){
                if(!name || !obj || !obj.path){return;}
                that.config.model[name]=obj;
                return M;
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
                return M;
            },
            /* 异步执行外部调用的触发方法 */
            trigger:function(resources){
                if(!resources){return M;}
                var maps=that.map,
                    rmaps=that.rmap;
                if(typeof resources==='string'){resources=[resources];}
                for(var i=0,len=resources.length;i<len;++i){
                    var res=resources[i];
                    if (typeof rmaps[res]==='undefined') continue;
                    that.release(res,rmaps[res]);
                    delete rmaps[res];
                }
                return M;
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
                if(that.selector){
                    a=document.getElementsByClassName(args[0]);
                    n=a.length;
                    for(;i<n;i++){
                        arr.push(a[i]);
                    }
                    return that.classArray(arr);
                }else{
                    classNmae=args[0].replace('/\-/','\\-');
                    reg=new RegExp('(^|\\s)'+classNmae+'(\\s|$)');
                    a=document.getElementsByTagName(tag);
                    n=a.length;
                    for(;i<n;i++){
                        b=a[i];
                        if(reg.test(b.className)){
                            arr.push(b);
                        }
                    }
                    return that.classArray(arr);
                }
            },
            attriubte:function(){
                if(that.Reg.reg){
                    reg=that.Reg.reg;
                }else{
                    var reg=/([\*a-zA-Z1-6]*)?(\[(\w+)\s*(\^|\$|\*|\||~|!)?=?\s*([\w\u00C0-\uFFFF\s\-_\.]+)?\])?/;
                    that.Reg['reg']=reg;
                }
                var node=arguments[1] || document,
                    search=arguments[0],
                    str=search.match(reg),
                    tag=str[1],// 属性选择器假如为e[k=v]形式 tag为e
                    key=str[3],// 属性选择器假如为e[k=v]形式 key为k
                    type=str[4]+'=',// 属性选择器假如为e[k=v]形式 type为符号
                    val=str[5],// 属性选择器假如为e[k=v]形式 val为v
                    arr=[],
                    attr,
                    i,
                    value,
                    elem=node.getElementsByTagName(tag),
                    len=elem.length;
                // 如果支持 IE8+以上都支持
                if((!!document.querySelectorAll) && type != "!="){
                    value = document.querySelectorAll(search);
                    for(var i=0,length = value.length;i < length;i++){
                        arr.push(value[i]);
                    }
                    return that.classArray(arr);
                }
                for(i=0;i<len;i++){
                    attr=elem[i];
                    value=attr[key];
                    if(typeof value==='string'){
                        if(!value===false){
                            var where=false;
                            if(type==='*='){
                                where=(value.indexOf(val)>=0)?true:false;
                            }else if(type==='!='){
                                where=(value!=val)?true:false;// 将会选取所有属性值不等于条件值的元素 例: 条件值a title="a b" title="a" 将会选取title="a b"
                            }else if(type==='^='){
                                where=(value.indexOf(val)===0)?true:false;// 选取以xx开头的所有元素
                            }else if(type==='$='){
                                (function(a,b){
                                    var i=b.length;
                                    where=(a.slice(-i)===b)?true:false;// 选取以xx结尾的所有元素
                                }(value,val));
                            }else if(type==='~='){
                                where=((''+value+'').indexOf(val)>=0)?true:false;// 选取指定词汇的元素
                            }else if(type==='|='){//匹配属性值为XX或以XX-打头的元素
                                where=( (value===val) ||value.substring(0,val.length+1)===(val+'-') )?true:false;
                            }else if(type==='='){
                                where=(value===val)?true:false;
                            }
                            where && arr.push(attr);
                        }
                    }
                }
                return that.classArray(arr);
            },
            /* 事件绑定 */
            bind:function(type,handler){
                if(!this[0].events){
                    this[0].events={};
                }
                var handlers=this[0].events[type];
                if(!handlers){
                    handlers=this[0].events[type]=[];
                    if(this[0]['on'+type]){
                        handlers[0]=this[0]['on'+type];
                    }
                }
                handlers[0]=handler;
                this[0]['on'+type]=that.handlerEvent;
            },
            /* 事件移除 */
            remove:function(type){
                this[0].events[type]=null;
            },
            /* each外部调用方法 */
            each:function(callback,args){
                return that.each(this,callback,args);
            }
        };
    }
}).init();
}(window));