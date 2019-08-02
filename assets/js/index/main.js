import Vue from 'vue';
import axios from 'axios';
import Example from '@/components/example.vue';

axios.get('/github/api/users/evan2x');

const app = new Vue({
  el: '#app',
  components: {
    Example
  },
  data() {
    return {
      title: 'Index'
    };
  }
});
