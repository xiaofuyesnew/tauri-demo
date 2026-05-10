<template>
  <router-view />
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
}

.comp {
  height: 100%;
  flex: 1;
}

.header {
  width: 100%;
  height: 60px;
  background-color: gray;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}

</style>
