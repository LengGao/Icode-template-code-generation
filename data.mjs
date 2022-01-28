import ASTElement from 'vue-template-compiler'
import Vue from 'vue'
// import Description from './data'
/**
 * @type ASTElement
 */
let ast= {}

/**
 * createElement 直观参考：https://cn.vuejs.org/v2/guide/render-function.html#createElement-%E5%8F%82%E6%95%B0
 * @type Vue.VNodeData
 */
let vnode = {
    tag: 'select',    
    class: {'red': {sel: '.red', cnt: {"margin": '50px;'}}},
    style: {'font-size': '12px'},
    attrs: [{
        name: 'title',
        value: 'select'
    }],
    childrens: [{ tag: 'a', 'class': {'foo': {}}} ],
    directives: [{
        name: 'my-custom-directive',
        value: '2',
        expression: '1 + 1',
        arg: 'foo',
        modifiers: {bar: true}
    }]
}


export default vnode