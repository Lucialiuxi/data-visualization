<script lang="js">
import { RouterLink, RouterView } from 'vue-router';
  export default {
    mounted() {
    },
    computed: {
      levelText: {
        get() {
          return this.$route?.matched[0]?.props?.default?.params || '开始学习吧';
        },
        set(text) {
          this.levelText = text;
        }
      }
    }
  }
</script>

<template>
  <main>
    {{levelText}}
    <RouterView/>
  </main>
</template>
