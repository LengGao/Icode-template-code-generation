<template>
    <div>
      <templatecoomponemt :type="'select'"> </templatecoomponemt>
    </div>
</template>

<script>
import templatecoomponemt from './component.vue'
export default {
  name: 'App',
  components: { templatecoomponemt },
  data() {
    return {

    }
  }
}
</script>

<style>
/* #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
} */
</style>
