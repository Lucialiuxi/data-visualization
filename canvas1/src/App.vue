<script  lang="js">
import { RouterLink, RouterView } from 'vue-router';
import HelloWorld from './components/HelloWorld.vue';
import router from './router/index';
let routes = router.getRoutes();

export default {
  data() {
    return {
      current: ''
    }
  },
  mounted() {
    let { pathname } = window.location;
    let levelArray = pathname?.split('/')?.filter(str => !!str);
    if(levelArray?.[0]) {
      this.current = levelArray[0]; 
    }
  },
  methods: {
    getRoutes() {
        let showRoutes = routes.find(item => item.name.indexOf(this.current) !== -1);
        return showRoutes?.children || [];
    },
    getPath(route) {
      let fullPath = '/' + this.current + '/' + route.path;
      return fullPath;
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
        if (to.fullPath !== from.fullPath && to.params.id) {
          this.current = to.name;
        }
      }
    }
  }
}
</script>

<template>
  <header>
    <div class="wrapper">
      <HelloWorld msg="hello webGL!" />
      <nav class="firstLevelNavWrap">
          <RouterLink
            v-for="route of getFirstList()" 
            :key="route.path"
            :to ="route.path"
          >{{route?.name}}</RouterLink>

      </nav>
      <nav>
        <RouterLink
          v-for="route of getRoutes()" 
          :key="route.path" 
          :to="{path: getPath(route)}" 
        >{{route?.name}}</RouterLink>
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
.firstLevelNavWrap {
  width: 500px;
  margin-bottom: 20px;
}
</style>
