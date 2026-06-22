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

.simple-popover {
  position: relative;
  display: inline-flex;
}

.simple-popover-content {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  padding: 4px;
  border: 1px solid #b9c2cf;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
}

</style>
