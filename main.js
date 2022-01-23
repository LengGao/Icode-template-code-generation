/**
 *  反编译 AST
 */
const fs = require('fs')
const path = require('path')

function isPromise(obj) {
    return (obj !== undefined && obj !== null && typeof obj.then === 'function' && typeof obj.catch === 'function')
}

function makeMap(str, expectsLowerCase) {
    var map = Object.create(null);
    var list = str.split(',');
    for (var i = 0; i < list.length; i++) map[list[i]] = true;
    return expectsLowerCase ? (val => map[val.toLowerCase()]) : (val => map[val])
}

const isDescription = makeMap(
    'tag,key,slot,scopedSlots,ref,refInFor,staticClass,class,staticStyle,style,props,childrens,'+
    'attrs,domProps,hook,on,nativeOn,transition,show,inlineTemplate,directives,keepAlive'
)

const isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template,blockquote,iframe,tfoot'
);

const target = path.join(__dirname,'templateCodeGenerator.vue')

const callbacks = ['close', 'style', 'script', 'template'], templateStack = [], scriptStack = [], styleStack = []

const getTagEndReg = /(>|\/>)$/

const parseDescriptionMap = {
    tag: null,
    key: null,
    class: deClass,
    style: null,
    attrs: null,
    props: null,
    domProps: null,
    on: null,
    hook: null,
    nativeOn: null,
    directives: null,
    staticClass: null,
    staticStyle: null,
    ref: null,
    refInFor: null,
    childrens: null,
    show: null,
    slot: null,
    scopedSlots: null,
    keepAlive: null,
    transition: null,
    inlineTemplate: null,
}

const ELEMENT_TYPES = {
    'select': parseSelect,
    'a': parseSelect
}



function deClass(context, classDesc) {
    for (let key in classDesc) {
        context = context.replace(getTagEndReg, ` ${key}="${classDesc[key]}"${"$1"}`)
    }
    return `${context}`
}

function parseSelect(description) {
    const keys = Object.keys(description)
    let current = templateStack.pop()
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (isDescription(key)) {
            if (parseDescriptionMap[key]) {
                current = parseDescriptionMap[key](current, description[key])
            }
        } else {
            throw new Error(`不在解析范围内: ${key} from ${parseDescriptionMap}`)
        }
    }
    templateStack.push(current)
}

/**
 * @param {String} part template/script/style
 * @param {String} content <xx>
 */
function pushTargetStack(part, content) {
    switch (part) {
        case 'template': templateStack.push(content); break;
        case 'script': scriptStack.push(content); break;
        case 'style': styleStack.push(content); break;
    }
}

function deCompileArray(childrens) {
    for (let i = 0; i < childrens.length; i++) {
        const description = childrens[i];
        deCompile(description, '\t');
    }
}

function deCompile(description, indentation) {
    if (!isHTMLTag(description.tag)) throw new Error(`未找到标签: ${description.tag}`); 
    for (const key in ELEMENT_TYPES) {
        if (key === description.tag) {
            pushTargetStack('template', `${indentation ? indentation : ''}<${key}>`)
            ELEMENT_TYPES[key](description)
            if (description.childrens) deCompileArray(description.childrens)
            pushTargetStack('template', `${indentation ? indentation : ''}</${key}>`)
        }
    }
}

function wirter(fd, part, callbacks) {
    let data = '', stack = []
    switch (part) {
        case 'template': stack = templateStack; break;
        case 'script': stack = scriptStack; break;
        case 'style': stack = styleStack; break;
        default: return close(fd);
    }
    data = executorData(part, stack)
    return fs.writeFile(fd, data, {encoding: 'utf8'}, (err) => {
        if (err) throw err
        executor(fd, callbacks)
    })
}

function close(fd) {
    fs.close(fd)
}

function executor(fd, callbacks) {
    const part = callbacks.pop()
    if (part) wirter.call(this, fd, part, callbacks)
}

function executorData(part, stack) {
    return`<${part}> \n ${stack.join('\n')} \n </${part}> \n`
}

function open(target) {
    fs.open(target, 'a+', (err, fd) =>{
        if (err) throw new Error("文件打开异常", err);
        executor(fd, callbacks)
    })
}

function init(description) {
    deCompile(description)
}

function main(description) {
    init(description)
    open(target)
}

let description = {
    tag: 'select',
    'class': {
        foo: true,
        bar: false
    },
    childrens: [
        {
            tag: 'a',
            'class': {
                foo: true,
                bar: false
            }
        }
    ],
    on: {
        click: this.clickHandler
    },
    directives: [
        {
            name: 'my-custom-directive',
            value: '2',
            expression: '1 + 1',
            arg: 'foo',
            modifiers: {bar: true}
        }
    ],
}

main(description)

module.exports.main = main

/**
 * 实现步骤
 * 先用读写流写入vue文件三个部分
 *  编写写入流函数分别要定位它们的位置以便于后面准确插入
 * 再解析配置项目分别插入对应部分
 *  分批次实现对应内容反编译
 */

/**
 * 实施问题
 * 插入部分到底要不要用栈这个还没有想好
 * 
 * yield * 通过实验发现，yield后的表达式不会立即求值，而是再generator生成的迭代器对象iterator.next()方法调用后求值
 * 其求值结果作为iteratorResult对象{value: '', done: ''}value属性的值，
 * 而next(xx)传入的xx值作为前一句yield语句本身的返回值的也就是说var a = yield ’a', a的值由mext传入的xx决定而不是
 * yield后的'a'，注意yield会暂停Generator函数的执行，所以当next()调用时第一句yield本身的值是由第二局next传入的参
 * 数决定的，所以由于第一次next()不论传什么值都是无效的
 * 
 * Generator.prototype.throw 向生成器抛出异常，并恢复生成器的执行，返回带有 done 及 value 两个属性的对象
 * 注意throw不能直接调用，原因应该是它在next后才挂在到iterator对象，Generator接口泛型中只传入了<T = unknown, TReturn = any, TNext = unknown>
 * 对于throw抛出的异常首先要明白yield会连后面的catch也阻塞，也就是说try,catch其实是两个内容，
 * 而throw的异常到底是内部捕获还是外部捕获？这就要看捕获try的执行流程发生在内部函数在外部，throw虽然会恢复G的执行
 * 但是iteratorResult的done为true那么流程G函数将不再会控制js执行流程
 * 
 * JS中的普通函数的含义不只是由函数这一层，它还是一个构造器，这也是普通函数与Generator，async函数的区别之一
 * 而可以证明这一点的是new 关键字会根据普通函数的返回值来构造对象，若返回的是一个对象则延用，非则则返回一个空对象{}
 * G函数与Async函数虽然都不是一个构造器，不能用new，但是它们的区别在于g函数的实例结果是iterator，而A是promise
 * 
 * 由php传来单引号未普通字符，字符中的变量不会被解析，而双引号会解析变量，这一点在正则引擎中的反向引用可能会用到
 */
