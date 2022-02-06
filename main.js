/**
 *  反编译 AST
 */
import fs from 'fs'
import { type } from 'os';
import path  from 'path'
const __dirname = path.resolve()
import data  from './data.mjs'

function makeMap(str, expectsLowerCase) {
    var map = Object.create(null);
    var list = str.split(',');
    for (var i = 0; i < list.length; i++) map[list[i]] = true;
    return expectsLowerCase ? (val => map[val.toLowerCase()]) : (val => map[val])
}

const isDescription = makeMap(
    'tag,key,slot,scopedSlots,ref,refInFor,staticClass,class,staticStyle,style,'+
    'props,data,childrens,methods,attrs,domProps,hook,on,nativeOn,'+
    'transition,show,inlineTemplate,directives,keepAlive'
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
)

const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')

const target = path.join(__dirname,'templateCodeGenerator.vue')

const callbacks = ['close', 'style', 'script', 'template'],
      templateStack = [],
      styleStack = [],
      scriptHeap = new Map(),
      handlerSet = {
        'add': (key, val) => scriptHeap.set(key, val),
        'del': (key) => scriptHeap.delete(key),
        'edit': (key, val) => scriptHeap.set(key, val),
        'query': (key) => scriptHeap.get(key)
     }

const parseDescriptionMap = {
    class: deClass,
    style: deStyle,
    attrs: deAttrs,
    props: deProps,
    directives: deDirectives,
    on: deEvent,
    methods: deMethods,
    data: deData,
    hook: null,
    refInFor: null,
    slot: null,
    scopedSlots: null,
    keepAlive: null,
    transition: null,
}

const ELEMENT_TYPES = {
    'select': parseSelect,
    'a': parseSelect
}

const getTagEndReg = /(>|\/>)$/,
      classSpellReg = /class\s*=\s*?/,
      handlerReg = /handler\s?|function\s?/,
      indentReg = /^\u0020{4}/mg
      
    
const scriptParseUtils = {
    "props": function (options) {
        let str = ''
        for (const key in options) {
            const type = options[key]
            str += `\t\t${key}: ${typeof type === 'function' ? type.name : type},\n`
        }
        return str
    },
    "methods": function (options) {
        let str = ''
        for (const key in options) {
            str += `\t\t${options[key].toString()},\n`
        }
        return str
    },
    "data": function (options) {
        const data = options.data, aspect = options.handler, reg = /handler\b.*\b.*\{|function\b.*\b.*\{/
        let objJSON, str = aspect.toString().replace(reg, "").slice(0, -1).trim().replace(indentReg, '')
        objJSON = ObjectToJSON(data)
        return `\t\t${str}\n\t\treturn {${objJSON}\n\t\t}`
    }
}

function isPromise(obj) {
    return (obj !== undefined && obj !== null && typeof obj.then === 'function' && typeof obj.catch === 'function')
}

function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}

function hasOwnProperty(obj, key) {
    return obj.hasOwnProperty(key)
}

function emptyObject(obj) {
    for (const key in obj) { return false }
    return true
}

function ObjectToJSON(obj) {
    let target = ''
    for (const key in obj) {
        target += `\n\t\t\t${key}: ${obj[key].replace('#', '')},`
    }
    return target
}
/**
 * 指定位置拼接字符
 * @param {RegExp} regexp 匹配正则
 * @param {*} insert 要拼接的内容
 * @param {String} source 原字符串 
 * @returns String
 */
function spell(regexp, insert ,source) {
    let matchRes = source.match(regexp), end = source.length, start = 1
    if (!matchRes) throw new Error(`正则未匹配: ${[...arguments]}`)
    start += matchRes['index'] + matchRes['0'].length
    return source.substring(0, start) + insert.toString() + source.substring(start, end)
}

/**
 * 样式内容拼接
 * @param {object} styleVal 具体选择器内的样式内容 
 * @returns String
 */
function styleSpell(styleVal) {
    return JSON.stringify(styleVal)
           .replace(/"|"/g, ``)
           .replace(/{/g, `{\n\t`)
           .replace(/}/g, `\n}\n`)
           .replace(/:/g, `: `)
           .replace(/,/g, `;\n\t`)
}

function mapToObject(map) {
    let obj = Object.create(null)
    for (let [key, val] of map) { obj[key] = val }
    return obj
}

/**
 * 反编译指令
 * @param {string} name 
 * @param {any} value 
 * @param {any} expression 
 * @param {string} arg 
 * @param {string} oldArg 
 * @param {string: boolean} modifiers 
 * @param {any} oldValue 
 */
function deDirectives(context, directivesDesc) {
    return context  
}

function deData(context, dataDesc) {
    scriptHeap.set('data',dataDesc)
    return context
}


function deEvent(content, eventDesc) {
    let methods = scriptHeap.get('methods')
    if (methods === undefined) { methods = {}; }
    for (let i = 0; i < eventDesc.length; i++) {
        const {type, name, args, handler} = eventDesc[i]
        if (hasOwnProperty(methods, name)) {
            throw new Error(`${name}方法已存在`)
        } else {
            content = content.replace(getTagEndReg, ` @${type}="${name}(${[...args]})" $1`)
            methods[name] = handler.toString().replace(handlerReg, name).replace(indentReg, '')
        }
    }
    scriptHeap.set("methods", methods)
    return content
}

function deMethods(content, methods) {
    scriptHeap.set("methods", methods)
    return content
}

function deProps(context, propsDesc) {
    let i, key, temp = Object.create(null)
    if (Array.isArray(propsDesc)) {
        for (i = 0; i < propsDesc.length; i++) {
            key = propsDesc[i]
            temp[key] = {type: null}
        }
        propsDesc = temp
    }
    operateHeap('add', {props: propsDesc})
    return context
}

/**
 * 反编译attrs
 * @param {string} context 
 * @param {Array} attrsDesc 
 * @returns String
 */
function deAttrs(context, attrsDesc) {
    for (let i = 0; i < attrsDesc.length; i++) {
        const attr = attrsDesc[i];
        context = context.replace(getTagEndReg, ` ${attr['name']}="${attr['value']}"${"$1"}`)
    }
    return context
}

/**
 * 反编译style
 * @param {string} context 当前正在编译的元素字符串模板
 * @param {Object} styleDesc 样式类对象
 * @returns String
 */
function deStyle(context, styleDesc) {
    for (let key in styleDesc) {
        context = context.replace(getTagEndReg, ` ${key}="${styleDesc[key]}" ${"$1"}`)
    }
    return context
}

/**
 * 反编译class
 * @param {string} context 当前正在编译的元素字符串模板
 * @param {Object} classDesc 样式类对象
 * @returns String
 */
function deClass(context, classDesc) {
    const has = context.search(classSpellReg)
    if (has == -1) { context = context.replace(getTagEndReg, ` class=""${"$1"}`) }
    for (let key in classDesc) {
        context = spell(classSpellReg, key, context)
        const cld = classDesc[key]
        if (typeof cld !== 'object') continue;
        if (emptyObject(cld)) {
            cld["sel"] = `.${key}`
            cld['cnt'] = Object.create(null)
        }
        pushTargetStack('style', cld)
    }
    return context
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

function deCompileArray(childrens) {
    for (let i = 0; i < childrens.length; i++) {
        const description = childrens[i];
        deCompile(description, '\t');
    }
}

/**
 * 待修正
 * @param {String} part template/script/style
 * @param {String | Object} content 标签与样式
 */
 function pushTargetStack(part, content) {
    switch (part) {
        case 'template': templateStack.push(content); break;
        case 'style': styleStack.push(content); break;
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

/**
 * 操作script集合
 * @param {String} operation 操作类型：add, del, edit, query
 * @param {Object} content 删除传key
 */
 function operateHeap(operation, content) {   
    const handler = handlerSet[operation]
    if (!handler) throw new Error('只接受 add, del, edit, query')
    if (typeof content === 'string') {
        if (!handler(content)) throw new Error(`删除失败`)
    }
    for (let key in content) {
        handler(key, content[key])
    }
}

function mapToJSON(map) {
    let obj = mapToObject(map), content = ''
    for (const key in obj) {
        if (key === 'data') {
            content += `\t${key}() {\n${scriptParseUtils[key](obj[key])}\n\t},\n`
        } else {
            content += `\t${key}: {\n${scriptParseUtils[key](obj[key])}\t},\n`
        }
    }
    return content
}

function parseTemplate(stack) {
    return stack.join('\n')
}

function parseScript(stack) {
    let heap = stack, script = mapToJSON(heap)
    return script
}

// 暂不支持sass
function parseStyle(stack) {
    let content = '', len = stack.length
    for(let i = 0; i < len; i++) {
        const styleObj = stack[i]
        content += `${styleObj['sel']} ${styleSpell(styleObj['cnt'])}\n`
    }
    return content
}

function executorData(part, stack) {
    if (part === 'template') { 
        return `<${part}>\n${parseTemplate(stack)}\n</${part}>\n`
    } else if (part === 'script') {
        return `<${part}>\nexport default {\n${parseScript(stack)}\n}\n</${part}>\n`
    } else if (part === 'style') {
        return `<${part} scoped>\n${parseStyle(stack)}</${part}>\n`
    }
}

function close(fd) {
    fs.close(fd)
}

function wirter(fd, part, callbacks) {
    let stack, data = ''
    switch (part) {
        case 'template': stack = templateStack; break;
        case 'script': stack = scriptHeap; break;
        case 'style': stack = styleStack; break;
        default: return close(fd);
    }
    data = executorData(part, stack)
    return fs.writeFile(fd, data, {encoding: 'utf8'}, (err) => {
        if (err) throw err
        executor(fd, callbacks)
    })
}

function executor(fd, callbacks) {
    const part = callbacks.pop()
    if (part) wirter.call(this, fd, part, callbacks)
}

function open(target) {
    fs.open(target, 'a+', (err, fd) =>{
        if (err) throw new Error("文件打开异常", err);
        executor(fd, callbacks)
    })
}

function main(target, description) {
    deCompile(description)
    open(target)
}

main(target, data)

export default main

/**
 * 存档
 * 为了应对不同的UI框架 makeMap要转变为高阶函数，
 * 脚本解析，考虑data函数的合并，以及其他内容的合并, Object.assign不行，props会合并带哦
 * scriptHeap[]
 * 1, data, props, mehdos, hooks, watch ...
 * pushTarget有缺陷，比如推入的是一个标签但是只能推入看是标签
 * 
 */

/**
 * 注意
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
