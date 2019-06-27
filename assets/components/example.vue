<template>
  <p :class="$style.desc">this is an {{name}}.</p>
</template>

<script>
export default {
  data() {
    return {
      name: 'example'
    };
  }
};
</script>

<style module>
.desc {
  color: #999;
  text-align: center;
}
</style>
