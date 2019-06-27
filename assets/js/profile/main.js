import Vue from 'vue';
import Example from '@/components/example.vue';

const app = new Vue({
  el: '#app',
  components: {
    Example
  },
  data() {
    return {
      title: 'Profile'
    };
  }
});
