<template>
    <div>
        <div v-if="type === 'select'">selet</div>
        <div v-else-if="type === 'input'">input</div>

    </div>
</template>
<script>
export default {
    props: {
        type: String
    },
    
    beforeCreate() {
        
    },
    created: () => {    
    },
    data: () => {
        return {
            init: 'true'
        }
    },
    name: 'templatecoomponemt'
}
</script>
<style scoped>

</style>
