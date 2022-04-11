<script>
export default {
  data () {
    return {
      addNovelOpen: false
    }
  },
  methods: {
    changeMsg () {
      this.msg = 'Welcome to Your Vue.js App (changed)'
    }
  },
  mounted () {
    let html = this.$refs.rows.innerHTML;
    this.$refs.rows.innerHTML = html.repeat(100);
  }
}
</script>

<template>
<div class="add-novel-dialog dialog" v-if="addNovelOpen">
  <div class="window">
    <div class="title"><b>Add Novel</b></div>
    <div class="subtitle">Type</div>
    <div class="multi-select-wrapper">
      <span class="multi-select selected">Syosetu</span>
      <span class="multi-select">Custom</span>
    </div>
    <div class="subtitle">Link</div>
    <input type="text" v-model="link" placeholder="https://ncode.syosetu.com/n9001/">
    <div class="buttons">
      <button class="secondary" @click="addNovelOpen = false">Cancel</button>
      <button>Add</button>
    </div>
  </div>
</div>
<div class="navbar">
  <button>Translated</button>
  <button @click="addNovelOpen = true">Add Novel</button>
</div>
<div class="novels">
  <div class="header">
    <span class="first">Date added</span>
    <span>Title</span>
    <span>Downloaded</span>
  </div>
  <div class="rows" ref="rows">
    <div class="row">
      <span class="material-icons-outlined">link</span>
      <span>4/3/2022</span>
      <span>Very long novel title</span>
      <span class="download">12/34<span class="material-icons filled">download</span></span>
    </div>
  </div>
</div>
</template>

<style>
html, body, #app {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}
.navbar {
  /* background: black; */
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: flex-end;
  position: fixed;
  right: 0;
}
.novels {
  width: 80%;
  /* margin: 10px auto; */
  /* background: blue; */
  height: 100%;
  margin: 0 auto;
}
.header {
  display: grid;
  grid-template-columns: 220px 1fr 150px;
  font-weight: bold;
  padding: 10px 0;
}
.header .first {
  padding-left: 60px;
}
.rows {
  height: calc(100% - 39px);
  overflow: auto;
}
.row {
  display: grid;
  grid-template-columns: 60px 160px 1fr 120px 30px;
  border-bottom: 1px solid #efefef;
  padding: 5px 0;
}
.row span {
  display: flex;
  align-items: center;
}
button {
  border: none;
  padding: 10px;
  border-radius: 7px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  color: white;
  background: black;
  user-select: none;
}
button:hover {
  opacity: 0.5;
}
button.secondary {
  background: none;
  color: black;
  font-weight: normal;
}
.dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
h1 {
  margin: 0;
}
.window {
  background: white;
  padding: 16px;
  border-radius: 7px;
}
.window .title {
  font-size: 24px;
  margin: 10px 0;
}
.subtitle {
  font-weight: bold;
  margin-top: 18px;
  margin-bottom: 6px;
}
.buttons {
  margin-top: 28px;
  display: flex;
  gap: 20px;
  justify-content: flex-end;
}
.multi-select-wrapper {
  display: flex;
  gap: 45px;
}
.multi-select {
  padding: 10px;
  border-radius: 7px;
  user-select: none;
  cursor: pointer;
  background: white;
  color: black;
}
.multi-select.selected {
  background: black;
  color: white;
  font-weight: bold;
}
input[type="text"] {
  border: none;
  background: #EFEFEF;
  border-radius: 7px;
  padding: 10px;
  width: 350px;
  font-size: 16px;
  color: #333;
  box-sizing: border-box;
}
</style>
