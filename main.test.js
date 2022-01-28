var obj = {a: 'a', b: 'b'}
function styleSpell(styleVal) {
    var str = `${JSON.stringify(styleVal)}`
    return str.replace(/"|"/g, '').replace(/:/g, ': ').replace(/,/, `;\n`)
}
styleSpell(obj)

describe('style', () => {
    test('spell', () => {
        expect(styleSpell(obj)).toMatch(`{a: a;\nb: b}`)
    })
})