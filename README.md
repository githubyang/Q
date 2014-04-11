Q.js
=

简介：这是一个轻量级的web前端框架，实现前端脚本的模块化加载，js函数的队列/异步执行，CSS样式注入,DOM操作。Q.js适合那些觉得jquery太庞大的前端攻城狮。
她很小巧，但功能绝对够一个交互效果不是太多的网站使用。
###她的两个优点：
- 绝对的轻量级，压缩之后12.4kb，大小是jquery的十分之一
- 易于集成到项目和扩展此框架
- 浏览器兼容性 目前我测过的浏览器
IE6+
360
Mozilla
chrome

-目前版本为 1.0

###框架API调用方法：
- 队列执行函数
```javascript
// Q.when();将函数排入队列
Q.when('A',function(){
    console.log('我是列队A里面的函数');
});
Q.when('B',function(){
    console.log('我是列队B里面的函数');
});
// Q.trigger();执行队列里面的函数
Q.trigger('B').trigger('A');//函数执行 B函数 A函数
```
- 外部脚本加载，也叫模块化加载，有一种装逼的叫法叫异步加载。
```javascript
// Q.add();装载模块 里面有两个参数 1、模块名称 2、对象字面量{path:'文件路径',type:'文件类型',requires:'定义依赖关系'}。Q.run();模块加载的运行方法。
Q.add('b',{path:'js/m/a.css',type:'css'});
Q.add('a',{path:'js/m/a.js',type:'js',requires:['b']});
Q.run('a',function(){
// 这里是回调函数
});
```
- 模块批量加载
```javasript
Q.set({
	a:{path:'',type:''},
	b:{path:'',type:'',requires:['a']},
	c:{path:'',type:'',requires:['b']},
	d:{path:'',type:'',requires:['c']}
});
Q.run('d',function(){});
```
- CSS样式注入
```javascript
// 两个参数 第一个参数是标示符 必须唯一，第二个是注入的内容
Q.inCss('a',[
        '.a{margin:0;}',
        '.b{text-decoration:none;}'
    ].join('\n')
);
// 也可以这样
Q.inCss('b',.a{margin:0;}');
```
- 关闭自动加载
```html
<script type="text/javascript" src="./js/Q.js" auto="false"></script>
```
- 重新指定核心库
```html
<script type="text/javascript" src="./js/Q.js" core="./js/sizzle.js"></script>
```
- 选择器
```javascript
// 目前的实现也许不够丰富 但是一般需求也够用了
Q.$('#id'); // id选择器
Q.$('.class'); // class选择器
Q.$('*[attribute符号=value]'); // 属性选择器
Q.$('a > b'); // 选取a元素里面的b元素
/*
 * [title]{} 包含标题(title)的所有元素
 * a[href]{} 对href属性的a元素应用样式
 * a[href][title]{} 将同时有href和title属性的a元素应用样式
 * [attribute=value] 选取带有指定属性值的每个元素
 * [attribute~=value] 选取带有指定词汇的每个元素
 * [attribute|=value] 选取指定属性值开头的所有元素，但必须是整个单词，后面可以跟-号
 * [attribute^=value] 选取指定属性值开头的所有元素
 * [attribute$=value] 选取指定属性值结尾的每个元素
 * [attribute*=value] 选取包含属性指定值的每个元素
 * [attribute!=value] 选取不等于指定属性值的每一个元素 jquery里面的
*/
```
- 添加class
```javascript
Q.$('').addClass('');
```
- 移除class
```javascript
Q.$('').removeClass('');// 如果传入的参数为空会移除掉所有的class
```
- append
```javascript
Q.$('').append('你要添加的内容'); // 向文本节点后面插入
```
- prepend
```javascript
Q.$('').prepend('你要添加的内容'); // 向文本节点前面插入
```
- prepend
```javascript
Q.$('').prepend('你要添加的内容'); // 向文本节点前面插入
```
- before
```javascript
Q.$('').before('你要添加的内容'); // 向节点前面插入
```
- after
```javascript
Q.$('').after('你要添加的内容'); // 向节点后面插入
```
- html
```javascript
Q.$('').html(); // 如果没传参数那就是获取
```
- val
```javascript
Q.$('').val(); // 获取表单的value的值
```
- css
```javascript
Q.$('').css(); // 获样式的值通常用来获取元素的高宽属性
```
- each
```javascript
Q.$('').each('函数'); // 用来循环
Q.each('数组或对象','函数'); // 用来循环
```
- children
```javascript
Q.$('').children(); // 获取当前选中元素的所有子元素
Q.$('#a').children('e'); // 获取当前选中元素的所有子元素里面的class等于e的节点
```
- find
```javascript
Q.$('').children().find(''); // 在获取当前选中元素的所有子元素里面查找需要的元素
```
- bind
```javascript
Q.$('').bind('事件类型','处理函数'); // 事件绑定 "事件类型支持自定义事件"
```
- spark
```javascript
Q.$('').spark('自定义事件的类型','可以传入多个参数'); // 自定义事件触发器
```
- unbind
```javascript
// 如果不指定参数 则移除选中节点的所有事件
Q.$('').unbind('要移除的事件类型'); // 事件移除
```
- hover
```javascript
// 必须绑定两个函数
Q.$('').hover(function(){},function(){});
// 如果需要冒泡设置最后一个参数为true
```
- x()
```javascript
Q.$('').x() // 获取元素的x坐标
```
- y()
```javascript
Q.$('').y() // 获取元素的y坐标
```
- bound
```javascript
Q.bound() // 返回 top bottom left right -top -left
```
- extend
```javascript
Q.extend(obj,prop) // 合并
Q.extend({a:function(){}}) // 向向框架挂载a方法支持链式调用
Q.a() // 调用方法
```
- ready
```javascript
Q.ready(function(){}); // 事件加载 等待dom树执行完毕再执行函数
```