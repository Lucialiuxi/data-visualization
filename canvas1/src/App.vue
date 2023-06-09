<script  lang="js">
import { RouterLink, RouterView } from 'vue-router';
import HelloWorld from './components/HelloWorld.vue';
import router from './router/index';
let routes = router.getRoutes();

export default {
  mounted() {
    // console.log('routes---', routes)
  },
  methods: {
    getRoutes(parentName) {
        let showRoutes = routes.find(item => item.name.indexOf(parentName) !== -1);
        return showRoutes?.children || [];
    },
    getPath(route, parent) {
      let fullPath = '/' + parent + '/' + route.path;
      return fullPath;
    },
    showRoute(parentName) {
      let show =  this.$route.path.indexOf(parentName) !== -1;
      return show;
    },
    getFirstList() {
      let list = routes.filter(item => {
        if(item?.props?.default?.params) {
          let newItem = Object.assign({}, item);
          delete newItem.children;
          return newItem;
        }
      });
      return list;
    }
  },
  watch: {
    $route: {
      handler: function (to, from) {
        console.log(to.fullPath, from.fullPath)
      }
    }
  }
}
</script>

<template>
  <header>
    <div class="wrapper">
      <HelloWorld msg="hello webGL!" />
      <nav>
        <RouterLink
          v-for="route of getFirstList()" 
          :key="route.path"
          :to ="route.path"
        >{{route?.name}}</RouterLink>
        <div v-show="showRoute('single')">
          <RouterLink
            v-for="route of getRoutes('single')" 
            :key="route.path" 
            :to="{path: getPath(route, 'single')}" 
          >{{route?.name}}</RouterLink>
        </div>
        <div v-show="showRoute('advance')">
          <RouterLink
            v-for="route of getRoutes('advance')" 
            :key="route.path" 
            :to="{path: getPath(route, 'advance')}" 
          >{{route?.name}}</RouterLink>
        </div>
      </nav>
    </div>
  </header>
  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
